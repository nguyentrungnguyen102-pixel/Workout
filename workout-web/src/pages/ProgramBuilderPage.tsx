import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, Search } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { DIFFICULTY_LABELS } from '../constants/programTemplates';
import { getCustomPresets } from '../services/customExerciseService';
import {
  createEmptyCustomProgram,
  createEmptyCustomDay,
  findProgramById,
  upsertCustomProgram,
  validateCustomProgram,
  finalizeCustomProgram,
} from '../lib/customProgram';
import { ProgramDay, ProgramDifficulty, ProgramExercise, WorkoutProgram } from '../types/program';
import { WorkoutPreset } from '../types/workout';

const EMOJI_OPTIONS = ['🏋️', '💪', '🔥', '⚡', '🧘', '🦵', '🏃', '🔰', '🤸', '🎯'];
const DIFFICULTIES: ProgramDifficulty[] = ['beginner', 'intermediate', 'advanced'];

function presetToExercise(preset: WorkoutPreset): ProgramExercise {
  const unit = preset.unit === 'km' ? 'reps' : preset.unit;
  const base: ProgramExercise = {
    presetId: preset.id,
    nameVi: preset.nameVi,
    sets: preset.defaultSets && preset.defaultSets > 0 ? preset.defaultSets : 3,
    unit,
  };
  if (unit === 'reps') base.reps = preset.defaultValue || 12;
  else base.durationSeconds = preset.defaultValue || 30;
  return base;
}

