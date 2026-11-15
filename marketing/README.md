# Bộ tài liệu tìm khách của Noben

Thư mục `marketing/` chứa nội dung quảng cáo và chăm sóc khách. **Không** phục vụ trên website (server không đọc thư mục này), chỉ để đội kinh doanh, người chạy quảng cáo dùng.

## Có gì trong thư mục

| File | Dùng để làm gì | Ai dùng |
|---|---|---|
| `lich-dang-bai-30-ngay.md` | 30 bài đăng hoàn chỉnh cho Facebook Page và Zalo OA, từ 16/11 đến 15/12/2026, kèm hashtag, ảnh/video gợi ý, link có UTM | Người quản lý Page, Zalo OA |
| `quang-cao-facebook.md` | 3 mẫu quảng cáo cho mỗi landing page (7 sản phẩm + tuyển đại lý), đối tượng nhắm, ngân sách thử A/B | Người chạy quảng cáo Meta |
| `quang-cao-google.md` | Nhóm từ khóa, từ khóa phủ định, 15 tiêu đề và 4 mô tả RSA cho mỗi landing page, cài đặt UTM | Người chạy Google Ads |
| `kich-ban-zalo-va-goi-dien.md` | Tin nhắn chào khách, chăm sóc sau bán, xin đánh giá, kịch bản gọi lại, trả lời phản đối | Nhân viên kinh doanh, kỹ thuật viên |
| `video-ngan.md` | 10 kịch bản video 15–30 giây quay bằng điện thoại, lịch đăng | Người quay video, quản lý TikTok/Reels |

## Trước khi dùng: 4 việc cần làm

1. **Điền các chỗ `[ĐIỀN: …]`.** Đó là giá, chiết khấu, khuyến mãi, ngân sách, số giấy xác nhận quảng cáo, giờ làm việc. Không tự đặt số khi chưa có số thật. Tìm nhanh bằng cách bấm Ctrl+F gõ `ĐIỀN`.
2. **Giấy xác nhận nội dung quảng cáo thuốc thú y.** Theo Luật Thú y, quảng cáo thuốc thú y (kể cả thuốc thủy sản) cần được cơ quan thú y xác nhận nội dung trước khi chạy. Kiểm tra cho từng sản phẩm trước khi chạy quảng cáo trả tiền, nhất là G7 và SORBEST.
3. **Ảnh thật.** Ảnh sản phẩm có sẵn trên web, nhưng quảng cáo và bài đăng hiệu quả hơn khi có ảnh ao, nhà máy, đội kỹ thuật thật. Ảnh có người hoặc ao của khách phải xin phép.
4. **Trang `/dai-ly` hiện chưa có đại lý nào** (`content/dai-ly.json` đang trống). Khi đã có danh sách, các kịch bản "tìm đại lý gần nhà" mới dùng được. Trước đó, khi khách hỏi, nhân viên báo đại lý gần nhất theo danh sách nội bộ.

## Nguyên tắc nội dung (giữ khi sửa)

- Công dụng và liều dùng chép đúng nhãn (trang sản phẩm trên web). Viết "theo nhãn" khi nêu liều.
- Không cam kết chữa khỏi, không "100%", không "hết bệnh", không "không chết con nào".
- Không bịa lời khách, đánh giá, số liệu hiệu quả, giải thưởng, khuyến mãi.
- Không quảng cáo sản phẩm kháng sinh và trị ký sinh trùng (các sản phẩm này đã ẩn khỏi web).
- Không chê sản phẩm của hãng khác.
- Không đổi quà lấy đánh giá tốt.

## Quy ước UTM

UTM là phần đuôi gắn sau link (`?utm_source=...`), giúp trang quản trị biết khách đến từ đâu. **Đừng xóa hay sửa phần này khi dán link.**

| Kênh | utm_source | utm_medium | utm_campaign |
|---|---|---|---|
| Bài đăng Facebook Page | `facebook` | `social` | `kien-thuc`, `canh-bao-mua`, `sp-<sản phẩm>`, `tuyen-dai-ly`, `danh-gia`, `cong-cu`, `uy-tin`, `tong-ket` |
| Bài đăng Zalo OA | `zalo` | `social` | như trên |
| Tin nhắn Zalo chăm sóc khách | `zalo` | `social` | `cham-soc` |
| Quảng cáo Facebook | `facebook` | `paid` | `fb-<sản phẩm>`, `fb-tuyen-dai-ly` |
| Quảng cáo Google | `google` | `cpc` | `gg-<sản phẩm>`, `gg-tuyen-dai-ly` |
| TikTok | `tiktok` | `social` | `video-ngan` |

`utm_content` dùng để phân biệt bài (`ngay01`…`ngay30`) hoặc phiên bản quảng cáo (`a`, `b`, `c`).

Muốn tạo link mới, giữ đúng mẫu:
`https://thuysannoben.com/<trang>?utm_source=<kênh>&utm_medium=<loại>&utm_campaign=<chiến dịch>&utm_content=<chi tiết>`

## Đọc khách từ quảng cáo trong `/quan-tri/lien-he`

1. Vào `https://thuysannoben.com/quan-tri/lien-he`, đăng nhập bằng tài khoản quản trị.
2. Phía trên có các ô lọc:
   - **Nhu cầu:** Mua sản phẩm, Yêu cầu báo giá, Làm đại lý, Tư vấn kỹ thuật…
   - **Nguồn:** lấy từ `utm_source`, ví dụ `facebook`, `zalo`, `google`, `tiktok`. Khách vào từ quảng cáo Google mà link chỉ có `gclid` hiện là `google-ads`; quảng cáo Facebook chỉ có `fbclid` hiện là `facebook-ads`; không có thông tin gì hiện **Tự nhiên**.
   - **Trang gửi:** trang khách điền form, ví dụ `/lp/g7`, `/tuyen-dai-ly`, `/tinh-lieu`.
   - **Trạng thái:** Mới, Đã gọi, Đã chốt, Không tiềm năng.
   - **Từ ngày, Đến ngày.**
