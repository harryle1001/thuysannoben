# Website Thủy sản Noben

Website của Công ty TNHH Noben, xây dựng bằng Node.js (Express + EJS). Website không cần cơ sở dữ liệu: toàn bộ nội dung nằm trong thư mục `content/`.

## Website có gì

- **Trang chủ:** phần "Ao của bạn đang gặp" để bà con chọn vấn đề ao nuôi và xem ngay sản phẩm phù hợp. Kèm 4 nhóm sản phẩm, sản phẩm nổi bật, bài kỹ thuật, dịch vụ gia công, chứng nhận và form gọi lại.
- **Sản phẩm (`/san-pham`):** 104 sản phẩm lấy từ website cũ.
  - Lọc theo nhóm, theo vấn đề ao nuôi, hoặc tìm theo tên.
  - Tìm kiếm có dấu hay không dấu đều được.
  - Mỗi sản phẩm có trang riêng: công dụng, hướng dẫn sử dụng, nút Gọi / Zalo / Gửi yêu cầu, sản phẩm liên quan.
- **Kỹ thuật nuôi và Tin tức:** 18 bài viết từ website cũ. Mỗi bài tự liệt kê các sản phẩm được nhắc đến trong bài.
- **Các trang khác:** Về Noben, Chứng nhận, Gia công, Liên hệ (có bản đồ), các trang chính sách.
- **Form liên hệ:**
  - Kiểm tra lỗi ngay khi nhập, chống spam.
  - Lưu vào `data/leads.jsonl` và gửi email nếu đã cấu hình SMTP.
  - Xem danh sách khách liên hệ tại `/quan-tri/lien-he`, có đăng nhập.
- **SEO:**
  - Có `sitemap.xml`, `robots.txt`, thẻ canonical, Open Graph và dữ liệu cấu trúc (Organization, Product, Article, Breadcrumb).
  - Toàn bộ link của website cũ được **chuyển hướng 301** sang link mới, nên không mất thứ hạng Google.
- **Tốc độ và bảo mật:**
  - Ảnh đã chuyển sang WebP, font tự host, nén gzip, header bảo mật (Helmet/CSP).
  - Không dùng thư viện JavaScript bên ngoài.

## Chạy trên máy

Yêu cầu Node.js 18.18 trở lên.

```bash
npm install
```

```bash
npm start
```

Mở http://localhost:3000. Muốn chạy kiểm thử tự động tất cả các trang:

```bash
npm run check
```

## Cấu hình

Sao chép `.env.example` thành `.env` rồi điền thông tin. Trên Hostinger, các giá trị này nhập ở mục biến môi trường (Environment variables) của ứng dụng Node.js.

| Biến | Ý nghĩa |
|------|---------|
| `SITE_URL` | Tên miền chính: `https://thuysannoben.vn` |
| `OLD_HOSTS` | Tên miền cũ hoặc phụ sẽ tự chuyển 301 sang tên miền chính. Mặc định: `thuocthuysannoben.com`, `www.thuocthuysannoben.com`, `www.thuysannoben.vn` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Hộp thư dùng để gửi email báo khi có khách điền form |
| `MAIL_TO` | Email nhận thông báo khách liên hệ |
| `ADMIN_USER`, `ADMIN_PASS` | Tài khoản xem danh sách khách tại `/quan-tri/lien-he` |

## Triển khai lên Hostinger

Hostinger chạy ứng dụng Node.js trên gói **Business / Cloud** (mục Node.js Apps) hoặc trên **VPS**. Gói Premium dùng chung không chạy được Node.js.

### Cách 1: Gói Business hoặc Cloud (kết nối thẳng với GitHub)

1. Đẩy code này lên một repo GitHub.
2. Vào hPanel, thêm website mới và chọn loại **Node.js App**.
3. Chọn nhập từ **GitHub**, cấp quyền rồi chọn repo này, nhánh `main`.
4. Thiết lập ứng dụng:
   - Phiên bản Node.js: 20 hoặc 22
   - Lệnh build: `npm install`
   - Lệnh start: `npm start`
   - File khởi động: `server.js`
5. Thêm biến môi trường theo bảng ở trên, sau đó bấm Deploy.
6. Trỏ tên miền `thuysannoben.vn` (và `www.thuysannoben.vn`) về ứng dụng và bật SSL.
7. Nếu công ty còn giữ tên miền cũ `thuocthuysannoben.com`, trỏ nó về cùng ứng dụng: website sẽ tự chuyển 301 sang `thuysannoben.vn`.

### Tên miền .vn

Tên miền `.vn` mua qua nhà đăng ký trong nước được VNNIC công nhận (Mắt Bão, PA Vietnam, Nhân Hòa, iNET…), cần CCCD hoặc giấy phép kinh doanh. Sau khi mua, tại trang quản lý tên miền đổi nameserver sang Hostinger, hoặc tạo bản ghi A trỏ về IP mà Hostinger cung cấp cho ứng dụng.

Mỗi lần push lên GitHub, bạn bấm Deploy lại (hoặc bật tự động deploy nếu hPanel có hỗ trợ).

### Cách 2: VPS Hostinger

Chạy lần lượt các lệnh sau trên VPS:

```bash
git clone https://github.com/<tai-khoan>/<repo>.git noben && cd noben
```

```bash
npm install --omit=dev
```

```bash
cp .env.example .env && nano .env
```

```bash
npm install -g pm2 && pm2 start server.js --name noben && pm2 save && pm2 startup
```

Tiếp theo, cấu hình Nginx chuyển tiếp tên miền vào `http://127.0.0.1:3000`, rồi cấp SSL bằng Certbot.

### Lưu ý về form liên hệ

Trên gói Business/Cloud, file `data/leads.jsonl` có thể bị xóa mỗi lần deploy lại. Vì vậy hãy cấu hình SMTP để mọi lời nhắn đều được gửi về email.

## Sửa nội dung

| File | Nội dung |
|------|----------|
| `content/company.json` | Tên, địa chỉ, số điện thoại, Zalo, tầm nhìn, sứ mệnh, video YouTube |
| `content/products.json` | Sản phẩm: tên, mô tả ngắn, nhóm, vấn đề ao nuôi, công dụng, hướng dẫn sử dụng, ảnh |
| `content/posts.json` | Bài viết |
| `content/categories.json`, `content/symptoms.json` | Nhóm sản phẩm và danh sách vấn đề ao nuôi |
| `content/pages.json` | Các trang chính sách |

Ảnh nằm trong `public/images/`. Sau khi sửa nội dung, khởi động lại ứng dụng (hoặc deploy lại).

## Cấu trúc thư mục

```
server.js            Khởi động Express, bảo mật, nén, file tĩnh
src/routes.js        Toàn bộ đường dẫn, SEO, chuyển hướng từ website cũ
src/content.js       Đọc nội dung JSON, tìm kiếm, gợi ý sản phẩm liên quan
src/leads.js         Xử lý form liên hệ (lưu file + gửi email)
views/               Giao diện EJS (partials/ và pages/)
public/              CSS, JS, font, ảnh
content/             Nội dung website
scripts/smoke-test.js  Kiểm thử nhanh tất cả các trang
.claude/skills/      Skill thiết kế (ui-ux-pro-max, frontend-design) dùng cho Claude Code
```
