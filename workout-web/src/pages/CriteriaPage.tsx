import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { STANDARD_REFERENCES, ReferenceTable } from '../lib/standards';

// Reference page showing every table used by lib/standards.ts to score
// "Đánh giá thể lực" (Stats → CoachInsights). STANDARD_REFERENCES is built
// directly from the same norm consts the scoring functions use, so the
// numbers shown here always match what's actually used to compute a score.

function RefTableBlock({ table }: { table: ReferenceTable }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="font-bold text-text-main text-sm mb-1">{table.title}</p>
      <p className="text-xs text-text-secondary mb-3">Đơn vị: {table.unit}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[420px]">
          <thead>
            <tr>
              <th className="text-left text-text-secondary font-semibold py-1.5 pr-2 border-b border-border whitespace-nowrap">
                Nhóm
              </th>
              {table.tierLabels.map((t) => (
                <th
                  key={t}
                  className="text-center text-text-secondary font-semibold py-1.5 px-2 border-b border-border whitespace-nowrap"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="py-1.5 pr-2 text-text-main font-medium whitespace-nowrap">{row.label}</td>
                {row.thresholds.map((v, i) => (
                  <td key={i} className="text-center py-1.5 px-2 text-text-main">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-text-muted mt-2">Nguồn: {table.source}</p>
      {table.note && <p className="text-[10px] text-text-muted italic mt-0.5">{table.note}</p>}
    </div>
  );
}

export default function CriteriaPage() {
  const navigate = useNavigate();
  const refs = STANDARD_REFERENCES;

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl hover:bg-card-2 transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-black text-text-main">Tiêu chí & Nguồn tham khảo</h1>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Đây là toàn bộ bảng chuẩn dùng để chấm điểm "📊 Đánh giá thể lực" ở trang Thống kê. Số liệu hiển thị bên
        dưới khớp đúng với số liệu app dùng để tính điểm — không phải bản rút gọn.
      </p>

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase">Sức mạnh (theo giới tính · độ tuổi)</p>
      {refs.strength.map((t) => (
        <RefTableBlock key={t.key} table={t} />
      ))}

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase mt-2">Vóc dáng (BMI)</p>
      <RefTableBlock table={refs.bmi} />

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase mt-2">Vận động (WHO)</p>
      <RefTableBlock table={refs.activity} />

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="font-bold text-text-main text-sm mb-2">Phút & calo (MET)</p>
        <p className="text-xs text-text-secondary mb-3">{refs.methodNote}</p>
        <div className="grid grid-cols-2 gap-2">
          {refs.metExamples.map((m) => (
            <div key={m.name} className="bg-card-2 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-text-main">{m.name}</span>
              <span className="text-xs font-bold text-primary">{m.met} MET</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="font-bold text-text-main text-sm mb-2">Đều đặn & Tiến bộ (quy ước trong app)</p>
        <div className="space-y-3">
          {refs.heuristics.map((h) => (
            <div key={h.title}>
              <p className="text-sm font-semibold text-text-main">{h.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">{h.text}</p>
              <p className="text-[10px] text-text-muted italic mt-1">{h.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