3. Mỗi khách trong bảng: cột nguồn ghi `utm_source`, dòng nhỏ bên dưới là **tên chiến dịch** (`utm_campaign`) và trang gửi.
4. Các khối thống kê: **Theo nguồn quảng cáo**, **Theo trang gửi (landing page)**, **Theo ngày (30 ngày)**. Bấm vào một nguồn để lọc nhanh.
5. Bấm **Xuất CSV** để tải danh sách đang lọc (có cột nguồn, chiến dịch, trang) về Excel/Google Sheets.

**Ví dụ lọc thường dùng:**
- Khách từ quảng cáo G7 trên Facebook: Nguồn = `facebook`, Trang gửi = `/lp/g7`. Muốn tách quảng cáo trả tiền với bài đăng thường: xuất CSV, lọc cột chiến dịch bắt đầu bằng `fb-`.
- Người đăng ký đại lý từ Google: Nguồn = `google`, Trang gửi = `/tuyen-dai-ly`.
- Hiệu quả cả tuần: chọn Từ ngày, Đến ngày, coi khối "Theo nguồn quảng cáo".

**So hiệu quả các phiên bản quảng cáo A, B, C:** trang quản trị chưa có ô lọc `utm_content`. Coi số khách để lại số trong Ads Manager / Google Ads, đối chiếu với tổng số khách theo chiến dịch trong file CSV.

**Mỗi tuần (gợi ý thứ Hai):**
1. Xuất CSV khách tuần trước.
2. Đếm theo chiến dịch: số khách, số "Đã chốt".
3. Chia ngân sách đã chi cho số khách để ra chi phí mỗi khách, và chia cho số khách đã chốt để ra chi phí mỗi đơn.
4. Tắt chiến dịch/phiên bản tệ nhất, tăng ngân sách cái tốt nhất.
5. Tải danh sách số điện thoại khách đã chốt lên Meta làm đối tượng tương tự (Lookalike).

### Giới hạn cần biết

- **UTM chỉ được lưu khi khách gửi form ở các trang có form thu UTM:** `/lp/<sản phẩm>`, `/tuyen-dai-ly`, `/tinh-lieu`, `/lich-cham-soc`.
  - Khách vào từ link bài viết (`/bai-viet/...`), trang sản phẩm (`/san-pham/...`), `/chung-nhan`, `/danh-gia`, `/lien-he` mà gửi form ở đó thì vẫn hiện nguồn **Tự nhiên**.
  - Khách bấm sang trang khác rồi mới gửi form cũng mất UTM.
  - Vì vậy **quảng cáo trả tiền luôn dẫn về `/lp/...` hoặc `/tuyen-dai-ly`**. Bài đăng kiến thức chủ yếu để kéo tương tác; đo lượt truy cập bằng Google Analytics nếu đã gắn mã GA4.
- **Khách gọi điện hoặc nhắn Zalo trực tiếp không có UTM.** Khi nghe máy, hỏi: "Anh/chị biết Noben qua đâu ạ (Facebook, Zalo, Google, đại lý, người quen)?", rồi ghi vào sổ theo dõi riêng.
- Nếu cần lưu UTM cho mọi trang (giữ UTM khi khách chuyển trang), cần sửa code web (`public/js/main.js` và các form). Phần này không thuộc thư mục `marketing/`; báo người phụ trách web.

## Xin đánh giá và duyệt đánh giá

- Gửi khách link `https://thuysannoben.com/danh-gia?sp=<slug>` theo mẫu trong `kich-ban-zalo-va-goi-dien.md`. Bảng slug các sản phẩm chính có sẵn trong file đó.
- Trang `/quan-tri/danh-gia` có nút tạo link và tin nhắn mẫu cho từng sản phẩm, và là nơi duyệt, gỡ, xóa đánh giá.
- Khối "Bà con nói gì về Noben" ở trang chủ chỉ hiện khi có từ 3 đánh giá đã duyệt. Trước khi có đánh giá thật, **không** dùng câu "hàng nghìn khách hài lòng" hay tương tự trong bất kỳ quảng cáo nào.

## Ảnh và video có sẵn trên web

| Loại | Đường dẫn |
|---|---|
| Ảnh sản phẩm | `https://thuysannoben.com/images/products/<slug>.webp` |
| Video G7 | `/media/ads/g7-phong-va-tri-benh-gan-chet-som-9x16.mp4` (dọc), `-16x9.mp4` (ngang) |
| Video CAPHOTE | `/media/ads/caphote-9x16.mp4`, `caphote-16x9.mp4` |
| Video AQUALAC FS | `/media/ads/aqualac-fs-9x16.mp4`, `aqualac-fs-16x9.mp4` |
| Ảnh thương hiệu | `/images/brand/banner-1.webp`, `banner-2.webp`, `gioi-thieu.webp`, `logo-noben-1024.png` |
| Ảnh bài viết | mở bài trên web, lưu ảnh đầu bài |

Video quảng cáo được dựng từ thư mục `motion/` của dự án; muốn có video cho sản phẩm khác, nhờ người phụ trách web dựng thêm theo cùng mẫu.
