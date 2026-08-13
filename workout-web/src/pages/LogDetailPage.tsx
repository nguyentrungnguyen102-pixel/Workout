import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Clock, Pencil, Trash2 } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';
import { getLogById, softDeleteLog, restoreLog } from '../services/workoutService';
import { WorkoutLog } from '../types/workout';
import { formatTimeOfDay } from '../lib/date';
import { formatAmount } from '../lib/format';

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { setDraftFromLog, startEditLog } = useWorkoutStore();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletedToast, setDeletedToast] = useState(false);
  // Holds the pending "navigate away after undo window" timer so the Hoàn
  // tác button can cancel it, and so it gets cleared on unmount.
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!logId) return;
    setLoading(true);
    getLogById(logId)
      .then(setLog)
      .catch(() => setLog(null))
      .finally(() => setLoading(false));
  }, [logId]);

  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  const handleRepeat = () => {
    if (!log) return;
    setDraftFromLog(log);
    navigate('/');
  };

  const handleEdit = () => {
    if (!log) return;
    startEditLog(log);
    navigate('/');
  };

  const handleDelete = () => {
    if (!log || !logId) return;
    if (!confirm('Xoá buổi tập này? Bạn có vài giây để hoàn tác.')) return;
    softDeleteLog(logId).catch(() => {});
    setDeletedToast(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => navigate('/history'), 4000);
  };

  const handleUndoDelete = () => {
    if (!logId) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setDeletedToast(false);
    restoreLog(logId).catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="px-4 pt-6">
        <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-text-secondary mb-4">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <p className="text-center text-text-secondary py-10">Không tìm thấy buổi tập</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      {deletedToast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-text-main text-background text-sm font-semibold py-3 px-4 rounded-xl z-50 flex items-center justify-between gap-3">
          <span>Đã xoá buổi tập</span>
          <button onClick={handleUndoDelete} className="font-black text-primary flex-shrink-0">Hoàn tác</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 gap-2">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-main transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Lịch sử</span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleEdit} aria-label="Sửa buổi tập"
            className="p-2 rounded-xl border border-border text-text-secondary hover:text-text-main hover:bg-card-2 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={handleDelete} aria-label="Xoá buổi tập"
            className="p-2 rounded-xl border border-danger-light text-danger hover:bg-danger-light transition-colors">
            <Trash2 size={15} />
          </button>
          <button onClick={handleRepeat}
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl">
            <RotateCcw size={14} />
            Tập lại
          </button>
        </div>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-black text-text-main">{formatDateVi(log.date)}</h1>
        {formatTimeOfDay(log.startedAt) && (
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={13} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Bắt đầu lúc {formatTimeOfDay(log.startedAt)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-primary">{log.totalDurationMinutes}</p>
          <p className="text-xs text-text-secondary mt-0.5">phút</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-text-main">{log.caloriesEstimate}</p>
          <p className="text-xs text-text-secondary mt-0.5">kcal</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-text-main">Bài tập ({log.exercises.length})</p>
        </div>
        <div className="divide-y divide-border">
          {log.exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <p className="font-semibold text-text-main text-sm">{ex.name}</p>
              <p className="text-sm text-text-secondary">{formatAmount(ex)}</p>
            </div>
          ))}
        </div>
      </div>

      {log.location && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-5">
          <p className="text-xs font-semibold text-text-secondary mb-1">📍 ĐỊA ĐIỂM</p>
          <p className="text-sm text-text-main">{log.location}</p>
        </div>
      )}

      {log.notes && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-5">
          <p className="text-xs font-semibold text-text-secondary mb-1">GHI CHÚ</p>
          <p className="text-sm text-text-main">{log.notes}</p>
        </div>
      )}
    </div>
  );
}
