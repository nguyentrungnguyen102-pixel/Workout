export const APP_VERSION = '2.12.0';

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
  { version: '2.6.1', phase: 6, summary: 'Hotfix: toast "PR mới 🏆" bị kẹt màn hình vĩnh viễn (tự tắt lại sau 4s); so sánh kỳ này/kỳ trước ở Tháng và 3 tháng không còn sai khi kỳ hiện tại chưa kết thúc (quy đổi theo số ngày đã qua)' },
  { version: '2.7.0', phase: 6, summary: 'Gợi ý tăng tiến theo mức hiện tại (không cố định); HLV chấm trình độ (nghiệp dư→chuyên nghiệp) + nhận xét cách tập + mẹo cho dân văn phòng; banner quote động lực song ngữ Anh–Việt; bỏ mẫu buổi tập tự lưu' },
  { version: '2.8.0', phase: 6, summary: 'HLV cá nhân gộp 1 khối: Điểm thể lực 0–100 theo chuẩn WHO + mốc calisthenics, đối chuẩn cụ thể (so mốc + khoảng cách tier), tiêu điểm & mẹo xoay theo tuần' },
  { version: '2.9.0', phase: 7, summary: 'Đánh giá thể lực chuẩn hoá: thu thập giới tính/tuổi/chiều cao; chấm theo chuẩn công bố (ExRx/ACSM sức mạnh, WHO vận động, BMI châu Á) hiển thị đầy đủ thang+nguồn+mốc; phút/calo theo MET×cân nặng; quote đổi mỗi lần mở' },
  { version: '2.9.1', phase: 7, summary: 'Sửa lỗi: Đánh giá thể lực nay chạy theo bộ lọc Tuần/Tháng/Quý (Vận động/Đều đặn/Tiến bộ + đường xu hướng tính theo kỳ; Sức mạnh & Vóc dáng là trạng thái hiện tại); Vóc dáng/BMI nay hiện đúng khi đã nhập chiều cao + cân nặng (tự nạp số đo cơ thể ở trang Thống kê)' },
  { version: '2.9.2', phase: 7, summary: 'Sửa thanh trượt đánh giá thể lực khớp đúng bậc; đưa toàn bộ tiêu chí/nguồn tham khảo vào trang Cài đặt (Thống kê chỉ còn link dẫn sang); thêm test tự động (vitest)' },
  { version: '2.9.3', phase: 7, summary: 'Hotfix: bỏ limit() không có orderBy trong các truy vấn logs/bodyMetrics — có thể ẩn ngẫu nhiên buổi tập/cân nặng mới nhất khi lịch sử vượt quá giới hạn; toast lưu (Cài đặt/Chương trình/Tóm tắt buổi tập) không còn bị tắt sớm khi bấm lưu 2 lần liên tiếp' },
  { version: '2.10.0', phase: 8, summary: 'Giao diện: menu desktop thu gọn (mini sidebar), icon bài tập vẽ SVG thay emoji + card chọn bài gọn hơn, heatmap khung giờ co giãn vừa khung, thêm ô tìm kiếm bài tập' },
  { version: '2.11.0', phase: 8, summary: 'Trang Thống kê thêm 4 biểu đồ: gộp bài theo ngày (số lượng trái/số phút phải), cột khối lượng theo tuần (nhóm cơ), radar cân bằng nhóm cơ, lịch nhiệt hoạt động; thêm hướng dẫn cách tập (form cues) cho từng bài' },
  { version: '2.12.0', phase: 8, summary: 'Thành tựu/huy hiệu (chuỗi ngày, tổng buổi/phút, kỷ lục, đều đặn, đa dạng nhóm cơ) trên Thống kê; nhập tạ (kg) cho nhóm Tạ đơn để theo dõi khối lượng & phá kỷ lục tạ' },
] as const;
