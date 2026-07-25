import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useBodyStore } from '../stores/bodyStore';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BodyMetric } from '../types/body';
import { estimateBodyFatNavy } from '../lib/bodyFat';
import { bodyFatStandard, scaleMarkerPercent } from '../lib/standards';

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface AddMetricFormProps {
  onSave: (data: Omit<BodyMetric, 'id' | 'userId' | 'date' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

function AddMetricForm({ onSave, onClose }: AddMetricFormProps) {
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [hip, setHip] = useState('');
  const [arm, setArm] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const data: Omit<BodyMetric, 'id' | 'userId' | 'date' | 'createdAt'> = {};
    if (weight) data.weight = parseFloat(weight);
    if (chest) data.chestCm = parseFloat(chest);
    if (hip) data.hipCm = parseFloat(hip);
    if (arm) data.armCm = parseFloat(arm);
    if (waist) data.waistCm = parseFloat(waist);
    if (neck) data.neckCm = parseFloat(neck);
    if (!weight && !chest && !hip && !arm && !waist && !neck) {
      setError('Nhập ít nhất một chỉ số');
      return;
    }
    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch {
      setError('Lỗi lưu chỉ số');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-3xl p-5 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-text-main">Thêm chỉ số cơ thể</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-card-2 transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Cân nặng (kg)', value: weight, set: setWeight, placeholder: 'VD: 65.5' },
            { label: 'Ngực (cm)', value: chest, set: setChest, placeholder: 'VD: 90' },
            { label: 'Hông (cm)', value: hip, set: setHip, placeholder: 'VD: 95' },
            { label: 'Tay (cm)', value: arm, set: setArm, placeholder: 'VD: 30' },
            { label: 'Eo (cm)', value: waist, set: setWaist, placeholder: 'VD: 80' },
            { label: 'Cổ (cm)', value: neck, set: setNeck, placeholder: 'VD: 37' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-text-secondary mb-1 block">{label}</label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary outline-none transition-colors"
                placeholder={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-danger text-sm mt-2">{error}</p>}

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-5 py-4 bg-primary text-white font-black rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/30">
          {saving ? 'Đang lưu...' : 'Lưu chỉ số'}
        </button>
      </div>
    </div>
  );
}

export default function BodyPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile } = useUserStore();
  const { metrics, latestMetric, loading, loadMetrics, addMetric } = useBodyStore();
  const [showForm, setShowForm] = useState(false);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (uid) loadMetrics(uid);
  }, [uid]);

  const weightData = metrics
    .filter((m) => m.weight !== undefined)
    .slice(0, 14)
    .reverse()
    .map((m) => ({ date: formatDateShort(m.date), weight: m.weight }));

  const prevMetric = metrics.length > 1 ? metrics[1] : null;
  const weightDelta = latestMetric?.weight && prevMetric?.weight
    ? (latestMetric.weight - prevMetric.weight).toFixed(1)
    : null;

  const handleAddMetric = async (data: Omit<BodyMetric, 'id' | 'userId' | 'date' | 'createdAt'>) => {
    if (!uid) throw new Error('Not logged in');
    await addMetric(uid, data);
  };

  const bodyFatPercent =
    profile?.sex && profile?.heightCm && latestMetric?.waistCm && latestMetric?.neckCm
      ? estimateBodyFatNavy({
          sex: profile.sex,
          heightCm: profile.heightCm,
          waistCm: latestMetric.waistCm,
          neckCm: latestMetric.neckCm,
          hipCm: latestMetric.hipCm,
        })
      : null;
  const bodyFatResult = bodyFatPercent !== null && profile?.sex ? bodyFatStandard(bodyFatPercent, profile.sex) : null;
  const missingProfileForBodyFat = !profile?.sex || !profile?.heightCm;

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')}
            className="p-2 rounded-xl hover:bg-card-2 transition-colors">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-2xl font-black text-text-main">Cơ thể</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl">
          <Plus size={16} />
          Thêm
        </button>
      </div>

      {showForm && (
        <AddMetricForm onSave={handleAddMetric} onClose={() => setShowForm(false)} />
      )}

      {latestMetric ? (
        <div className="bg-card rounded-2xl border border-border p-4 mb-5">
          <p className="text-xs font-semibold text-text-secondary mb-3">CHỈ SỐ MỚI NHẤT</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {latestMetric.weight !== undefined && (
              <div className="bg-primary-light rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Cân nặng</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-primary">{latestMetric.weight}</p>
                  <p className="text-sm text-primary mb-0.5">kg</p>
                </div>
                {weightDelta !== null && (
                  <p className={`text-xs font-semibold mt-0.5 ${parseFloat(weightDelta) > 0 ? 'text-danger' : 'text-success'}`}>
                    {parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} kg
                  </p>
                )}
              </div>
            )}
            {latestMetric.chestCm !== undefined && (
              <div className="bg-card-2 rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Ngực</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-text-main">{latestMetric.chestCm}</p>
                  <p className="text-sm text-text-secondary mb-0.5">cm</p>
                </div>
              </div>
            )}
            {latestMetric.hipCm !== undefined && (
              <div className="bg-card-2 rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Hông</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-text-main">{latestMetric.hipCm}</p>
                  <p className="text-sm text-text-secondary mb-0.5">cm</p>
                </div>
              </div>
            )}
            {latestMetric.armCm !== undefined && (
              <div className="bg-card-2 rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Tay</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-text-main">{latestMetric.armCm}</p>
                  <p className="text-sm text-text-secondary mb-0.5">cm</p>
                </div>
              </div>
            )}
            {latestMetric.waistCm !== undefined && (
              <div className="bg-card-2 rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Eo</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-text-main">{latestMetric.waistCm}</p>
                  <p className="text-sm text-text-secondary mb-0.5">cm</p>
                </div>
              </div>
            )}
            {latestMetric.neckCm !== undefined && (
              <div className="bg-card-2 rounded-xl p-3">
                <p className="text-xs text-text-secondary mb-1">Cổ</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-text-main">{latestMetric.neckCm}</p>
                  <p className="text-sm text-text-secondary mb-0.5">cm</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : !loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 mb-5 text-center">
          <p className="text-3xl mb-2">📏</p>
          <p className="text-text-secondary text-sm">Chưa có chỉ số nào</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-primary text-sm font-semibold">
            Thêm chỉ số đầu tiên →
          </button>
        </div>
      ) : null}

      {latestMetric?.waistCm !== undefined && latestMetric?.neckCm !== undefined && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-5">
          <p className="text-sm font-bold text-text-main mb-1">Ước tính % mỡ cơ thể (Navy)</p>
          {bodyFatResult ? (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <p className="text-2xl font-black text-primary">{bodyFatResult.value}%</p>
                <span className="text-[11px] font-bold text-primary bg-primary-light border border-primary/20 rounded-full px-2 py-0.5">
                  {bodyFatResult.bands[bodyFatResult.tierIndex].label}
                </span>
              </div>
              <div className="pt-1">
                <div className="relative h-2 rounded-full bg-border overflow-hidden flex">
                  {bodyFatResult.bands.map((_, i) => (
                    <div key={i} className="h-full flex-1 bg-primary/20" style={{ opacity: 0.25 + (i / Math.max(1, bodyFatResult.bands.length - 1)) * 0.55 }} />
                  ))}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-card shadow"
                    style={{ left: `${Math.min(96, Math.max(4, scaleMarkerPercent(bodyFatResult.bands, bodyFatResult.value)))}%` }}
                  />
                </div>
                <div className="flex mt-0.5">
                  {bodyFatResult.bands.map((b, i) => (
                    <span key={i} className="text-[9px] text-text-secondary leading-none text-center" style={{ width: `${100 / bodyFatResult.bands.length}%` }}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-2">{bodyFatResult.source}</p>
            </>
          ) : missingProfileForBodyFat ? (
            <Link to="/settings" className="block text-xs font-bold text-primary bg-primary-light border border-primary/20 rounded-2xl px-3 py-2">
              Nhập giới tính + chiều cao ở Cài đặt để tính % mỡ cơ thể →
            </Link>
          ) : (
            <p className="text-xs text-text-secondary">Nhập thêm vòng hông (Nữ cần cả 3 số đo) để tính được.</p>
          )}
        </div>
      )}

      {weightData.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-5">
          <p className="text-sm font-bold text-text-main mb-3">Cân nặng (14 lần gần nhất)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#8A8A8A' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                formatter={(v: number) => [`${v} kg`, 'Cân nặng']}
              />
              <Line type="monotone" dataKey="weight" stroke="#FF5400" strokeWidth={2.5} dot={{ r: 3, fill: '#FF5400' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : metrics.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-text-main">Lịch sử chỉ số</p>
          </div>
          <div className="divide-y divide-border">
            {metrics.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <p className="text-xs text-text-secondary mb-1.5">{formatDateVi(m.date)}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {m.weight !== undefined && (
                    <span className="text-sm text-text-main"><span className="font-bold">{m.weight}</span> kg</span>
                  )}
                  {m.chestCm !== undefined && (
                    <span className="text-sm text-text-main">Ngực <span className="font-bold">{m.chestCm}</span> cm</span>
                  )}
                  {m.hipCm !== undefined && (
                    <span className="text-sm text-text-main">Hông <span className="font-bold">{m.hipCm}</span> cm</span>
                  )}
                  {m.armCm !== undefined && (
                    <span className="text-sm text-text-main">Tay <span className="font-bold">{m.armCm}</span> cm</span>
                  )}
                  {m.waistCm !== undefined && (
                    <span className="text-sm text-text-main">Eo <span className="font-bold">{m.waistCm}</span> cm</span>
                  )}
                  {m.neckCm !== undefined && (
                    <span className="text-sm text-text-main">Cổ <span className="font-bold">{m.neckCm}</span> cm</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
