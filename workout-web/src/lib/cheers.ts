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
  'Tuyệt vời! Giữ phong độ này nhé 🎯',
  'Mỗi ngày một chút, kết quả một nhiều 📈',
  'Bạn đang xây dựng thói quen vô địch 🛠️',
  'Cố lên, tương lai bạn đang cảm ơn đấy 🙏',
  'Quá đỉnh! Cơ bắp đang lắng nghe 💥',
  'Không có đường tắt, chỉ có bạn và nỗ lực 🛤️',
  'Hôm nay bạn chọn không lười — quá ngầu 😎',
  'Một buổi tập = một chiến thắng nhỏ 🏅',
  'Kiên trì là siêu năng lực của bạn ⚡',
  'Cứ đều đặn thế này, bạn sẽ bất ngờ đấy 🌈',
  'Tập xong rồi! Tự thưởng một nụ cười 😄',
  'Bền bỉ hôm nay, khỏe mạnh dài lâu 🌳',
];

export const WEEKLY_CHEERS: string[] = [
  'Trọn vẹn cả tuần! Quá xuất sắc 🏅',
  'Tuần này bạn bất bại 🔝',
  'Hoàn thành mục tiêu tuần — đỉnh của chóp 👑',
  'Một tuần kỷ luật tuyệt vời 💎',
  'Bạn vừa khép lại tuần hoàn hảo 🎖️',
  'Cả tuần không bỏ lỡ — quá bản lĩnh 🦾',
  'Tuần này bạn đã thắng chính mình 🥇',
  'Mục tiêu tuần: đã chinh phục ✅🔥',
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

export function pickCheer(seed: string): string {
  return CHEERS[hashSeed(seed) % CHEERS.length];
}

export function pickWeeklyCheer(seed: string): string {
  return WEEKLY_CHEERS[hashSeed(seed) % WEEKLY_CHEERS.length];
}
