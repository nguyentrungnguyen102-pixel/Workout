// Telegram workout reminder — sends personalized morning/evening reminders
// via one Telegram bot. Triggered every 30 minutes by the GitHub Actions
// cron in .github/workflows/telegram-reminder.yml.
//
// The web app (workout-web/) is a static SPA with owner-only Firestore
// rules, so it cannot read other users' data to send reminders itself.
// This script instead runs in CI with the Firebase Admin SDK (full
// server-side access) and pushes messages out via the Telegram Bot API.
//
// DRY RUN: if TELEGRAM_BOT_TOKEN or FIREBASE_SERVICE_ACCOUNT is missing
// (e.g. running locally, or secrets not configured in the repo yet), this
// script does NOT initialize firebase-admin and does NOT call Telegram —
// it builds sample morning + evening messages from a hardcoded mock user
// and prints them, then exits 0. This keeps the script runnable/testable
// without any live credentials.

import admin from 'firebase-admin';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// Mirrors src/lib/quotes.ts QUOTES — bilingual (en/vi) + author, same set
// shown in the app's QuoteBanner so the Telegram message matches the app.
const QUOTES = [
  { en: 'The body achieves what the mind believes.', vi: 'Cơ thể làm được điều mà tâm trí tin tưởng.', author: 'Napoleon Hill' },
  { en: 'The pain you feel today will be the strength you feel tomorrow.', vi: 'Nỗi đau hôm nay sẽ là sức mạnh của ngày mai.', author: 'Arnold Schwarzenegger' },
  { en: "Take care of your body. It's the only place you have to live.", vi: 'Hãy chăm sóc cơ thể — đó là nơi duy nhất bạn phải sống.', author: 'Jim Rohn' },
  { en: 'Discipline is choosing between what you want now and what you want most.', vi: 'Kỷ luật là chọn giữa điều bạn muốn bây giờ và điều bạn muốn nhất.', author: 'Abraham Lincoln' },
  { en: 'A journey of a thousand miles begins with a single step.', vi: 'Hành trình vạn dặm bắt đầu từ một bước chân.', author: 'Lão Tử' },
  { en: "It's not that I'm so smart, it's just that I stay with problems longer.", vi: 'Không phải tôi thông minh hơn, chỉ là tôi kiên trì với vấn đề lâu hơn.', author: 'Albert Einstein' },
  { en: "The only bad workout is the one that didn't happen.", vi: 'Buổi tập tệ nhất là buổi tập không diễn ra.', author: 'Ngạn ngữ' },
  { en: 'Success is the sum of small efforts repeated day in and day out.', vi: 'Thành công là tổng của những nỗ lực nhỏ lặp lại mỗi ngày.', author: 'Robert Collier' },
  { en: 'Strength does not come from winning. Your struggles develop your strengths.', vi: 'Sức mạnh không đến từ chiến thắng. Chính khó khăn rèn nên sức mạnh của bạn.', author: 'Arnold Schwarzenegger' },
  { en: 'He who has a why to live can bear almost any how.', vi: 'Người có lý do để sống có thể chịu đựng gần như mọi cách sống.', author: 'Friedrich Nietzsche' },
  { en: 'Well done is better than well said.', vi: 'Làm tốt hơn là nói hay.', author: 'Benjamin Franklin' },
  { en: 'Slow progress is still progress.', vi: 'Tiến bộ chậm vẫn là tiến bộ.', author: 'Ngạn ngữ' },
  { en: "You don't have to be great to start, but you have to start to be great.", vi: 'Không cần giỏi mới bắt đầu, nhưng phải bắt đầu mới giỏi được.', author: 'Zig Ziglar' },
  { en: 'What we do now echoes in eternity.', vi: 'Những gì ta làm hôm nay sẽ vang vọng mãi về sau.', author: 'Marcus Aurelius' },
  { en: 'The groundwork for all happiness is good health.', vi: 'Nền tảng của mọi hạnh phúc là sức khỏe tốt.', author: 'Leigh Hunt' },
];

