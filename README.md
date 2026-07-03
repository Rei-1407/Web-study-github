# Học GitHub cho dự án Unreal Engine

Website học & luyện tập nội bộ giúp thành thạo Git/GitHub trong bối cảnh làm game trên Unreal Engine. Nội dung được xây dựng từ tài liệu chuẩn [`Huong-dan-GitHub-cho-du-an-Unreal-Engine-v3.md`](Huong-dan-GitHub-cho-du-an-Unreal-Engine-v3.md).

## Tính năng

- **17 bài học** (15 mục + 2 phụ lục) với điều hướng trước/sau, callout, bảng, code có tô màu và nút sao chép.
- **Quiz tương tác** sau các mục lý thuyết — phản hồi tức thì kèm giải thích.
- **Thử thách gõ lệnh git** — gõ lệnh thật, hệ thống chấm đúng/sai và gợi ý, giúp xây phản xạ.
- **Bảng tra lệnh** có ô tìm kiếm nhanh (38 lệnh, gộp theo nhóm).
- **Checklist "tốt nghiệp"** tương tác.
- **Động lực học**: thanh tiến độ, điểm XP, cấp độ, huy hiệu, hiệu ứng chúc mừng. Tiến độ lưu trong trình duyệt (localStorage).
- **Giao diện sáng/tối**, tập trung vào nội dung.

## Chạy tại máy

Chỉ cần một static server bất kỳ. Kèm sẵn một server nhỏ không phụ thuộc:

```bash
node tools/serve.mjs 4173
# mở http://localhost:4173
```

## Cập nhật nội dung

Nội dung bài học được sinh tự động từ file Markdown nguồn. Sau khi sửa `Huong-dan-GitHub-cho-du-an-Unreal-Engine-v3.md`:

```bash
cd tools
npm install      # lần đầu
npm run build    # sinh lại assets/js/content-data.js
```

Còn quiz và thử thách gõ lệnh nằm ở `assets/js/quiz-data.js` và `assets/js/challenge-data.js` (chỉnh trực tiếp).

## Cấu trúc

```
index.html                 # khung trang
assets/css/style.css       # giao diện (sáng/tối qua CSS variables)
assets/js/
  content-data.js          # nội dung bài học (TỰ SINH — không sửa tay)
  lessons-meta.js          # nhóm chương + tiêu đề sidebar
  quiz-data.js             # câu hỏi quiz
  challenge-data.js        # thử thách gõ lệnh
  app.js                   # routing, tiến độ, XP, huy hiệu, tương tác
assets/vendor/highlight.min.js
tools/build-content.mjs    # script sinh content-data.js từ Markdown
tools/serve.mjs            # static server để chạy thử
```

## Triển khai

Trang được host bằng **GitHub Pages**, deploy qua **GitHub Actions** (`.github/workflows/deploy.yml`): mỗi lần push lên `main`, workflow tải toàn bộ thư mục gốc lên và publish. Nếu một lần deploy lỗi tạm thời (GitHub thỉnh thoảng báo *"Deployment failed, try again later"*), chỉ cần chạy lại workflow:

```bash
gh workflow run deploy.yml --ref main
```
