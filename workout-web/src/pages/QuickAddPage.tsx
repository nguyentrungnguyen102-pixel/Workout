import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Flame, Target, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useProgramStore } from '../stores/programStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../constants/exercises';
import { PROGRAM_TEMPLATES } from '../constants/programTemplates';
import { getTemplates, saveTemplate } from '../services/templateService';
import { getCustomPresets, saveCustomPreset, deleteCustomPreset } from '../services/customExerciseService';
import { WorkoutTemplate, ExerciseEntry, WorkoutLog, WorkoutPreset, ExerciseCategory, ExerciseUnit } from '../types/workout';
import { WorkoutProgram } from '../types/program';
import { ExerciseGoal } from '../types/user';
import { formatAmount } from '../lib/format';
import { pickCheer, pickWeeklyCheer } from '../lib/cheers';
import { buildSuggestions, roundNice } from '../lib/suggestions';
import { sumThisWeek } from '../lib/dayTimeline';
import { todayString } from '../lib/date';
import WeeklyPlanCard from '../components/WeeklyPlanCard';

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Category = 'all' | 'strength' | 'core' | 'dumbbell' | 'cardio' | 'mobility' | 'recovery';

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tất cả ⚡' },
  { key: 'strength', label: 'Sức mạnh 💪' },
  { key: 'core', label: 'Bụng 🔥' },
  { key: 'dumbbell', label: 'Tạ đơn 🏋️' },
  { key: 'cardio', label: 'Cardio 🏃' },
  { key: 'mobility', label: 'Linh hoạt 🧘' },
  { key: 'recovery', label: 'Phục hồi 🌿' },
];

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  strength: { text: '#FF5400', bg: '#FFF0EC' },
  core: { text: '#BE185D', bg: '#FCE7F3' },
  cardio: { text: '#2563EB', bg: '#EFF6FF' },
  mobility: { text: '#059669', bg: '#ECFDF5' },
  recovery: { text: '#7C3AED', bg: '#F5F3FF' },
  dumbbell: { text: '#B45309', bg: '#FEF3C7' },
};

const ICON_OPTIONS = ['🏋️', '💪', '🤸', '🏃', '🚴', '🧘', '🤼', '🥊', '⚽', '🏊', '🎯', '🔥', '⭐', '🌟', '💥'];
const CREATE_CATEGORIES: ExerciseCategory[] = ['strength', 'core', 'dumbbell', 'cardio', 'mobility', 'recovery'];
const UNIT_OPTIONS: { label: string; value: ExerciseUnit }[] = [
  { label: 'Reps', value: 'reps' },
  { label: 'Giây', value: 'seconds' },
  { label: 'Phút', value: 'minutes' },
];

interface CreateExerciseModalProps {
  uid: string;
  onClose: () => void;
  onCreated: (preset: WorkoutPreset) => void;
}