function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Matches QuoteBanner.tsx layout: EN italic, VI bold, then "— Author".
function formatQuote(q) {
  return `<i>${escapeHtml(q.en)}</i>\n<b>${escapeHtml(q.vi)}</b>\n— ${escapeHtml(q.author)}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Mirrors formatGoalTarget() in workout-web/src/pages/SettingsPage.tsx —
// target = targetReps ?? targetDurationSeconds ?? targetSets.
function goalTargetText(goal) {
  if (goal.targetReps) return `${goal.targetReps} cái`;
  if (goal.targetDurationSeconds) {
    const s = goal.targetDurationSeconds;
    return s >= 60 ? `${Math.round(s / 60)} phút` : `${s} giây`;
  }
  return `${goal.targetSets || 1} hiệp`;
}

// Sums raw reps / durationSeconds logged today for a given goal's preset,
// across (possibly multiple) logs/exercise-entries — same raw-unit
// convention as the rest of the app (no unit conversion beyond seconds<->min
// display formatting).
function sumTodayForGoal(todayLogs, goal) {
  let reps = 0;
  let durationSeconds = 0;
  for (const log of todayLogs) {
    for (const ex of log.exercises || []) {
      if (ex.presetId !== goal.presetId) continue;
      reps += ex.reps || 0;
      durationSeconds += ex.durationSeconds || 0;
    }
  }
  return { reps, durationSeconds };
}

function buildMorningMessage(profile, goals, recentLogs) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`☀️ <b>Chào buổi sáng, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');

  if (enabledGoals.length > 0) {
    lines.push('<b>Lịch tập hôm nay:</b>');
    for (const g of enabledGoals) {
      lines.push(`• ${escapeHtml(g.name)}: ${goalTargetText(g)}`);
    }
  } else {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
  }

  const recentNames = recentLogs
    .slice(0, 2)
    .map((l) => (l.exercises || []).map((e) => e.name).filter(Boolean).join(', '))
    .filter(Boolean);
  if (recentNames.length > 0) {
    lines.push('');
    lines.push(`Bài gần đây: ${escapeHtml(recentNames.join(' · '))}`);
  }

  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  return lines.join('\n');
}

function buildEveningMessage(profile, goals, todayLogs) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`🌙 <b>Tối rồi, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');

  const remaining = [];
  for (const g of enabledGoals) {
    const sum = sumTodayForGoal(todayLogs, g);
    if (g.targetReps) {
      const left = g.targetReps - sum.reps;
      if (left > 0) remaining.push(`• ${escapeHtml(g.name)}: còn ${left} cái`);
    } else if (g.targetDurationSeconds) {
      const left = g.targetDurationSeconds - sum.durationSeconds;
      if (left > 0) {
        const leftText = left >= 60 ? `${Math.round(left / 60)} phút` : `${left} giây`;
        remaining.push(`• ${escapeHtml(g.name)}: còn ${leftText}`);
      }
    }
  }

  if (enabledGoals.length === 0) {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
  } else if (remaining.length === 0) {
    lines.push('🎉 Bạn đã hoàn thành mọi mục tiêu hôm nay. Tuyệt vời, cứ thế phát huy!');
  } else {
    lines.push('<b>Hôm nay còn thiếu:</b>');
    lines.push(...remaining);
  }

  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  return lines.join('\n');
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Every-30-min cron: a slot "fires" for the 30-minute window starting at its
// configured time, e.g. reminderMorning='06:30' fires for now in [06:30,06:59].
function resolveSlot(nowMinutes, morningStr, eveningStr) {
  const morning = toMinutes(morningStr || '06:30');
  const evening = toMinutes(eveningStr || '19:00');
  if (nowMinutes >= morning && nowMinutes <= morning + 29) return 'morning';
  if (nowMinutes >= evening && nowMinutes <= evening + 29) return 'evening';
  return null;
}

async function sendTelegramMessage(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.error(`  Telegram API lỗi: ${res.status} ${JSON.stringify(data)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`  Lỗi gọi Telegram API: ${err.message}`);
    return false;
  }
}

