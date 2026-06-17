import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Play, Pause, ChevronRight, Flame, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useProgramStore } from '../stores/programStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../constants/exercises';
import { getTemplates, saveTemplate } from '../services/templateService';
import { WorkoutTemplate, ExerciseEntry, WorkoutLog } from '../types/workout';
import { ExerciseGoal } from '../types/user';

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

function formatValue(e: ExerciseEntry): string {
  if (e.unit === 'reps') {
    const base = `${e.sets}×${e.reps ?? '-'} reps`;
    return e.weight ? `${base} · ${e.weight}kg` : base;
  }
  if (e.unit === 'seconds') return `${e.sets}×${e.durationSeconds ?? '-'}s`;
  if (e.unit === 'minutes') {
    const mins = e.durationSeconds ? Math.round(e.durationSeconds / 60) : '-';
    return `${mins} phút`;
  }
  return `${e.sets} hiệp`;
}

function ActiveTimer({ startedAt }: { startedAt: Date | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 bg-success-light px-2.5 py-1.5 rounded-xl">
      <span className="text-xs">⏱</span>
      <span className="text-xs font-black text-success tabular-nums">{mm}:{ss}</span>
    </div>
  );
}

function RestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (s: number) => {
    setSeconds(s);
    setRunning(true);
  };

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && running) {
      setRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  const toggle = () => setRunning((r) => !r);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-text-secondary mb-2">Nghỉ giữa hiệp</p>
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
          <button onClick={toggle} className="ml-auto p-2 rounded-full bg-primary text-white">
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}

interface WorkoutSummaryModalProps {
  onClose: () => void;
  uid: string;
}

function WorkoutSummaryModal({ onClose, uid }: WorkoutSummaryModalProps) {
  const { draft, removeExercise, updateExercise, setNotes, logWorkout, isLogging } = useWorkoutStore();
  const [toast, setToast] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateInput, setShowTemplateInput] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:bg-black/40 md:p-6">
      <div className="flex flex-col bg-background w-full h-full md:h-auto md:max-h-[88vh] md:max-w-lg md:rounded-3xl md:shadow-2xl md:overflow-hidden">
      {toast && (
        <div className="absolute top-4 left-4 right-4 bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-10">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Hiệp:</span>
                    <button onClick={() => updateExercise(ex.presetId, { sets: Math.max(1, ex.sets - 1) })}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold text-text-main text-sm">{ex.sets}</span>
                    <button onClick={() => updateExercise(ex.presetId, { sets: ex.sets + 1 })}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>

                  {ex.unit === 'reps' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Reps:</span>
                      <button onClick={() => updateExercise(ex.presetId, { reps: Math.max(1, (ex.reps || 1) - 1) })}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold text-text-main text-sm">{ex.reps ?? '-'}</span>
                      <button onClick={() => updateExercise(ex.presetId, { reps: (ex.reps || 0) + 1 })}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  )}

                  {ex.unit === 'reps' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Kg:</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="w-16 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
                        placeholder="–"
                        value={ex.weight ?? ''}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          updateExercise(ex.presetId, { weight: isNaN(v) ? undefined : v });
                        }}
                      />
                    </div>
                  )}

                  {(ex.unit === 'seconds' || ex.unit === 'minutes') && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">
                        {ex.unit === 'minutes' ? 'Phút:' : 'Giây:'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        className="w-16 text-center font-bold text-text-main text-sm bg-card-2 border border-border rounded-lg px-2 py-1 focus:border-primary outline-none"
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
                    </div>
                  )}
                </div>
              </div>
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

function isGoalMet(goal: ExerciseGoal, todayLog: WorkoutLog | null): boolean {
  if (!todayLog) return false;
  const ex = todayLog.exercises.find(e => e.presetId === goal.presetId);
  if (!ex) return false;
  const setsOk = ex.sets >= goal.targetSets;
  const repsOk = !goal.targetReps || (ex.reps || 0) >= goal.targetReps;
  const durOk = !goal.targetDurationSeconds || (ex.durationSeconds || 0) >= goal.targetDurationSeconds;
  return setsOk && repsOk && durOk;
}

