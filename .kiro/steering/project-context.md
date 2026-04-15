## Thông tin dự án
- Tên: Office chatbot
- Mục đích: Giao diện website chatbot bao gồm đăng nhập/ đăng ký, tương tác chatbot, quản lý lịch họp, quản lý người dùng, quản lý phòng họp

## Quy tắc ngôn ngữ
- Tất cả text hiển thị trên UI phải bằng tiếng Việt
- Comment trong code bằng tiếng Việt
- Tên biến, hàm bằng tiếng Anh (camelCase)

## Thiết kế & Thương hiệu
- Màu chủ đạo: đỏ (#E53E3E), vàng (#F6AD55)
- Font: system font stack, ưu tiên sans-serif
- Responsive: hỗ trợ từ 375px (mobile) đến 1920px (desktop)
- Phong cách: hiện đại, sạch sẽ, dễ đọc

## Kiến trúc kỹ thuật
- Frontend: Vanilla HTML/CSS/JS, ReactJs
- Charts: Chart.js qua CDN
- Không dùng database, dữ liệu từ API bên ngoài

## API Endpoints
- Tham khảo api trong doc http://127.0.0.1:8000/docs

## Quy tắc code
- Mỗi hàm tối đa 30 dòng, single responsibility
- Xử lý lỗi cho mọi API call (loading state, error state, retry)
- Không hardcode URL – dùng biến cấu hình
- File structure: public/ (frontend assets)
- Xử lý các vấn đề kỹ thuật khi tải dữ liệu (dùng localhost proxy để tránh lỗi trình duyệt chặn CORS)

## Quy tắc KHÔNG được vi phạm
- KHÔNG code backend
- KHÔNG bỏ qua error handling
- KHÔNG dùng inline styles – tách riêng file CSS
