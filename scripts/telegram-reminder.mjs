// Telegram workout reminder — sends personalized reminders via one Telegram
// bot, with content that varies by day of week. Triggered every 30 minutes
// by the GitHub Actions cron in .github/workflows/telegram-reminder.yml.
//
// Schedule (all times are the user's own reminderMorning/reminderEvening,
// resolved in their profile timezone):
//   Mon-Fri morning: yesterday's shortfall + today's targets + week-to-date remaining
//   Mon-Fri evening: today's remaining
//   Saturday morning ONLY (no Saturday evening send): week-to-date remaining
//   Sunday evening ONLY (no Sunday morning send): full week vs last-week summary
//
// The web app (workout-web/) is a static SPA with owner-only Firestore
// rules, so it cannot read other users' data to send reminders itself.
// This script instead runs in CI with the Firebase Admin SDK (full
// server-side access) and pushes messages out via the Telegram Bot API.
//
// DRY RUN: if TELEGRAM_BOT_TOKEN or FIREBASE_SERVICE_ACCOUNT is missing
// (e.g. running locally, or secrets not configured in the repo yet), this
// script does NOT initialize firebase-admin and does NOT call Telegram —
// it builds all 4 message variants from hardcoded mock data and prints
// them, then exits 0. This keeps the script runnable/testable without any
// live credentials.

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

// Formats an arbitrary raw value (reps or seconds) using whichever unit
// this goal is tracked in — reused for target text AND for "còn N" deltas.
function formatUnitValue(goal, n) {
  if (goal.targetReps) return `${n} cái`;
  if (goal.targetDurationSeconds) {
    return n >= 60 ? `${Math.round(n / 60)} phút` : `${n} giây`;
  }
  return `${n} hiệp`;
}

// Mirrors formatGoalTarget() in workout-web/src/pages/SettingsPage.tsx —
// target = targetReps ?? targetDurationSeconds ?? targetSets.
function goalTargetText(goal) {
  if (goal.targetReps) return formatUnitValue(goal, goal.targetReps);
  if (goal.targetDurationSeconds) return formatUnitValue(goal, goal.targetDurationSeconds);
  return formatUnitValue(goal, goal.targetSets || 1);
}

function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateStr(d);
}
// 0=Sun..6=Sat — pure calendar math, UTC-anchored so it doesn't depend on
// the CI runner's local timezone (localToday is already the user's local
// calendar date string by the time it reaches these helpers).
function dowOf(dateStr) {
  return parseDateStr(dateStr).getUTCDay();
}
function mondayOf(dateStr) {
  return addDays(dateStr, -((dowOf(dateStr) + 6) % 7));
}

// Sums raw reps / durationSeconds logged for a given goal's preset across
// (possibly multiple) logs/exercise-entries within [fromDateStr,
// toDateStrIncl] — same raw-unit convention as the rest of the app (no
// unit conversion beyond seconds<->min display formatting). Guards against
// an inverted range (e.g. Monday morning's "week-to-date" is
// mondayOf(today)..yesterday, which is empty/inverted on a Monday since
// yesterday is last Sunday) by returning zero instead of scanning wrong.
function sumForGoalInRange(allLogs, goal, fromDateStr, toDateStrIncl) {
  if (fromDateStr > toDateStrIncl) return { reps: 0, durationSeconds: 0 };
  let reps = 0;
  let durationSeconds = 0;
  for (const log of allLogs) {
    if (!log.date || log.date < fromDateStr || log.date > toDateStrIncl) continue;
    for (const ex of log.exercises || []) {
      if (ex.presetId !== goal.presetId) continue;
      reps += ex.reps || 0;
      durationSeconds += ex.durationSeconds || 0;
    }
  }
  return { reps, durationSeconds };
}

function dailyTargetValue(goal) {
  return goal.targetReps ?? goal.targetDurationSeconds ?? 0;
}

function doneValue(goal, sums) {
  return goal.targetReps ? sums.reps : sums.durationSeconds;
}

// Pushes either a titled bullet list of goals still short (target > done),
// or `allMetMessage` if none are short. Caller guarantees enabledGoals is
// non-empty (checked once per message builder, see below).
function buildGoalDeltaSection(lines, { title, enabledGoals, doneFn, targetFn, allMetMessage }) {
  const remaining = [];
  for (const g of enabledGoals) {
    const target = targetFn(g);
    const left = target - doneFn(g);
    if (target > 0 && left > 0) remaining.push(`• ${escapeHtml(g.name)}: còn ${formatUnitValue(g, left)}`);
  }
  if (remaining.length === 0) {
    lines.push(allMetMessage);
  } else {
    lines.push(title);
    lines.push(...remaining);
  }
}