function CreateExerciseModal({ uid, onClose, onCreated }: CreateExerciseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [unit, setUnit] = useState<ExerciseUnit>('reps');
  const [defaultValue, setDefaultValue] = useState('10');
  const [defaultSets, setDefaultSets] = useState('3');
  const [icon, setIcon] = useState('🏋️');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Nhập tên bài tập'); return; }
    const val = parseFloat(defaultValue);
    if (!val || val <= 0) { setError('Nhập số lớn hơn 0'); return; }
    const sets = parseInt(defaultSets, 10);
    if (unit === 'reps' && (!sets || sets <= 0)) { setError('Nhập số hiệp lớn hơn 0'); return; }
    setError('');
    setSaving(true);
    try {
      const preset = await saveCustomPreset(uid, {
        nameVi: name.trim(),
        category,
        unit,
        defaultValue: val,
        defaultSets: unit === 'reps' ? sets : 3,
        icon,
      });
      onCreated(preset);
      onClose();
    } catch {
      setError('Không tạo được. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center md:bg-black/40 md:p-6">
      <div className="flex flex-col bg-background w-full h-full md:h-auto md:max-h-[88vh] md:max-w-md md:rounded-3xl md:shadow-2xl md:overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card">
          <h2 className="text-lg font-black text-text-main">Tạo bài tập mới</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-card-2 transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">Icon</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`flex-shrink-0 w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl transition-colors ${
                    icon === ic ? 'border-primary bg-primary-light' : 'border-border bg-card'
                  }`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">Tên bài tập</p>
            <input
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none transition-colors"
              placeholder="VD: Hít đất nghịch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">Nhóm cơ</p>
            <div className="flex flex-wrap gap-2">
              {CREATE_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                    category === c ? 'bg-primary text-white border-primary' : 'bg-card text-text-secondary border-border'
                  }`}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">Đơn vị đo</p>
            <div className="flex gap-2">
              {UNIT_OPTIONS.map((u) => (
                <button key={u.value} type="button" onClick={() => setUnit(u.value)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors ${
                    unit === u.value ? 'bg-primary text-white border-primary' : 'bg-card text-text-secondary border-border'
                  }`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-secondary mb-2">
                Mặc định ({unit === 'reps' ? 'reps' : unit === 'seconds' ? 'giây' : 'phút'})
              </p>
              <input type="number" min={1} value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text-main focus:border-primary outline-none" />
            </div>
            {unit === 'reps' && (
              <div className="flex-1">
                <p className="text-xs font-semibold text-text-secondary mb-2">Số hiệp</p>
                <input type="number" min={1} value={defaultSets} onChange={(e) => setDefaultSets(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text-main focus:border-primary outline-none" />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-danger font-semibold">{error}</p>}
        </div>

        <div className="px-4 py-4 border-t border-border bg-card">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/30 transition-opacity">
            {saving ? 'Đang tạo...' : 'Tạo bài tập ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WorkoutSummaryModalProps {
  onClose: () => void;
  uid: string;
}

function WorkoutSummaryModal({ onClose, uid }: WorkoutSummaryModalProps) {
  const { draft, removeExercise, updateExercise, setNotes, setStartedAt, logWorkout, isLogging } = useWorkoutStore();
  const [toast, setToast] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateInput, setShowTemplateInput] = useState(false);

  // Default the workout time to "now" when the modal opens with no time set.
  useEffect(() => {
    if (!draft.startedAt) setStartedAt(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleLog = async () => {
    if (draft.exercises.length === 0) return;
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

  // Small pill chips that let you tap to fill the number input instead of
  // typing — still fully editable by hand afterwards via the input itself.
  // Chip bases are frozen per exercise at first render so tapping a chip
  // doesn't shift the whole row to recompute around the new value.
  const chipBaseRef = useRef<Map<string, number>>(new Map());
  const renderQuickChips = (ex: ExerciseEntry) => {
    type Chip = { key: string; label: string; active: boolean; onClick: () => void };
    let chips: Chip[] = [];

    if (ex.unit === 'reps') {
      if (!chipBaseRef.current.has(ex.presetId)) {
        chipBaseRef.current.set(
          ex.presetId,
          ex.reps && ex.reps > 0
            ? ex.reps
            : (SYSTEM_PRESETS.find((p) => p.id === ex.presetId)?.defaultValue ?? 10)
        );
      }
      const base = chipBaseRef.current.get(ex.presetId)!;
      const values = Array.from(new Set([0.5, 0.75, 1, 1.25].map((m) => roundNice(base * m, 'reps'))));
      chips = values.map((v) => ({
        key: `reps-${v}`,
        label: `${v}`,
        active: (ex.reps ?? 0) === v,
        onClick: () => updateExercise(ex.presetId, { reps: v }),
      }));
    } else if (ex.unit === 'seconds') {
      chips = [20, 30, 45, 60, 90].map((v) => ({
        key: `sec-${v}`,
        label: `${v}s`,
        active: (ex.durationSeconds ?? 0) === v,
        onClick: () => updateExercise(ex.presetId, { durationSeconds: v }),
      }));
    } else if (ex.unit === 'minutes') {
      chips = [5, 10, 15, 20, 30].map((m) => ({
        key: `min-${m}`,
        label: `${m}p`,
        active: (ex.durationSeconds ?? 0) === m * 60,
        onClick: () => updateExercise(ex.presetId, { durationSeconds: m * 60 }),
      }));
    } else if (ex.unit === 'km') {
      chips = [1, 2, 3, 5].map((v) => ({
        key: `km-${v}`,
        label: `${v}km`,
        active: (ex.distance ?? 0) === v,
        onClick: () => updateExercise(ex.presetId, { distance: v }),
      }));
    }

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={c.onClick}
            className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
              c.active
                ? 'bg-primary text-white border-primary'
                : 'bg-card-2 border-border text-text-secondary hover:border-primary hover:text-primary'
            }`}>
            {c.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center md:bg-black/40 md:p-6">
      <div className="flex flex-col bg-background w-full h-full md:h-auto md:max-h-[88vh] md:max-w-lg md:rounded-3xl md:shadow-2xl md:overflow-hidden">
      {toast && (
        <div className="absolute top-4 left-4 right-4 bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-10">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-black text-text-main">Lưu buổi tập</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-card-2 transition-colors">
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Editable workout time — defaults to now, supports back-dating */}
        <div className="bg-card rounded-2xl p-3 border border-border">
          <label className="text-xs font-semibold text-text-secondary block mb-1.5">🕐 Thời gian tập</label>
          <input
            type="datetime-local"
            value={draft.startedAt ? toLocalInput(draft.startedAt) : ''}
            onChange={(e) => { if (e.target.value) setStartedAt(new Date(e.target.value)); }}
            className="w-full bg-card-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
          />
          <p className="text-[10px] text-text-muted mt-1">Mặc định là bây giờ. Sửa nếu bạn quên ghi lúc tập.</p>
        </div>

        {draft.exercises.length === 0 ? (
          <p className="text-text-secondary text-center py-8 text-sm">Chưa có bài tập nào. Quay lại để thêm.</p>
        ) : (
          draft.exercises.map((ex) => {
            const cc = CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.strength;
            return (
              <div key={ex.presetId} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-text-main">{ex.name}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ color: cc.text, backgroundColor: cc.bg }}>
                      {CATEGORY_LABELS[ex.category] || ex.category}
                    </span>
                  </div>
                  <button onClick={() => removeExercise(ex.presetId)}
                    className="p-1.5 rounded-full hover:bg-danger-light text-text-secondary hover:text-danger transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {ex.unit === 'reps' && (
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-text-secondary">Số lượng:</label>
                      <input
                        type="number"
                        min={1}
                        className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                        value={ex.reps ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          updateExercise(ex.presetId, { reps: Math.max(1, v) });
                        }}
                      />
                      <span className="text-xs text-text-secondary">cái</span>
                    </div>
                  )}

                  {(ex.unit === 'seconds' || ex.unit === 'minutes') && (
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-text-secondary">
                        {ex.unit === 'minutes' ? 'Số phút:' : 'Số giây:'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                        value={ex.unit === 'minutes'
                          ? Math.round((ex.durationSeconds || 0) / 60)
                          : (ex.durationSeconds || 0)}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          updateExercise(ex.presetId, {
                            durationSeconds: ex.unit === 'minutes' ? v * 60 : v,
                          });
                        }}
                      />
                      <span className="text-xs text-text-secondary">
                        {ex.unit === 'minutes' ? 'phút' : 'giây'}
                      </span>
                    </div>
                  )}

                  {ex.unit === 'km' && (
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-text-secondary">Quãng đường:</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        className="w-20 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                        value={ex.distance ?? 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          updateExercise(ex.presetId, { distance: Math.max(0, v) });
                        }}
                      />
                      <span className="text-xs text-text-secondary">km</span>
                    </div>
                  )}
                </div>

                {renderQuickChips(ex)}

              </div>
            );
          })
        )}

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

      <div className="px-4 py-4 border-t border-border bg-card">
        <button onClick={handleLog} disabled={isLogging || draft.exercises.length === 0}
          className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/30 transition-opacity">
          {isLogging ? 'Đang lưu...' : `Lưu buổi tập (${draft.exercises.length} bài) ✅`}
        </button>
      </div>
      </div>
    </div>
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface WeeklyForecastCardProps {
  recentLogs: WorkoutLog[];
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function WeeklyForecastCard({ recentLogs }: WeeklyForecastCardProps) {
  const now = new Date();
  const today = todayString();
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const monDate = new Date(now);
  monDate.setDate(now.getDate() - dow);
  const weekStart = toDateStr(monDate);

  const weekDates = new Set(recentLogs.filter(l => l.date >= weekStart && l.date <= today).map(l => l.date));
  const thisWeekDays = weekDates.size;

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthDays = new Set(recentLogs.filter(l => l.date >= monthStart && l.date <= today).map(l => l.date)).size;

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 p-3">
      <p className="text-xs font-bold text-text-secondary mb-2">📅 Hoạt động tập luyện</p>
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary">Tuần này</span>
          <span className="text-xs font-bold text-primary">{thisWeekDays} ngày đã tập</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monDate);
            d.setDate(monDate.getDate() + i);
            const ds = toDateStr(d);
            const trained = weekDates.has(ds);
            const isToday = ds === today;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`w-full h-6 rounded-md flex items-center justify-center transition-all ${
                  trained ? 'bg-primary text-white' : isToday ? 'bg-primary/15 ring-1 ring-primary/40' : ds > today ? 'bg-card-2' : 'bg-border/50'
                }`}>
                  {trained && <span className="text-[10px] font-black">✓</span>}
                </div>
                <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>{WEEKDAY_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-text-secondary">Tháng này</span>
        <span className="text-xs font-bold text-text-main">{monthDays} ngày đã tập</span>
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
    if (target >= 60) {
      return `${Math.round(current / 60)}/${Math.round(target / 60)} phút`;
    }
    return `${current}/${target}s`;
  }
  return `${current}/${target}`;
}

