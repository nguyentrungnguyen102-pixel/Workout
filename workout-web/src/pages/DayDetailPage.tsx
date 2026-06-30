import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { getLogsForDate } from '../services/workoutService';
import { WorkoutLog } from '../types/workout';
import { buildDayTimeline, aggregateExercises } from '../lib/dayTimeline';
import { formatAmount } from '../lib/format';

function formatDateViLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${weekday}, ${day}/${month}/${year}`;
}

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const { setDraftFromLog } = useWorkoutStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid || !date) return;
    let cancelled = false;
    setLoading(true);
    getLogsForDate(uid, date)
      .then((result) => { if (!cancelled) setLogs(result); })
      .catch(() => { if (!cancelled) setLogs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid, date]);

  const timeline = buildDayTimeline(logs);
  const totalMinutes = logs.reduce((s, l) => s + l.totalDurationMinutes, 0);
  const totalKcal = logs.reduce((s, l) => s + l.caloriesEstimate, 0);

  const handleRepeatDay = () => {
    if (logs.length === 0) return;
    const aggregated = aggregateExercises(logs);
    setDraftFromLog({ ...logs[0], exercises: aggregated });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!date) {
    return (
      <div className="px-4 pt-6">
        <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-text-secondary mb-4">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <p className="text-center text-text-secondary py-10">Không tìm thấy ngày</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      {/* Back + repeat header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-main transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Lịch sử</span>
        </button>
        {logs.length > 0 && (
          <button onClick={handleRepeatDay}
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl">
            <RotateCcw size={14} />
            Tập lại
          </button>
        )}
      </div>

      {/* Day header */}
      <div className="mb-5">
        <h1 className="text-xl font-black text-text-main">{formatDateViLong(date)}</h1>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-primary">{totalMinutes}</p>
            <p className="text-xs text-text-secondary mt-0.5">phút</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-text-main">{totalKcal}</p>
            <p className="text-xs text-text-secondary mt-0.5">kcal</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-text-secondary text-sm">Không có buổi tập nào ngày này</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-text-main">Chi tiết ngày ({timeline.length} bài)</p>
          </div>
          <div className="divide-y divide-border">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3">
                {item.time && (
                  <span className="text-xs font-bold text-primary flex-shrink-0 w-12">{item.time}</span>
                )}
                <span className="font-semibold text-text-main text-sm flex-1">{item.name}</span>
                <span className="text-sm text-text-secondary">{formatAmount(item.ex)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
