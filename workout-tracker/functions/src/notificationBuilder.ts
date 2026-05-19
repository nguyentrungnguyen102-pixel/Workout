interface StreakContext {
  currentStreak: number;
  weeklyGoal: number;
  thisWeekCount: number;
}

export function buildSmartMessage(streak: StreakContext): string | null {
  const { currentStreak, weeklyGoal, thisWeekCount } = streak;
  const remaining = weeklyGoal - thisWeekCount;

  if (currentStreak >= 30) {
    return `${currentStreak} ngày streak! Huyền thoại. Đừng để đứt chuỗi hôm nay! 👑`;
  }
  if (currentStreak >= 14) {
    return `${currentStreak} ngày liên tiếp — anh đang bốc lửa. Giữ vững! 🔥`;
  }
  if (currentStreak >= 7) {
    return `Streak ${currentStreak} ngày đang chờ anh. Quick Add chỉ 10 giây thôi! 💪`;
  }
  if (currentStreak >= 1) {
    return `Streak ${currentStreak} ngày đang bị đe doạ. 1 buổi tập là đủ để giữ chuỗi! ⚡`;
  }
  if (remaining === 1) {
    return `Còn 1 buổi nữa là xong mục tiêu tuần. Go! 🎯`;
  }
  if (remaining > 1) {
    return `Còn thiếu ${remaining} buổi để đạt mục tiêu tuần. Đừng để cuối tuần phải bù! 📊`;
  }
  return `Hôm nay chưa tập. Bắt đầu streak mới đi, chỉ cần 10 phút! 🚀`;
}
