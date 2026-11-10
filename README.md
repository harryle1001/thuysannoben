# Website Thủy sản Noben

Website của Công ty TNHH Noben, xây dựng bằng Node.js (Express + EJS). Website không cần cơ sở dữ liệu: toàn bộ nội dung nằm trong thư mục `content/`.

## Website có gì

- **Trang chủ:** phần "Ao của bạn đang gặp" để bà con chọn vấn đề ao nuôi và xem ngay sản phẩm phù hợp. Kèm 4 nhóm sản phẩm, sản phẩm nổi bật, bài kỹ thuật, dịch vụ gia công, chứng nhận và form gọi lại.
- **Sản phẩm (`/san-pham`):** 104 sản phẩm lấy từ website cũ.
  - Lọc theo nhóm, theo vấn đề ao nuôi, hoặc tìm theo tên.
  - Tìm kiếm có dấu hay không dấu đều được.
  - Mỗi sản phẩm có trang riêng: công dụng, hướng dẫn sử dụng, nút Gọi / Zalo / Gửi yêu cầu, sản phẩm liên quan.
- **Kiến thức nuôi tôm:** 28 bài (17 bài mới chuẩn SEO và 11 bài từ website cũ), chia 4 chuyên mục, có mục lục, hỏi đáp và sản phẩm liên quan.
- **Giải pháp theo vấn đề ao nuôi:** 8 trang như "Thuốc trị phân trắng, gan tụy cho tôm", mỗi trang có dấu hiệu, các bước xử lý và sản phẩm phù hợp.
- **Các trang khác:** Về Noben, Chứng nhận, Gia công, Liên hệ (có bản đồ), các trang chính sách.
- **Sửa nội dung bằng cây bút:** quản trị viên đăng nhập rồi sửa chữ ngay trên trang (xem phần bên dưới).
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
| `ADMIN_USER`, `ADMIN_PASS` | Tài khoản quản trị: sửa nội dung bằng cây bút và xem khách liên hệ tại `/quan-tri/lien-he` |
| `SESSION_SECRET` | (Không bắt buộc) chuỗi bí mật để ký phiên đăng nhập |
| `ANTHROPIC_API_KEY` | Khóa Claude API cho Trợ lý Noben (chatbot). Để trống thì trợ lý trả lời bằng cách tìm trong nội dung website |
| `CHAT_DAILY_LIMIT` | (Không bắt buộc) số câu trả lời AI tối đa mỗi ngày, mặc định 800. Vượt mức thì trợ lý chuyển sang chế độ tìm kiếm |

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

## Viết thêm bài kiến thức (chuẩn SEO)

Bài viết nằm trong `content/kien-thuc/`, mỗi bài là một file Markdown. Phần đầu file khai báo thông tin SEO:

```
---
title: Tiêu đề hiển thị trên trang
seo_title: Tiêu đề cho Google, dưới 60 ký tự
description: Mô tả 120 đến 160 ký tự, có từ khóa bà con hay tìm
category: benh-tom | moi-truong | ky-thuat | dinh-duong
keywords: từ khóa 1, từ khóa 2
symptoms: gan-ruot, mem-vo        (gắn bài với trang giải pháp)
products: prazi-s, caphote         (sản phẩm hiện bên cạnh bài)
photo: /images/posts/....webp      (ảnh nền cho ảnh bìa)
date: 2026-11-09
---
```

- Dùng `## ` cho các mục lớn: website tự tạo mục lục.
- Mục `## Câu hỏi thường gặp` với các câu hỏi `### ...` sẽ thành phần hỏi đáp mở/đóng và dữ liệu FAQ cho Google.
- Sau khi thêm bài, tạo ảnh bìa bằng lệnh dưới, rồi khởi động lại ứng dụng.

```bash
pip install pillow fonttools brotli
```

```bash
python3 scripts/make-covers.py
```

Kiểm tra SEO toàn bộ trang khi website đang chạy:

```bash
node scripts/seo-audit.js http://localhost:3000
```

## SEO đã có sẵn

- Trang **Giải pháp** cho 8 vấn đề ao nuôi (`/giai-phap/...`) và trang **Kiến thức nuôi tôm** theo chuyên mục (`/ky-thuat-nuoi/...`).
- Dữ liệu cấu trúc: doanh nghiệp (Organization, LocalBusiness), ô tìm kiếm Google (WebSite SearchAction), bài viết (BlogPosting), hỏi đáp (FAQPage), sản phẩm (Product), danh sách (ItemList), breadcrumb.
- `sitemap.xml` có ảnh và ngày cập nhật, `rss.xml`, ảnh chia sẻ Facebook/Zalo riêng cho từng bài.
- Sau khi website chạy trên tên miền thật: khai báo `https://thuysannoben.vn/sitemap.xml` trong Google Search Console và tạo hồ sơ Google Business cho địa chỉ nhà máy để hiện trên Google Maps.

## Ảnh sản phẩm tách nền và trưng bày 3D

- Mỗi sản phẩm có ảnh bao bì đã tách nền trong `public/images/products-cutout/`. Website dùng ảnh này cho thẻ sản phẩm (đặt trên bệ có ánh đèn, bóng đổ, nghiêng theo chuột), băng chuyền 3D kéo qua lại ở trang chủ và trang sản phẩm, và khu xoay sản phẩm ở trang chi tiết. Ảnh poster gốc vẫn giữ để bấm "Xem nhãn gốc" đọc thông tin trên bao bì.
- Thêm sản phẩm mới: đặt ảnh poster vào `public/images/products/`, khai báo trong `content/products.json`, rồi tách nền:

