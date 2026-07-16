export const APP_VERSION = '2.6.1';

// Lich su phien ban chinh thuc (sau dot don nhanh 14/07/2026 — gop cac
// nang cap tot nhat tu cac nhanh phien hang ngay vao mot ban duy nhat).
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web (React + Vite) — 9 trang, date utils' },
  { version: '1.1.0', phase: 2, summary: 'GitHub Pages deploy (HashRouter, ErrorBoundary, 404.html), responsive, QuickAdd UX' },
  { version: '1.2.0', phase: 3, summary: 'History redesign + heatmap, Exercise Goals, stats period tabs, smart suggestions, bài core/abs, tổng tuần theo bài' },
  { version: '2.0.0', phase: 4, summary: 'Bản hợp nhất: dọn notification chết + version tracking; fix orderBy/date-range Firestore; 5 bug fix lib (tuần/gợi ý/nhãn tuần); weight (kg) tracking + biểu đồ; tự tạo bài tập custom' },
  { version: '2.0.1', phase: 4, summary: 'Hotfix: bỏ orderBy server-side làm ẩn toàn bộ log (doc thiếu field date bị Firestore loại); Lịch sử không blank khi 1 query lỗi; Cài đặt hiện email + mã người dùng' },
  { version: '2.1.0', phase: 5, summary: 'Bỏ đồng hồ nghỉ giữa hiệp, chip chọn nhanh số lượng/thời gian, 2 bài bụng mới (tay chạm chân, con lăn), gợi ý bài mới cùng nhóm "Thử mới ✨"' },
  { version: '2.2.0', phase: 5, summary: 'Điểm % kế hoạch tuần: tuần này vs tuần trước + breakdown từng bài + gợi ý cải thiện (Home)' },
  { version: '2.3.0', phase: 5, summary: 'Gộp Lịch sử + Thống kê một trang: KPI, lịch tháng (tuần hiện tại 10 dòng), heatmap khung giờ tập theo thứ, còn 3 tab điều hướng' },
  { version: '2.4.0', phase: 5, summary: 'Trang chủ có Buổi gần nhất (tập lại 1 chạm) + gợi ý chương trình phù hợp; mục Cơ thể chuyển vào Cài đặt' },
  { version: '2.4.1', phase: 5, summary: 'Theo góp ý: kế hoạch tuần khớp số với mục tiêu (reps thô, phút hiển thị đúng), bỏ track phút vận động; bỏ ô nhập tạ (kg); khối chương trình chuyển xuống cuối trang chủ' },
  { version: '2.5.0', phase: 6, summary: 'Thông báo "PR mới 🏆" ngay khi lưu buổi tập vượt kỷ lục cá nhân (reps/thời gian) — so khớp toàn bộ lịch sử trước khi ghi log' },
  { version: '2.6.0', phase: 6, summary: 'Chế độ HLV: nhận xét thông minh kèm số liệu, bảng chi tiết bài tập theo kỳ (nhóm theo nhóm cơ, so kỳ trước), xem lùi các tuần/tháng cũ; chi tiết kế hoạch tuần hiện cả tuần trước + số lượng cụ thể' },
  { version: '2.6.1', phase: 6, summary: 'Hotfix: toast "PR mới" bị treo màn hình vĩnh viễn (effect tự huỷ timeout của chính nó khi clearNewPRs đổi state cùng tick); nhận xét HLV + bảng so kỳ trước tính sai khi xem Tháng/3 tháng (so kỳ hiện tại chưa hết ngày với kỳ trước đã hết hẳn, mục tiêu tuần không quy đổi theo độ dài kỳ, câu buổi/phút dùng chung 1 chiều tăng giảm dù 2 số liệu lệch hướng nhau)' },
] as const;
