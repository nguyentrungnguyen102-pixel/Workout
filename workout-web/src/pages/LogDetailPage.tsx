import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Clock, Pencil, Trash2, X, Check } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';
import { useUserStore } from '../stores/userStore';
import { getLogById, updateLog, deleteLog } from '../services/workoutService';
import { getLatestBodyMetric } from '../services/bodyService';
import { ExerciseEntry, WorkoutLog } from '../types/workout';
import { formatTimeOfDay } from '../lib/date';
import { formatAmount } from '../lib/format';

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { setDraftFromLog } = useWorkoutStore();
  const { firebaseUser } = useUserStore();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);

  const [editing, setEditing] = useState(false);
  const [editExercises, setEditExercises] = useState<ExerciseEntry[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!logId) return;
    setLoading(true);
    getLogById(logId)
      .then(setLog)
      .catch(() => setLog(null))
      .finally(() => setLoading(false));
  }, [logId]);

  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) return;
    getLatestBodyMetric(uid).then((m) => setWeightKg(m?.weight)).catch(() => {});
  }, [firebaseUser?.uid]);

  const handleRepeat = () => {
    if (!log) return;
    setDraftFromLog(log);
    navigate('/');
  };

  const startEditing = () => {
    if (!log) return;
    setEditExercises(log.exercises.map((e) => ({ ...e })));
    setEditNotes(log.notes || '');
    setEditLocation(log.location || '');
    setError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  const updateEditExercise = (presetId: string, updates: Partial<ExerciseEntry>) => {
    setEditExercises((prev) => prev.map((e) => (e.presetId === presetId ? { ...e, ...updates } : e)));
  };

  const removeEditExercise = (presetId: string) => {
    setEditExercises((prev) => prev.filter((e) => e.presetId !== presetId));
  };

  const handleSave = async () => {
    if (!log || !logId) return;
    if (editExercises.length === 0) {
      setError('Buổi tập cần ít nhất 1 bài tập. Xoá cả buổi nếu muốn bỏ hẳn.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateLog(logId, { exercises: editExercises, notes: editNotes, location: editLocation }, weightKg);
      const fresh = await getLogById(logId);
      setLog(fresh);
      setEditing(false);
    } catch {
      setError('Lưu thất bại. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!logId) return;
    if (!confirm('Xoá buổi tập này? Không thể hoàn tác.')) return;
    setDeleting(true);
    try {
      await deleteLog(logId);
      navigate('/history');
    } catch {
      setError('Xoá thất bại. Thử lại nhé!');
      setDeleting(false);
    }
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
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-main transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Lịch sử</span>
        </button>
        {editing ? (
          <div className="flex items-center gap-2">
            <button onClick={cancelEditing} disabled={saving}
              className="flex items-center gap-1.5 bg-card-2 text-text-secondary text-sm font-bold px-3 py-2 rounded-xl disabled:opacity-50">
              <X size={14} />
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50">
              <Check size={14} />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 bg-danger-light text-danger text-sm font-bold px-3 py-2 rounded-xl disabled:opacity-50">
              <Trash2 size={14} />
            </button>
            <button onClick={startEditing}
              className="flex items-center gap-1.5 bg-card-2 text-text-main text-sm font-bold px-3 py-2 rounded-xl">
              <Pencil size={14} />
              Sửa
            </button>
            <button onClick={handleRepeat}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl">
              <RotateCcw size={14} />
              Tập lại
            </button>
          </div>
        )}
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

      {error && (
        <p className="text-xs text-danger font-semibold mb-3">{error}</p>
      )}

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

      {editing ? (
        <div className="space-y-3 mb-5">
          {editExercises.map((ex) => (
            <div key={ex.presetId} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="font-bold text-text-main text-sm truncate">{ex.name}</p>
                <button onClick={() => removeEditExercise(ex.presetId)}
                  className="p-1.5 rounded-full hover:bg-danger-light text-text-secondary hover:text-danger transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {ex.unit === 'reps' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary">Số lượng:</label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                      value={ex.reps ?? 0}
                      onChange={(e) => updateEditExercise(ex.presetId, { reps: Math.max(1, parseInt(e.target.value) || 0) })}
                    />
                    <span className="text-xs text-text-secondary">cái</span>
                  </div>
                )}

                {(ex.unit === 'seconds' || ex.unit === 'minutes') && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary">{ex.unit === 'minutes' ? 'Số phút:' : 'Số giây:'}</label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                      value={ex.unit === 'minutes' ? Math.round((ex.durationSeconds || 0) / 60) : (ex.durationSeconds || 0)}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        updateEditExercise(ex.presetId, { durationSeconds: ex.unit === 'minutes' ? v * 60 : v });
                      }}
                    />
                    <span className="text-xs text-text-secondary">{ex.unit === 'minutes' ? 'phút' : 'giây'}</span>
                  </div>
                )}

                {ex.category === 'dumbbell' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary">Tạ:</label>
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                      value={ex.weight ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        updateEditExercise(ex.presetId, { weight: raw === '' ? undefined : Math.max(0, parseFloat(raw) || 0) });
                      }}
                    />
                    <span className="text-xs text-text-secondary">kg</span>
                  </div>
                )}

                {ex.unit === 'km' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary">Quãng đường:</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                      value={ex.distance ?? 0}
                      onChange={(e) => updateEditExercise(ex.presetId, { distance: Math.max(0, parseFloat(e.target.value) || 0) })}
                    />
                    <span className="text-xs text-text-secondary">km</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-secondary">Hiệp:</label>
                  <input
                    type="number"
                    min={1}
                    className="w-16 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                    value={ex.sets ?? 1}
                    onChange={(e) => updateEditExercise(ex.presetId, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
              </div>
            </div>
          ))}
          {editExercises.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">Đã bỏ hết bài tập — bấm Lưu sẽ báo lỗi, dùng nút xoá 🗑️ ở trên nếu muốn xoá cả buổi.</p>
          )}
        </div>
      ) : (
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
      )}

      {editing ? (
        <>
          <div className="bg-card rounded-2xl border border-border p-4 mb-5">
            <p className="text-xs font-semibold text-text-secondary mb-2">📍 ĐỊA ĐIỂM</p>
            <input
              type="text"
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
              placeholder="Sân bóng ABC, hồ bơi XYZ..."
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mb-5">
            <p className="text-xs font-semibold text-text-secondary mb-2">GHI CHÚ</p>
            <textarea
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2 text-sm text-text-main resize-none focus:border-primary outline-none"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
