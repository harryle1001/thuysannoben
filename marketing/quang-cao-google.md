# Quảng cáo Google Tìm kiếm cho các landing page

8 chiến dịch: 7 sản phẩm (`/lp/<slug>`) và tuyển đại lý (`/tuyen-dai-ly`). Mỗi chiến dịch có nhóm từ khóa, quảng cáo tìm kiếm thích ứng (RSA) gồm 15 tiêu đề, 4 mô tả, và URL có UTM. Độ dài tiêu đề, mô tả đã kiểm bằng máy (tiêu đề ≤ 30 ký tự, mô tả ≤ 90 ký tự, tính cả dấu tiếng Việt).

## Trước khi chạy

1. **Giấy xác nhận nội dung quảng cáo thuốc thú y:** như ghi chú trong `quang-cao-facebook.md`. [ĐIỀN: số xác nhận, nếu có].
2. **Chính sách Google Ads:**
   - Không ghi số điện thoại trong tiêu đề, mô tả. Số **0934 246 420** đặt ở **tài sản cuộc gọi** (Call asset).
   - Không viết hoa toàn bộ, không dùng "!" trong tiêu đề.
   - Không cam kết chữa khỏi.
3. **UTM:** dán chuỗi sau vào ô **Hậu tố URL cuối cùng** (Final URL suffix) ở cấp chiến dịch, không dán vào URL cuối cùng:
   `utm_source=google&utm_medium=cpc&utm_campaign=<tên chiến dịch>&utm_term={keyword}&utm_content={creative}`
   Bật **tự động gắn thẻ** (auto-tagging) để có `gclid`. Trang quản trị nhận cả hai: có `utm_source=google` thì ghi nguồn "google", chỉ có `gclid` thì ghi "google-ads".
4. **Cài đặt chiến dịch gợi ý:**
   - Mạng: chỉ **Tìm kiếm** (tắt Mạng hiển thị, tắt Đối tác tìm kiếm lúc đầu)
   - Vị trí: Việt Nam, chọn "Người ở hoặc thường xuyên ở" vị trí mục tiêu; ưu tiên tăng giá thầu +20% ở các tỉnh nuôi tôm trọng điểm (xem danh sách ở file Facebook)
   - Ngôn ngữ: Tiếng Việt
   - Giá thầu: tuần 1–2 dùng **Tối đa hóa số lần nhấp** có giới hạn CPC [ĐIỀN: CPC tối đa, gợi ý 3.000–6.000 đ]; khi đã có từ 15–30 chuyển đổi (gửi form) thì chuyển sang **Tối đa hóa lượt chuyển đổi**
   - Ngân sách: [ĐIỀN: ngân sách/ngày cho từng chiến dịch]; gợi ý thử 80.000–150.000 đ/ngày mỗi chiến dịch sản phẩm, ưu tiên G7, CAPHOTE, AQUALAC FS, SUPER YUCCA
   - Lịch chạy: 5:00–22:00 hằng ngày
5. **Tài sản (asset) dùng chung:**
   - **Cuộc gọi:** 0934 246 420
   - **Đường liên kết trang web (Sitelink):** Tính liều `/tinh-lieu` · Lịch chăm sóc tôm `/lich-cham-soc` · Chứng nhận ISO `/chung-nhan` · Kiến thức nuôi tôm `/ky-thuat-nuoi` (thêm "Tìm đại lý gần nhà `/dai-ly`" khi trang này đã có danh sách đại lý)
   - **Chú thích (Callout):** Giá nhà máy · Giao hàng toàn quốc · ISO 9001:2015 · Tư vấn miễn phí · Sản xuất từ 2002
   - **Đoạn thông tin có cấu trúc (Structured snippet), loại "Loại":** Vi sinh xử lý đáy, Khoáng chất, Thức ăn bổ sung, Gây màu nước
   - **Hình ảnh:** ảnh sản phẩm và `/images/brand/logo-noben-1024.png`
6. **Đo chuyển đổi:** nếu đã gắn GA4 (`ga_id` trong `content/company.json` hoặc biến `GA_MEASUREMENT_ID`), nhập sự kiện gửi form vào Google Ads làm chuyển đổi. Nếu chưa, đối chiếu thủ công ở `/quan-tri/lien-he` (lọc nguồn `google`), xem `README.md`.

## Kiểu khớp từ khóa

