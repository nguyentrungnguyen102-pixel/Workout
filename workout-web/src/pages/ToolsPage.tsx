import { useState } from 'react';
import { Calculator, Dumbbell } from 'lucide-react';

const ONE_RM_ZONES = [
  { pct: 0.95, label: 'Tối đa (1–2 reps)', color: '#DC2626' },
  { pct: 0.90, label: 'Gần tối đa (3–4 reps)', color: '#D97706' },
  { pct: 0.85, label: 'Sức mạnh (5–6 reps)', color: '#F59E0B' },
  { pct: 0.75, label: 'Tăng cơ (8–12 reps)', color: '#2563EB' },
  { pct: 0.65, label: 'Sức bền (12–15 reps)', color: '#059669' },
  { pct: 0.50, label: 'Khởi động (15–20 reps)', color: '#7C3AED' },
];

function epley(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export default function ToolsPage() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const w = parseFloat(weight);
  const r = parseInt(reps);
  const valid = w > 0 && r >= 1 && r < 30;
  const oneRM = valid ? epley(w, r) : null;

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <h1 className="text-2xl font-black text-text-main mb-1">Công cụ</h1>
      <p className="text-sm text-text-secondary mb-5">Tính toán hỗ trợ tập luyện</p>

      {/* 1RM Calculator */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
            <Calculator size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-black text-text-main">Tính 1RM</p>
            <p className="text-xs text-text-secondary">Ước tính sức tối đa 1 lần (công thức Epley)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
              Trọng lượng (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="20"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text-main focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
              Số lần (reps)
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="10"
              min={1}
              max={29}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-card-2 border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text-main focus:border-primary outline-none"
            />
          </div>
        </div>

        {oneRM ? (
          <div>
            <div className="bg-primary rounded-2xl p-4 text-white text-center mb-4">
              <p className="text-xs font-semibold opacity-80 mb-1">Ước tính 1RM của bạn</p>
              <p className="text-5xl font-black">{oneRM}</p>
              <p className="text-sm opacity-80 mt-0.5">kg</p>
            </div>

            <p className="text-xs font-semibold text-text-secondary mb-3">Vùng tập luyện</p>
            <div className="space-y-2.5">
              {ONE_RM_ZONES.map((z) => {
                const zoneKg = Math.round(oneRM * z.pct);
                return (
                  <div key={z.pct} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: z.color }}
                    />
                    <span className="text-xs text-text-secondary flex-1">{z.label}</span>
                    <span className="text-sm font-black text-text-main tabular-nums">
                      {zoneKg} kg
                    </span>
                    <span className="text-xs text-text-muted w-10 text-right tabular-nums">
                      {Math.round(z.pct * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-text-muted mt-4 text-center">
              Công thức Epley: 1RM = Tạ × (1 + Reps ÷ 30)
            </p>
          </div>
        ) : (
          <div className="bg-card-2 rounded-xl p-6 text-center">
            <Dumbbell size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-secondary">
              Nhập trọng lượng và số lần để tính 1RM
            </p>
            <p className="text-xs text-text-muted mt-1">Reps phải từ 1–29</p>
          </div>
        )}
      </div>

      {/* Tip card */}
      <div className="bg-primary-light border border-primary/20 rounded-2xl p-4">
        <p className="text-xs font-bold text-primary mb-1">💡 Cách dùng 1RM</p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Dùng 75–85% 1RM để tăng cơ (8–12 reps). Dùng 85–95% để tăng sức mạnh (3–6 reps).
          Không nên nâng tối đa thường xuyên — hãy dùng 1RM làm tham chiếu để chọn tạ phù hợp.
        </p>
      </div>
    </div>
  );
}
