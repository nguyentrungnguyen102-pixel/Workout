import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Play, StopCircle, Plus, Pencil } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useProgramStore } from '../stores/programStore';
import { PROGRAM_TEMPLATES, DIFFICULTY_LABELS } from '../constants/programTemplates';
import { findProgramById } from '../lib/customProgram';
import { WorkoutProgram } from '../types/program';

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string }> = {
  beginner:     { text: '#059669', bg: '#ECFDF5' },
  intermediate: { text: '#D97706', bg: '#FEF3C7' },
  advanced:     { text: '#DC2626', bg: '#FEF2F2' },
};

export default function ProgramsPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile } = useUserStore();
  const { activeState, loading, loadActiveProgram, activate, deactivate } = useProgramStore();
  const [activating, setActivating] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const uid = firebaseUser?.uid;
  const customPrograms = profile?.customPrograms ?? [];

  useEffect(() => {
    if (uid) loadActiveProgram(uid);
  }, [uid]);

  // Ref (not state) holds the pending timer so a fast second toast can clear
  // the first toast's timeout before it fires and clears the newer message.
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  };

  const handleActivate = async (programId: string) => {
    if (!uid) return;
    if (activeState && activeState.programId !== programId) {
      if (!confirm('Bạn đang có chương trình đang chạy. Chuyển sang chương trình mới?')) return;
    }
    setActivating(programId);
    try {
      await activate(uid, programId);
      showToast('Đã bắt đầu chương trình! 🚀');
    } catch {
      showToast('Lỗi kích hoạt chương trình');
    } finally {
      setActivating(null);
    }
  };

  const handleDeactivate = async () => {
    if (!uid) return;
    if (!confirm('Dừng chương trình hiện tại?')) return;
    try {
      await deactivate(uid);
      showToast('Đã dừng chương trình');
    } catch {
      showToast('Lỗi');
    }
  };

  const activeProgram = findProgramById(activeState?.programId, PROGRAM_TEMPLATES, customPrograms);
  const todayDay = activeProgram && activeState ? activeProgram.days[activeState.currentDayIndex] ?? null : null;

  const renderProgramCard = (prog: WorkoutProgram) => {
    const isActive = activeState?.programId === prog.id;
    const dc = DIFFICULTY_COLORS[prog.difficulty] || DIFFICULTY_COLORS.beginner;
    return (
      <div key={prog.id}
        className={`bg-card rounded-2xl border-2 p-4 transition-all ${isActive ? 'border-primary' : 'border-border'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{prog.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-text-main text-sm">{prog.nameVi}</p>
                {isActive && <CheckCircle size={14} className="text-primary flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: dc.text, backgroundColor: dc.bg }}>
                  {DIFFICULTY_LABELS[prog.difficulty]}
                </span>
                {isActive && (
                  <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                    Đang chạy
                  </span>
                )}
              </div>
            </div>
          </div>
          {prog.isCustom && (
            <Link to={`/programs/builder/${prog.id}`}
              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors flex-shrink-0"
              aria-label="Sửa chương trình">
              <Pencil size={15} />
            </Link>
          )}
        </div>

        <p className="text-xs text-text-secondary mb-3 leading-relaxed">{prog.descriptionVi || '—'}</p>

        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          <span>📅 {prog.daysPerWeek} ngày/tuần</span>
          <span>⏱ ~{prog.estimatedMinutes} phút</span>
          <span>📋 {prog.days.length} buổi</span>
        </div>

        <div className="flex gap-2">
          <Link to={`/programs/${prog.id}`}
            className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors text-center">
            Xem chi tiết
          </Link>
          {isActive ? (
            <button onClick={handleDeactivate}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-danger-light bg-danger-light rounded-xl text-xs font-bold text-danger hover:bg-danger hover:text-white transition-colors">
              <StopCircle size={13} />
              Dừng lại
            </button>
          ) : (
            <button onClick={() => handleActivate(prog.id)}
              disabled={activating === prog.id}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-primary rounded-xl text-xs font-bold text-white disabled:opacity-50 hover:bg-primary-dark transition-colors">
              <Play size={13} />
              {activating === prog.id ? 'Đang bắt đầu...' : 'Bắt đầu'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-50">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-black text-text-main mb-2">Chương trình</h1>
      <p className="text-sm text-text-secondary mb-5">Chọn chương trình phù hợp với mục tiêu của bạn</p>

      {activeProgram && todayDay && (
        <div className="bg-primary text-white rounded-2xl p-4 mb-5">
          <p className="text-xs font-semibold opacity-80 mb-1">ĐANG CHẠY</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{activeProgram.emoji}</span>
            <div>
              <p className="font-black text-base">{activeProgram.nameVi}</p>
              <p className="text-xs opacity-80">Ngày {(activeState?.currentDayIndex || 0) + 1}/{activeProgram.days.length}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-xs opacity-80 mb-1">HÔM NAY</p>
            <p className="font-bold">{todayDay.emoji} {todayDay.nameVi}</p>
            <p className="text-xs opacity-80 mt-0.5">{todayDay.focusVi}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary">CHƯƠNG TRÌNH CỦA BẠN</p>
            <Link to="/programs/builder"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              <Plus size={14} />
              Tạo chương trình
            </Link>
          </div>
          {customPrograms.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-4 mb-6 text-center">
              <p className="text-sm text-text-secondary">Chưa có chương trình tự tạo. Bấm "Tạo chương trình" để tự soạn buổi tập theo ý bạn.</p>
            </div>
          ) : (
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 mb-6">
              {customPrograms.map(renderProgramCard)}
            </div>
          )}

          <p className="text-xs font-semibold text-text-secondary mb-3">CHƯƠNG TRÌNH CÓ SẴN</p>
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {PROGRAM_TEMPLATES.map(renderProgramCard)}
          </div>
        </>
      )}
    </div>
  );
}
