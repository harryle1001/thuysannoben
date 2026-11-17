# Website Thủy sản Noben

Website của Công ty TNHH Noben, xây dựng bằng Node.js (Express + EJS). Website không cần cơ sở dữ liệu: toàn bộ nội dung nằm trong thư mục `content/`.

## Website có gì

- **Trang chủ:** phần "Ao của bạn đang gặp" để bà con chọn vấn đề ao nuôi và xem ngay sản phẩm phù hợp. Kèm 4 nhóm sản phẩm, sản phẩm nổi bật, bài kỹ thuật, dịch vụ gia công, chứng nhận và form gọi lại.
- **Sản phẩm (`/san-pham`):** sản phẩm lấy từ website cũ; các sản phẩm kháng sinh và trị ký sinh trùng được ẩn khỏi web (danh sách `HIDDEN` trong `src/content.js`, trang cũ tự chuyển 301 về nhóm sản phẩm).
  - Lọc theo nhóm, theo vấn đề ao nuôi, hoặc tìm theo tên.
  - Tìm kiếm có dấu hay không dấu đều được.
  - Mỗi sản phẩm có trang riêng: công dụng, hướng dẫn sử dụng, nút Gọi / Zalo / Gửi yêu cầu, sản phẩm liên quan.
- **Kiến thức nuôi tôm:** bài chuẩn SEO có nguồn tham khảo và bài từ website cũ, chia 4 chuyên mục, có mục lục, hỏi đáp và sản phẩm liên quan.
- **Giải pháp theo vấn đề ao nuôi:** 8 trang như "Thuốc trị phân trắng, gan tụy cho tôm", mỗi trang có dấu hiệu, các bước xử lý và sản phẩm phù hợp.
- **Các trang khác:** Về Noben, Chứng nhận, Gia công, Liên hệ (có bản đồ), các trang chính sách.
- **Video (`/video`):** 11 phim motion graphic (7 sản phẩm, 3 phác đồ, 1 tuyển đại lý) dựng bằng Remotion trong `motion/`. Khai báo ở `content/product-videos.json` (theo sản phẩm) và `content/landing-videos.json` (theo landing, `dai-ly` = `/tuyen-dai-ly`). Video hiện ngay sau hero ở `/lp/:slug`, `/tuyen-dai-ly`, `/san-pham/:slug`; trang chủ có băng chuyền "Video sản phẩm" mở lightbox; `/video` có schema `VideoObject` và sitemap có `video:video`. Máy tính xem bản 16:9, điện thoại xem bản dọc 9:16 (`<source media>`); poster chỉ tải khi video gần vào màn hình.
  - Dựng lại: `cd motion && npm ci && bash render-all.sh [slug...]` (bản 9:16 chất lượng cao có tiếng nằm ở `motion/out/`, không đưa vào Git), rồi `bash compress.sh <slug> <giây-poster>` tạo bản web: 16:9 mp4/webm ≤ 3 MB, poster ≤ 60 KB, 9:16 ≤ 4 MB.
- **Sửa nội dung bằng cây bút:** quản trị viên đăng nhập rồi sửa chữ ngay trên trang (xem phần bên dưới).
- **Form liên hệ:**
  - Kiểm tra lỗi ngay khi nhập, chống spam.
  - Lưu vào `leads.jsonl` trong thư mục dữ liệu (xem "Dữ liệu khách và sao lưu") và gửi email nếu đã cấu hình SMTP.
  - Xem khách liên hệ tại `/quan-tri/lien-he` (có đăng nhập): lọc theo nhu cầu, nguồn quảng cáo, trang gửi, ngày; thống kê 7/30 ngày; xuất CSV; đánh dấu trạng thái (lưu ở `lead-status.json` trong thư mục dữ liệu, không vào Git).
