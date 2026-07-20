import { useState } from 'react';
import { Achievement, computeAchievements } from '../lib/achievements';
import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';

interface Props {
  logs: WorkoutLog[];
  profile: UserProfile | null;
}

const GROUP_ORDER = ['streak', 'sessions', 'minutes', 'pr', 'consistency', 'variety'];

function AchievementBadge({ a }: { a: Achievement }) {
  if (a.unlocked) {
    return (
      <div className="bg-primary-light border border-primary/20 rounded-xl p-3 flex flex-col items-center text-center gap-1">
        <span className="text-2xl leading-none">{a.icon}</span>
        <p className="text-[11px] font-bold text-primary leading-tight">{a.title}</p>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, Math.round((a.current / a.target) * 100)));
  const remain = Math.max(0, a.target - a.current);

  return (
    <div className="bg-card-2 rounded-xl p-3 flex flex-col items-center text-center gap-1 opacity-50">
      <span className="text-2xl leading-none">{a.icon}</span>
      <p className="text-[11px] font-bold text-text-muted leading-tight">{a.title}</p>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1">
        <div className="h-full bg-text-muted rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-text-muted">còn {remain}</p>
    </div>
  );
}

export default function AchievementsCard({ logs, profile }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!logs || logs.length === 0) return null;

  const achievements = computeAchievements(logs, profile);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  // Compact view: per group, show the highest-tier unlocked badge (the
  // trophy already earned) plus the next locked milestone (what's coming).
  const summary: Achievement[] = [];
  for (const group of GROUP_ORDER) {
    const groupAchievements = achievements.filter((a) => a.group === group);
    const unlocked = groupAchievements.filter((a) => a.unlocked);
    const locked = groupAchievements.filter((a) => !a.unlocked);
    if (unlocked.length > 0) summary.push(unlocked[unlocked.length - 1]);
    if (locked.length > 0) summary.push(locked[0]);
  }

  const displayList = expanded ? achievements : summary;
  const canExpand = achievements.length > summary.length;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-main">🏅 Thành tựu</p>
        <p className="text-sm font-black text-primary">{unlockedCount}/{total} huy hiệu</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {displayList.map((a) => (
          <AchievementBadge key={a.id} a={a} />
        ))}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-center text-xs font-semibold text-primary mt-3 py-1.5 hover:underline">
          {expanded ? 'Thu gọn ↑' : 'Xem tất cả →'}
        </button>
      )}
    </div>
  );
}