Trong mỗi nhóm, `"từ khóa"` là **khớp cụm từ**, `[từ khóa]` là **khớp chính xác**. Tuần đầu chỉ dùng hai kiểu này, chưa dùng khớp rộng. Sau 2 tuần, coi báo cáo **Cụm từ tìm kiếm** để thêm từ khóa tốt và thêm từ khóa phủ định.

## Từ khóa phủ định dùng chung (cấp tài khoản)

Thêm vào một **danh sách từ khóa phủ định** rồi gắn cho cả 8 chiến dịch (khớp cụm từ):

- **Không phải người mua:** "là gì", "wiki", "luận văn", "đề tài", "pdf", "giáo trình", "tiểu luận", "bài giảng"
- **Tìm việc:** "tuyển dụng", "việc làm", "lương"
- **Ngoài sản phẩm:** "tôm hùm", "tôm càng xanh cảnh", "cá cảnh", "bể cá", "thủy sinh", "hồ cá koi", "chó", "mèo", "gà", "heo", "người", "gan người", "thuốc bổ gan người", "men tiêu hóa cho bé"
- **Nấu ăn, ăn uống:** "nấu", "món", "cách làm tôm", "luộc", "rang", "giá tôm hôm nay", "giá tôm thẻ", "bán tôm"
- **Kháng sinh, ký sinh trùng (Noben không quảng cáo nhóm này):** "kháng sinh", "thuốc kháng sinh", "florfenicol", "oxytetracycline", "doxycycline", "thuốc diệt ký sinh trùng", "trùng loa kèn", "praziquantel"
- **Tự làm, miễn phí:** "tự làm", "tự chế", "miễn phí", "free"
- **Đối thủ:** [ĐIỀN: tên thương hiệu đối thủ nếu không muốn hiện quảng cáo khi người ta tìm tên họ]

Riêng chiến dịch **tuyển đại lý**, thêm phủ định: "mua lẻ", "giá bán lẻ", "cách dùng", "liều dùng", và không dùng phủ định "tuyển dụng" nếu muốn bắt người tìm "tuyển dụng đại lý" (cân nhắc, vì đa số là người tìm việc).

Riêng các chiến dịch **sản phẩm**, thêm phủ định: "đại lý", "nhà phân phối", "tuyển".

Giữa các chiến dịch sản phẩm, thêm phủ định chéo theo tên sản phẩm (ví dụ chiến dịch G7 phủ định [sorbest], [caphote]) để từ khóa không giành nhau.

---

## 1. G7: bổ gan, giải độc gan cho tôm

**Chiến dịch:** `gg-g7`  
**URL cuối cùng:** `https://thuysannoben.com/lp/g7`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-g7&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/g7?utm_source=google&utm_medium=cpc&utm_campaign=gg-g7&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Thuốc gan tôm** (cụm từ và chính xác):

- "thuốc bổ gan cho tôm"  ·  [thuốc bổ gan cho tôm]
- "thuốc gan tụy cho tôm"  ·  [thuốc gan tụy cho tôm]
- "thuốc trị gan tôm"  ·  [thuốc trị gan tôm]
- "thuốc giải độc gan tôm"  ·  [thuốc giải độc gan tôm]
- "thảo dược bổ gan tôm"  ·  [thảo dược bổ gan tôm]

**Triệu chứng gan** (cụm từ và chính xác):

- "tôm bị teo gan"  ·  [tôm bị teo gan]
- "tôm bị sưng gan"  ·  [tôm bị sưng gan]
- "tôm bị trắng gan"  ·  [tôm bị trắng gan]
- "gan tôm bị ứ nước"  ·  [gan tôm bị ứ nước]
- "tôm chết rải rác do gan"  ·  [tôm chết rải rác do gan]

**Tên sản phẩm** (cụm từ và chính xác):

