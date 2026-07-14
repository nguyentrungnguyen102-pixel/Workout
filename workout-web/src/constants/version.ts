export const APP_VERSION = '2.4.1';

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
] as const;