// "Tuần này còn thiếu" — week-to-date (Monday..yesterday) vs weekly target.
// Shared verbatim by weekday-morning §3 and Saturday-morning's sole section.
function pushWeeklyRemainingSection(lines, enabledGoals, allLogs, localToday, sessionsPerWeek) {
  const thisMonday = mondayOf(localToday);
  const yesterday = addDays(localToday, -1);
  buildGoalDeltaSection(lines, {
    title: '<b>Tuần này còn thiếu:</b>',
    enabledGoals,
    doneFn: (g) => doneValue(g, sumForGoalInRange(allLogs, g, thisMonday, yesterday)),
    targetFn: (g) => dailyTargetValue(g) * sessionsPerWeek,
    allMetMessage: '🎉 Bạn đã hoàn thành mục tiêu tuần này rồi!',
  });
}

// Full week vs last-week comparison (every goal shown, not filtered by
// shortfall) — only used by Sunday evening's summary.
function buildWeeklySummarySection(lines, { enabledGoals, allLogs, localToday, sessionsPerWeek }) {
  const thisMonday = mondayOf(localToday);
  const lastWeekMonday = mondayOf(addDays(localToday, -7));
  const lastWeekSunday = addDays(lastWeekMonday, 6);

  lines.push('<b>Tổng kết tuần này:</b>');
  let scoreSum = 0;
  let scoreCount = 0;
  for (const g of enabledGoals) {
    const doneThisWeek = doneValue(g, sumForGoalInRange(allLogs, g, thisMonday, localToday));
    const doneLastWeek = doneValue(g, sumForGoalInRange(allLogs, g, lastWeekMonday, lastWeekSunday));
    lines.push(`• ${escapeHtml(g.name)}: ${formatUnitValue(g, doneThisWeek)} (tuần trước ${formatUnitValue(g, doneLastWeek)})`);

    const target = dailyTargetValue(g) * sessionsPerWeek;
    if (target > 0) {
      scoreSum += Math.min(100, Math.round((doneThisWeek / target) * 100));
      scoreCount += 1;
    }
  }

  if (scoreCount > 0) {
    const scoreThisWeek = Math.round(scoreSum / scoreCount);
    let scoreLastSum = 0;
    let scoreLastCount = 0;
    for (const g of enabledGoals) {
      const target = dailyTargetValue(g) * sessionsPerWeek;
      if (target === 0) continue;
      const doneLastWeek = doneValue(g, sumForGoalInRange(allLogs, g, lastWeekMonday, lastWeekSunday));
      scoreLastSum += Math.min(100, Math.round((doneLastWeek / target) * 100));
      scoreLastCount += 1;
    }
    const scoreLastWeek = scoreLastCount > 0 ? Math.round(scoreLastSum / scoreLastCount) : 0;
    const delta = scoreThisWeek - scoreLastWeek;

    lines.push('');
    if (delta > 0) {
      lines.push(`📈 Tăng ${delta} điểm % so với tuần trước — giữ vững phong độ nhé!`);
    } else if (delta < 0) {
      lines.push(`📉 Giảm ${Math.abs(delta)} điểm % so với tuần trước — tuần tới cố gắng hơn nhé!`);
    } else {
      lines.push('➖ Ngang bằng tuần trước — đều đặn là chìa khoá, cố lên!');
    }
  }
}

function sessionsPerWeekOf(profile) {
  return Math.max(1, profile.weeklyGoalSessions || 5);
}

function buildWeekdayMorningMessage(profile, goals, allLogs, localToday) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`☀️ <b>Chào buổi sáng, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  lines.push('');

  if (enabledGoals.length === 0) {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
    return lines.join('\n');
  }

  const yesterday = addDays(localToday, -1);
  buildGoalDeltaSection(lines, {
    title: '<b>Hôm qua còn thiếu:</b>',
    enabledGoals,
    doneFn: (g) => doneValue(g, sumForGoalInRange(allLogs, g, yesterday, yesterday)),
    targetFn: dailyTargetValue,
    allMetMessage: '🎉 Hôm qua bạn đã hoàn thành hết mục tiêu!',
  });

  lines.push('');
  lines.push('<b>Hôm nay cần tập:</b>');
  for (const g of enabledGoals) {
    lines.push(`• ${escapeHtml(g.name)}: ${goalTargetText(g)}`);
  }

  lines.push('');
  pushWeeklyRemainingSection(lines, enabledGoals, allLogs, localToday, sessionsPerWeekOf(profile));

  return lines.join('\n');
}

function buildWeekdayEveningMessage(profile, goals, allLogs, localToday) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`🌙 <b>Tối rồi, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  lines.push('');

  if (enabledGoals.length === 0) {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
    return lines.join('\n');
  }

  buildGoalDeltaSection(lines, {
    title: '<b>Hôm nay còn thiếu:</b>',
    enabledGoals,
    doneFn: (g) => doneValue(g, sumForGoalInRange(allLogs, g, localToday, localToday)),
    targetFn: dailyTargetValue,
    allMetMessage: '🎉 Bạn đã hoàn thành mọi mục tiêu hôm nay. Tuyệt vời, cứ thế phát huy!',
  });

  return lines.join('\n');
}