- "g7 noben"  ·  [g7 noben]
- "thuốc g7 cho tôm"  ·  [thuốc g7 cho tôm]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | G7 Bổ Gan Cho Tôm | 17 |
| 2 | Thảo Dược Bổ Gan Tôm | 20 |
| 3 | Giải Độc Gan Cho Tôm | 20 |
| 4 | Phòng Bệnh Gan Cho Tôm | 22 |
| 5 | Teo Gan, Sưng Gan, Trắng Gan | 28 |
| 6 | Trộn Ăn Hoặc Tạt Ao | 19 |
| 7 | Thảo Dược Và Acid Amin | 22 |
| 8 | Nhà Máy ISO 9001:2015 | 21 |
| 9 | Sản Xuất Từ Năm 2002 | 20 |
| 10 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 11 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 12 | Gọi Kỹ Thuật Viên Noben | 23 |
| 13 | Cho Tôm Thẻ Và Tôm Sú | 21 |
| 14 | Phác Đồ Gan Ruột Noben | 22 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | G7: hỗn hợp thảo dược và acid amin giúp bổ gan, giải độc gan, phục hồi chức năng gan. | 85 |
| 2 | Giúp phòng các bệnh gan thường gặp trên tôm: teo gan, sưng gan, trắng gan, gan ứ nước. | 86 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Để lại số điện thoại, kỹ thuật viên Noben gọi lại tư vấn liều dùng cho ao của bạn. | 82 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 2. CAPHOTE: siêu khoáng cứng vỏ

**Chiến dịch:** `gg-caphote`  
**URL cuối cùng:** `https://thuysannoben.com/lp/caphote`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-caphote&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/caphote?utm_source=google&utm_medium=cpc&utm_campaign=gg-caphote&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Khoáng cho tôm** (cụm từ và chính xác):

- "khoáng cho tôm"  ·  [khoáng cho tôm]
- "siêu khoáng cho tôm"  ·  [siêu khoáng cho tôm]
- "khoáng nước cho tôm"  ·  [khoáng nước cho tôm]
- "khoáng tạt ao tôm"  ·  [khoáng tạt ao tôm]
- "khoáng trộn thức ăn cho tôm"  ·  [khoáng trộn thức ăn cho tôm]

**Mềm vỏ, cong thân** (cụm từ và chính xác):

- "tôm bị mềm vỏ"  ·  [tôm bị mềm vỏ]
- "tôm mềm vỏ kéo dài"  ·  [tôm mềm vỏ kéo dài]
- "tôm bị cong thân đục cơ"  ·  [tôm bị cong thân đục cơ]
- "thuốc cứng vỏ tôm"  ·  [thuốc cứng vỏ tôm]
- "tôm khó lột vỏ"  ·  [tôm khó lột vỏ]

**Tên sản phẩm** (cụm từ và chính xác):

- "caphote noben"  ·  [caphote noben]
- "caphote siêu khoáng"  ·  [caphote siêu khoáng]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | CAPHOTE Siêu Khoáng | 19 |
| 2 | Tôm Cứng Vỏ Nhanh | 17 |
| 3 | Vỏ Dày, Vỏ Đẹp | 14 |
| 4 | Phòng Cong Thân, Đục Cơ | 23 |
| 5 | Khoáng Dễ Hấp Thụ | 17 |
| 6 | Dùng Cho Ao Bạt, Ao Đất | 23 |
| 7 | Tạt Ao Hoặc Trộn Ăn | 19 |
| 8 | Cứng Vỏ Nhanh Để Thu Tôm | 24 |
| 9 | Khoáng Vi Lượng, Đa Lượng | 25 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Phác Đồ Khoáng Noben | 20 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | CAPHOTE bổ sung khoáng vi lượng, đa lượng dễ hấp thụ, giúp tôm cứng vỏ nhanh, vỏ dày. | 85 |
| 2 | Phòng ngừa cong thân, đục cơ, trắng lưng, vỏ xanh, mềm vỏ. Dùng tạt ao hoặc trộn thức ăn. | 89 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Xem liều dùng định kỳ và trước thu hoạch. Để lại số, kỹ thuật viên Noben gọi lại. | 81 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 3. AQUALAC FS: đường ruột

**Chiến dịch:** `gg-aqualac-fs`  
**URL cuối cùng:** `https://thuysannoben.com/lp/aqualac-fs`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-aqualac-fs&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/aqualac-fs?utm_source=google&utm_medium=cpc&utm_campaign=gg-aqualac-fs&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Đường ruột tôm** (cụm từ và chính xác):

- "thuốc đường ruột cho tôm"  ·  [thuốc đường ruột cho tôm]
- "men tiêu hóa cho tôm"  ·  [men tiêu hóa cho tôm]
- "thuốc nong ruột tôm"  ·  [thuốc nong ruột tôm]
- "men vi sinh đường ruột tôm"  ·  [men vi sinh đường ruột tôm]

