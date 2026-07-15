# Workout — WorkoutTracker 💪

App ghi buổi tập cá nhân, chạy trên trình duyệt (mobile-first).

**Dùng app:** https://nguyentrungnguyen102-pixel.github.io/Workout/#/

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `workout-web/` | **Bản chính thức** — React 19 + Vite + TypeScript + Tailwind, dữ liệu Firebase Auth/Firestore (project `workout-tracker-84dde`) |
| `workout-tracker/` | Bản mobile (React Native/Expo) — **đã ngừng phát triển**, giữ làm tư liệu |

## Deploy

Tự động: push lên `main` (có thay đổi trong `workout-web/`) → GitHub Actions build → publish nhánh `gh-pages` → GitHub Pages. Không deploy tay.

Nhánh giữ lại: `main` (code) + `gh-pages` (bản build). Các nhánh khác là tạm thời — gộp xong thì xóa.

## Chạy local

```bash
cd workout-web
npm install
npm run dev
```

Firebase config có sẵn fallback trong `src/services/firebase.ts` (API key web của Firebase là public theo thiết kế; phân quyền thật nằm ở Firestore Rules).

## Phiên bản

Xem `workout-web/src/constants/version.ts` (hiển thị trong app tại Cài đặt → Phiên bản). Mỗi đợt nâng cấp bump version + thêm dòng `PHASE_HISTORY`.

## Lưu ý bảo trì

- **Không thêm `orderBy`/`where('date'...)` server-side** vào các query trong `workout-web/src/services/workoutService.ts` — `orderBy` của Firestore loại bỏ mọi document thiếu field đó và dạng range cần composite index chưa chắc tồn tại; đã từng gây sự cố "mất sạch dữ liệu" (xem ghi chú trong file). Chỉ đổi sau khi deploy `firestore.indexes.json` và xác minh mọi log cũ có field `date`.
- Ngày lưu dạng chuỗi `YYYY-MM-DD` theo giờ địa phương (không dùng `toISOString`).
- Quy ước đếm mục tiêu: reps thô (không nhân số hiệp), tuần = mục tiêu ngày × số buổi/tuần — phải khớp giữa GoalsStrip và Kế hoạch tuần.
