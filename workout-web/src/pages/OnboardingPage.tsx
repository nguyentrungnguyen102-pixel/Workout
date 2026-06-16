import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const GOAL_OPTIONS = [
  { label: '90 phút', value: 90, desc: '~3 buổi/tuần' },
  { label: '150 phút', value: 150, desc: '~5 buổi/tuần ⭐' },
  { label: '240 phút', value: 240, desc: '~6 buổi/tuần' },
  { label: '300 phút', value: 300, desc: 'Mỗi ngày 🔥' },
];
const SESSION_OPTIONS = [2, 3, 4, 5];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, updateProfile } = useUserStore();
  const [step, setStep] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(150);
  const [goalSessions, setGoalSessions] = useState(3);
  const [saving, setSaving] = useState(false);

  if (profile?.onboardingDone) { navigate('/'); return null; }

  const handleFinish = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    await updateProfile(firebaseUser.uid, {
      weeklyGoalMinutes: goalMinutes,
      weeklyGoalSessions: goalSessions,
      onboardingDone: true,
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-border'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="text-center">
          <div className="text-6xl mb-6">👋</div>
          <h1 className="text-3xl font-black text-text-main mb-3">Chào mừng!</h1>
          <p className="text-text-secondary leading-relaxed">Cùng setup mục tiêu tập luyện để app có thể theo dõi và nhắc nhở bạn hiệu quả hơn.</p>
          <button onClick={() => setStep(1)} className="mt-10 w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30">Bắt đầu →</button>
        </div>
      )}

      {step === 1 && (
        <div className="w-full">
          <h2 className="text-2xl font-black text-text-main mb-2 text-center">Mục tiêu hàng tuần</h2>
          <p className="text-text-secondary text-sm text-center mb-6">Tổng số phút tập mỗi tuần</p>
          <div className="flex flex-col gap-3">
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGoalMinutes(opt.value)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${goalMinutes === opt.value ? 'border-primary bg-primary-light' : 'border-border bg-card'}`}
              >
                <span className={`font-bold text-base ${goalMinutes === opt.value ? 'text-primary' : 'text-text-main'}`}>{opt.label}</span>
                <span className="text-text-secondary text-sm">{opt.desc}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="mt-6 w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30">Tiếp theo →</button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full">
          <h2 className="text-2xl font-black text-text-main mb-2 text-center">Số buổi mỗi tuần</h2>
          <p className="text-text-secondary text-sm text-center mb-6">Bạn muốn tập mấy buổi?</p>
          <div className="flex gap-3 justify-center">
            {SESSION_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setGoalSessions(n)}
                className={`w-16 h-16 rounded-xl border-2 font-black text-xl transition-all ${goalSessions === n ? 'border-primary bg-primary text-white' : 'border-border bg-card text-text-main'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-text-secondary text-sm text-center mt-3">{goalSessions} ngày/tuần</p>
          <button onClick={handleFinish} disabled={saving} className="mt-8 w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Bắt đầu tập! 🚀'}
          </button>
        </div>
      )}
    </div>
  );
}
