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

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="font-bold text-text-main text-sm mb-2">Điểm tổng hợp & 4 bậc (Nhập môn → Nghiệp dư → Bán chuyên → Chuyên nghiệp)</p>
        <p className="text-xs text-text-secondary mb-2">
          Điểm 0-100 là <strong>quy ước tổng hợp trong app</strong> — trung bình có trọng số của 5 tiêu chí bên
          dưới (Sức mạnh 35% · Vận động 20% · Đều đặn 20% · Vóc dáng 15% · Tiến bộ 10%), không phải một chứng chỉ
          hay trích dẫn từ một tổ chức cụ thể nào. Từng tiêu chí thành phần vẫn được chấm theo đúng các bảng chuẩn
          ACSM/ExRx, WHO 2020 và BMI châu Á/Bộ Y tế VN liệt kê phía dưới.
        </p>
        <p className="text-xs text-text-secondary">
          Ngưỡng 4 bậc (40 / 60 / 80 điểm) kế thừa từ thang 5 mức cũ của app (20/40/60/80), chỉ gộp 2 bậc thấp
          nhất lại thành "Nhập môn" — các ngưỡng còn lại giữ nguyên, không phải số tự đặt mới.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="font-bold text-text-main text-sm mb-2">Phạm vi tính theo kỳ đang chọn</p>
        <p className="text-xs text-text-secondary mb-2">
          Đổi bộ lọc <strong>Tuần / Tháng / 3 tháng</strong> ở đầu trang Thống kê chỉ ảnh hưởng tới: Vận động,
          Đều đặn, Tiến bộ, biểu đồ "Bài tập theo ngày", biểu đồ "Cân bằng nhóm cơ", bảng "Chi tiết bài tập" và
          KPI buổi/phút/kcal đầu trang.
        </p>
        <p className="text-xs text-text-secondary">
          Không đổi theo bộ lọc kỳ (cố định theo thiết kế): Sức mạnh & Vóc dáng là trạng thái hiện tại; "Kế hoạch
          tuần" luôn theo tuần thực tế; "Khối lượng theo tuần" luôn hiện 10 tuần gần nhất; Kỷ lục cá nhân, Thành
          tựu, chuỗi ngày dài nhất và Lịch sử luôn là toàn thời gian.
        </p>
      </div>

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase">Sức mạnh (theo giới tính · độ tuổi)</p>
      <p className="text-xs text-text-secondary mb-3">
        Chấm theo <strong>trung bình mức tốt nhất mỗi tuần trong 90 ngày gần đây</strong> (không phải kỷ lục cao
        nhất từng đạt) — phản ánh đúng phong độ hiện tại thay vì 1 buổi đỉnh cao từ lâu.
      </p>
      {refs.strength.map((t) => (
        <RefTableBlock key={t.key} table={t} />
      ))}

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase mt-2">Vóc dáng (BMI)</p>
      <RefTableBlock table={refs.bmi} />

      <p className="text-xs font-bold text-text-secondary mb-2 uppercase mt-2">% Mỡ cơ thể (ước tính Navy)</p>
      <RefTableBlock table={refs.bodyFat} />

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
