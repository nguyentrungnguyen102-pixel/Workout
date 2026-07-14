export const APP_VERSION = '2.0.1';

// Lich su phien ban chinh thuc (sau dot don nhanh 14/07/2026 — gop cac
// nang cap tot nhat tu cac nhanh phien hang ngay vao mot ban duy nhat).
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web (React + Vite) — 9 trang, date utils' },
  { version: '1.1.0', phase: 2, summary: 'GitHub Pages deploy (HashRouter, ErrorBoundary, 404.html), responsive, QuickAdd UX' },
  { version: '1.2.0', phase: 3, summary: 'History redesign + heatmap, Exercise Goals, stats period tabs, smart suggestions, bài core/abs, tổng tuần theo bài' },
  { version: '2.0.0', phase: 4, summary: 'Bản hợp nhất: dọn notification chết + version tracking; fix orderBy/date-range Firestore; 5 bug fix lib (tuần/gợi ý/nhãn tuần); weight (kg) tracking + biểu đồ; tự tạo bài tập custom' },
  { version: '2.0.1', phase: 4, summary: 'Hotfix: bỏ orderBy server-side làm ẩn toàn bộ log (doc thiếu field date bị Firestore loại); Lịch sử không blank khi 1 query lỗi; Cài đặt hiện email + mã người dùng' },
] as const;