- **Tính liều (`/tinh-lieu`):** nhập diện tích, độ sâu ao (hoặc m³) và kg thức ăn, công cụ đọc liều trên nhãn và tính lượng cần dùng. Kiểm thử bộ đọc liều: `node scripts/test-dose.js`.
- **Đánh giá của khách (`/danh-gia`):** bà con, đại lý gửi đánh giá (sao, nội dung, tối đa 2 ảnh được nén sang WebP trên điện thoại). Đánh giá mới ở trạng thái chờ duyệt, lưu trong `reviews.json` và `review-photos/` của thư mục dữ liệu (không vào Git). Duyệt, gỡ hoặc xóa tại `/quan-tri/danh-gia`; trang này cũng tạo link `/danh-gia?sp=<slug>` và tin nhắn mẫu gửi khách qua Zalo. Chỉ đánh giá đã duyệt mới hiện trên trang sản phẩm, `/danh-gia` và khối "Bà con nói gì về Noben" ở trang chủ (khối này chỉ hiện khi có từ 3 đánh giá đã duyệt). Dữ liệu cấu trúc AggregateRating chỉ có khi sản phẩm có đánh giá thật.
- **Bản đồ giải pháp (`/ban-do-giai-phap`):** đồ thị động (force-directed, canvas, không thư viện ngoài) nối 8 vấn đề ao ↔ sản phẩm ↔ 4 nhóm. Chạm vấn đề hoặc chip để xem sản phẩm phù hợp; kéo được node. Tự dừng khi ra khỏi màn hình; máy bật giảm chuyển động thì vẽ tĩnh. Code ở `public/js/kmap.js`.
- **Lịch chăm sóc (`/lich-cham-soc`):** nhập ngày thả giống và loại ao (bạt, đất), trang hiện tuổi tôm, giai đoạn, việc cần làm tuần này và sản phẩm gợi ý. Nội dung ở `content/lich-cham-soc.json`.
- **SEO:**
  - Có `sitemap.xml`, `robots.txt`, thẻ canonical, Open Graph và dữ liệu cấu trúc (Organization, Product, Article, Breadcrumb).
  - Toàn bộ link của website cũ được **chuyển hướng 301** sang link mới, nên không mất thứ hạng Google.
- **Tốc độ và bảo mật:**
  - Ảnh đã chuyển sang WebP, font tự host, nén gzip, header bảo mật (Helmet/CSP).
  - Ảnh sản phẩm và ảnh bìa bài viết có bản nhỏ trong `sm/` để điện thoại tải ảnh vừa đủ (`srcset`). Thêm ảnh mới thì chạy `python3 scripts/make-small.py`.
  - Video nền chỉ tải sau khi trang đã hiện; video trang trí (`data-decor`) không phát trên điện thoại, video trang chủ trên điện thoại dọc là bản cắt đúng phần hiển thị (`noben-hero-m72`), máy bật tiết kiệm dữ liệu hoặc mạng 2G/3G chỉ thấy ảnh poster.
  - Cuộn mượt (Lenis) chỉ bật cho chuột/trackpad; điện thoại cuộn gốc và không tải thư viện.
  - `public/.htaccess`: trên Hostinger, LiteSpeed phục vụ thẳng file trong `public/`, nên header cache đặt ở đây (CSS/JS/phông 1 năm `immutable`, ảnh/video 30 ngày). Đổi CSS/JS thì tăng `?v=`.
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
| `SITE_URL` | Tên miền chính: `https://thuysannoben.com` |
| `OLD_HOSTS` | Tên miền cũ hoặc phụ sẽ tự chuyển 301 sang tên miền chính. Mặc định: `thuocthuysannoben.com`, `www.thuocthuysannoben.com`, `www.thuysannoben.com` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Hộp thư dùng để gửi email báo khi có khách điền form |
| `MAIL_TO` | Email nhận thông báo khách liên hệ |
| `ADMIN_USER`, `ADMIN_PASS` | Tài khoản quản trị: sửa nội dung bằng cây bút và xem khách liên hệ tại `/quan-tri/lien-he` |
| `SESSION_SECRET` | (Không bắt buộc) chuỗi bí mật để ký phiên đăng nhập |
| `ANTHROPIC_API_KEY` | Khóa Claude API cho Trợ lý Noben (chatbot). Để trống thì trợ lý trả lời bằng cách tìm trong nội dung website |
| `CHAT_DAILY_LIMIT` | (Không bắt buộc) số câu trả lời AI tối đa mỗi ngày, mặc định 800. Vượt mức thì trợ lý chuyển sang chế độ tìm kiếm |
| `GA_MEASUREMENT_ID` | (Không bắt buộc) mã Google Analytics 4 dạng `G-XXXXXXXXXX`. Có thể điền thay vào trường `ga_id` trong `content/company.json` |
| `ADMIN_TOTP_SECRET` | (Không bắt buộc) bật đăng nhập 2 lớp: khóa base32 lấy ở `/quan-tri/2fa`. Để trống thì chỉ cần mật khẩu |
| `DATA_DIR` | (Không bắt buộc) thư mục lưu dữ liệu khách. Mặc định `~/noben-data` (hoặc `../noben-data` cạnh thư mục ứng dụng) |
| `LEADS_WEBHOOK_URL`, `LEADS_WEBHOOK_SECRET` | (Không bắt buộc) gửi mỗi khách mới sang Google Sheets, xem mục bên dưới |
| `INDEXNOW_AUTO` | (Không bắt buộc) đặt `0` để tắt việc tự báo trang mới cho Bing qua IndexNow sau mỗi lần triển khai |

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
6. Trỏ tên miền `thuysannoben.com` (và `www.thuysannoben.com`) về ứng dụng và bật SSL.
7. Nếu công ty còn giữ tên miền cũ `thuocthuysannoben.com`, trỏ nó về cùng ứng dụng: website sẽ tự chuyển 301 sang `thuysannoben.com`.

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

