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
  { en: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', vi: 'Thành công không phải đích cuối, thất bại không phải dấu chấm hết: quan trọng là can đảm tiếp tục.', author: 'Winston Churchill' },
  { en: 'It does not matter how slowly you go as long as you do not stop.', vi: 'Đi chậm thế nào cũng không sao, miễn là đừng dừng lại.', author: 'Khổng Tử' },
  { en: 'The pain of discipline is far less than the pain of regret.', vi: 'Nỗi đau của kỷ luật nhỏ hơn nhiều so với nỗi đau của hối tiếc.', author: 'Ngạn ngữ' },
  { en: 'Motivation is what gets you started. Habit is what keeps you going.', vi: 'Động lực giúp bạn bắt đầu. Thói quen giúp bạn duy trì.', author: 'Jim Ryun' },
  { en: "You miss 100% of the shots you don't take.", vi: 'Bạn bỏ lỡ 100% những cú ném mình không thực hiện.', author: 'Wayne Gretzky' },
  { en: "The difference between the impossible and the possible lies in a person's determination.", vi: 'Ranh giới giữa điều không thể và có thể nằm ở quyết tâm của mỗi người.', author: 'Tommy Lasorda' },
  { en: 'Push yourself, because no one else is going to do it for you.', vi: 'Hãy tự thúc đẩy bản thân, vì không ai làm điều đó thay bạn.', author: 'Khuyết danh' },
  { en: 'Sweat is just fat crying.', vi: 'Mồ hôi chỉ là mỡ đang khóc.', author: 'Khuyết danh' },
  { en: "Strength grows in the moments when you think you can't go on but you keep going anyway.", vi: 'Sức mạnh lớn lên đúng lúc bạn nghĩ mình không thể tiếp tục nhưng vẫn cứ bước.', author: 'Khuyết danh' },
  { en: 'A year from now you may wish you had started today.', vi: 'Một năm nữa nhìn lại, bạn sẽ ước gì mình đã bắt đầu từ hôm nay.', author: 'Karen Lamb' },
  { en: 'The only way to define your limits is by going beyond them.', vi: 'Cách duy nhất để biết giới hạn của mình là vượt qua nó.', author: 'Arthur C. Clarke' },
  { en: 'Discipline equals freedom.', vi: 'Kỷ luật chính là tự do.', author: 'Jocko Willink' },
  { en: "You don't get what you wish for. You get what you work for.", vi: 'Bạn không nhận được điều mình ước, mà nhận được điều mình bỏ công sức.', author: 'Khuyết danh' },
  { en: "Don't count the days, make the days count.", vi: 'Đừng đếm số ngày đã qua, hãy làm cho mỗi ngày đáng giá.', author: 'Muhammad Ali' },
  { en: 'Champions keep playing until they get it right.', vi: 'Nhà vô địch cứ chơi tiếp cho đến khi làm đúng.', author: 'Billie Jean King' },
  { en: 'The mind is the limit — as long as the mind can envision something, you can do it.', vi: 'Tâm trí chính là giới hạn — chỉ cần tâm trí hình dung được, bạn sẽ làm được.', author: 'Arnold Schwarzenegger' },
  { en: 'Nothing will work unless you do.', vi: 'Không gì tự vận hành nếu bạn không hành động.', author: 'Maya Angelou' },
  { en: 'Energy and persistence conquer all things.', vi: 'Năng lượng và sự kiên trì chinh phục mọi thứ.', author: 'Benjamin Franklin' },
  { en: "It always seems impossible until it's done.", vi: 'Mọi thứ luôn có vẻ bất khả thi cho đến khi nó được hoàn thành.', author: 'Nelson Mandela' },
  { en: 'Fall seven times, stand up eight.', vi: 'Ngã bảy lần, đứng dậy tám lần.', author: 'Ngạn ngữ Nhật' },
  { en: 'Small daily improvements are the key to staggering long-term results.', vi: 'Những cải thiện nhỏ mỗi ngày là chìa khoá cho kết quả lớn về lâu dài.', author: 'Khuyết danh' },
  { en: 'What hurts today makes you stronger tomorrow.', vi: 'Điều làm bạn đau hôm nay sẽ khiến bạn mạnh mẽ hơn vào ngày mai.', author: 'Jay Cutler' },
  { en: "Your body can stand almost anything. It's your mind you have to convince.", vi: 'Cơ thể bạn chịu đựng được gần như mọi thứ — chỉ cần thuyết phục được tâm trí.', author: 'Khuyết danh' },
  { en: 'The clock is ticking — are you becoming the person you want to be?', vi: 'Đồng hồ vẫn đang chạy — bạn có đang trở thành người mình muốn không?', author: 'Greg Plitt' },
  { en: "If it doesn't challenge you, it doesn't change you.", vi: 'Nếu nó không thách thức bạn, nó sẽ không thể thay đổi bạn.', author: 'Fred DeVito' },
  { en: 'Good things come to those who sweat.', vi: 'Điều tốt đẹp đến với những ai chịu đổ mồ hôi.', author: 'Khuyết danh' },
  { en: "Excuses don't burn calories.", vi: 'Lời bào chữa không đốt được calo nào.', author: 'Khuyết danh' },
  { en: "The hard days are the best because that's when champions are made.", vi: 'Những ngày khó khăn nhất là ngày tốt nhất, vì đó là lúc nhà vô địch được tạo ra.', author: 'Gabby Douglas' },
  { en: "You don't have to be extreme, just consistent.", vi: 'Bạn không cần cực đoan, chỉ cần đều đặn.', author: 'Khuyết danh' },
  { en: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', vi: 'Chúng ta là những gì mình lặp lại mỗi ngày. Sự xuất sắc không phải là hành động, mà là thói quen.', author: 'Aristotle' },
  { en: 'The best time to plant a tree was 20 years ago. The second best time is now.', vi: 'Thời điểm tốt nhất để trồng cây là 20 năm trước. Thời điểm tốt thứ nhì là ngay bây giờ.', author: 'Ngạn ngữ' },
  { en: 'Whether you think you can, or you think you cannot — you are right.', vi: 'Dù bạn nghĩ mình làm được, hay nghĩ mình không làm được — bạn đều đúng.', author: 'Henry Ford' },
  { en: 'The man who moves a mountain begins by carrying away small stones.', vi: 'Người dời được cả ngọn núi bắt đầu từ việc mang đi từng viên đá nhỏ.', author: 'Khổng Tử' },
  { en: 'Perseverance is not a long race; it is many short races one after the other.', vi: 'Kiên trì không phải một chặng đua dài, mà là nhiều chặng đua ngắn nối tiếp nhau.', author: 'Walter Elliot' },
  { en: 'The struggle you are in today is developing the strength you need for tomorrow.', vi: 'Cuộc chiến bạn đang trải qua hôm nay đang rèn nên sức mạnh bạn cần cho ngày mai.', author: 'Robert Tew' },
  { en: "Don't limit your challenges, challenge your limits.", vi: 'Đừng giới hạn thử thách của mình, hãy thử thách giới hạn của mình.', author: 'Khuyết danh' },
  { en: 'Wake up with determination, go to bed with satisfaction.', vi: 'Thức dậy với quyết tâm, đi ngủ với sự hài lòng.', author: 'Khuyết danh' },
  { en: 'Difficult roads often lead to beautiful destinations.', vi: 'Con đường gian nan thường dẫn đến những đích đến đẹp đẽ.', author: 'Khuyết danh' },
  { en: 'Once you learn to quit, it becomes a habit.', vi: 'Một khi bạn học được cách bỏ cuộc, nó sẽ trở thành thói quen.', author: 'Vince Lombardi' },
  { en: "It's not whether you get knocked down, it's whether you get up.", vi: 'Vấn đề không phải là bạn có bị quật ngã hay không, mà là bạn có đứng dậy hay không.', author: 'Vince Lombardi' },
  { en: 'The only place where success comes before work is in the dictionary.', vi: 'Chỉ trong từ điển thì "thành công" mới đứng trước "làm việc".', author: 'Vince Lombardi' },
  { en: 'Far and away the best prize that life offers is the chance to work hard at work worth doing.', vi: 'Phần thưởng lớn nhất mà cuộc sống mang lại là cơ hội được nỗ lực hết mình cho điều đáng làm.', author: 'Theodore Roosevelt' },
  { en: 'Believe you can and you are halfway there.', vi: 'Tin rằng mình làm được, coi như bạn đã đi được nửa chặng đường.', author: 'Theodore Roosevelt' },
  { en: 'Do the hard jobs first. The easy jobs will take care of themselves.', vi: 'Hãy làm việc khó trước. Việc dễ sẽ tự lo được.', author: 'Dale Carnegie' },
  { en: 'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', vi: 'Người nghiệp dư ngồi chờ cảm hứng, còn chúng ta thì đứng dậy và bắt tay vào làm.', author: 'Stephen King' },
  { en: 'Continuous effort — not strength or intelligence — is the key to unlocking our potential.', vi: 'Nỗ lực bền bỉ — chứ không phải sức mạnh hay trí thông minh — mới là chìa khoá mở ra tiềm năng của chúng ta.', author: 'Winston Churchill' },
  { en: "Set your goals high, and don't stop till you get there.", vi: 'Đặt mục tiêu thật cao, và đừng dừng lại cho đến khi đạt được.', author: 'Bo Jackson' },
  { en: 'There is no elevator to success. You have to take the stairs.', vi: 'Không có thang máy đến thành công. Bạn phải tự leo từng bậc thang bộ.', author: 'Khuyết danh' },
  { en: 'Somewhere, someone else is training when you are not — and when you race them, they will win.', vi: 'Ở đâu đó, có người vẫn đang tập khi bạn nghỉ — và khi đối đầu, người đó sẽ thắng.', author: 'Khuyết danh' },
  { en: 'The pain you feel now is nothing compared to the pain of regret.', vi: 'Nỗi đau bạn chịu bây giờ chẳng thấm gì so với nỗi đau của sự hối tiếc sau này.', author: 'Khuyết danh' },
  { en: 'A river cuts through rock, not because of its power, but its persistence.', vi: 'Dòng sông xẻ được đá không phải nhờ sức mạnh, mà nhờ sự kiên trì.', author: 'Jim Watkins' },
  { en: 'The comeback is always stronger than the setback.', vi: 'Sự trở lại luôn mạnh mẽ hơn cú vấp ngã.', author: 'Khuyết danh' },
  { en: 'Your only limit is you.', vi: 'Giới hạn duy nhất của bạn chính là bạn.', author: 'Khuyết danh' },
  { en: 'Train insane or remain the same.', vi: 'Tập điên cuồng, hoặc mãi mãi giậm chân tại chỗ.', author: 'Khuyết danh' },
  { en: 'What seems impossible today will one day become your warm-up.', vi: 'Điều tưởng chừng bất khả thi hôm nay, một ngày nào đó sẽ chỉ là bài khởi động của bạn.', author: 'Khuyết danh' },
  { en: "Don't wish for it, work for it.", vi: 'Đừng chỉ ước, hãy bắt tay vào làm.', author: 'Khuyết danh' },
  { en: 'The body achieves what the mind believes and the will sustains.', vi: 'Cơ thể đạt được điều tâm trí tin tưởng và ý chí duy trì.', author: 'Khuyết danh' },
  { en: "Rome wasn't built in a day, but they worked on it every single day.", vi: 'La Mã không được xây trong một ngày, nhưng người ta xây nó mỗi ngày không nghỉ.', author: 'Khuyết danh' },
  { en: 'You are stronger than you think.', vi: 'Bạn mạnh mẽ hơn mình nghĩ rất nhiều.', author: 'Khuyết danh' },
  { en: 'Every accomplishment starts with the decision to try.', vi: 'Mọi thành tựu đều bắt đầu từ quyết định thử sức.', author: 'Khuyết danh' },
  { en: 'Sore today, strong tomorrow.', vi: 'Đau hôm nay, mạnh mẽ ngày mai.', author: 'Khuyết danh' },
  { en: 'Progress, not perfection.', vi: 'Cần sự tiến bộ, không cần sự hoàn hảo.', author: 'Khuyết danh' },
  { en: 'Do not wait for the perfect moment, take the moment and make it perfect.', vi: 'Đừng chờ khoảnh khắc hoàn hảo, hãy nắm lấy khoảnh khắc và biến nó thành hoàn hảo.', author: 'Khuyết danh' },
  { en: 'Habits are the compound interest of self-improvement.', vi: 'Thói quen chính là lãi kép của sự tự hoàn thiện.', author: 'James Clear' },
  { en: 'You do not rise to the level of your goals, you fall to the level of your systems.', vi: 'Bạn không vươn lên bằng mục tiêu, mà rơi xuống bằng chính hệ thống thói quen của mình.', author: 'James Clear' },
  { en: 'Every action you take is a vote for the type of person you wish to become.', vi: 'Mỗi hành động bạn làm là một lá phiếu cho con người bạn muốn trở thành.', author: 'James Clear' },
  { en: 'The chains of habit are too weak to be felt until they are too strong to be broken.', vi: 'Xiềng xích của thói quen quá nhẹ để cảm nhận, cho đến khi nó quá chắc để phá vỡ.', author: 'Samuel Johnson' },
  { en: 'First we form habits, then they form us.', vi: 'Đầu tiên ta tạo nên thói quen, rồi thói quen tạo nên ta.', author: 'Ngạn ngữ' },
  { en: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', vi: 'Biết thôi chưa đủ; ta phải áp dụng. Muốn thôi chưa đủ; ta phải hành động.', author: 'Johann Wolfgang von Goethe' },
  { en: 'He who has health has hope, and he who has hope has everything.', vi: 'Ai có sức khỏe là có hy vọng, ai có hy vọng là có tất cả.', author: 'Ngạn ngữ Ả Rập' },
  { en: 'He who has a healthy body has a treasure that no wealth can buy.', vi: 'Ai có cơ thể khỏe mạnh là có một kho báu mà tiền bạc không mua được.', author: 'Ngạn ngữ' },
  { en: 'A healthy outside starts from the inside.', vi: 'Vẻ ngoài khỏe mạnh bắt đầu từ bên trong.', author: 'Robert Urich' },
  { en: 'To keep the body in good health is a duty, otherwise we shall not be able to keep the mind strong and clear.', vi: 'Giữ gìn sức khỏe cơ thể là một trách nhiệm, nếu không tâm trí ta khó mà mạnh mẽ và minh mẫn.', author: 'Đức Phật' },
  { en: 'Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.', vi: 'Thể lực không chỉ là chìa khoá cho một cơ thể khỏe mạnh, mà còn là nền tảng cho một trí tuệ năng động, sáng tạo.', author: 'John F. Kennedy' },
  { en: 'Move your body every day, even if it is just a little.', vi: 'Hãy vận động cơ thể mỗi ngày, dù chỉ một chút.', author: 'Khuyết danh' },
  { en: 'Early to bed and early to rise makes a man healthy, wealthy, and wise.', vi: 'Ngủ sớm dậy sớm giúp con người khỏe mạnh, giàu có và khôn ngoan.', author: 'Benjamin Franklin' },
  { en: 'Rest when you are weary. Refresh and renew yourself, your body, your mind, your spirit.', vi: 'Nghỉ ngơi khi bạn mệt mỏi. Làm mới lại cơ thể, tâm trí và tinh thần của mình.', author: 'Ralph Marston' },
  { en: 'Consistency is what transforms average into excellence.', vi: 'Sự đều đặn là thứ biến điều bình thường thành xuất sắc.', author: 'Khuyết danh' },
  { en: 'Anything worth doing is worth doing well.', vi: 'Việc gì đáng làm thì đáng làm cho tốt.', author: 'Ngạn ngữ' },
  { en: 'Great things are done by a series of small things brought together.', vi: 'Những điều vĩ đại được tạo nên từ chuỗi những điều nhỏ bé gộp lại.', author: 'Vincent van Gogh' },
  { en: 'Patience, persistence and perspiration make an unbeatable combination for success.', vi: 'Kiên nhẫn, kiên trì và mồ hôi tạo nên một sự kết hợp bất bại cho thành công.', author: 'Napoleon Hill' },
  { en: 'The expert in anything was once a beginner.', vi: 'Chuyên gia trong bất kỳ lĩnh vực nào cũng từng là người mới bắt đầu.', author: 'Helen Hayes' },
  { en: 'A little progress each day adds up to big results.', vi: 'Một chút tiến bộ mỗi ngày sẽ cộng dồn thành kết quả lớn.', author: 'Satya Nani' },
  { en: 'Discipline is the bridge between goals and accomplishment.', vi: 'Kỷ luật là cây cầu nối giữa mục tiêu và thành tựu.', author: 'Jim Rohn' },
  { en: 'The greatest wealth is health.', vi: 'Của cải lớn nhất chính là sức khoẻ.', author: 'Virgil' },
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