export default function ProgramBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { firebaseUser, profile, updateProfile } = useUserStore();
  const uid = firebaseUser?.uid;
  const customPrograms = useMemo(() => profile?.customPrograms ?? [], [profile]);
  const isEditing = !!id;

  const [program, setProgram] = useState<WorkoutProgram>(() => {
    const existing = id ? findProgramById(id, [], customPrograms) : null;
    return existing ? existing : createEmptyCustomProgram();
  });
  const [pickerForDay, setPickerForDay] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customPresets, setCustomPresets] = useState<WorkoutPreset[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Loads once profile.customPrograms is available (page can be entered
  // directly via URL before ProgramsPage has triggered a profile load).
  useEffect(() => {
    if (!isEditing) return;
    const existing = findProgramById(id, [], customPrograms);
    if (existing) setProgram(existing);
    else if (profile) setNotFound(true); // profile loaded, still not found
  }, [id, isEditing, customPrograms, profile]);

  useEffect(() => {
    if (!uid) return;
    getCustomPresets(uid).then(setCustomPresets).catch(() => {});
  }, [uid]);

  const allPresets = useMemo(
    () => [...SYSTEM_PRESETS, ...customPresets].filter((p) => p.unit !== 'km'),
    [customPresets]
  );

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? allPresets.filter((p) => p.nameVi.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      : allPresets;
    return list.slice(0, 30);
  }, [allPresets, search]);

  const updateDay = (dayId: string, patch: Partial<ProgramDay>) => {
    setProgram((p) => ({ ...p, days: p.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) }));
  };

  const addDay = () => {
    setProgram((p) => ({ ...p, days: [...p.days, createEmptyCustomDay(p.days.length + 1)] }));
  };

  const removeDay = (dayId: string) => {
    setProgram((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  };

  const addExercise = (dayId: string, preset: WorkoutPreset) => {
    const exercise = presetToExercise(preset);
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, exercise] } : d)),
    }));
    setPickerForDay(null);
    setSearch('');
  };

  const updateExercise = (dayId: string, index: number, patch: Partial<ProgramExercise>) => {
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)) }
          : d
      ),
    }));
  };

  const removeExercise = (dayId: string, index: number) => {
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((_, i) => i !== index) } : d)),
    }));
  };

  const handleSave = async () => {
    if (!uid) return;
    const finalProgram = finalizeCustomProgram(program);
    const validationErrors = validateCustomProgram(finalProgram);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    try {
      const next = upsertCustomProgram(customPrograms, finalProgram);
      await updateProfile(uid, { customPrograms: next });
      navigate(`/programs/${finalProgram.id}`);
    } catch {
      setErrors(['Lưu thất bại — kiểm tra kết nối mạng và thử lại.']);
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div className="px-4 md:px-8 pt-6 md:pt-8">
        <button onClick={() => navigate('/programs')} className="flex items-center gap-2 text-text-secondary mb-4">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <p className="text-center text-text-secondary py-10">Không tìm thấy chương trình</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-28">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-card-2 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-black text-text-main flex-1 truncate">
          {isEditing ? 'Sửa chương trình' : 'Chương trình mới'}
        </h1>
      </div>

      {errors.length > 0 && (
        <div className="bg-danger-light border border-danger/20 rounded-2xl p-3 mb-4">
          {errors.map((err) => (
            <p key={err} className="text-xs text-danger font-semibold">• {err}</p>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-secondary mb-1 block">Tên chương trình</label>
          <input value={program.nameVi} onChange={(e) => setProgram((p) => ({ ...p, nameVi: e.target.value }))}
            placeholder="VD: Tạ đơn 3 buổi của tôi"
            className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-main" />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary mb-1 block">Mô tả (không bắt buộc)</label>
          <input value={program.descriptionVi} onChange={(e) => setProgram((p) => ({ ...p, descriptionVi: e.target.value }))}
            placeholder="VD: Toàn thân, tăng dần độ khó"
            className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-main" />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Biểu tượng</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button key={emoji} onClick={() => setProgram((p) => ({ ...p, emoji }))}
                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-lg transition-colors ${
                  program.emoji === emoji ? 'border-primary bg-primary-light' : 'border-border'
                }`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Độ khó</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setProgram((p) => ({ ...p, difficulty: d }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                  program.difficulty === d ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary'
                }`}>
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary mb-1 block">Thời gian ước tính mỗi buổi (phút)</label>
          <input type="number" min={5} max={180} value={program.estimatedMinutes}
            onChange={(e) => setProgram((p) => ({ ...p, estimatedMinutes: Math.max(5, Number(e.target.value) || 0) }))}
            className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-main" />
        </div>
      </div>

      <p className="text-xs font-semibold text-text-secondary mb-3">CÁC BUỔI TẬP</p>
      <div className="space-y-3 mb-4">
        {program.days.map((day, dayIdx) => (
          <div key={day.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-card-2 text-text-secondary text-xs font-black flex items-center justify-center flex-shrink-0">
                {dayIdx + 1}
              </span>
              <input value={day.nameVi} onChange={(e) => updateDay(day.id, { nameVi: e.target.value })}
                placeholder="Tên buổi (VD: Ngực · Vai)"
                className="flex-1 bg-card-2 border border-border rounded-xl px-3 py-2 text-sm font-bold text-text-main" />
              <button onClick={() => removeDay(day.id)} className="p-2 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                aria-label="Xoá buổi tập">
                <Trash2 size={16} />
              </button>
            </div>
            <input value={day.focusVi} onChange={(e) => updateDay(day.id, { focusVi: e.target.value })}
              placeholder="Nhóm cơ tập trung (không bắt buộc)"
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2 text-xs text-text-main mb-3" />

            <div className="divide-y divide-border mb-2">
              {day.exercises.map((ex, exIdx) => (
                <div key={`${ex.presetId}_${exIdx}`} className="flex items-center gap-2 py-2">
                  <p className="text-sm text-text-main flex-1 truncate">{ex.nameVi}</p>
                  <input type="number" min={1} value={ex.sets}
                    onChange={(e) => updateExercise(day.id, exIdx, { sets: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-12 bg-card-2 border border-border rounded-lg px-1.5 py-1 text-xs text-center" />
                  <span className="text-xs text-text-secondary">×</span>
                  {ex.unit === 'reps' ? (
                    <input type="number" min={1} value={ex.reps ?? ''}
                      onChange={(e) => updateExercise(day.id, exIdx, { reps: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-14 bg-card-2 border border-border rounded-lg px-1.5 py-1 text-xs text-center" />
                  ) : (
                    <input type="number" min={1} value={ex.durationSeconds ?? ''}
                      onChange={(e) => updateExercise(day.id, exIdx, { durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-14 bg-card-2 border border-border rounded-lg px-1.5 py-1 text-xs text-center" />
                  )}
                  <span className="text-xs text-text-secondary w-8">{ex.unit === 'reps' ? 'reps' : ex.unit === 'minutes' ? 'phút' : 'giây'}</span>
                  <button onClick={() => removeExercise(day.id, exIdx)} className="p-1 text-text-secondary hover:text-danger transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {pickerForDay === day.id ? (
              <div className="border border-border rounded-xl p-2 mt-2">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Search size={14} className="text-text-secondary flex-shrink-0" />
                  <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm bài tập..."
                    className="flex-1 bg-transparent text-sm text-text-main outline-none" />
                  <button onClick={() => { setPickerForDay(null); setSearch(''); }} className="text-text-secondary flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {filteredPresets.map((preset) => (
                    <button key={preset.id} onClick={() => addExercise(day.id, preset)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-card-2 text-left transition-colors">
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-sm text-text-main flex-1 truncate">{preset.nameVi}</span>
                    </button>
                  ))}
                  {filteredPresets.length === 0 && (
                    <p className="text-xs text-text-secondary text-center py-3">Không tìm thấy bài tập</p>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => { setPickerForDay(day.id); setSearch(''); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-xl text-xs font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                <Plus size={14} /> Thêm bài tập
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addDay}
        className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-border rounded-2xl text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors mb-6">
        <Plus size={16} /> Thêm buổi tập
      </button>

      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-56 lg:left-60 max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 z-40">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-primary text-white font-black text-base rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-50">
          {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Lưu chương trình'}
        </button>
      </div>
    </div>
  );
}