// Saturday morning ONLY (no Saturday evening send) — catch-up before the
// week ends, same "week-to-date remaining" section as weekday-morning §3.
function buildSaturdayMorningMessage(profile, goals, allLogs, localToday) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`☀️ <b>Chào buổi sáng, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  lines.push('');

  if (enabledGoals.length === 0) {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
    return lines.join('\n');
  }

  pushWeeklyRemainingSection(lines, enabledGoals, allLogs, localToday, sessionsPerWeekOf(profile));
  return lines.join('\n');
}

// Sunday evening ONLY (no Sunday morning send) — full week wrap-up vs last
// week, with a one-line assessment.
function buildSundayEveningMessage(profile, goals, allLogs, localToday) {
  const enabledGoals = goals.filter((g) => g.enabled);
  const lines = [];
  lines.push(`🌙 <b>Tối rồi, ${escapeHtml(profile.displayName || 'bạn')}!</b>`);
  lines.push('');
  lines.push(`💬 ${formatQuote(pickQuote())}`);
  lines.push('');

  if (enabledGoals.length === 0) {
    lines.push('Chưa đặt mục tiêu bài tập — vào Cài đặt để thêm nhé!');
    return lines.join('\n');
  }

  buildWeeklySummarySection(lines, { enabledGoals, allLogs, localToday, sessionsPerWeek: sessionsPerWeekOf(profile) });
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
  const dow = dowOf(localToday); // 0=Sun..6=Sat

  const slot = resolveSlot(nowMinutes, profile.reminderMorning, profile.reminderEvening);
  if (!slot) return; // not within any reminder window right now
  if (slot === 'morning' && dow === 0) return; // no Sunday-morning send
  if (slot === 'evening' && dow === 6) return; // no Saturday-evening send

  if (profile.lastReminderSent?.[slot] === localToday) return; // already sent today

  const goals = profile.exerciseGoals || [];

  const logsSnap = await db.collection('logs').where('userId', '==', uid).get();
  const allLogs = logsSnap.docs.map((d) => d.data());

  let message;
  if (slot === 'morning') {
    message = dow === 6
      ? buildSaturdayMorningMessage(profile, goals, allLogs, localToday)
      : buildWeekdayMorningMessage(profile, goals, allLogs, localToday);
  } else {
    message = dow === 0
      ? buildSundayEveningMessage(profile, goals, allLogs, localToday)
      : buildWeekdayEveningMessage(profile, goals, allLogs, localToday);
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

  // Builders don't read the weekday themselves (only processUser routes by
  // dow), so dry run can call all 4 directly on one fixed mock date — no
  // need to fake dow. 2026-07-22 is a Wednesday; mockAllLogs spans last
  // week (07-13..07-19), this Monday (07-20) and yesterday (07-21) so the
  // "hôm qua thiếu" / "tuần này thiếu" / "so sánh tuần trước" sections all
  // produce non-trivial (non-zero) numbers.
  const mockLocalToday = '2026-07-22';
  const mockProfile = { displayName: 'Nguyên', timezone: 'Asia/Ho_Chi_Minh', weeklyGoalSessions: 5 };
  const mockGoals = [
    { presetId: 'pushup', name: 'Hít đất', targetReps: 100, targetSets: 1, enabled: true },
    { presetId: 'plank', name: 'Plank', targetDurationSeconds: 120, targetSets: 1, enabled: true },
  ];
  const mockAllLogs = [
    // Last week (Mon 07-13 .. Sun 07-19)
    { date: '2026-07-13', exercises: [{ presetId: 'pushup', name: 'Hít đất', reps: 80 }] },
    { date: '2026-07-15', exercises: [{ presetId: 'plank', name: 'Plank', durationSeconds: 90 }] },
    { date: '2026-07-17', exercises: [{ presetId: 'pushup', name: 'Hít đất', reps: 60 }] },
    // This week — Monday 07-20
    { date: '2026-07-20', exercises: [{ presetId: 'pushup', name: 'Hít đất', reps: 50 }, { presetId: 'situp', name: 'Gập bụng', reps: 30 }] },
    // Yesterday 07-21 (partial — leaves a shortfall on both goals)
    { date: '2026-07-21', exercises: [{ presetId: 'pushup', name: 'Hít đất', reps: 40 }, { presetId: 'plank', name: 'Plank', durationSeconds: 60 }] },
  ];

  console.log('--- [T2-T6] Sáng ---\n');
  console.log(buildWeekdayMorningMessage(mockProfile, mockGoals, mockAllLogs, mockLocalToday));
  console.log('\n--- [T2-T6] Tối ---\n');
  console.log(buildWeekdayEveningMessage(mockProfile, mockGoals, mockAllLogs, mockLocalToday));
  console.log('\n--- [T7] Sáng (chỉ gửi sáng) ---\n');
  console.log(buildSaturdayMorningMessage(mockProfile, mockGoals, mockAllLogs, mockLocalToday));
  console.log('\n--- [Chủ nhật] Tối (chỉ gửi tối) ---\n');
  console.log(buildSundayEveningMessage(mockProfile, mockGoals, mockAllLogs, mockLocalToday));
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