### Dữ liệu khách và sao lưu

- Khách liên hệ (`leads.jsonl`), trạng thái (`lead-status.json`), đánh giá (`reviews.json`, `review-photos/`), chữ sửa bằng cây bút (`overrides.json`) lưu trong **thư mục dữ liệu ngoài thư mục ứng dụng**, nên deploy lại không xóa. Mặc định là `~/noben-data` (thư mục nhà của tài khoản hosting, deploy không đụng tới), hoặc `../noben-data` cạnh thư mục code; đặt `DATA_DIR` để chọn chỗ khác. Không ghi được thì website dùng lại `data/` trong ứng dụng.
- Lần khởi động đầu, file trong `data/` cũ được **chép** sang thư mục mới (không xóa, không ghi đè), log ghi `[data] đã chép N file...`. Toàn bộ đường dẫn nằm ở `src/datadir.js`.
- File JSON ghi ra file tạm rồi đổi tên (không bao giờ hỏng nửa chừng), `leads.jsonl` chỉ ghi nối thêm.
- **Sao lưu tự động:** mỗi ngày một file `backups/noben-YYYY-MM-DD.tar.gz` trong thư mục dữ liệu, giữ 30 bản.
- **Tải bản sao lưu:** đăng nhập → `/quan-tri/lien-he` → nút **Tải bản sao lưu** (file `.tar.gz`, mở bằng 7-Zip/WinRAR). Có khách, trạng thái, đánh giá, ảnh, chữ đã sửa; không có mật khẩu.
- Nên cấu hình thêm SMTP (email) và/hoặc Google Sheets để có bản thứ hai ngoài máy chủ.

### Gửi khách mới sang Google Sheets (tùy chọn)

Mỗi khách mới được POST JSON tới `LEADS_WEBHOOK_URL` (chờ tối đa 5 giây, thử lại 2 lần; lỗi không ảnh hưởng form, không gửi IP của khách).

1. Tạo Google Sheet mới, hàng 1 ghi: `Thời gian | Họ tên | Điện thoại | Tỉnh | Nhu cầu | Sản phẩm | Lời nhắn | Trang gửi`.
2. Menu **Tiện ích mở rộng → Apps Script**, xóa code mẫu, dán đoạn dưới. Thay `DOI_KHOA_NAY` bằng một chuỗi bí mật bạn tự đặt (hoặc để trống nếu không dùng khóa).

