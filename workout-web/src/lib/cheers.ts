export const CHEERS: string[] = [
  'Cháy hết mình! 🔥',
  'Kỷ luật là tự do 💪',
  'Hôm nay bản lĩnh thật! 🦁',
  'Mạnh hơn hôm qua rồi đó 🚀',
  'Chiến binh không bỏ cuộc! ⚔️',
  'Cơ thể cảm ơn bạn đấy 🙌',
  'Xuất sắc! Không ai tập thay bạn được 🏆',
  'Mồ hôi hôm nay, tự hào ngày mai 💧',
  'Bạn vừa vượt qua phiên bản cũ của mình ✨',
  'Đỉnh cao không tự nhiên mà có 🏔️',
  'Chăm chỉ không phản bội bạn đâu 🌟',
  'Thân thể khỏe, tinh thần vững 🧠💪',
];

export function pickCheer(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  const index = Math.abs(hash) % CHEERS.length;
  return CHEERS[index];
}