**Phân trắng, ruột** (cụm từ và chính xác):

- "tôm bị phân trắng"  ·  [tôm bị phân trắng]
- "tôm bị trống ruột"  ·  [tôm bị trống ruột]
- "tôm bị đứt khúc ruột"  ·  [tôm bị đứt khúc ruột]
- "tôm đi phân lỏng"  ·  [tôm đi phân lỏng]
- "thuốc ngừa phân trắng cho tôm"  ·  [thuốc ngừa phân trắng cho tôm]

**Tên sản phẩm** (cụm từ và chính xác):

- "aqualac fs"  ·  [aqualac fs]
- "aqualac noben"  ·  [aqualac noben]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | AQUALAC FS Cho Tôm | 18 |
| 2 | Đường Ruột To Khỏe | 18 |
| 3 | Hỗ Trợ Ngừa Phân Trắng | 22 |
| 4 | Hỗ Trợ Tiêu Hóa Cho Tôm | 23 |
| 5 | Nong To Đường Ruột Tôm | 22 |
| 6 | Ngừa Trống Đường Ruột | 21 |
| 7 | Tôm Ăn Mạnh, Lớn Nhanh | 22 |
| 8 | Trộn Thức Ăn Hằng Ngày | 22 |
| 9 | Cho Tôm Thẻ Và Tôm Sú | 21 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Phác Đồ Đường Ruột | 18 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | AQUALAC FS hỗ trợ tiêu hóa, hấp thu thức ăn nhanh, làm to đường ruột, tôm tăng trọng. | 85 |
| 2 | Hỗ trợ ngăn ngừa phân trắng, trống đường ruột. Tăng liều khi phân lỏng, theo nhãn. | 82 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Xem phác đồ đường ruột khuyên dùng. Để lại số, kỹ thuật viên Noben gọi lại tư vấn. | 82 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 4. SORBEST: gan tụy, chết sớm

**Chiến dịch:** `gg-sorbest`  
**URL cuối cùng:** `https://thuysannoben.com/lp/sorbest`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-sorbest&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/sorbest?utm_source=google&utm_medium=cpc&utm_campaign=gg-sorbest&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Gan tụy, chết sớm** (cụm từ và chính xác):

- "thuốc gan tụy tôm"  ·  [thuốc gan tụy tôm]
- "tôm chết sớm"  ·  [tôm chết sớm]
- "tôm chết tấp mé"  ·  [tôm chết tấp mé]
- "hội chứng chết sớm trên tôm"  ·  [hội chứng chết sớm trên tôm]
- "thuốc phòng chết sớm cho tôm"  ·  [thuốc phòng chết sớm cho tôm]

**Gan tôm** (cụm từ và chính xác):

- "tôm bị teo gan"  ·  [tôm bị teo gan]
- "gan tôm bị nhạt màu"  ·  [gan tôm bị nhạt màu]
- "tôm bị hoại tử gan tụy"  ·  [tôm bị hoại tử gan tụy]
- "bổ gan cho tôm"  ·  [bổ gan cho tôm]

**Tên sản phẩm** (cụm từ và chính xác):

- "sorbest noben"  ·  [sorbest noben]
- "thuốc sorbest"  ·  [thuốc sorbest]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | SORBEST Chăm Gan Tôm | 20 |
| 2 | Bổ Gan, Giải Độc Gan | 20 |
| 3 | Phòng Bệnh Gan Cho Tôm | 22 |
| 4 | Teo Gan, Sưng Gan, Trắng Gan | 28 |
| 5 | Hạn Chế Chết Rải Rác | 20 |
| 6 | Thảo Dược Và Acid Amin | 22 |
| 7 | Trộn Ăn Hoặc Tạt Ao | 19 |
| 8 | Ngăn Bệnh Gan Tái Phát | 22 |
| 9 | Dùng Suốt Vụ Nuôi | 17 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Phác Đồ Gan Tụy Noben | 21 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | SORBEST: thảo dược và acid amin bổ gan, giải độc gan, phục hồi chức năng gan cho tôm. | 85 |
| 2 | Giúp phòng các bệnh gan: teo gan, sưng gan, trắng gan, gan ứ nước, chết rải rác. | 80 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Xem liều trộn ăn, liều tạt ao. Để lại số, kỹ thuật viên Noben gọi lại tư vấn. | 77 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 5. PROTICBEST: vi sinh xử lý đáy