```js
const SECRET = 'DOI_KHOA_NAY';
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  // Apps Script không đọc được header, nên website gửi khóa cả trong trường "secret".
  if (SECRET && d.secret !== SECRET) return ContentService.createTextOutput('forbidden');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
      new Date(d.at), d.name, "'" + d.phone, d.province, d.need, d.product, d.message, d.page,
    ]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
```

3. Bấm **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**: *Thực thi với tư cách*: **Tôi**; *Ai có quyền truy cập*: **Bất kỳ ai**. Cấp quyền, chép URL kết thúc bằng `/exec`.
4. Trên hPanel đặt `LEADS_WEBHOOK_URL` = URL đó, `LEADS_WEBHOOK_SECRET` = chuỗi bí mật ở bước 2, rồi khởi động lại ứng dụng. Không đưa khóa vào code hay Git.

### Đăng nhập 2 lớp (mã 6 số)

1. Đăng nhập quản trị, mở `/quan-tri/2fa`, quét mã QR bằng Google Authenticator, nhập thử mã 6 số.
2. Trên hPanel đặt `ADMIN_TOTP_SECRET` = khóa hiện trên trang, rồi khởi động lại. Mọi phiên cũ bị đăng xuất.
3. Từ đó đăng nhập cần mật khẩu + mã 6 số (sai 5 lần thì khóa 15 phút; mỗi mã chỉ dùng một lần; đăng nhập kiểu Basic auth bị tắt). Mất điện thoại: xóa biến `ADMIN_TOTP_SECRET` trên hPanel để quay lại chỉ dùng mật khẩu.

### Giám sát

- `/healthz` trả JSON ngắn: `uptime`, `dataWritable` (ghi được dữ liệu không), `dataLocation` (`home`, `app-parent`, `DATA_DIR` hoặc `fallback`), `migratedFiles` (số file chép từ `data/` cũ ở lần khởi động này), `commit`.
- `node scripts/monitor.js --base https://thuysannoben.com` kiểm tra 10 trang quan trọng (mã trả về, thời gian, nội dung) và gửi thử form ở chế độ dry-run (header `X-Noben-Dry-Run: 1`, không lưu).
- GitHub Actions `.github/workflows/monitor.yml` chạy mỗi giờ. Khi lỗi, mở (hoặc thêm bình luận vào) Issue **"🚨 Website thuysannoben.com đang lỗi"**, GitHub gửi email cho chủ repo; website ổn lại thì Issue tự đóng.

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
- Sau khi website chạy trên tên miền thật: khai báo `https://thuysannoben.com/sitemap.xml` trong Google Search Console và tạo hồ sơ Google Business cho địa chỉ nhà máy để hiện trên Google Maps.

## Ảnh sản phẩm tách nền và trưng bày 3D

- Mỗi sản phẩm có ảnh bao bì đã tách nền trong `public/images/products-cutout/`. Website dùng ảnh này cho thẻ sản phẩm (đặt trên bệ có ánh đèn, bóng đổ, nghiêng theo chuột), băng chuyền 3D kéo qua lại ở trang chủ và trang sản phẩm, và khu xoay sản phẩm ở trang chi tiết. Ảnh poster gốc vẫn giữ để bấm "Xem nhãn gốc" đọc thông tin trên bao bì.
- Ảnh tách nền được làm nét bằng AI: gói hàng trên poster được phóng to 4 lần bằng Real-ESRGAN (chữ trên nhãn rõ, không nhòe), tách nền ở độ phân giải cao, rồi nắn lại viền theo loại bao bì: túi và bao có viền thẳng, bo góc nhẹ; chai có viền cân đối hai bên (loại bỏ bọt nước, mảng nền dính vào); viền ảnh được khử màu nền để đặt lên nền nào cũng sạch.
- Thêm sản phẩm mới: đặt ảnh poster vào `public/images/products/`, khai báo trong `content/products.json`, thêm tên sản phẩm vào nhóm `POUCH` (túi, bao) hoặc `BOTTLE` (chai) đầu file `scripts/enhance-products.py`, rồi chạy:

```bash
pip install "rembg[cpu]" pillow numpy scipy opencv-python-headless spandrel torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
```

```bash
mkdir -p ~/.sr && curl -L -o ~/.sr/RealESRGAN_x4plus.pth https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
```

