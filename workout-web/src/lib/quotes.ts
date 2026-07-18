export interface Quote {
  en: string;
  vi: string;
  author: string;
}

export const QUOTES: Quote[] = [
  {
    en: 'The body achieves what the mind believes.',
    vi: 'Cơ thể làm được điều mà tâm trí tin tưởng.',
    author: 'Napoleon Hill',
  },
  {
    en: 'The pain you feel today will be the strength you feel tomorrow.',
    vi: 'Nỗi đau hôm nay sẽ là sức mạnh của ngày mai.',
    author: 'Arnold Schwarzenegger',
  },
  {
    en: "Take care of your body. It's the only place you have to live.",
    vi: 'Hãy chăm sóc cơ thể — đó là nơi duy nhất bạn phải sống.',
    author: 'Jim Rohn',
  },
  {
    en: 'Discipline is choosing between what you want now and what you want most.',
    vi: 'Kỷ luật là chọn giữa điều bạn muốn bây giờ và điều bạn muốn nhất.',
    author: 'Abraham Lincoln',
  },
  {
    en: 'A journey of a thousand miles begins with a single step.',
    vi: 'Hành trình vạn dặm bắt đầu từ một bước chân.',
    author: 'Lão Tử',
  },
  {
    en: "It's not that I'm so smart, it's just that I stay with problems longer.",
    vi: 'Không phải tôi thông minh hơn, chỉ là tôi kiên trì với vấn đề lâu hơn.',
    author: 'Albert Einstein',
  },
  {
    en: 'The only bad workout is the one that didn\'t happen.',
    vi: 'Buổi tập tệ nhất là buổi tập không diễn ra.',
    author: 'Ngạn ngữ',
  },
  {
    en: 'Success is the sum of small efforts repeated day in and day out.',
    vi: 'Thành công là tổng của những nỗ lực nhỏ lặp lại mỗi ngày.',
    author: 'Robert Collier',
  },
  {
    en: 'Strength does not come from winning. Your struggles develop your strengths.',
    vi: 'Sức mạnh không đến từ chiến thắng. Chính khó khăn rèn nên sức mạnh của bạn.',
    author: 'Arnold Schwarzenegger',
  },
  {
    en: 'He who has a why to live can bear almost any how.',
    vi: 'Người có lý do để sống có thể chịu đựng gần như mọi cách sống.',
    author: 'Friedrich Nietzsche',
  },
  {
    en: 'Well done is better than well said.',
    vi: 'Làm tốt hơn là nói hay.',
    author: 'Benjamin Franklin',
  },
  {
    en: 'Slow progress is still progress.',
    vi: 'Tiến bộ chậm vẫn là tiến bộ.',
    author: 'Ngạn ngữ',
  },
  {
    en: 'You don\'t have to be great to start, but you have to start to be great.',
    vi: 'Không cần giỏi mới bắt đầu, nhưng phải bắt đầu mới giỏi được.',
    author: 'Zig Ziglar',
  },
  {
    en: 'What we do now echoes in eternity.',
    vi: 'Những gì ta làm hôm nay sẽ vang vọng mãi về sau.',
    author: 'Marcus Aurelius',
  },
  {
    en: 'The groundwork for all happiness is good health.',
    vi: 'Nền tảng của mọi hạnh phúc là sức khỏe tốt.',
    author: 'Leigh Hunt',
  },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

export function pickQuote(seed: string): Quote {
  return QUOTES[hashSeed(seed) % QUOTES.length];
}

// Picks a genuinely random quote (not seeded) — used so the banner shows a
// different quote each time the app is opened/refreshed, rather than the
// same one all day.
export function pickRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