function formatGoalTarget(g: ExerciseGoal): string {
  if (g.targetReps) return `${g.targetSets}×${g.targetReps} reps`;
  if (g.targetDurationSeconds) {
    const s = g.targetDurationSeconds;
    return s >= 60 ? `${g.targetSets}×${Math.round(s / 60)} phút` : `${g.targetSets}×${s}s`;
  }
  return `${g.targetSets} hiệp`;
}

interface GoalsStripProps {
  goals: ExerciseGoal[];
  todayLog: WorkoutLog | null;
}

function GoalsStrip({ goals, todayLog }: GoalsStripProps) {
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
        <div className="px-3 pb-3 space-y-1.5">
          {activeGoals.map(g => {
            const met = isGoalMet(g, todayLog);
            return (
              <div key={g.presetId} className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${met ? 'text-success' : 'text-text-secondary'}`}>
                  {met ? '✅' : '❌'} {g.name}
                </span>
                <span className="text-xs text-text-muted">{formatGoalTarget(g)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuickAddPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser } = useUserStore();
  const { draft, todayLog, yesterdayLog, addExercise, setDraftFromLog, loadRecentLogs } = useWorkoutStore();
  const { loadActiveProgram, getTodayDay } = useProgramStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    loadRecentLogs(uid);
    loadActiveProgram(uid);
    getTemplates(uid).then(setTemplates).catch(() => {});
  }, [uid]);

  const todayDay = getTodayDay();
  const firstName = profile?.displayName?.split(' ').pop() || 'bạn';
  const streak = profile?.streak?.current || 0;
  const weeklyGoal = profile?.weeklyGoalMinutes || 150;
  const weeklyDone = profile?.weeklyStats?.totalMinutes || 0;
  const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyGoal) * 100));

  const filteredPresets = activeCategory === 'all'
    ? SYSTEM_PRESETS
    : SYSTEM_PRESETS.filter((p) => p.category === activeCategory);

  const draftIds = new Set(draft.exercises.map((e) => e.presetId));

  const handleAddExercise = (preset: typeof SYSTEM_PRESETS[0]) => {
    if (draftIds.has(preset.id)) return;
    const yesterday = yesterdayLog?.exercises.find((e) => e.presetId === preset.id);
    const entry: ExerciseEntry = {
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: yesterday?.sets ?? preset.defaultSets ?? 3,
      reps: preset.unit === 'reps' ? (yesterday?.reps ?? preset.defaultValue) : undefined,
      durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes')
        ? (yesterday?.durationSeconds ?? (preset.unit === 'seconds' ? preset.defaultValue : preset.defaultValue * 60))
        : undefined,
    };
    addExercise(entry);
  };

  const getSuggestedValue = (preset: typeof SYSTEM_PRESETS[0]) => {
    const y = yesterdayLog?.exercises.find((e) => e.presetId === preset.id);
    if (preset.unit === 'reps') {
      const base = `${y?.sets ?? preset.defaultSets ?? 3}×${y?.reps ?? preset.defaultValue} reps`;
      return y?.weight ? `${base} · ${y.weight}kg` : base;
    }
    if (preset.unit === 'seconds') return `${y?.durationSeconds ?? preset.defaultValue}s`;
    if (preset.unit === 'minutes') {
      const secs = y?.durationSeconds ?? preset.defaultValue * 60;
      return `${Math.round(secs / 60)} phút`;
    }
    return `${preset.defaultValue}`;
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-24">
      {showModal && uid && (
        <WorkoutSummaryModal onClose={() => setShowModal(false)} uid={uid} />
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
          <ActiveTimer startedAt={draft.startedAt} />
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

      {/* Templates — horizontal scroll chips, only if exist */}
      {/* Goals strip */}
      <GoalsStrip goals={profile?.exerciseGoals || []} todayLog={todayLog} />

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
        {filteredPresets.map((preset) => {
          const inDraft = draftIds.has(preset.id);
          const cc = CATEGORY_COLORS[preset.category] || CATEGORY_COLORS.strength;
          return (
            <button key={preset.id} onClick={() => handleAddExercise(preset)}
              className={`bg-card rounded-2xl p-4 border-2 text-left transition-all active:scale-95 ${
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