```bash
python3 scripts/enhance-products.py ten-san-pham
```

Mỗi sản phẩm mất khoảng 45 giây trên máy không có GPU. Nếu poster quá lạ khiến máy không tìm đúng gói hàng, khai báo khung gói trong `BOX` ở đầu script (như Down Max). Script cũ `scripts/cutout-products.py` (tách nền nhanh, không làm nét) vẫn giữ để dùng khi cần.

Sản phẩm chưa có ảnh tách nền sẽ tự hiển thị ảnh poster.

## Video motion graphic (Remotion)

Video nền đầu trang chủ, trang Về Noben và phim "Kiểm soát chất lượng" được dựng bằng code trong thư mục `motion/` (Remotion, React), không dùng ảnh chụp. File đã xuất nằm ở `public/media/` (MP4 + WebM + ảnh chờ), mỗi file khoảng 0,6 đến 1,8 MB.

- `HeroLoop`: 12 giây, lặp liền mạch, không chữ (chữ của trang nằm đè lên).
- `BrandFilm`: 18 giây: tôm tự vẽ, quy trình khép kín 4 bước, chứng nhận và số liệu, logo cuối.

Sửa chữ hoặc màu trong `motion/src/`, rồi xuất lại:

```bash
cd motion && npm install
```

```bash
npm run render:hero && npm run render:film
```

Sau đó nén cho web bằng ffmpeg (xem lịch sử commit để lấy đúng lệnh) và chép vào `public/media/`. Skill hướng dẫn dựng video nằm trong `.claude/skills/remotion-motion-graphics/`.

## Trợ lý Noben (chatbot)

Nút tròn màu vàng ở góc phải mỗi trang mở khung **Trợ lý Noben**. Trợ lý trả lời tự động 24/7 bằng tiếng Việt, dựa trên danh mục sản phẩm, các trang giải pháp theo bệnh và bài kiến thức của chính website, có gắn liên kết tới trang sản phẩm. Trợ lý không tự báo giá: khách hỏi giá, đặt hàng, đại lý sẽ được mời gọi hotline, nhắn Zalo hoặc để lại thông tin.

- Bật AI: lấy khóa tại https://platform.claude.com (mục API Keys, cần nạp tiền vào tài khoản), rồi nhập vào biến môi trường `ANTHROPIC_API_KEY` trên Hostinger và khởi động lại ứng dụng. Không đưa khóa vào GitHub.
- Chưa có khóa (hoặc vượt `CHAT_DAILY_LIMIT`): trợ lý vẫn hoạt động, tìm trang giải pháp và sản phẩm khớp với câu hỏi, kèm nút gọi và Zalo.
- Mỗi khách được hỏi tối đa 20 câu trong 10 phút; chỉ trang của website mới gọi được `/api/chat`.
- Nội dung trò chuyện không lưu trên máy chủ (đã ghi trong Chính sách bảo mật, mục "Trợ lý tự động").
- Mã nguồn: `src/chat.js` (máy chủ), `public/js/chat.js` (khung chat). Đổi model bằng biến `CHAT_MODEL` nếu cần.

Nút **Zalo** mở chat với số `zalo` trong `content/company.json`; nút **Messenger** mở đường dẫn `messenger` trong cùng file (dạng `https://m.me/<tên-trang-hoặc-tài-khoản>`).

## Hệ thống đại lý

Trang `/dai-ly` cho khách tìm đại lý theo tên, huyện, xã hoặc theo tỉnh, thành (34 tỉnh, thành mới). Mỗi tỉnh có trang riêng `/dai-ly/tinh/<tinh>` và mỗi đại lý có trang hồ sơ `/dai-ly/<ten-dai-ly>` (địa chỉ, điện thoại, người phụ trách, bản đồ, nút chỉ đường, các đại lý cùng tỉnh). Các trang này tự vào sitemap. Đường dẫn đại lý của web cũ (`/partnersearch`, `/partner/...`) chuyển 301 về `/dai-ly`.

