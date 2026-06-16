import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser, updateProfile } = useUserStore();
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile?.weeklyGoalMinutes || 150));
  const [sheetsId, setSheetsId] = useState(profile?.sheetsId || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const uid = firebaseUser?.uid;
  const streak = profile?.streak?.current || 0;

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

  const handleSignOut = async () => {
    if (!confirm('Đăng xuất?')) return;
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-success text-white text-sm font-semibold py-3 px-4 rounded-xl text-center z-50">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-black text-text-main mb-5">Cài đặt</h1>

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
