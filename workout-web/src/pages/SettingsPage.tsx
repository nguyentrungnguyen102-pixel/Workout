import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronRight, Plus, X, Target } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';
import { ExerciseGoal } from '../types/user';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { APP_VERSION } from '../constants/version';
import { getBodyMetrics } from '../services/bodyService';
import { BodyMetric } from '../types/body';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser, updateProfile } = useUserStore();
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile?.weeklyGoalMinutes || 150));
  const [sheetsId, setSheetsId] = useState(profile?.sheetsId || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Physical-profile fields (sex/birthYear/heightCm) — used by the
  // fitness-assessment feature (lib/energy.ts + lib/standards.ts) for
  // MET-based calories and sex/age-band norm tables. Optional; lets users
  // who onboarded before these fields existed fill them in later.
  const [sex, setSex] = useState<'male' | 'female' | undefined>(profile?.sex);
  const [birthYear, setBirthYear] = useState(profile?.birthYear ? String(profile.birthYear) : '');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [savingPhysical, setSavingPhysical] = useState(false);

  // Exercise goals state
  const [goals, setGoals] = useState<ExerciseGoal[]>(profile?.exerciseGoals || []);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalSearch, setGoalSearch] = useState('');
  const [newGoalPresetId, setNewGoalPresetId] = useState('');
  const [newGoalValue, setNewGoalValue] = useState('');

  // AuthGuard only gates on auth resolution, not on userStore.loadProfile()'s
  // Firestore fetch — profile is frequently still null on mount and populates
  // moments later. Re-sync the local form state once it arrives so a page
  // load/refresh on this route doesn't show the user's goals as empty.
  const profileSyncedRef = useRef(false);
  useEffect(() => {
    if (profile && !profileSyncedRef.current) {
      profileSyncedRef.current = true;
      setWeeklyGoal(String(profile.weeklyGoalMinutes || 150));
      setSheetsId(profile.sheetsId || '');
      setGoals(profile.exerciseGoals || []);
      setSex(profile.sex);
      setBirthYear(profile.birthYear ? String(profile.birthYear) : '');
      setHeightCm(profile.heightCm ? String(profile.heightCm) : '');
    }
  }, [profile]);

  const uid = firebaseUser?.uid;
  const streak = profile?.streak?.current || 0;

  // Latest weight preview for the "Cơ thể" card — fetch just the 2 most
  // recent body-metric records (not the full history) so this settings page
  // stays light; getBodyMetrics already sorts newest-first.
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  useEffect(() => {
    if (!uid) return;
    getBodyMetrics(uid, 2).then(setBodyMetrics).catch(() => setBodyMetrics([]));
  }, [uid]);

  const latestWeight = bodyMetrics[0]?.weight;
  const weightDelta = useMemo(() => {
    const latest = bodyMetrics[0]?.weight;
    const prev = bodyMetrics[1]?.weight;
    if (latest === undefined || prev === undefined) return null;
    return Math.round((latest - prev) * 10) / 10;
  }, [bodyMetrics]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleSaveGoal = async () => {
    if (!uid) return;
    const mins = parseInt(weeklyGoal, 10);
    if (isNaN(mins) || mins < 10) { showToast('Nhập số phút hợp lệ (tối thiểu 10)'); return; }
    setSaving(true);
    try {
      await updateProfile(uid, { weeklyGoalMinutes: mins });
      showToast('Đã lưu mục tiêu! ✅');
    } catch {
      showToast('Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhysical = async () => {
    if (!uid) return;
    setSavingPhysical(true);
    try {
      const update: Record<string, any> = {};
      if (sex) update.sex = sex;
      const by = parseInt(birthYear, 10);
      if (!isNaN(by) && by > 1900) update.birthYear = by;
      const h = parseFloat(heightCm);
      if (!isNaN(h) && h > 0) update.heightCm = h;
      await updateProfile(uid, update);
      showToast('Đã lưu hồ sơ thể chất! ✅');
    } catch {
      showToast('Lỗi lưu');
    } finally {
      setSavingPhysical(false);
    }
  };

  const handleSaveSheets = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await updateProfile(uid, { sheetsId: sheetsId.trim() });
      showToast('Đã lưu Google Sheets ID! ✅');
    } catch {
      showToast('Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const saveGoals = async (newGoals: ExerciseGoal[]) => {
    if (!uid) return;
    setGoals(newGoals);
    try {
      await updateProfile(uid, { exerciseGoals: newGoals });
    } catch {
      showToast('Lỗi lưu mục tiêu');
    }
  };

  const handleToggleGoal = (presetId: string) => {
    saveGoals(goals.map(g => g.presetId === presetId ? { ...g, enabled: !g.enabled } : g));
  };

  const handleRemoveGoal = (presetId: string) => {
    saveGoals(goals.filter(g => g.presetId !== presetId));
  };

  const handleAddGoal = () => {
    const preset = SYSTEM_PRESETS.find(p => p.id === newGoalPresetId);
    if (!preset) return;
    const val = parseInt(newGoalValue) || preset.defaultValue;
    const newGoal: ExerciseGoal = {
      presetId: preset.id,
      name: preset.nameVi,
      targetSets: 1,
      enabled: true,
      ...(preset.unit === 'reps' ? { targetReps: val } : { targetDurationSeconds: preset.unit === 'minutes' ? val * 60 : val }),
    };
    const updated = goals.find(g => g.presetId === preset.id)
      ? goals.map(g => g.presetId === preset.id ? newGoal : g)
      : [...goals, newGoal];
    saveGoals(updated);
    setShowAddGoal(false);
    setNewGoalPresetId('');
    setGoalSearch('');
    setNewGoalValue('');
    showToast('Đã thêm mục tiêu! 🎯');
  };

  const handleSignOut = async () => {
    if (!confirm('Đăng xuất?')) return;
    await signOut(auth);
    navigate('/login');
  };

  const filteredPresets = goalSearch.trim()
    ? SYSTEM_PRESETS.filter(p =>
        p.nameVi.toLowerCase().includes(goalSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(goalSearch.toLowerCase())
      )
    : SYSTEM_PRESETS.slice(0, 8);

  const selectedPreset = SYSTEM_PRESETS.find(p => p.id === newGoalPresetId);

  const formatGoalTarget = (g: ExerciseGoal) => {
    if (g.targetReps) return `${g.targetReps} cái`;
    if (g.targetDurationSeconds) {
      const s = g.targetDurationSeconds;
      return s >= 60 ? `${Math.round(s / 60)} phút` : `${s}s`;
    }
    return `${g.targetSets} hiệp`;
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-50">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-black text-text-main mb-5">Cài đặt</h1>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-2xl flex-shrink-0">
          👤
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-main truncate">{profile?.displayName || 'User'}</p>
          <p className="text-xs text-text-secondary truncate">{profile?.email}</p>
          {streak > 0 && (
            <p className="text-xs text-primary font-semibold mt-0.5">🔥 {streak} ngày liên tiếp</p>
          )}
        </div>
      </div>

      {/* Weekly goal */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-xs font-semibold text-text-secondary mb-3">MỤC TIÊU HÀNG TUẦN</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            className="flex-1 bg-card-2 border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors"
            placeholder="150"
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
          />
          <span className="text-sm text-text-secondary flex-shrink-0">phút/tuần</span>
          <button onClick={handleSaveGoal} disabled={saving}
            className="px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50 flex-shrink-0">
            Lưu
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Hiện tại: {profile?.weeklyGoalMinutes || 150} phút · ~{Math.round((profile?.weeklyGoalMinutes || 150) / 30)} phút/buổi
        </p>
      </div>

      {/* Exercise goals */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <p className="text-xs font-semibold text-text-secondary">MỤC TIÊU BÀI TẬP</p>
          </div>
          <button onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary-light px-2 py-1 rounded-lg transition-colors">
            <Plus size={12} /> Thêm
          </button>
        </div>

        {goals.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">
            Chưa có mục tiêu. Nhấn "Thêm" để đặt mục tiêu từng bài tập.
          </p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.presetId}
                className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleGoal(g.presetId)}
                    className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${g.enabled ? 'bg-primary' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${g.enabled ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${g.enabled ? 'text-text-main' : 'text-text-secondary'}`}>
                      {g.name}
                    </p>
                    <p className="text-xs text-text-secondary">{formatGoalTarget(g)}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveGoal(g.presetId)}
                  className="p-1.5 rounded-full hover:bg-danger-light hover:text-danger text-text-muted transition-colors ml-2 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add goal form */}
        {showAddGoal && (
          <div className="mt-4 pt-4 border-t border-border">
            <input
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-main focus:border-primary outline-none transition-colors mb-2"
              placeholder="Tìm bài tập..."
              value={goalSearch}
              onChange={(e) => { setGoalSearch(e.target.value); setNewGoalPresetId(''); }}
            />
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-32 overflow-y-auto">
              {filteredPresets.map(p => (
                <button key={p.id} onClick={() => { setNewGoalPresetId(p.id); setNewGoalValue(String(p.defaultValue)); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    newGoalPresetId === p.id ? 'bg-primary text-white border-primary' : 'bg-card-2 text-text-secondary border-border'
                  }`}>
                  {p.icon} {p.nameVi}
                </button>
              ))}
            </div>

            {selectedPreset && (
              <div className="mb-3">
                <label className="text-xs text-text-secondary mb-1 block">
                  {selectedPreset.unit === 'reps' ? 'Số lượng (cái)' : selectedPreset.unit === 'minutes' ? 'Thời gian (phút)' : 'Thời gian (giây)'}
                </label>
                <input type="number" min={1} value={newGoalValue}
                  onChange={e => setNewGoalValue(e.target.value)}
                  className="w-full bg-card-2 border border-border rounded-xl px-3 py-2 text-sm text-text-main focus:border-primary outline-none" />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleAddGoal} disabled={!newGoalPresetId}
                className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-40">
                Thêm mục tiêu
              </button>
              <button onClick={() => { setShowAddGoal(false); setNewGoalPresetId(''); setGoalSearch(''); }}
                className="px-4 py-2.5 border border-border text-sm text-text-secondary rounded-xl">
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-xs font-semibold text-text-secondary mb-1">GOOGLE SHEETS ID</p>
        <p className="text-xs text-text-secondary mb-3">Tự động đồng bộ buổi tập lên Google Sheets</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-card-2 border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            value={sheetsId}
            onChange={(e) => setSheetsId(e.target.value)}
          />
          <button onClick={handleSaveSheets} disabled={saving}
            className="px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50 flex-shrink-0">
            Lưu
          </button>
        </div>
      </div>

      <Link to="/programs"
        className="flex items-center justify-between bg-card rounded-2xl border border-border p-4 mb-4 hover:border-primary/40 transition-colors">
        <div>
          <p className="font-semibold text-text-main text-sm">Chương trình tập</p>
          <p className="text-xs text-text-secondary mt-0.5">Quản lý chương trình luyện tập</p>
        </div>
        <ChevronRight size={18} className="text-text-secondary" />
      </Link>

      {/* Physical profile — sex/birthYear/heightCm, used by fitness-assessment
          calorie & standards scoring (lib/energy.ts / lib/standards.ts) */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-xs font-semibold text-text-secondary mb-3">HỒ SƠ THỂ CHẤT</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Giới tính</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map(s => (
                <button key={s} onClick={() => setSex(s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${sex === s ? 'border-primary bg-primary-light text-primary' : 'border-border bg-card-2 text-text-main'}`}>
                  {s === 'male' ? 'Nam' : 'Nữ'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Năm sinh</label>
              <input type="number" placeholder="VD: 1990" value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-text-main text-sm focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Chiều cao (cm)</label>
              <input type="number" placeholder="VD: 170" value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-text-main text-sm focus:border-primary outline-none transition-colors" />
            </div>
          </div>
          <button onClick={handleSavePhysical} disabled={savingPhysical}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50">
            {savingPhysical ? 'Đang lưu...' : 'Lưu hồ sơ thể chất'}
          </button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/settings/body')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/settings/body'); } }}
        className="flex items-center justify-between bg-card rounded-2xl border border-border p-4 mb-4 hover:border-primary/40 transition-colors cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-lg flex-shrink-0">📏</div>
          <div className="min-w-0">
            <p className="font-semibold text-text-main text-sm">Cơ thể</p>
            {latestWeight !== undefined ? (
              <p className="text-xs text-text-secondary mt-0.5">
                {latestWeight} kg
                {weightDelta !== null && weightDelta !== 0 && (
                  <span className={`ml-1.5 font-semibold ${weightDelta > 0 ? 'text-danger' : 'text-success'}`}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-text-secondary flex-shrink-0" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-xs font-semibold text-text-secondary mb-2">THÔNG TIN</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Múi giờ</span>
            <span className="text-text-main font-medium">{profile?.timezone || 'Asia/Ho_Chi_Minh'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tham gia</span>
            <span className="text-text-main font-medium">
              {profile?.createdAt ? new Date((profile.createdAt as any).seconds * 1000).toLocaleDateString('vi-VN') : '--'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Phiên bản</span>
            <span className="text-text-main font-medium">v{APP_VERSION}</span>
          </div>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-text-secondary flex-shrink-0">Tài khoản</span>
            <span className="text-text-main font-medium break-all text-right">{firebaseUser?.email || '(không có email)'}</span>
          </div>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-text-secondary flex-shrink-0">Mã người dùng</span>
            <span className="text-text-main font-mono text-xs break-all text-right">{firebaseUser?.uid || '--'}</span>
          </div>
        </div>
      </div>

      <button onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 border border-danger-light text-danger bg-danger-light rounded-2xl font-bold text-sm hover:bg-danger hover:text-white transition-colors">
        <LogOut size={16} />
        Đăng xuất
      </button>
    </div>
  );
}
