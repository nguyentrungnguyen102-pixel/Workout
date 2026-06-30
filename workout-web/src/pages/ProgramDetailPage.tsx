import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useProgramStore } from '../stores/programStore';
import { PROGRAM_TEMPLATES, DIFFICULTY_LABELS } from '../constants/programTemplates';

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string }> = {
  beginner:     { text: '#059669', bg: '#ECFDF5' },
  intermediate: { text: '#D97706', bg: '#FEF3C7' },
  advanced:     { text: '#DC2626', bg: '#FEF2F2' },
};

function formatExerciseValue(ex: { sets: number; reps?: number; durationSeconds?: number; unit: string }): string {
  if (ex.unit === 'reps') return `${ex.sets}×${ex.reps ?? '-'} reps`;
  if (ex.unit === 'seconds') return `${ex.sets}×${ex.durationSeconds ?? '-'}s`;
  if (ex.unit === 'minutes') return `${Math.round((ex.durationSeconds || 0) / 60)} phút`;
  return `${ex.sets} hiệp`;
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const { activeState, loading, loadActiveProgram, activate, advanceDay, deactivate } = useProgramStore();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [toast, setToast] = useState('');

  const uid = firebaseUser?.uid;
  const program = PROGRAM_TEMPLATES.find((p) => p.id === id);
  const isActive = activeState?.programId === id;
  const currentDayIndex = activeState?.currentDayIndex || 0;
  // completedDates grows for the program's lifetime, but day markers/progress
  // should reflect position within the current cycle (currentDayIndex wraps modulo days.length).
  const completedInCycle = program ? (activeState?.completedDates?.length || 0) % program.days.length : 0;

  useEffect(() => {
    if (uid) loadActiveProgram(uid);
  }, [uid]);

  if (!program) {
    return (
      <div className="px-4 md:px-8 pt-6 md:pt-8">
        <button onClick={() => navigate('/programs')} className="flex items-center gap-2 text-text-secondary mb-4">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <p className="text-center text-text-secondary py-10">Không tìm thấy chương trình</p>
      </div>
    );
  }

  const dc = DIFFICULTY_COLORS[program.difficulty] || DIFFICULTY_COLORS.beginner;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleActivate = async () => {
    if (!uid) return;
    if (activeState && activeState.programId !== id) {
      if (!confirm('Bạn đang có chương trình đang chạy. Chuyển sang chương trình này?')) return;
    }
    setActivating(true);
    try {
      await activate(uid, id!);
      showToast('Đã bắt đầu chương trình! 🚀');
    } catch {
      showToast('Lỗi kích hoạt');
    } finally {
      setActivating(false);
    }
  };

  const handleAdvanceDay = async () => {
    if (!uid) return;
    setAdvancing(true);
    try {
      await advanceDay(uid);
      showToast('Hoàn thành buổi tập! 🎉');
    } catch {
      showToast('Lỗi');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!uid) return;
    if (!confirm('Dừng chương trình này?')) return;
    try {
      await deactivate(uid);
      showToast('Đã dừng chương trình');
    } catch {
      showToast('Lỗi');
    }
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-28">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-50">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/programs')}
          className="p-2 rounded-xl hover:bg-card-2 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-black text-text-main flex-1 truncate">{program.nameVi}</h1>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{program.emoji}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: dc.text, backgroundColor: dc.bg }}>
                {DIFFICULTY_LABELS[program.difficulty]}
              </span>
              {isActive && (
                <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> Đang chạy
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">{program.descriptionVi}</p>
        <div className="flex gap-4 text-xs text-text-secondary">
          <span>📅 {program.daysPerWeek} ngày/tuần</span>
          <span>⏱ ~{program.estimatedMinutes} phút/buổi</span>
          <span>📋 {program.days.length} buổi</span>
        </div>
      </div>

      {isActive && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-primary mb-1">TIẾN ĐỘ</p>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-text-main">Ngày {currentDayIndex + 1}/{program.days.length}</p>
            <p className="text-xs text-text-secondary">{activeState?.completedDates?.length || 0} buổi đã hoàn thành</p>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.round((completedInCycle / program.days.length) * 100)}%` }} />
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-text-secondary mb-3">CÁC BUỔI TẬP</p>
      <div className="space-y-2 mb-6">
        {program.days.map((day, idx) => {
          const isCurrentDay = isActive && idx === currentDayIndex;
          const isExpanded = expandedDay === day.id;
          const isCompleted = isActive && completedInCycle > idx;

          return (
            <div key={day.id}
              className={`bg-card rounded-2xl border-2 overflow-hidden transition-all ${
                isCurrentDay ? 'border-primary' : 'border-border'
              }`}>
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    isCurrentDay ? 'bg-primary text-white' : isCompleted ? 'bg-success text-white' : 'bg-card-2 text-text-secondary'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{day.emoji}</span>
                      <p className="font-bold text-text-main text-sm">{day.nameVi}</p>
                      {isCurrentDay && <span className="text-xs text-primary font-semibold">· Hôm nay</span>}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{day.focusVi} · {day.exercises.length} bài</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-text-secondary flex-shrink-0" /> : <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border">
                  <div className="divide-y divide-border mt-2">
                    {day.exercises.map((ex) => (
                      <div key={ex.presetId} className="flex items-center justify-between py-2.5">
                        <p className="text-sm text-text-main">{ex.nameVi}</p>
                        <p className="text-sm text-text-secondary">{formatExerciseValue(ex)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-56 lg:left-60 max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 z-40 space-y-2">
        {isActive ? (
          <>
            <button onClick={handleAdvanceDay} disabled={advancing}
              className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-50">
              {advancing ? 'Đang lưu...' : `✅ Hoàn thành buổi ${currentDayIndex + 1} hôm nay`}
            </button>
            <button onClick={handleDeactivate}
              className="w-full py-3 border border-danger-light bg-danger-light text-danger font-bold text-sm rounded-2xl hover:bg-danger hover:text-white transition-colors">
              Dừng chương trình
            </button>
          </>
        ) : (
          <button onClick={handleActivate} disabled={activating || loading}
            className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2">
            <Play size={18} />
            {activating ? 'Đang bắt đầu...' : 'Bắt đầu chương trình'}
          </button>
        )}
      </div>
    </div>
  );
}