async function processUser(db, uid, profile) {
  const tz = profile.timezone || 'Asia/Ho_Chi_Minh';
  const now = new Date();

  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hh = Number(hm.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(hm.find((p) => p.type === 'minute')?.value ?? '0');
  const nowMinutes = hh * 60 + mm;

  const localToday = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now); // YYYY-MM-DD

  const slot = resolveSlot(nowMinutes, profile.reminderMorning, profile.reminderEvening);
  if (!slot) return; // not within any reminder window right now

  if (profile.lastReminderSent?.[slot] === localToday) return; // already sent today

  const goals = profile.exerciseGoals || [];

  const logsSnap = await db.collection('logs').where('userId', '==', uid).get();
  const allLogs = logsSnap.docs.map((d) => d.data());

  let message;
  if (slot === 'morning') {
    const recentLogs = allLogs
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3);
    message = buildMorningMessage(profile, goals, recentLogs);
  } else {
    const todayLogs = allLogs.filter((l) => l.date === localToday);
    message = buildEveningMessage(profile, goals, todayLogs);
  }

  const ok = await sendTelegramMessage(profile.telegramChatId, message);
  if (ok) {
    await db.collection('users').doc(uid).set(
      { lastReminderSent: { [slot]: localToday } },
      { merge: true }
    );
    console.log(`  Đã gửi (${slot}) cho user ${uid}`);
  } else {
    console.error(`  Gửi thất bại (${slot}) cho user ${uid}`);
  }
}

async function runLive() {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const usersSnap = await db.collection('users').where('reminderEnabled', '==', true).get();
  console.log(`Tìm thấy ${usersSnap.size} user bật nhắc tập.`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const profile = userDoc.data();
    if (!profile.telegramChatId) continue;
    try {
      await processUser(db, uid, profile);
    } catch (err) {
      console.error(`Lỗi xử lý user ${uid}: ${err.message}`);
    }
  }
}

function runDryRun() {
  console.log('=== DRY RUN — thiếu TELEGRAM_BOT_TOKEN hoặc FIREBASE_SERVICE_ACCOUNT ===');
  console.log('(không khởi tạo firebase-admin, không gọi Telegram API)\n');

  const mockProfile = { displayName: 'Nguyên', timezone: 'Asia/Ho_Chi_Minh' };
  const mockGoals = [
    { presetId: 'pushup', name: 'Hít đất', targetReps: 100, targetSets: 1, enabled: true },
    { presetId: 'plank', name: 'Plank', targetDurationSeconds: 120, targetSets: 1, enabled: true },
  ];
  const mockRecentLogs = [
    {
      date: '2026-07-19',
      exercises: [
        { presetId: 'pushup', name: 'Hít đất', reps: 50 },
        { presetId: 'situp', name: 'Gập bụng', reps: 30 },
      ],
    },
    {
      date: '2026-07-18',
      exercises: [{ presetId: 'plank', name: 'Plank', durationSeconds: 90 }],
    },
  ];
  const mockTodayLogs = [
    {
      date: '2026-07-20',
      exercises: [{ presetId: 'pushup', name: 'Hít đất', reps: 40 }],
    },
  ];

  console.log('--- Tin nhắn buổi sáng ---\n');
  console.log(buildMorningMessage(mockProfile, mockGoals, mockRecentLogs));
  console.log('\n--- Tin nhắn buổi tối ---\n');
  console.log(buildEveningMessage(mockProfile, mockGoals, mockTodayLogs));
  console.log('\n=== Kết thúc dry run ===');
}

async function main() {
  if (!TELEGRAM_BOT_TOKEN || !FIREBASE_SERVICE_ACCOUNT) {
    runDryRun();
    return;
  }
  await runLive();
}

main().catch((err) => {
  console.error('Lỗi không xử lý được:', err);
  process.exit(1);
});