Nhập danh sách đại lý từ Excel hoặc Google Sheets: lưu thành file **CSV UTF-8** với các cột `ten, tinh, huyen, dia_chi, dien_thoai, nguoi_phu_trach, ghi_chu` (tên cột tiếng Việt có dấu cũng được), rồi chạy:

```bash
node scripts/import-dai-ly.js danh-sach-dai-ly.csv
```

Lệnh ghi đè `content/dai-ly.json`. Đẩy lên GitHub là web tự cập nhật. Khi chưa có đại lý nào, trang hiển thị lời mời gọi hotline để được giới thiệu đại lý gần nhất.

## Báo giá nhiều sản phẩm, nhận tin, tuyển dụng

- Trang sản phẩm có nút **Thêm vào danh sách báo giá**. Khách chọn nhiều sản phẩm, chỉnh số lượng ở `/bao-gia` và gửi một lần. Yêu cầu vào danh sách khách liên hệ với nhu cầu "Yêu cầu báo giá".
- Chân trang có form **đăng ký nhận tin qua Zalo** (họ tên, số Zalo).
- Trang `/tuyen-dung` có form ứng tuyển; nội dung "Vị trí đang tuyển" sửa được bằng cây bút.
- Mọi form chống spam bằng ô ẩn, giới hạn 5 lần mỗi 10 phút cho mỗi máy và bẫy thời gian (gửi trong vòng 2,5 giây sau khi mở trang bị bỏ qua).

## Landing page (chạy quảng cáo)

- `/tuyen-dai-ly`: trang tuyển đại lý, có form ở ngay đầu trang và cuối trang. Trang được Google lập chỉ mục (từ khóa "tuyển đại lý thuốc thủy sản").
- `/lp/g7`, `/lp/caphote`, `/lp/aqualac-fs`, `/lp/sorbest`, `/lp/proticbest`, `/lp/super-yucca`, `/lp/top-weigh`: trang sản phẩm chủ lực dùng cho quảng cáo Facebook, Zalo, Google. Không lập chỉ mục để tránh trùng với trang sản phẩm.
- Thêm landing sản phẩm mới: thêm một mục vào `content/landings.json` (slug, sản phẩm, trang giải pháp, tiêu đề, lợi ích, sản phẩm phối hợp).
- Gắn mã chiến dịch vào link quảng cáo, ví dụ `https://thuysannoben.com/lp/g7?utm_source=facebook&utm_campaign=g7-thang11`. Mã này được lưu kèm khách liên hệ (cột trang) để biết quảng cáo nào ra khách.
- Chữ trên landing sửa được bằng cây bút khi đăng nhập quản trị.

## Sửa nội dung ngay trên trang (cây bút)

1. Đặt biến môi trường `ADMIN_PASS` (và `ADMIN_USER` nếu muốn, mặc định là `admin`).
2. Vào `/quan-tri/dang-nhap` và đăng nhập. Phiên đăng nhập kéo dài 7 ngày.
3. Ở góc dưới bên trái mỗi trang có **nút cây bút**. Bấm vào, các chữ sửa được sẽ có viền nét đứt: tên và mô tả sản phẩm, công dụng, hướng dẫn sử dụng, tiêu đề và nội dung bài viết, các trang chính sách, thông tin công ty (hotline, địa chỉ, email, tầm nhìn, sứ mệnh) và các tiêu đề, đoạn giới thiệu trên trang chủ, Gia công, Liên hệ.
4. Bấm vào chữ, sửa, rồi bấm **Lưu thay đổi**. Người xem thấy ngay nội dung mới.

Người xem bình thường không thấy cây bút. Nội dung sửa được làm sạch trước khi lưu (chỉ giữ in đậm, nghiêng, danh sách, chỉ số trên/dưới).

Thay đổi được lưu trong `overrides.json` ở thư mục dữ liệu (ngoài thư mục ứng dụng, deploy lại không mất), đè lên nội dung gốc trong `content/`. File này không nằm trong Git, nên:

- Muốn giữ lâu dài, vào menu cây bút → **Tải nội dung đã sửa** rồi gửi cho người phát triển đưa vào `content/`. File này cũng có trong bản sao lưu hằng ngày.

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