**Chiến dịch:** `gg-proticbest`  
**URL cuối cùng:** `https://thuysannoben.com/lp/proticbest`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-proticbest&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/proticbest?utm_source=google&utm_medium=cpc&utm_campaign=gg-proticbest&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Vi sinh xử lý đáy** (cụm từ và chính xác):

- "vi sinh xử lý đáy ao tôm"  ·  [vi sinh xử lý đáy ao tôm]
- "men vi sinh xử lý nước ao tôm"  ·  [men vi sinh xử lý nước ao tôm]
- "vi sinh gốc cho ao tôm"  ·  [vi sinh gốc cho ao tôm]
- "em gốc cho ao tôm"  ·  [em gốc cho ao tôm]
- "vi sinh ủ cho ao tôm"  ·  [vi sinh ủ cho ao tôm]

**Đáy dơ, nhớt bạt** (cụm từ và chính xác):

- "đáy ao tôm bị dơ"  ·  [đáy ao tôm bị dơ]
- "xử lý nhớt bạt ao tôm"  ·  [xử lý nhớt bạt ao tôm]
- "làm sạch đáy ao bạt"  ·  [làm sạch đáy ao bạt]
- "xử lý bùn đáy ao tôm"  ·  [xử lý bùn đáy ao tôm]

**Tên sản phẩm** (cụm từ và chính xác):

- "proticbest"  ·  [proticbest]
- "proticbest noben"  ·  [proticbest noben]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | PROTICBEST Vi Sinh Gốc | 22 |
| 2 | Đáy Sạch, Bạt Sạch | 18 |
| 3 | Làm Sạch Nhớt Bạt | 17 |
| 4 | Phân Hủy Chất Thải Đáy Ao | 25 |
| 5 | Ổn Định Màu Nước, pH | 20 |
| 6 | Ủ Sục Khí Tăng Sinh Khối | 24 |
| 7 | Cho Ao Bạt, Ao Đất | 18 |
| 8 | Xử Lý Thức Ăn Dư, Tảo Tàn | 25 |
| 9 | Tiết Kiệm Chi Phí Vi Sinh | 25 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Phác Đồ Xử Lý Đáy Ao | 20 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | PROTICBEST: vi sinh gốc làm sạch đáy, sạch nhớt bạt, sạch nước, ổn định màu nước, pH. | 85 |
| 2 | Phân hủy chất thải hữu cơ, thức ăn dư, xác tảo tàn và khí độc đáy ao nuôi tôm. | 78 |
| 3 | Có công thức ủ sục khí trên nhãn để tăng sinh khối. Tạt trực tiếp 1 lít/3.000 m³ nước. | 86 |
| 4 | Nhà máy Noben Củ Chi, ISO 9001:2015. Để lại số, kỹ thuật viên Noben gọi lại tư vấn. | 83 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 6. SUPER YUCCA: khí độc

**Chiến dịch:** `gg-super-yucca`  
**URL cuối cùng:** `https://thuysannoben.com/lp/super-yucca`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-super-yucca&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/super-yucca?utm_source=google&utm_medium=cpc&utm_campaign=gg-super-yucca&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Khí độc ao tôm** (cụm từ và chính xác):

- "xử lý khí độc ao tôm"  ·  [xử lý khí độc ao tôm]
- "yucca cho ao tôm"  ·  [yucca cho ao tôm]
- "thuốc hấp thụ khí độc ao tôm"  ·  [thuốc hấp thụ khí độc ao tôm]
- "xử lý nh3 ao tôm"  ·  [xử lý nh3 ao tôm]
- "xử lý no2 ao tôm"  ·  [xử lý no2 ao tôm]
- "xử lý h2s ao tôm"  ·  [xử lý h2s ao tôm]

**Nổi đầu** (cụm từ và chính xác):

- "tôm nổi đầu"  ·  [tôm nổi đầu]
- "tôm nổi đầu buổi sáng"  ·  [tôm nổi đầu buổi sáng]
- "cấp cứu tôm nổi đầu"  ·  [cấp cứu tôm nổi đầu]
- "tôm tấp mé"  ·  [tôm tấp mé]

**Tên sản phẩm** (cụm từ và chính xác):

