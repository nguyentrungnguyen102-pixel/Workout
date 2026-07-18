import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useBodyStore } from '../stores/bodyStore';

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
  const { addMetric } = useBodyStore();
  const [step, setStep] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(150);
  const [goalSessions, setGoalSessions] = useState(3);
  const [saving, setSaving] = useState(false);

  // Demographics — all optional/skippable, collected in step 3. Used later
  // by the fitness-assessment feature (lib/energy.ts + lib/standards.ts) to
  // personalize calorie estimates and pick the right sex/age-band norm
  // table; nothing here blocks finishing onboarding.
  const [sex, setSex] = useState<'male' | 'female' | undefined>(undefined);
  const [birthYear, setBirthYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  if (profile?.onboardingDone) { navigate('/'); return null; }

  const finishOnboarding = async (includeDemographics: boolean) => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const profileUpdate: Record<string, any> = {
        weeklyGoalMinutes: goalMinutes,
        weeklyGoalSessions: goalSessions,
        onboardingDone: true,
      };
      if (includeDemographics) {
        if (sex) profileUpdate.sex = sex;
        const by = parseInt(birthYear, 10);
        if (!isNaN(by) && by > 1900) profileUpdate.birthYear = by;
        const h = parseFloat(heightCm);
        if (!isNaN(h) && h > 0) profileUpdate.heightCm = h;
      }
      await updateProfile(firebaseUser.uid, profileUpdate);

      if (includeDemographics) {
        const w = parseFloat(weightKg);
        if (!isNaN(w) && w > 0) {
          await addMetric(firebaseUser.uid, { weight: w });
        }
      }
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2, 3].map(i => (
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
          <button onClick={() => setStep(3)} className="mt-8 w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30">
            Tiếp theo →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full">
          <h2 className="text-2xl font-black text-text-main mb-2 text-center">Hồ sơ thể chất</h2>
          <p className="text-text-secondary text-sm text-center mb-6">Giúp app tính calo và đánh giá thể lực chính xác hơn (có thể bỏ qua)</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Giới tính</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${sex === s ? 'border-primary bg-primary-light text-primary' : 'border-border bg-card text-text-main'}`}>
                    {s === 'male' ? 'Nam' : 'Nữ'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Năm sinh</label>
              <input type="number" placeholder="VD: 1990" value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors" />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Chiều cao (cm)</label>
              <input type="number" placeholder="VD: 170" value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors" />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Cân nặng (kg)</label>
              <input type="number" placeholder="VD: 65" value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors" />
            </div>
          </div>

          <button onClick={() => finishOnboarding(true)} disabled={saving}
            className="mt-6 w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Bắt đầu tập! 🚀'}
          </button>
          <button onClick={() => finishOnboarding(false)} disabled={saving}
            className="mt-3 w-full text-text-secondary font-semibold text-sm py-2 disabled:opacity-50">
            Bỏ qua
          </button>
        </div>
      )}
    </div>
  );
}
