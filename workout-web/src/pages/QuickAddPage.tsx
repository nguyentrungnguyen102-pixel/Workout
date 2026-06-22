import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Pause, ChevronRight, Flame, Target, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useProgramStore } from '../stores/programStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../constants/exercises';
import { getCustomPresets, saveCustomPreset, deleteCustomPreset } from '../services/customExerciseService';
import { getTemplates, saveTemplate } from '../services/templateService';
import { WorkoutTemplate, ExerciseEntry, WorkoutLog, WorkoutPreset, ExerciseCategory, ExerciseUnit, SetDetail } from '../types/workout';
import { ExerciseGoal } from '../types/user';
import { formatAmount } from '../lib/format';
import { pickCheer } from '../lib/cheers';
import { buildSuggestions } from '../lib/suggestions';
import { todayString } from '../lib/date';

type Category = 'all' | 'strength' | 'dumbbell' | 'cardio' | 'mobility' | 'recovery';

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tất cả ⚡' },
  { key: 'strength', label: 'Sức mạnh 💪' },
  { key: 'dumbbell', label: 'Tạ đơn 🏋️' },
  { key: 'cardio', label: 'Cardio 🏃' },
  { key: 'mobility', label: 'Linh hoạt 🧘' },
  { key: 'recovery', label: 'Phục hồi 🌿' },
];

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  strength: { text: '#FF5400', bg: '#FFF0EC' },
  cardio: { text: '#2563EB', bg: '#EFF6FF' },
  mobility: { text: '#059669', bg: '#ECFDF5' },
  recovery: { text: '#7C3AED', bg: '#F5F3FF' },
  dumbbell: { text: '#B45309', bg: '#FEF3C7' },
};

const ICON_OPTIONS = ['💪', '🏋️', '🤸', '🧘', '🏃', '🚴', '🏊', '⭐', '🔥', '🦵', '🎯', '🌀', '⬆️', '↔️', '🔄', '🏆', '🦾', '🌿', '🧱', '🎽'];

function initSetDetails(ex: ExerciseEntry): SetDetail[] {
  if (ex.setDetails && ex.setDetails.length > 0) return ex.setDetails.map((s) => ({ ...s }));
  return Array.from({ length: ex.sets || 1 }, () => ({
    reps: ex.reps,
    weight: ex.weight,
    durationSeconds: ex.durationSeconds,
  }));
}

// ── Rest Timer ──────────────────────────────────────────────────────────────

function RestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (s: number) => { setSeconds(s); setRunning(true); };

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && running) {
      setRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-text-secondary mb-2">⏱ Nghỉ giữa hiệp</p>
      <div className="flex gap-2 mb-3">
        {[30, 60, 90].map((s) => (
          <button key={s} onClick={() => start(s)}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-semibold text-text-secondary bg-card hover:border-primary hover:text-primary transition-colors">
            {s}s
          </button>
        ))}
      </div>
      {seconds > 0 && (
        <div className="flex items-center gap-3 bg-card-2 rounded-xl p-3">
          <span className="text-2xl font-black text-primary tabular-nums">{mm}:{ss}</span>
          <button onClick={() => setRunning((r) => !r)} className="ml-auto p-2 rounded-full bg-primary text-white">
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Exercise Set Card ────────────────────────────────────────────────────────

interface ExerciseSetCardProps {
  ex: ExerciseEntry;
  setDetails: SetDetail[];
  yesterdayEx?: ExerciseEntry;
  onUpdateSet: (idx: number, updates: Partial<SetDetail>) => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onRemoveExercise: () => void;
}

function ExerciseSetCard({ ex, setDetails, yesterdayEx, onUpdateSet, onAddSet, onRemoveSet, onRemoveExercise }: ExerciseSetCardProps) {
  const cc = CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.strength;
  const showWeight = ex.category === 'strength' || ex.category === 'dumbbell';
  const isTime = ex.unit === 'seconds' || ex.unit === 'minutes';

  const yesterdayHint = yesterdayEx
    ? `Hôm qua: ${formatAmount(yesterdayEx)}`
    : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-text-main">{ex.name}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ color: cc.text, backgroundColor: cc.bg }}>
            {CATEGORY_LABELS[ex.category] || ex.category}
          </span>
        </div>
        <button onClick={onRemoveExercise}
          className="p-1.5 rounded-full hover:bg-danger-light text-text-secondary hover:text-danger transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Column headers */}
      <div className={`grid gap-1.5 mb-1 ${showWeight ? 'grid-cols-[24px_1fr_72px_28px]' : isTime ? 'grid-cols-[24px_1fr_28px]' : 'grid-cols-[24px_1fr_28px]'}`}>
        <span className="text-[10px] font-bold text-text-muted uppercase">H</span>
        <span className="text-[10px] font-bold text-text-muted uppercase">
          {isTime ? (ex.unit === 'minutes' ? 'Phút' : 'Giây') : 'Số cái'}
        </span>
        {showWeight && <span className="text-[10px] font-bold text-text-muted uppercase">Tạ (kg)</span>}
        <span />
      </div>

      {/* Set rows */}
      {setDetails.map((s, idx) => (
        <div key={idx} className={`grid gap-1.5 mb-1.5 items-center ${showWeight ? 'grid-cols-[24px_1fr_72px_28px]' : 'grid-cols-[24px_1fr_28px]'}`}>
          <span className="text-xs font-black text-text-secondary text-center">{idx + 1}</span>

          {isTime ? (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="w-full text-center font-bold text-sm bg-card-2 border border-border rounded-lg px-2 py-1.5 focus:border-primary outline-none"
              value={ex.unit === 'minutes'
                ? (s.durationSeconds ? Math.round(s.durationSeconds / 60) : '')
                : (s.durationSeconds ?? '')}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0;
                onUpdateSet(idx, { durationSeconds: ex.unit === 'minutes' ? v * 60 : v });
              }}
            />
          ) : (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="w-full text-center font-bold text-sm bg-card-2 border border-border rounded-lg px-2 py-1.5 focus:border-primary outline-none"
              value={s.reps ?? ''}
              onChange={(e) => onUpdateSet(idx, { reps: parseInt(e.target.value) || 0 })}
            />
          )}

          {showWeight && (
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              className="w-full text-center text-sm bg-card-2 border border-border rounded-lg px-1 py-1.5 focus:border-primary outline-none"
              value={s.weight ?? ''}
              placeholder="—"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onUpdateSet(idx, { weight: isNaN(v) ? undefined : v });
              }}
            />
          )}

          <button
            onClick={() => setDetails.length > 1 && onRemoveSet(idx)}
            disabled={setDetails.length <= 1}
            className="p-1 rounded hover:bg-danger-light text-text-muted hover:text-danger transition-colors disabled:opacity-30">
            <X size={12} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between mt-2">
        <button onClick={onAddSet}
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:opacity-80">
          <Plus size={12} /> Thêm hiệp
        </button>
        {yesterdayHint && (
          <span className="text-[10px] text-text-muted">{yesterdayHint}</span>
        )}
      </div>
    </div>
  );
}

// ── Workout Summary Modal ────────────────────────────────────────────────────

interface WorkoutSummaryModalProps {
  onClose: () => void;
  uid: string;
  yesterdayLog: WorkoutLog | null;
}

function WorkoutSummaryModal({ onClose, uid, yesterdayLog }: WorkoutSummaryModalProps) {
  const { draft, removeExercise, updateExercise, setNotes, logWorkout, isLogging } = useWorkoutStore();
  const [toast, setToast] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateInput, setShowTemplateInput] = useState(false);

  // Per-exercise set details (local state, synced to store on save)
  const [setDetailsMap, setSetDetailsMap] = useState<Record<string, SetDetail[]>>(() => {
    const m: Record<string, SetDetail[]> = {};
    for (const ex of draft.exercises) {
      m[ex.presetId] = initSetDetails(ex);
    }
    return m;
  });

  // When draft changes (exercise added/removed externally), sync
  useEffect(() => {
    setSetDetailsMap((prev) => {
      const next = { ...prev };
      for (const ex of draft.exercises) {
        if (!next[ex.presetId]) {
          next[ex.presetId] = initSetDetails(ex);
        }
      }
      for (const key of Object.keys(next)) {
        if (!draft.exercises.find((e) => e.presetId === key)) {
          delete next[key];
        }
      }
      return next;
    });
  }, [draft.exercises]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleLog = async () => {
    if (draft.exercises.length === 0) return;
    // Sync setDetails to store before logging
    for (const [presetId, details] of Object.entries(setDetailsMap)) {
      updateExercise(presetId, { setDetails: details, sets: details.length });
    }
    try {
      await logWorkout(uid);
      showToast('Đã lưu buổi tập! 🎉');
      setTimeout(onClose, 800);
    } catch {
      showToast('Lỗi lưu buổi tập');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await saveTemplate(uid, templateName.trim(), draft.exercises);
      showToast('Đã lưu template!');
      setTemplateName('');
      setShowTemplateInput(false);
    } catch {
      showToast('Lỗi lưu template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const updateSet = (presetId: string, idx: number, updates: Partial<SetDetail>) => {
    setSetDetailsMap((prev) => ({
      ...prev,
      [presetId]: prev[presetId].map((s, i) => i === idx ? { ...s, ...updates } : s),
    }));
  };

  const addSet = (presetId: string) => {
    setSetDetailsMap((prev) => {
      const current = prev[presetId] || [];
      const last = current[current.length - 1] || {};
      return { ...prev, [presetId]: [...current, { ...last }] };
    });
  };

  const removeSet = (presetId: string, idx: number) => {
    setSetDetailsMap((prev) => ({
      ...prev,
      [presetId]: prev[presetId].filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:bg-black/40 md:p-6">
      <div className="flex flex-col bg-background w-full h-full md:h-auto md:max-h-[92vh] md:max-w-lg md:rounded-3xl md:shadow-2xl md:overflow-hidden">
        {toast && (
          <div className="absolute top-4 left-4 right-4 bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-10">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card flex-shrink-0">
          <h2 className="text-lg font-black text-text-main">Buổi tập hôm nay</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-card-2 transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {draft.exercises.length === 0 ? (
            <p className="text-text-secondary text-center py-8 text-sm">Chưa có bài tập nào. Quay lại để thêm.</p>
          ) : (
            draft.exercises.map((ex) => {
              const yesterdayEx = yesterdayLog?.exercises.find((e) => e.presetId === ex.presetId);
              return (
                <ExerciseSetCard
                  key={ex.presetId}
                  ex={ex}
                  setDetails={setDetailsMap[ex.presetId] || initSetDetails(ex)}
                  yesterdayEx={yesterdayEx}
                  onUpdateSet={(idx, updates) => updateSet(ex.presetId, idx, updates)}
                  onAddSet={() => addSet(ex.presetId)}
                  onRemoveSet={(idx) => removeSet(ex.presetId, idx)}
                  onRemoveExercise={() => removeExercise(ex.presetId)}
                />
              );
            })
          )}

          <RestTimer />

          <div className="mt-4">
            <p className="text-xs font-semibold text-text-secondary mb-2">Ghi chú</p>
            <textarea
              className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm text-text-main resize-none focus:border-primary outline-none transition-colors"
              rows={3}
              placeholder="Cảm giác hôm nay, chấn thương, mục tiêu..."
              value={draft.notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {showTemplateInput ? (
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
                placeholder="Tên template..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
              />
              <button onClick={handleSaveTemplate} disabled={savingTemplate}
                className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50">
                Lưu
              </button>
              <button onClick={() => setShowTemplateInput(false)}
                className="px-3 py-2 border border-border text-sm rounded-xl text-text-secondary">
                Hủy
              </button>
            </div>
          ) : (
            <button onClick={() => setShowTemplateInput(true)}
              className="w-full py-3 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors mt-2">
              💾 Lưu thành template
            </button>
          )}
        </div>

        <div className="px-4 py-4 border-t border-border bg-card flex-shrink-0">
          <button onClick={handleLog} disabled={isLogging || draft.exercises.length === 0}
            className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/30 transition-opacity">
            {isLogging ? 'Đang lưu...' : `Lưu buổi tập (${draft.exercises.length} bài) ✅`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Exercise Modal ────────────────────────────────────────────────────

interface CreateExerciseModalProps {
  uid: string;
  onCreated: (preset: WorkoutPreset) => void;
  onClose: () => void;
}

function CreateExerciseModal({ uid, onCreated, onClose }: CreateExerciseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [unit, setUnit] = useState<ExerciseUnit>('reps');
  const [defaultValue, setDefaultValue] = useState('12');
  const [icon, setIcon] = useState('💪');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Nhập tên bài tập'); return; }
    setSaving(true);
    try {
      const preset = await saveCustomPreset(uid, {
        nameVi: name.trim(),
        category,
        unit,
        defaultValue: parseInt(defaultValue) || 12,
        defaultSets: 3,
        icon,
      });
      onCreated(preset);
      onClose();
    } catch {
      setError('Lỗi tạo bài tập');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50">
      <div className="w-full md:max-w-sm bg-background rounded-t-3xl md:rounded-3xl p-5 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-text-main">Tạo bài tập mới</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-card-2 transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Tên bài tập</label>
            <input
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none"
              placeholder="VD: Squat thành tường"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((em) => (
                <button key={em} onClick={() => setIcon(em)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    icon === em ? 'bg-primary-light ring-2 ring-primary' : 'bg-card-2 hover:bg-card'
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Loại</label>
            <div className="flex flex-wrap gap-1.5">
              {(['strength', 'dumbbell', 'cardio', 'mobility', 'recovery'] as ExerciseCategory[]).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    category === cat ? 'bg-primary text-white' : 'bg-card-2 border border-border text-text-secondary'
                  }`}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Đơn vị</label>
            <div className="flex gap-2">
              {([['reps', 'Số cái'], ['seconds', 'Giây'], ['minutes', 'Phút']] as [ExerciseUnit, string][]).map(([u, label]) => (
                <button key={u} onClick={() => setUnit(u)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    unit === u ? 'bg-primary text-white' : 'bg-card-2 border border-border text-text-secondary'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Default value */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">
              Giá trị mặc định ({unit === 'reps' ? 'cái' : unit === 'minutes' ? 'phút' : 'giây'})
            </label>
            <input
              type="number"
              min={1}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-danger text-sm mt-2">{error}</p>}

        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="w-full mt-5 py-4 bg-primary text-white font-black rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/30">
          {saving ? 'Đang tạo...' : `${icon} Tạo bài tập`}
        </button>
      </div>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface WeeklyForecastCardProps {
  recentLogs: WorkoutLog[];
  weeklyTargetDays?: number;
}

function WeeklyForecastCard({ recentLogs, weeklyTargetDays = 5 }: WeeklyForecastCardProps) {
  const now = new Date();
  const today = todayString();
  const dow = (now.getDay() + 6) % 7;
  const monDate = new Date(now);
  monDate.setDate(now.getDate() - dow);
  const weekStart = toDateStr(monDate);

  const weekDates = new Set(recentLogs.filter(l => l.date >= weekStart && l.date <= today).map(l => l.date));
  const thisWeekDays = weekDates.size;
  const daysRemaining = 6 - dow;
  const onTrack = dow === 0 ? true : thisWeekDays / (dow + 1) >= weeklyTargetDays / 7;

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthDays = new Set(recentLogs.filter(l => l.date >= monthStart && l.date <= today).map(l => l.date)).size;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthForecast = Math.min(daysInMonth, now.getDate() > 0 ? Math.round((monthDays / now.getDate()) * daysInMonth) : 0);

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 p-3">
      <p className="text-xs font-bold text-text-secondary mb-2">📅 Tiến độ tập luyện</p>
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Tuần này</span>
          <span className={`text-xs font-bold ${onTrack ? 'text-success' : 'text-primary'}`}>
            {thisWeekDays}/{weeklyTargetDays} ngày{onTrack && thisWeekDays > 0 ? ' · đúng tiến độ ✓' : ''}
          </span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monDate);
            d.setDate(monDate.getDate() + i);
            const ds = toDateStr(d);
            const trained = weekDates.has(ds);
            return (
              <div key={i} className={`flex-1 h-2 rounded-sm transition-all ${
                trained ? 'bg-primary' : ds > today ? 'bg-border' : 'bg-border/60'
              }`} />
            );
          })}
        </div>
        <p className="text-[10px] text-text-muted mt-0.5">
          Dự báo cuối tuần: ~{Math.min(weeklyTargetDays, thisWeekDays + daysRemaining)} ngày
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Tháng này</span>
        <div className="text-right">
          <span className="text-xs font-bold text-text-main">{monthDays} ngày đã tập</span>
          <p className="text-[10px] text-text-muted">Dự báo: ~{monthForecast} ngày</p>
        </div>
      </div>
    </div>
  );
}

function isGoalMet(goal: ExerciseGoal, todayLog: WorkoutLog | null): boolean {
  if (!todayLog) return false;
  const ex = todayLog.exercises.find(e => e.presetId === goal.presetId);
  if (!ex) return false;
  if (goal.targetReps) return (ex.reps || 0) >= goal.targetReps;
  if (goal.targetDurationSeconds) return (ex.durationSeconds || 0) >= goal.targetDurationSeconds;
  return false;
}

function getGoalCurrent(goal: ExerciseGoal, todayLog: WorkoutLog | null): number {
  if (!todayLog) return 0;
  const ex = todayLog.exercises.find(e => e.presetId === goal.presetId);
  if (!ex) return 0;
  if (goal.targetReps) return ex.reps ?? 0;
  if (goal.targetDurationSeconds) return ex.durationSeconds ?? 0;
  return 0;
}

function formatGoalLabel(current: number, target: number, goal: ExerciseGoal): string {
  if (goal.targetReps) return `${current}/${target} cái`;
  if (goal.targetDurationSeconds) {
    if (target >= 60) return `${Math.round(current / 60)}/${Math.round(target / 60)} phút`;
    return `${current}/${target}s`;
  }
  return `${current}/${target}`;
}

interface GoalsStripProps {
  goals: ExerciseGoal[];
  todayLog: WorkoutLog | null;
  todayDateStr: string;
}

function GoalsStrip({ goals, todayLog, todayDateStr }: GoalsStripProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeGoals = goals.filter(g => g.enabled);
  if (activeGoals.length === 0) return null;

  const metCount = activeGoals.filter(g => isGoalMet(g, todayLog)).length;
  const allMet = metCount === activeGoals.length;
  const isEvening = new Date().getHours() >= 17;
  const showReminder = isEvening && !allMet;

  return (
    <div className={`rounded-2xl border mb-3 overflow-hidden ${
      showReminder ? 'bg-primary-light border-primary/30' : allMet ? 'bg-success-light border-success/30' : 'bg-card border-border'
    }`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Target size={14} className={allMet ? 'text-success' : showReminder ? 'text-primary' : 'text-text-secondary'} />
          <span className={`text-xs font-bold ${allMet ? 'text-success' : showReminder ? 'text-primary' : 'text-text-secondary'}`}>
            {showReminder ? `Còn ${activeGoals.length - metCount} mục tiêu chưa đạt` :
             allMet ? '✅ Đã đạt tất cả mục tiêu hôm nay!' :
             `Mục tiêu hôm nay`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black ${allMet ? 'text-success' : 'text-primary'}`}>{metCount}/{activeGoals.length}</span>
          {collapsed ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronUp size={14} className="text-text-secondary" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2.5">
          {allMet && (
            <div className="bg-success/10 border border-success/20 rounded-xl px-3 py-2 text-center mb-1">
              <p className="text-sm font-bold text-success">{pickCheer(todayDateStr)}</p>
            </div>
          )}
          {activeGoals.map(g => {
            const met = isGoalMet(g, todayLog);
            const target = g.targetReps ?? g.targetDurationSeconds ?? 1;
            const current = getGoalCurrent(g, todayLog);
            const pct = Math.min(1, current / target);
            const label = formatGoalLabel(current, target, g);
            return (
              <div key={g.presetId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${met ? 'text-success' : 'text-text-secondary'}`}>
                    {met ? '✓ ' : ''}{g.name}
                  </span>
                  <span className="text-xs text-text-muted">{label}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${met ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SuggestionsCardProps {
  recentLogs: WorkoutLog[];
  onAddWithValue: (preset: WorkoutPreset, value: number) => void;
}

function SuggestionsCard({ recentLogs, onAddWithValue }: SuggestionsCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const suggestions = buildSuggestions(recentLogs, 4);
  if (suggestions.length === 0) return null;

  function formatSuggestionValue(value: number, unit: string): string {
    if (unit === 'reps') return `${value} cái`;
    if (unit === 'seconds') return `${value}s`;
    if (unit === 'minutes') return `${Math.round(value / 60)} phút`;
    return `${value}`;
  }

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-bold text-text-secondary">💡 Gợi ý hôm nay</span>
        {collapsed ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronUp size={14} className="text-text-secondary" />}
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {suggestions.map((s) => {
            const preset = SYSTEM_PRESETS.find(p => p.id === s.presetId);
            return (
              <div key={s.presetId} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-text-main flex-shrink-0 min-w-[80px]">{s.name}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[{ label: 'Nhẹ', val: s.light }, { label: 'Vừa', val: s.moderate }, { label: 'Cao', val: s.high }].map(({ label, val }) => (
                    <button key={label}
                      onClick={() => preset && onAddWithValue(preset, val)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        label === 'Vừa'
                          ? 'border-primary bg-primary-light text-primary font-semibold hover:bg-primary hover:text-white'
                          : 'border-border bg-card-2 text-text-secondary hover:border-primary hover:text-primary'
                      }`}>
                      {label} {formatSuggestionValue(val, s.unit)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function QuickAddPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser } = useUserStore();
  const { draft, todayLog, yesterdayLog, recentLogs, addExercise, updateExercise, setDraftFromLog, loadRecentLogs } = useWorkoutStore();
  const { loadActiveProgram, getTodayDay } = useProgramStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showModal, setShowModal] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [customPresets, setCustomPresets] = useState<WorkoutPreset[]>([]);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    loadRecentLogs(uid);
    loadActiveProgram(uid);
    getTemplates(uid).then(setTemplates).catch(() => {});
    getCustomPresets(uid).then(setCustomPresets).catch(() => {});
  }, [uid]);

  const todayDay = getTodayDay();
  const firstName = profile?.displayName?.split(' ').pop() || 'bạn';
  const streak = profile?.streak?.current || 0;

  const allPresets = [...SYSTEM_PRESETS, ...customPresets];
  const filteredPresets = activeCategory === 'all'
    ? allPresets
    : allPresets.filter((p) => p.category === activeCategory);

  const draftIds = new Set(draft.exercises.map((e) => e.presetId));

  const handleAddExercise = (preset: WorkoutPreset) => {
    if (draftIds.has(preset.id)) return;
    const yesterday = yesterdayLog?.exercises.find((e) => e.presetId === preset.id);
    const entry: ExerciseEntry = {
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: preset.defaultSets || 3,
      reps: preset.unit === 'reps' ? (yesterday?.reps ?? preset.defaultValue) : undefined,
      durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes')
        ? (yesterday?.durationSeconds ?? (preset.unit === 'seconds' ? preset.defaultValue : preset.defaultValue * 60))
        : undefined,
      weight: yesterday?.weight,
    };
    addExercise(entry);
  };

  const handleAddWithValue = (preset: WorkoutPreset, value: number) => {
    const entry: ExerciseEntry = {
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: preset.defaultSets || 3,
      reps: preset.unit === 'reps' ? value : undefined,
      durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes') ? value : undefined,
    };
    if (draftIds.has(preset.id)) {
      updateExercise(preset.id, {
        reps: preset.unit === 'reps' ? value : undefined,
        durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes') ? value : undefined,
      });
    } else {
      addExercise(entry);
    }
    setShowModal(true);
  };

  const getSuggestedValue = (preset: WorkoutPreset) => {
    const y = yesterdayLog?.exercises.find((e) => e.presetId === preset.id);
    if (preset.unit === 'reps') {
      const reps = y?.reps ?? preset.defaultValue;
      const wLabel = y?.weight ? ` · ${y.weight}kg` : '';
      return `${reps} cái${wLabel}`;
    }
    if (preset.unit === 'seconds') {
      const secs = y?.durationSeconds ?? preset.defaultValue;
      return formatAmount({ unit: 'seconds', durationSeconds: secs });
    }
    if (preset.unit === 'minutes') {
      const secs = y?.durationSeconds ?? preset.defaultValue * 60;
      return formatAmount({ unit: 'minutes', durationSeconds: secs });
    }
    return `${preset.defaultValue}`;
  };

  const handleDeleteCustom = async (presetId: string) => {
    if (!confirm('Xóa bài tập này?')) return;
    try {
      await deleteCustomPreset(presetId);
      setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    } catch {
      // ignore
    }
  };

  const todayDateStr = todayString();

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-24">
      {showModal && uid && (
        <WorkoutSummaryModal
          onClose={() => setShowModal(false)}
          uid={uid}
          yesterdayLog={yesterdayLog}
        />
      )}
      {showCreateExercise && uid && (
        <CreateExerciseModal
          uid={uid}
          onCreated={(preset) => setCustomPresets((prev) => [...prev, preset])}
          onClose={() => setShowCreateExercise(false)}
        />
      )}

      {/* Compact header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-text-main">{firstName} 👋</span>
          {todayLog && (
            <span className="text-xs font-semibold text-success bg-success-light px-2 py-0.5 rounded-full">✅ Đã tập</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!todayLog && yesterdayLog && (
            <button
              onClick={() => { if (uid) { setDraftFromLog(yesterdayLog); setShowModal(true); } }}
              className="flex items-center gap-1 bg-primary-light px-3 py-1.5 rounded-xl text-xs font-bold text-primary">
              ⚡ Hôm qua
            </button>
          )}
          {!todayLog && draft.exercises.length > 0 && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 bg-card-2 border border-border px-3 py-1.5 rounded-xl text-xs font-bold text-text-main">
              ⏩ Tiếp tục
            </button>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-primary-light px-2.5 py-1.5 rounded-xl">
              <Flame size={14} className="text-primary" />
              <span className="font-black text-primary text-sm">{streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Program of the day */}
      {todayDay && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 mb-3">
          <span className="text-lg">{todayDay.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-main text-xs truncate">{todayDay.nameVi}</p>
            <p className="text-xs text-text-secondary truncate">{todayDay.focusVi}</p>
          </div>
        </div>
      )}

      <WeeklyForecastCard recentLogs={recentLogs} weeklyTargetDays={5} />
      <GoalsStrip goals={profile?.exerciseGoals || []} todayLog={todayLog} todayDateStr={todayDateStr} />
      <SuggestionsCard recentLogs={recentLogs} onAddWithValue={handleAddWithValue} />

      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          <span className="flex-shrink-0 text-xs font-semibold text-text-secondary self-center">📋</span>
          {templates.map((t) => (
            <button key={t.id}
              onClick={() => {
                if (!uid) return;
                t.exercises.forEach((ex) => {
                  if (!draftIds.has(ex.presetId)) addExercise(ex);
                });
                setShowModal(true);
              }}
              className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text-main hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs + create button */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide -mx-1 px-1">
          {CATEGORY_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === key
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text-secondary'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreateExercise(true)}
          className="flex-shrink-0 flex items-center gap-1 bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
          <Plus size={12} /> Tạo
        </button>
      </div>

      {/* Exercise grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredPresets.map((preset) => {
          const inDraft = draftIds.has(preset.id);
          const cc = CATEGORY_COLORS[preset.category] || CATEGORY_COLORS.strength;
          return (
            <div key={preset.id} className="relative">
              <button onClick={() => handleAddExercise(preset)}
                className={`w-full bg-card rounded-2xl p-4 border-2 text-left transition-all active:scale-95 ${
                  inDraft ? 'border-primary' : 'border-border hover:border-primary/40'
                }`}>
                <div className="text-2xl mb-2">{preset.icon}</div>
                <p className="font-bold text-text-main text-sm leading-tight mb-1">{preset.nameVi}</p>
                <p className="text-xs text-text-secondary mb-2">{getSuggestedValue(preset)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: cc.text, backgroundColor: cc.bg }}>
                    {CATEGORY_LABELS[preset.category]}
                  </span>
                  {inDraft && <span className="text-xs font-bold text-primary">✓</span>}
                </div>
              </button>
              {preset.isCustom && (
                <button
                  onClick={() => handleDeleteCustom(preset.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-card-2 text-text-muted hover:text-danger hover:bg-danger-light transition-colors">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {draft.exercises.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-0 right-0 md:left-56 lg:left-60 max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 z-40">
          <button onClick={() => setShowModal(true)}
            className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl shadow-lg shadow-primary/40 flex items-center justify-center gap-2">
            <span>Log workout ({draft.exercises.length} bài)</span>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