- "super yucca"  ·  [super yucca]
- "super yucca noben"  ·  [super yucca noben]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | SUPER YUCCA Cho Ao Tôm | 22 |
| 2 | Hấp Thụ Nhanh Khí Độc | 21 |
| 3 | Hỗ Trợ Cấp Cứu Nổi Đầu | 22 |
| 4 | Đào Thải Khí Độc Khỏi Ao | 24 |
| 5 | Cải Thiện Ô Nhiễm Ao Nuôi | 25 |
| 6 | Dùng Định Kỳ Hằng Tuần | 22 |
| 7 | 1 Lít Cho 5.000 m³ Nước | 23 |
| 8 | Xử Lý Khí Độc NH3 | 17 |
| 9 | Cho Ao Bạt, Ao Đất | 18 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Phác Đồ Khí Độc Noben | 21 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | SUPER YUCCA hấp thụ nhanh khí độc, hỗ trợ cấp cứu khi tôm nổi đầu, cải thiện môi trường. | 88 |
| 2 | Định kỳ 1 lít/5.000 m³ nước, 7 ngày/lần; khi khí độc cao 1 lít/3.000 m³ (theo nhãn). | 84 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Xem phác đồ khí độc, nổi đầu. Để lại số, kỹ thuật viên Noben gọi lại tư vấn. | 76 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 7. TOP WEIGH: tăng trọng

**Chiến dịch:** `gg-top-weigh`  
**URL cuối cùng:** `https://thuysannoben.com/lp/top-weigh`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-top-weigh&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/lp/top-weigh?utm_source=google&utm_medium=cpc&utm_campaign=gg-top-weigh&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Tăng trọng tôm** (cụm từ và chính xác):

- "thuốc tăng trọng cho tôm"  ·  [thuốc tăng trọng cho tôm]
- "tôm chậm lớn"  ·  [tôm chậm lớn]
- "tôm lớn chậm"  ·  [tôm lớn chậm]
- "thuốc kích thích tôm lớn nhanh"  ·  [thuốc kích thích tôm lớn nhanh]
- "tôm còi lệch cỡ"  ·  [tôm còi lệch cỡ]

**Lột xác, vỏ** (cụm từ và chính xác):

- "tôm lột xác không đều"  ·  [tôm lột xác không đều]
- "tôm bị ốp thân"  ·  [tôm bị ốp thân]
- "tôm vỏ xanh da trời"  ·  [tôm vỏ xanh da trời]

**Tên sản phẩm** (cụm từ và chính xác):

- "top weigh"  ·  [top weigh]
- "top weigh noben"  ·  [top weigh noben]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | TOP WEIGH Cho Tôm | 17 |
| 2 | Tôm Tăng Trọng Nhanh | 20 |
| 3 | Lột Xác Đúng Chu Kỳ | 19 |
| 4 | Acid Amin, Vitamin, Khoáng | 26 |
| 5 | Khắc Phục Ốp Thân, Mềm Vỏ | 25 |
| 6 | Trộn Thức Ăn Theo Tuổi Tôm | 26 |
| 7 | Cho Tôm Thẻ Và Tôm Sú | 21 |
| 8 | Tôm Lên Size Đều | 16 |
| 9 | Phác Đồ Tăng Trọng Noben | 24 |
| 10 | Nhà Máy ISO 9001:2015 | 21 |
| 11 | Giá Nhà Máy, Giao Toàn Quốc | 27 |
| 12 | Tư Vấn Kỹ Thuật Miễn Phí | 24 |
| 13 | Gọi Kỹ Thuật Viên Noben | 23 |
| 14 | Giảm Chi Phí Thức Ăn | 20 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | TOP WEIGH bổ sung acid amin, vitamin, khoáng chất giúp tôm tăng trọng, lột đúng chu kỳ. | 87 |
| 2 | Khắc phục ốp thân, mềm vỏ, vỏ xanh da trời. Trộn 5–10 g/kg thức ăn theo tuổi tôm. | 81 |
| 3 | Sản xuất tại nhà máy Noben Củ Chi, đạt ISO 9001:2015. Giá nhà máy, giao hàng toàn quốc. | 87 |
| 4 | Xem phác đồ tăng trọng khuyên dùng. Để lại số, kỹ thuật viên Noben gọi lại tư vấn. | 82 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.

---

## 8. Tuyển đại lý