function getWeeklyGoal(goal: ExerciseGoal, recentLogs: WorkoutLog[], sessionsPerWeek: number): { current: number; target: number; met: boolean } {
  const weekly = sumThisWeek(recentLogs, goal.presetId);
  const dailyTarget = goal.targetReps ?? goal.targetDurationSeconds ?? 1;
  const target = dailyTarget * Math.max(1, sessionsPerWeek);
  const current = goal.targetReps ? weekly.reps : weekly.seconds;
  return { current, target, met: current >= target };
}

interface GoalsStripProps {
  goals: ExerciseGoal[];
  todayLog: WorkoutLog | null;
  todayDateStr: string;
  recentLogs: WorkoutLog[];
  sessionsPerWeek: number;
  onAddExercise?: (presetId: string) => void;
}

function GoalsStrip({ goals, todayLog, todayDateStr, recentLogs, sessionsPerWeek, onAddExercise }: GoalsStripProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeGoals = goals.filter(g => g.enabled);
  if (activeGoals.length === 0) return null;

  const metCount = activeGoals.filter(g => isGoalMet(g, todayLog)).length;
  const allMet = metCount === activeGoals.length;
  const weeklyMetCount = activeGoals.filter(g => getWeeklyGoal(g, recentLogs, sessionsPerWeek).met).length;
  const allWeeklyMet = weeklyMetCount === activeGoals.length;
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
            {showReminder ? `🔔 Còn ${activeGoals.length - metCount} mục tiêu chưa đạt` :
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
          {allWeeklyMet && (
            <div className="bg-success/15 border border-success/30 rounded-xl px-3 py-2 text-center mb-1">
              <p className="text-sm font-black text-success">🏆 {pickWeeklyCheer(todayDateStr)}</p>
            </div>
          )}
          {allMet && !allWeeklyMet && (
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
            const wk = getWeeklyGoal(g, recentLogs, sessionsPerWeek);
            const wkPct = Math.min(1, wk.current / wk.target);
            const wkLabel = formatGoalLabel(wk.current, wk.target, g);
            return (
              <div key={g.presetId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${met ? 'text-success' : 'text-text-secondary'}`}>
                    {met ? '✓ ' : ''}{g.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{label}</span>
                    {!met && onAddExercise && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddExercise(g.presetId); }}
                        className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary-light border border-primary/20 hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                        ➕ Tập
                      </button>
                    )}
                  </div>
                </div>
                {/* Daily bar */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-muted w-7 flex-shrink-0">Ngày</span>
                  <div className="flex-1 bg-border rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${met ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
                {/* Weekly bar */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-muted w-7 flex-shrink-0">Tuần</span>
                  <div className="flex-1 bg-border rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${wk.met ? 'bg-success' : 'bg-primary/60'}`}
                      style={{ width: `${wkPct * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-text-muted flex-shrink-0">{wkLabel}</span>
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
  excludeIds: Set<string>;
  presets: WorkoutPreset[];
  onAddWithValue: (preset: WorkoutPreset, value: number) => void;
}

function SuggestionsCard({ recentLogs, excludeIds, presets, onAddWithValue }: SuggestionsCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const suggestions = buildSuggestions(recentLogs, 5, excludeIds);
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
        <span className="text-xs font-bold text-text-secondary">💡 Gợi ý tập tiếp</span>
        {collapsed ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronUp size={14} className="text-text-secondary" />}
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {suggestions.map((s) => {
            const preset = presets.find(p => p.id === s.presetId);
            return (
              <div key={s.presetId} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-text-main flex-shrink-0 min-w-[80px] inline-flex items-center gap-1">
                  {s.name}
                  {s.isNew && (
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-full">Thử mới ✨</span>
                  )}
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => preset && onAddWithValue(preset, s.light)}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-card-2 text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    Nhẹ {formatSuggestionValue(s.light, s.unit)}
                  </button>
                  <button
                    onClick={() => preset && onAddWithValue(preset, s.moderate)}
                    className="text-xs px-2 py-1 rounded-lg border border-primary bg-primary-light text-primary font-semibold hover:bg-primary hover:text-white transition-colors">
                    Vừa {formatSuggestionValue(s.moderate, s.unit)}
                  </button>
                  <button
                    onClick={() => preset && onAddWithValue(preset, s.high)}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-card-2 text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    Cao {formatSuggestionValue(s.high, s.unit)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  // Defensive: dateStr is expected as 'YYYY-MM-DD'; fall back gracefully if malformed.
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr || '--';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// recentLogs (from workoutStore.loadRecentLogs -> getLogsForHeatmap) is sorted
// ASCENDING by date (oldest first), so the most recent log is the LAST item,
// not recentLogs[0]. When several sessions share the most recent date, merge
// them (dedup by presetId) the same way the store merges yesterday's logs.
function getMostRecentLog(recentLogs: WorkoutLog[], yesterdayLog: WorkoutLog | null): WorkoutLog | null {
  if (!recentLogs || recentLogs.length === 0) return null;
  const maxDate = recentLogs.reduce((max, l) => (l?.date && l.date > max ? l.date : max), recentLogs[0]?.date ?? '');
  if (!maxDate) return null;
  if (yesterdayLog && yesterdayLog.date === maxDate) return yesterdayLog;
  const sameDate = recentLogs.filter((l) => l.date === maxDate);
  if (sameDate.length === 0) return null;
  if (sameDate.length === 1) return sameDate[0];
  const merged: ExerciseEntry[] = [];
  const seen = new Set<string>();
  sameDate.forEach((l) => {
    (l.exercises || []).forEach((e) => {
      if (e?.presetId && !seen.has(e.presetId)) {
        seen.add(e.presetId);
        merged.push(e);
      }
    });
  });
  return { ...sameDate[0], exercises: merged };
}

interface RecentSessionCardProps {
  log: WorkoutLog;
  presets: WorkoutPreset[];
  onRepeat: () => void;
}

function RecentSessionCard({ log, presets, onRepeat }: RecentSessionCardProps) {
  const exercises = log.exercises || [];
  if (exercises.length === 0) return null;
  const shown = exercises.slice(0, 4);
  const extra = exercises.length - shown.length;

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-bold text-text-secondary">🔁 Buổi gần nhất</p>
        <span className="text-xs text-text-muted">{formatShortDate(log.date)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {shown.map((ex) => {
          const preset = presets.find((p) => p.id === ex.presetId);
          return (
            <span key={ex.presetId}
              className="inline-flex items-center gap-1 text-xs font-semibold text-text-main bg-card-2 border border-border rounded-full px-2.5 py-1">
              <span>{preset?.icon ?? '🏋️'}</span>
              {ex.name || preset?.nameVi || 'Bài tập'}
            </span>
          );
        })}
        {extra > 0 && (
          <span className="text-xs font-semibold text-text-secondary bg-card-2 border border-border rounded-full px-2.5 py-1">
            +{extra} bài
          </span>
        )}
      </div>
      <button onClick={onRepeat}
        className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-[0.99] transition-transform">
        Tập lại buổi này →
      </button>
    </div>
  );
}

interface ProgramSuggestionCardProps {
  templates: WorkoutProgram[];
}

function ProgramSuggestionCard({ templates }: ProgramSuggestionCardProps) {
  const navigate = useNavigate();
  if (templates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-bold text-text-secondary">📅 Gợi ý chương trình</p>
        <button onClick={() => navigate('/programs')} className="text-xs font-semibold text-primary">
          Xem tất cả →
        </button>
      </div>
      <div className="space-y-2">
        {templates.map((t) => (
          <button key={t.id} onClick={() => navigate(`/programs/${t.id}`)}
            className="w-full flex items-center gap-3 bg-card-2 border border-border rounded-xl p-3 text-left hover:border-primary/40 transition-colors">
            <span className="text-2xl flex-shrink-0">{t.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-main text-sm truncate">{t.nameVi}</p>
              <p className="text-xs text-text-secondary truncate">{t.descriptionVi}</p>
            </div>
            <ChevronRight size={16} className="text-text-secondary flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuickAddPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser } = useUserStore();
  const { draft, todayLog, yesterdayLog, recentLogs, addExercise, updateExercise, setDraftFromLog, loadRecentLogs } = useWorkoutStore();
  const { activeState, loadActiveProgram, getTodayDay } = useProgramStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [customPresets, setCustomPresets] = useState<WorkoutPreset[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const allPresets = useMemo(() => [...customPresets, ...SYSTEM_PRESETS], [customPresets]);

  // "Buổi gần nhất" — most recent past session, only relevant when today has
  // no log yet (otherwise the user is already looking at today's summary).
  const mostRecentLog = useMemo(
    () => (todayLog ? null : getMostRecentLog(recentLogs, yesterdayLog)),
    [todayLog, recentLogs, yesterdayLog]
  );

  // "Gợi ý chương trình" — only shown when no program is active. Score each
  // template by how many of the user's top-trained categories (from actual
  // logged exercises, not the coarse single-value template.focus field) it
  // covers, then keep the top 2 (ties preserve PROGRAM_TEMPLATES file order
  // via Array#sort's stable sort).
  const recommendedTemplates = useMemo<WorkoutProgram[]>(() => {
    if (activeState) return [];
    const categoryCounts: Partial<Record<ExerciseCategory, number>> = {};
    recentLogs.forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        if (!ex?.category) return;
        categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1;
      });
    });
    const topCategories = new Set(
      Object.entries(categoryCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([cat]) => cat)
    );
    if (topCategories.size === 0) return PROGRAM_TEMPLATES.slice(0, 2);
    const scored = PROGRAM_TEMPLATES.map((t) => {
      const templateCategories = new Set<string>();
      t.days.forEach((d) => {
        (d.exercises || []).forEach((ex) => {
          const preset = SYSTEM_PRESETS.find((p) => p.id === ex.presetId);
          if (preset) templateCategories.add(preset.category);
        });
      });
      let score = 0;
      templateCategories.forEach((c) => { if (topCategories.has(c)) score += 1; });
      return { template: t, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 2).map((s) => s.template);
  }, [activeState, recentLogs]);

  const filteredPresets = activeCategory === 'all'
    ? allPresets
    : allPresets.filter((p) => p.category === activeCategory);

  const draftIds = new Set(draft.exercises.map((e) => e.presetId));

  const handleCustomCreated = (preset: WorkoutPreset) => {
    // The mount-time getCustomPresets() can resolve after creation and already
    // contain this preset — dedupe by id so the card doesn't render twice.
    setCustomPresets((prev) => [preset, ...prev.filter((p) => p.id !== preset.id)]);
  };

  const handleDeleteCustom = async (preset: WorkoutPreset) => {
    if (!confirm(`Xoá "${preset.nameVi}"? Không thể hoàn tác.`)) return;
    try {
      await deleteCustomPreset(preset.id);
      setCustomPresets((prev) => prev.filter((p) => p.id !== preset.id));
    } catch {
      // best-effort delete; leave preset in place on failure
    }
  };

  const handleAddExercise = (preset: WorkoutPreset) => {
    if (draftIds.has(preset.id)) return;
    const yesterday = yesterdayLog?.exercises.find((e) => e.presetId === preset.id);
    const entry: ExerciseEntry = {
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: 1,
      reps: preset.unit === 'reps' ? (yesterday?.reps ?? preset.defaultValue) : undefined,
      durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes')
        ? (yesterday?.durationSeconds ?? (preset.unit === 'seconds' ? preset.defaultValue : preset.defaultValue * 60))
        : undefined,
      weight: preset.unit === 'reps' ? yesterday?.weight : undefined,
    };
    addExercise(entry);
  };

  const handleAddWithValue = (preset: WorkoutPreset, value: number) => {
    // Remove existing entry for this preset if it exists so we can re-add with new value
    const entry: ExerciseEntry = {
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: 1,
      reps: preset.unit === 'reps' ? value : undefined,
      durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes') ? value : undefined,
    };
    if (draftIds.has(preset.id)) {
      // Update existing
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
      return formatAmount({ unit: 'reps', reps });
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

  const todayDateStr = todayString();

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-24">
      {showModal && uid && (
        <WorkoutSummaryModal onClose={() => setShowModal(false)} uid={uid} />
      )}

      {showCreateModal && uid && (
        <CreateExerciseModal
          uid={uid}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCustomCreated}
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

      {/* Program of the day — compact strip */}
      {todayDay && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 mb-3">
          <span className="text-lg">{todayDay.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-main text-xs truncate">{todayDay.nameVi}</p>
            <p className="text-xs text-text-secondary truncate">{todayDay.focusVi}</p>
          </div>
        </div>
      )}

      {/* Weekly plan score: this week vs last week + breakdown + tip */}
      <WeeklyPlanCard logs={recentLogs} profile={profile} />


      {/* Weekly forecast */}
      <WeeklyForecastCard recentLogs={recentLogs} />

      {/* Goals strip */}
      <GoalsStrip
        goals={profile?.exerciseGoals || []}
        todayLog={todayLog}
        todayDateStr={todayDateStr}
        recentLogs={recentLogs}
        sessionsPerWeek={profile?.weeklyGoalSessions || 5}
        onAddExercise={(presetId) => {
          const preset = SYSTEM_PRESETS.find(p => p.id === presetId);
          if (!preset) return;
          const yesterday = yesterdayLog?.exercises.find(e => e.presetId === presetId);
          const value = preset.unit === 'reps'
            ? (yesterday?.reps ?? preset.defaultValue)
            : (yesterday?.durationSeconds ?? (preset.unit === 'seconds' ? preset.defaultValue : preset.defaultValue * 60));
          handleAddWithValue(preset, value);
        }}
      />

      {/* Suggestions card — complementary past exercises, excluding goals & today's done */}
      <SuggestionsCard
        recentLogs={recentLogs}
        excludeIds={new Set([
          ...(profile?.exerciseGoals || []).filter(g => g.enabled).map(g => g.presetId),
          ...(todayLog?.exercises || []).map(e => e.presetId),
          ...draft.exercises.map(e => e.presetId),
        ])}
        presets={allPresets}
        onAddWithValue={handleAddWithValue}
      />

      {/* Templates — horizontal scroll chips, only if exist */}
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

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-1 px-1">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button onClick={() => setShowCreateModal(true)}
          className="bg-card rounded-2xl p-4 border-2 border-dashed border-border hover:border-primary/60 text-text-secondary hover:text-primary transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 min-h-[112px]">
          <Plus size={22} />
          <span className="text-xs font-bold">Tạo bài tập</span>
        </button>
        {filteredPresets.map((preset) => {
          const inDraft = draftIds.has(preset.id);
          const cc = CATEGORY_COLORS[preset.category] || CATEGORY_COLORS.strength;
          return (
            <div key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => handleAddExercise(preset)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAddExercise(preset); }
              }}
              className={`relative bg-card rounded-2xl p-4 border-2 text-left transition-all active:scale-95 cursor-pointer ${
                inDraft ? 'border-primary' : 'border-border hover:border-primary/40'
              }`}>
              {preset.isCustom && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustom(preset); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
                  className="absolute top-2 right-2 p-1 rounded-full text-text-muted hover:bg-danger-light hover:text-danger transition-colors"
                  aria-label={`Xoá ${preset.nameVi}`}>
                  <Trash2 size={14} />
                </button>
              )}
              <div className="text-2xl mb-2">{preset.icon}</div>
              <p className="font-bold text-text-main text-sm leading-tight mb-1 pr-5">{preset.nameVi}</p>
              <p className="text-xs text-text-secondary mb-2">{getSuggestedValue(preset)}</p>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: cc.text, backgroundColor: cc.bg }}>
                  {CATEGORY_LABELS[preset.category]}
                </span>
                {preset.isCustom && (
                  <span className="text-[9px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-full flex-shrink-0">Tự tạo</span>
                )}
                {inDraft && <span className="text-xs font-bold text-primary flex-shrink-0">✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Program block — bottom of Home per owner's preference: quick logging
          and the weekly plan stay above the fold, program shortcuts below. */}
      {mostRecentLog && (
        <div className="mt-4">
          <RecentSessionCard
            log={mostRecentLog}
            presets={allPresets}
            onRepeat={() => { if (uid) { setDraftFromLog(mostRecentLog); setShowModal(true); } }}
          />
        </div>
      )}
      {!activeState && recommendedTemplates.length > 0 && (
        <ProgramSuggestionCard templates={recommendedTemplates} />
      )}

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