```bash
pip install "rembg[cpu]" pillow numpy scipy
```

```bash
MODEL=birefnet-general-lite python3 scripts/cutout-products.py ten-san-pham
```

Sản phẩm chưa có ảnh tách nền sẽ tự hiển thị ảnh poster.

## Trợ lý Noben (chatbot)

Nút tròn màu vàng ở góc phải mỗi trang mở khung **Trợ lý Noben**. Trợ lý trả lời tự động 24/7 bằng tiếng Việt, dựa trên danh mục sản phẩm, các trang giải pháp theo bệnh và bài kiến thức của chính website, có gắn liên kết tới trang sản phẩm. Trợ lý không tự báo giá: khách hỏi giá, đặt hàng, đại lý sẽ được mời gọi hotline, nhắn Zalo hoặc để lại thông tin.

- Bật AI: lấy khóa tại https://platform.claude.com (mục API Keys, cần nạp tiền vào tài khoản), rồi nhập vào biến môi trường `ANTHROPIC_API_KEY` trên Hostinger và khởi động lại ứng dụng. Không đưa khóa vào GitHub.
- Chưa có khóa (hoặc vượt `CHAT_DAILY_LIMIT`): trợ lý vẫn hoạt động, tìm trang giải pháp và sản phẩm khớp với câu hỏi, kèm nút gọi và Zalo.
- Mỗi khách được hỏi tối đa 20 câu trong 10 phút; chỉ trang của website mới gọi được `/api/chat`.
- Nội dung trò chuyện không lưu trên máy chủ (đã ghi trong Chính sách bảo mật, mục "Trợ lý tự động").
- Mã nguồn: `src/chat.js` (máy chủ), `public/js/chat.js` (khung chat). Đổi model bằng biến `CHAT_MODEL` nếu cần.

Nút **Zalo** mở chat với số `zalo` trong `content/company.json`; nút **Messenger** mở đường dẫn `messenger` trong cùng file (dạng `https://m.me/<tên-trang-hoặc-tài-khoản>`).

## Sửa nội dung ngay trên trang (cây bút)

1. Đặt biến môi trường `ADMIN_PASS` (và `ADMIN_USER` nếu muốn, mặc định là `admin`).
2. Vào `/quan-tri/dang-nhap` và đăng nhập. Phiên đăng nhập kéo dài 7 ngày.
3. Ở góc dưới bên trái mỗi trang có **nút cây bút**. Bấm vào, các chữ sửa được sẽ có viền nét đứt: tên và mô tả sản phẩm, công dụng, hướng dẫn sử dụng, tiêu đề và nội dung bài viết, các trang chính sách, thông tin công ty (hotline, địa chỉ, email, tầm nhìn, sứ mệnh) và các tiêu đề, đoạn giới thiệu trên trang chủ, Gia công, Liên hệ.
4. Bấm vào chữ, sửa, rồi bấm **Lưu thay đổi**. Người xem thấy ngay nội dung mới.

Người xem bình thường không thấy cây bút. Nội dung sửa được làm sạch trước khi lưu (chỉ giữ in đậm, nghiêng, danh sách, chỉ số trên/dưới).

Thay đổi được lưu trong `data/overrides.json` trên máy chủ, đè lên nội dung gốc trong `content/`. File này không nằm trong Git, nên:
- Trên **VPS**, file được giữ nguyên khi cập nhật code bằng `git pull`.
- Trên gói **Business/Cloud**, một lần deploy lại có thể xóa file này. Trước khi deploy lại, vào menu cây bút → **Tải nội dung đã sửa** để tải bản sao, rồi gửi cho người phát triển đưa vào `content/` hoặc đặt lại file vào `data/overrides.json`.

## Cấu trúc thư mục

```
server.js            Khởi động Express, bảo mật, nén, file tĩnh
src/routes.js        Toàn bộ đường dẫn, SEO, chuyển hướng từ website cũ
src/content.js       Đọc nội dung JSON, tìm kiếm, gợi ý sản phẩm liên quan
src/articles.js      Đọc bài Markdown, tạo mục lục và FAQ
src/seo.js           Dữ liệu cấu trúc schema.org
content/kien-thuc/   Bài kiến thức nuôi tôm (Markdown)
content/giai-phap.json  Nội dung 8 trang giải pháp
src/leads.js         Xử lý form liên hệ (lưu file + gửi email)
src/auth.js          Đăng nhập quản trị (cookie có chữ ký)
src/sanitize.js      Làm sạch HTML khi lưu nội dung sửa trên trang
public/js/editor.js  Nút cây bút và chế độ sửa trên trang
public/js/showcase.js  Băng chuyền 3D, nghiêng thẻ, kéo để xoay sản phẩm
scripts/cutout-products.py  Tách nền ảnh sản phẩm
views/               Giao diện EJS (partials/ và pages/)
public/              CSS, JS, font, ảnh
content/             Nội dung website
scripts/smoke-test.js  Kiểm thử nhanh tất cả các trang
.claude/skills/      Skill thiết kế (ui-ux-pro-max, frontend-design) dùng cho Claude Code
```