**Chiến dịch:** `gg-tuyen-dai-ly`  
**URL cuối cùng:** `https://thuysannoben.com/tuyen-dai-ly`  
**Mẫu theo dõi (Final URL suffix):** `utm_source=google&utm_medium=cpc&utm_campaign=gg-tuyen-dai-ly&utm_term={keyword}&utm_content={creative}`  
**URL đầy đủ để kiểm tra:** `https://thuysannoben.com/tuyen-dai-ly?utm_source=google&utm_medium=cpc&utm_campaign=gg-tuyen-dai-ly&utm_term={keyword}&utm_content={creative}`

### Nhóm từ khóa

**Đại lý thuốc thủy sản** (cụm từ và chính xác):

- "tuyển đại lý thuốc thủy sản"  ·  [tuyển đại lý thuốc thủy sản]
- "làm đại lý thuốc thủy sản"  ·  [làm đại lý thuốc thủy sản]
- "mở đại lý thuốc thủy sản"  ·  [mở đại lý thuốc thủy sản]
- "nhà phân phối thuốc thủy sản"  ·  [nhà phân phối thuốc thủy sản]
- "đại lý thuốc thú y thủy sản"  ·  [đại lý thuốc thú y thủy sản]

**Nhập hàng giá gốc** (cụm từ và chính xác):

- "nhập thuốc thủy sản giá sỉ"  ·  [nhập thuốc thủy sản giá sỉ]
- "nguồn hàng thuốc thủy sản"  ·  [nguồn hàng thuốc thủy sản]
- "công ty sản xuất thuốc thủy sản"  ·  [công ty sản xuất thuốc thủy sản]
- "nhà máy thuốc thủy sản"  ·  [nhà máy thuốc thủy sản]

**Kinh doanh vật tư** (cụm từ và chính xác):

- "mở cửa hàng thuốc thủy sản"  ·  [mở cửa hàng thuốc thủy sản]
- "kinh doanh thuốc thủy sản"  ·  [kinh doanh thuốc thủy sản]
- "mở đại lý vật tư nuôi tôm"  ·  [mở đại lý vật tư nuôi tôm]

### Quảng cáo tìm kiếm thích ứng (RSA)

| # | Tiêu đề (≤ 30 ký tự) | Số ký tự |
|---|---|---|
| 1 | Tuyển Đại Lý Thủy Sản | 21 |
| 2 | Làm Đại Lý Noben | 16 |
| 3 | Nhập Hàng Giá Nhà Máy | 21 |
| 4 | Gần 100 Sản Phẩm | 16 |
| 5 | Chiết Khấu Theo Sản Lượng | 25 |
| 6 | Kỹ Thuật Viên Hỗ Trợ | 20 |
| 7 | Giao Hàng Toàn Quốc | 19 |
| 8 | Nhà Máy ISO 9001:2015 | 21 |
| 9 | Sản Xuất Từ Năm 2002 | 20 |
| 10 | Nhà Máy Tại Củ Chi | 18 |
| 11 | Nhận Bảng Giá Đại Lý | 20 |
| 12 | Gọi Kỹ Thuật Viên Noben | 23 |
| 13 | Chưa Có Cửa Hàng Vẫn Được | 25 |
| 14 | Vi Sinh, Khoáng, Bổ Sung | 24 |
| 15 | Thuốc Thủy Sản Noben | 20 |

| # | Mô tả (≤ 90 ký tự) | Số ký tự |
|---|---|---|
| 1 | Noben tuyển đại lý thuốc thủy sản tại các vùng nuôi: nhập giá nhà máy, gần 100 sản phẩm. | 88 |
| 2 | Chiết khấu, thưởng theo sản lượng nhập. Kỹ thuật viên hỗ trợ sản phẩm, phác đồ, ca khó. | 87 |
| 3 | Nhà máy Noben tại Củ Chi, TP.HCM, đạt ISO 9001:2015, sản xuất từ 2002. Giao toàn quốc. | 86 |
| 4 | Để lại số điện thoại, phòng kinh doanh Noben gọi lại gửi bảng giá và chính sách đại lý. | 87 |

**Ghim gợi ý:** tiêu đề 1 ghim vị trí 1 (tên sản phẩm hoặc "Tuyển Đại Lý"); tiêu đề 12 (lời mời gọi) ghim vị trí 3. Còn lại để Google tự xoay.
