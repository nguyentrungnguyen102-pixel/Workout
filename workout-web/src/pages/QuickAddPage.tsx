import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Play, Pause, ChevronRight, Flame } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useProgramStore } from '../stores/programStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../constants/exercises';
import { getTemplates, saveTemplate } from '../services/templateService';
import { WorkoutTemplate, ExerciseEntry } from '../types/workout';

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
  if (e.unit === 'reps') return `${e.sets}×${e.reps ?? '-'} reps`;
  if (e.unit === 'seconds') return `${e.sets}×${e.durationSeconds ?? '-'}s`;
  if (e.unit === 'minutes') {
    const mins = e.durationSeconds ? Math.round(e.durationSeconds / 60) : '-';
    return `${mins} phút`;
  }
  return `${e.sets} hiệp`;
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
  const { draft, removeExercise, updateExercise, setIntensity, setNotes, logWorkout, isLogging } = useWorkoutStore();
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

  const INTENSITIES: { key: 'light' | 'moderate' | 'heavy'; label: string; color: string }[] = [
    { key: 'light', label: 'Nhẹ 🟢', color: '#059669' },
    { key: 'moderate', label: 'Vừa 🟡', color: '#D97706' },
    { key: 'heavy', label: 'Nặng 🔴', color: '#DC2626' },
  ];

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

                  {(ex.unit === 'seconds' || ex.unit === 'minutes') && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Thời gian:</span>
                      <button onClick={() => updateExercise(ex.presetId, { durationSeconds: Math.max(10, (ex.durationSeconds || 30) - 10) })}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center font-bold text-text-main text-sm">
                        {ex.unit === 'minutes' ? `${Math.round((ex.durationSeconds || 0) / 60)}m` : `${ex.durationSeconds || 0}s`}
                      </span>
                      <button onClick={() => updateExercise(ex.presetId, { durationSeconds: (ex.durationSeconds || 30) + 10 })}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {(ex.category === 'dumbbell' || ex.category === 'strength') && ex.unit === 'reps' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-text-secondary">Tạ (kg):</span>
                    <button onClick={() => updateExercise(ex.presetId, { weight: Math.max(0.5, parseFloat(((ex.weight || 0) - 0.5).toFixed(1))) })}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="w-10 text-center font-bold text-text-main text-sm">
                      {ex.weight ? `${ex.weight}` : '—'}
                    </span>
                    <button onClick={() => updateExercise(ex.presetId, { weight: parseFloat(((ex.weight || 0) + 0.5).toFixed(1)) })}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Plus size={12} />
                    </button>
                    <span className="text-xs text-text-secondary">kg</span>
                    {ex.weight && ex.reps && (
                      <span className="text-xs font-semibold text-primary ml-1">
                        1RM≈{Math.round(ex.weight * (1 + (ex.reps / 30)))}kg
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <RestTimer />

        <div className="mt-4">
          <p className="text-xs font-semibold text-text-secondary mb-2">Cường độ</p>
          <div className="flex gap-2">
            {INTENSITIES.map(({ key, label, color }) => (
              <button key={key} onClick={() => setIntensity(key)}
                className="flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                style={draft.intensity === key
                  ? { borderColor: color, backgroundColor: color + '18', color }
                  : {}}>
                <span className={draft.intensity === key ? '' : 'text-text-secondary'}>{label}</span>
              </button>
            ))}
          </div>
        </div>

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
    if (preset.unit === 'reps') return `${y?.sets ?? preset.defaultSets ?? 3}×${y?.reps ?? preset.defaultValue} reps`;
    if (preset.unit === 'seconds') return `${y?.durationSeconds ?? preset.defaultValue}s`;
    if (preset.unit === 'minutes') {
      const secs = y?.durationSeconds ?? preset.defaultValue * 60;
      return `${Math.round(secs / 60)} phút`;
    }
    return `${preset.defaultValue}`;
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-32">
      {showModal && uid && (
        <WorkoutSummaryModal onClose={() => setShowModal(false)} uid={uid} />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-text-secondary text-sm">Chào,</p>
          <h1 className="text-2xl font-black text-text-main">{firstName} 👋</h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-primary-light px-3 py-2 rounded-xl">
            <Flame size={16} className="text-primary" />
            <span className="font-black text-primary text-sm">{streak}</span>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-text-main">Mục tiêu tuần</span>
          <span className="text-sm font-bold text-primary">{weeklyDone}/{weeklyGoal} phút</span>
        </div>
        <div className="h-2.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${weeklyPct}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">{weeklyPct}% hoàn thành</p>
      </div>

      {todayLog && (
        <div className="bg-success-light border border-success/20 rounded-2xl p-4 mb-4">
          <p className="font-bold text-success text-sm mb-1">Đã tập hôm nay ✅</p>
          <p className="text-text-secondary text-xs">
            {todayLog.exercises.map((e) => e.name).join(' · ')}
          </p>
          <p className="text-text-secondary text-xs mt-1">{todayLog.totalDurationMinutes} phút</p>
        </div>
      )}

      {!todayLog && yesterdayLog && (
        <button
          onClick={() => { if (uid) { setDraftFromLog(yesterdayLog); setShowModal(true); } }}
          className="w-full flex items-center justify-between bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4 text-left">
          <div>
            <p className="font-bold text-primary text-sm">🔁 Lặp lại hôm qua</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {yesterdayLog.exercises.map((e) => e.name).slice(0, 3).join(' · ')}
              {yesterdayLog.exercises.length > 3 ? ` +${yesterdayLog.exercises.length - 3}` : ''}
            </p>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </button>
      )}

      {!todayLog && draft.exercises.length > 0 && (
        <button onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-between bg-card-2 border border-border rounded-2xl p-4 mb-4 text-left">
          <div>
            <p className="font-bold text-text-main text-sm">⏩ Tiếp tục buổi tập</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {draft.exercises.map((e) => e.name).slice(0, 3).join(' · ')}
              {draft.exercises.length > 3 ? ` +${draft.exercises.length - 3}` : ''}
            </p>
          </div>
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      )}

      {todayDay && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-xs text-text-secondary font-semibold mb-1">CHƯƠNG TRÌNH HÔM NAY</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{todayDay.emoji}</span>
            <div>
              <p className="font-bold text-text-main text-sm">{todayDay.nameVi}</p>
              <p className="text-xs text-text-secondary">{todayDay.focusVi}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {todayDay.exercises.slice(0, 4).map((ex) => (
              <span key={ex.presetId} className="text-xs bg-card-2 px-2 py-1 rounded-lg text-text-secondary">
                {ex.nameVi}
              </span>
            ))}
            {todayDay.exercises.length > 4 && (
              <span className="text-xs bg-card-2 px-2 py-1 rounded-lg text-text-secondary">
                +{todayDay.exercises.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {templates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-secondary font-semibold mb-2">TEMPLATE CỦA TÔI</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {templates.map((t) => (
              <button key={t.id}
                onClick={() => {
                  if (!uid) return;
                  t.exercises.forEach((ex) => {
                    if (!draftIds.has(ex.presetId)) addExercise(ex);
                  });
                  setShowModal(true);
                }}
                className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-main hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                {t.name}
              </button>
            ))}
          </div>
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
              {preset.muscleGroup && (
                <p className="text-xs text-text-secondary mt-1 leading-tight truncate">{preset.muscleGroup}</p>
              )}
            </button>
          );
        })}
      </div>

      {draft.exercises.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-56 lg:left-60 max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 z-40">
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
