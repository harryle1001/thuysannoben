# Quảng cáo Facebook (Meta Ads) cho các landing page

8 trang đích: 7 trang sản phẩm `/lp/<slug>` và trang `/tuyen-dai-ly`. Mỗi trang có 3 phiên bản quảng cáo để chạy thử A/B, gợi ý đối tượng và ngân sách thử nghiệm.

## Trước khi chạy: đọc kỹ

1. **Giấy xác nhận nội dung quảng cáo.** Theo Luật Thú y, quảng cáo thuốc thú y (kể cả thuốc thủy sản) phải được cơ quan thú y xác nhận nội dung trước khi chạy. Kiểm tra với phòng pháp chế hoặc Cục Chăn nuôi và Thú y cho từng sản phẩm, nhất là G7 và SORBEST (nhóm phòng trị bệnh). Ghi số xác nhận vào đây: [ĐIỀN: số giấy xác nhận nội dung quảng cáo cho từng sản phẩm, nếu có].
2. **Chính sách Meta.**
   - Không cam kết chữa khỏi, không hứa "100%", "hết bệnh", "không chết con nào".
   - Không đưa số liệu hiệu quả nếu không có trên nhãn.
   - Không dùng ảnh trước/sau giả.
   - Không viết kiểu nhắm vào đặc điểm cá nhân của người xem ("Bạn đang lỗ vốn?").
   - Mọi câu trong file này đã viết theo hướng đó; khi sửa, giữ nguyên tinh thần.
3. **Link phải giữ nguyên UTM.** Trang quản trị `/quan-tri/lien-he` đọc `utm_source` và `utm_campaign` để biết khách đến từ quảng cáo nào. Quy ước:
   - `utm_source=facebook`
   - `utm_medium=paid` (quảng cáo trả tiền; bài đăng thường dùng `social`)
   - `utm_campaign=<tên chiến dịch>`
   - `utm_content=<phiên bản A, B hay C>`
4. **Định dạng.** Ưu tiên video dọc 9:16 (Reels, Tin) và video vuông/ngang cho Bảng tin. 3 sản phẩm đã có video: G7, CAPHOTE, AQUALAC FS (`public/media/ads/`). Sản phẩm khác dùng ảnh sản phẩm (`public/images/products/<slug>.webp`) đặt trên nền ảnh ao thật, hoặc quay video theo `video-ngan.md`.
5. **Mục tiêu chiến dịch gợi ý:** "Khách hàng tiềm năng" (Leads) với đích là trang web (form gọi lại trên landing page), hoặc "Lượt truy cập" khi mới bắt đầu, ngân sách nhỏ. Bật Meta Pixel nếu đã gắn: [ĐIỀN: mã Pixel nếu có].

## Đối tượng chung cho các sản phẩm cho tôm

**Khu vực:** chọn theo tỉnh, hoặc ghim bản đồ bán kính 15–25 km quanh các vùng nuôi tôm tập trung:
- **Đồng bằng sông Cửu Long:** Cà Mau (gồm Bạc Liêu cũ), Cần Thơ (gồm Sóc Trăng cũ), Vĩnh Long (gồm Bến Tre, Trà Vinh cũ), An Giang (gồm Kiên Giang cũ), Đồng Tháp (gồm Tiền Giang cũ), Tây Ninh (gồm Long An cũ).
- **Miền Trung:** Khánh Hòa (gồm Ninh Thuận cũ), Lâm Đồng (gồm Bình Thuận cũ), Quảng Ngãi, Đà Nẵng (gồm Quảng Nam cũ), Huế, Quảng Trị, Hà Tĩnh, Nghệ An, Thanh Hóa.
- **Miền Bắc:** Quảng Ninh, Hải Phòng, Ninh Bình (gồm Nam Định cũ).
- Lưu ý: từ 1/7/2025 nhiều tỉnh đã sáp nhập. Nếu Meta chưa cập nhật tên tỉnh mới, dùng ghim bản đồ theo huyện, xã cũ.

**Độ tuổi:** 25–60. **Giới tính:** tất cả (thực tế người quyết định mua thường là nam 30–55, nhưng để Meta tự tối ưu).

**Sở thích (Detailed targeting):**
- Nuôi trồng thủy sản (Aquaculture)
- Nuôi tôm (Shrimp farming)
- Thủy sản, Ngư nghiệp (Fishery)
- Nông nghiệp (Agriculture)
- Thức ăn chăn nuôi (Animal feed)
- Tôm (Shrimp)

Trong 3–5 ngày đầu, nên để **Advantage+ audience** bật (mở rộng tự động) với khu vực đã khoanh vùng. Vùng nuôi tôm khá hẹp nên sở thích chỉ là gợi ý.

**Loại trừ:** người đã gửi form (tạo Custom Audience từ danh sách số điện thoại xuất CSV ở `/quan-tri/lien-he`, cập nhật mỗi tuần).

**Đối tượng tương tự (sau 2–4 tuần):** tạo Lookalike 1–3% từ danh sách khách đã chốt (trạng thái "Đã chốt" trong trang quản trị).

## Ngân sách thử nghiệm A/B chung

| Giai đoạn | Thời gian | Cách làm | Ngân sách gợi ý |
|---|---|---|---|
| Thử nghiệm | 5–7 ngày | 1 chiến dịch / sản phẩm, 1 nhóm quảng cáo, 3 mẫu A, B, C cùng chạy | [ĐIỀN: ngân sách/ngày]; gợi ý bắt đầu 100.000–150.000 đ/ngày cho mỗi sản phẩm |
| Đánh giá | ngày 7 | Coi chi phí mỗi khách để lại số (CPL) trong Ads Manager, đối chiếu số khách thật ở `/quan-tri/lien-he` theo `utm_content` | – |
| Mở rộng | tuần 2 trở đi | Tắt mẫu có CPL cao nhất, tăng ngân sách mẫu tốt nhất 20–30% mỗi 2–3 ngày | [ĐIỀN] |

Quy tắc chung: mỗi mẫu cần tối thiểu khoảng 1.000–2.000 lượt hiển thị trước khi kết luận. Thay đổi một thứ mỗi lần (chữ, hoặc hình, hoặc đối tượng) để biết cái gì làm khác biệt.

**Ưu tiên chạy:** G7, CAPHOTE, AQUALAC FS trước (đã có video), sau đó SUPER YUCCA, SORBEST, PROTICBEST, TOP WEIGH. Trang tuyển đại lý chạy song song với ngân sách riêng.

---

## 1. G7: bổ gan, giải độc gan cho tôm

**Trang đích:** `https://thuysannoben.com/lp/g7`
**Video:** `g7-phong-va-tri-benh-gan-chet-som-9x16.mp4` (Reels, Tin), `g7-phong-va-tri-benh-gan-chet-som-16x9.mp4` (Bảng tin)

### Phiên bản A: nỗi lo gan tụy
- **Văn bản chính:**
  Gan tôm nhạt màu, sưng hoặc teo nhỏ là dấu hiệu tôm đang yếu.
  G7 của Noben là hỗn hợp thảo dược và acid amin giúp bổ gan, giải độc gan, phục hồi chức năng gan, phòng các bệnh gan thường gặp trên tôm.
  ✅ Dùng trộn thức ăn hằng ngày hoặc tạt ao
  ✅ Sản xuất tại nhà máy ISO 9001:2015, Củ Chi
  Để lại số, kỹ thuật Noben gọi lại tư vấn liều dùng cho ao nhà mình.
- **Tiêu đề:** Gan tôm khỏe từ những ngày đầu
- **Mô tả:** Thảo dược bổ gan cho tôm
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/g7?utm_source=facebook&utm_medium=paid&utm_campaign=fb-g7&utm_content=a`

### Phiên bản B: cách dùng đơn giản
- **Văn bản chính:**
  Trộn 3–5 ml G7 cho mỗi kg thức ăn, cho ăn 2 lần/ngày, dùng 3–5 ngày, nghỉ 5 ngày rồi lặp lại (theo nhãn).
  Thảo dược và acid amin giúp bổ gan, giải độc gan, tăng đề kháng cho tôm thẻ, tôm sú.
  Giá nhà máy, có đại lý tại nhiều vùng nuôi. Bấm để xem đầy đủ hướng dẫn và để lại số nhận tư vấn.
- **Tiêu đề:** G7: trộn ăn hoặc tạt ao đều được
- **Mô tả:** Giá nhà máy, tư vấn miễn phí
- **Nút:** Gửi tin nhắn (hoặc Tìm hiểu thêm nếu chạy về web)
- **Link:** `https://thuysannoben.com/lp/g7?utm_source=facebook&utm_medium=paid&utm_campaign=fb-g7&utm_content=b`

### Phiên bản C: uy tín nhà sản xuất
- **Văn bản chính:**
  Noben sản xuất thuốc thủy sản tại Củ Chi, TP.HCM từ năm 2002. Nhà máy đạt chuẩn ISO 9001:2015.
  G7 là sản phẩm chăm gan tụy cho tôm: bổ gan, giải độc gan, phòng các bệnh gan như teo gan, sưng gan, trắng gan, gan ứ nước.
  Muốn biết phác đồ gan ruột đầy đủ, mời bà con xem trang dưới hoặc gọi 0934 246 420.
- **Tiêu đề:** Thảo dược bổ gan từ nhà máy Noben
- **Mô tả:** Hotline/Zalo 0934 246 420
- **Nút:** Gọi ngay (chiến dịch Cuộc gọi) hoặc Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/g7?utm_source=facebook&utm_medium=paid&utm_campaign=fb-g7&utm_content=c`

**Đối tượng riêng:** đối tượng chung + sở thích "Shrimp farming". Ngân sách: theo bảng chung.

---

## 2. CAPHOTE: siêu khoáng, cứng vỏ nhanh

**Trang đích:** `https://thuysannoben.com/lp/caphote`
**Video:** `caphote-9x16.mp4`, `caphote-16x9.mp4`

### Phiên bản A: tôm mềm vỏ
- **Văn bản chính:**
  Tôm lột xong vỏ mềm lâu, cong thân, đục cơ?
  CAPHOTE siêu khoáng của Noben bổ sung khoáng vi lượng và đa lượng ở dạng dễ hấp thụ, giúp tôm cứng vỏ nhanh, vỏ dày, phòng ngừa cong thân, đục cơ, trắng lưng.
  ✅ Tạt ao định kỳ hoặc trộn thức ăn hằng ngày
  ✅ Dùng cho ao bạt, ao đất
  Bấm để xem liều dùng và nhận tư vấn.
- **Tiêu đề:** Tôm cứng vỏ nhanh, vỏ dày
- **Mô tả:** Siêu khoáng cho ao bạt, ao đất
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/caphote?utm_source=facebook&utm_medium=paid&utm_campaign=fb-caphote&utm_content=a`

### Phiên bản B: mùa khô, độ mặn thay đổi
- **Văn bản chính:**
  Mùa khô độ mặn thay đổi, tôm dễ khó lột, mềm vỏ.
  Bổ sung khoáng đều đặn với CAPHOTE: tạt 1 lít/2.000 m³ nước để kích thích lột và cứng vỏ, hoặc trộn 5 ml/kg thức ăn hằng ngày (theo nhãn).
  Sản xuất tại nhà máy Noben, Củ Chi. Để lại số, kỹ thuật gọi lại tư vấn.
- **Tiêu đề:** Siêu khoáng CAPHOTE cho mùa khô
- **Mô tả:** Giá nhà máy, tư vấn miễn phí
- **Nút:** Đăng ký (Leads) hoặc Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/caphote?utm_source=facebook&utm_medium=paid&utm_campaign=fb-caphote&utm_content=b`

### Phiên bản C: trước thu hoạch
- **Văn bản chính:**
  Chuẩn bị thu tôm cần vỏ cứng, đẹp.
  CAPHOTE có liều dùng riêng trước thu hoạch ghi trên nhãn, giúp tôm cứng vỏ nhanh để thu.
  Xem hướng dẫn đầy đủ và phác đồ khoáng khuyên dùng trên trang sản phẩm.
- **Tiêu đề:** Cứng vỏ nhanh để thu tôm
- **Mô tả:** Xem liều dùng trước thu hoạch
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/caphote?utm_source=facebook&utm_medium=paid&utm_campaign=fb-caphote&utm_content=c`

**Đối tượng riêng:** đối tượng chung. Ưu tiên vùng nuôi độ mặn thấp và vùng nuôi ao bạt mật độ cao.

---

## 3. AQUALAC FS: đường ruột to khỏe

**Trang đích:** `https://thuysannoben.com/lp/aqualac-fs`
**Video:** `aqualac-fs-9x16.mp4`, `aqualac-fs-16x9.mp4`

### Phiên bản A: dấu hiệu đường ruột
- **Văn bản chính:**
  Ruột tôm lỏng, đứt khúc, phân trắng trôi trên mặt nước là lúc cần chăm đường ruột.
  AQUALAC FS của Noben hỗ trợ tiêu hóa, hấp thu thức ăn nhanh, hỗ trợ ngăn ngừa phân trắng, trống đường ruột và làm to đường ruột.
  ✅ Trộn thức ăn hằng ngày suốt vụ
  ✅ Tăng liều khi tôm có dấu hiệu phân trắng, phân lỏng (theo nhãn)
- **Tiêu đề:** Đường ruột to khỏe, tôm ăn mạnh
- **Mô tả:** Hỗ trợ ngừa phân trắng
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/aqualac-fs?utm_source=facebook&utm_medium=paid&utm_campaign=fb-aqualac-fs&utm_content=a`

### Phiên bản B: tăng trọng
- **Văn bản chính:**
  Tôm tiêu hóa tốt thì hấp thu thức ăn tốt.
  AQUALAC FS: trộn 3 g/kg thức ăn, 2–3 lần mỗi ngày, suốt vụ nuôi (theo nhãn). Giúp làm to đường ruột, hỗ trợ tôm tăng trọng nhanh.
  Giá nhà máy Noben. Để lại số nhận tư vấn phác đồ đường ruột.
- **Tiêu đề:** Hấp thu thức ăn tốt, tôm lớn đều
- **Mô tả:** Trộn thức ăn hằng ngày
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/lp/aqualac-fs?utm_source=facebook&utm_medium=paid&utm_campaign=fb-aqualac-fs&utm_content=b`

### Phiên bản C: phác đồ
- **Văn bản chính:**
  Chăm đường ruột tôm không chỉ một sản phẩm.
  Trên trang AQUALAC FS, Noben gợi ý phác đồ đường ruột khuyên dùng kèm theo (acid hữu cơ, enzyme tiêu hóa, bổ gan) để bà con chọn theo tình trạng ao.
  Có câu hỏi, gọi hoặc Zalo 0934 246 420.
- **Tiêu đề:** Phác đồ đường ruột cho tôm
- **Mô tả:** Tư vấn miễn phí từ kỹ thuật Noben
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/aqualac-fs?utm_source=facebook&utm_medium=paid&utm_campaign=fb-aqualac-fs&utm_content=c`

---

## 4. SORBEST: chăm gan, vượt giai đoạn chết sớm

**Trang đích:** `https://thuysannoben.com/lp/sorbest`
**Hình:** `public/images/products/sorbest.webp` trên nền ảnh ao thật; hoặc video quay theo kịch bản số 3 trong `video-ngan.md`.

### Phiên bản A
- **Văn bản chính:**
  Giai đoạn đầu vụ là lúc gan tôm chịu áp lực lớn.
  SORBEST của Noben là hỗn hợp thảo dược và acid amin giúp bổ gan, giải độc gan, phục hồi chức năng gan, phòng các bệnh gan như teo gan, sưng gan, trắng gan, gan ứ nước.
  Dùng trộn thức ăn hoặc tạt ao. Bấm để xem liều dùng.
- **Tiêu đề:** Gan khỏe ngay từ đầu vụ
- **Mô tả:** Thảo dược và acid amin
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/sorbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-sorbest&utm_content=a`

### Phiên bản B
- **Văn bản chính:**
  SORBEST: trộn 10 g/kg thức ăn, 2–3 lần mỗi ngày suốt vụ; hoặc tạt 500 g/2.000 m³ nước, 5–7 ngày/lần (theo nhãn).
  Có thể dùng kết hợp acid hữu cơ DAVI CID LIQUID.
  Sản xuất tại nhà máy ISO 9001:2015 của Noben.
- **Tiêu đề:** SORBEST: dùng đơn giản, dùng suốt vụ
- **Mô tả:** Giá nhà máy, tư vấn miễn phí
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/lp/sorbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-sorbest&utm_content=b`

### Phiên bản C
- **Văn bản chính:**
  Bắt tôm soi gan: gan vàng nâu, căng là tốt; gan nhạt, teo là cần chăm.
  Noben có bài hướng dẫn nhận biết gan tôm và phác đồ gan tụy khuyên dùng cùng SORBEST. Xem ngay hoặc để lại số để kỹ thuật gọi lại.
- **Tiêu đề:** Nhìn gan tôm, biết ao khỏe hay yếu
- **Mô tả:** Kỹ thuật Noben tư vấn miễn phí
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/sorbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-sorbest&utm_content=c`

> G7 và SORBEST cùng nhóm gan tụy. Không chạy cả hai cho cùng một đối tượng cùng lúc; chạy G7 trước (có video), SORBEST sau hoặc ở vùng khác.

---

## 5. PROTICBEST: vi sinh gốc làm sạch đáy

**Trang đích:** `https://thuysannoben.com/lp/proticbest`
**Hình:** ảnh sản phẩm + ảnh thùng ủ vi sinh sục khí tại ao (kịch bản số 5 trong `video-ngan.md`).

### Phiên bản A
- **Văn bản chính:**
  Đáy ao dơ, bạt nhớt, nước có mùi?
  PROTICBEST là vi sinh gốc của Noben: làm sạch đáy, sạch nhớt bạt, sạch nước; phân hủy chất thải hữu cơ, thức ăn dư, xác tảo tàn và khí độc đáy ao; giúp ổn định màu nước, pH.
  Bấm xem cách dùng.
- **Tiêu đề:** Đáy sạch, bạt sạch, nước trong
- **Mô tả:** Vi sinh gốc cho ao bạt, ao đất
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/proticbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-proticbest&utm_content=a`

### Phiên bản B
- **Văn bản chính:**
  Ủ sục khí PROTICBEST 12–24 giờ với đường và thức ăn số 0 để tăng sinh khối trước khi tạt, giúp tiết kiệm chi phí (công thức ủ có trên nhãn và trang sản phẩm).
  Tạt trực tiếp: 1 lít/3.000 m³ nước, 3–5 ngày/lần.
- **Tiêu đề:** Ủ vi sinh đúng cách, tiết kiệm hơn
- **Mô tả:** Công thức ủ ghi rõ trên nhãn
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/proticbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-proticbest&utm_content=b`

### Phiên bản C
- **Văn bản chính:**
  Cuối vụ, thức ăn nhiều, chất thải đáy ao tích tụ nhanh.
  Kết hợp vi sinh gốc PROTICBEST với SUPER YUCCA, zeolite theo phác đồ xử lý đáy của Noben. Để lại số, kỹ thuật tư vấn liều theo diện tích ao.
- **Tiêu đề:** Phác đồ xử lý đáy ao cuối vụ
- **Mô tả:** Giá nhà máy, tư vấn miễn phí
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/lp/proticbest?utm_source=facebook&utm_medium=paid&utm_campaign=fb-proticbest&utm_content=c`

---

## 6. SUPER YUCCA: hấp thụ khí độc

**Trang đích:** `https://thuysannoben.com/lp/super-yucca`

### Phiên bản A
- **Văn bản chính:**
  Khí độc tăng là tôm giảm ăn, dễ nổi đầu.
  SUPER YUCCA của Noben hấp thụ nhanh các loại khí độc, hỗ trợ cấp cứu khi tôm nổi đầu, phân hủy và đào thải khí độc ra khỏi ao nuôi.
  Bấm xem liều dùng định kỳ và liều khi khí độc cao.
- **Tiêu đề:** Kiểm soát khí độc ao tôm
- **Mô tả:** Dùng định kỳ hằng tuần
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/super-yucca?utm_source=facebook&utm_medium=paid&utm_campaign=fb-super-yucca&utm_content=a`

### Phiên bản B
- **Văn bản chính:**
  Định kỳ 7 ngày/lần: 1 lít SUPER YUCCA cho 5.000 m³ nước. Khi khí độc cao: 1 lít/3.000 m³ (theo nhãn).
  Tạt lúc sáng sớm hoặc chiều mát, mở quạt cho sản phẩm phân tán đều.
  Không biết ao mình bao nhiêu khối? Dùng công cụ Tính liều miễn phí trên web Noben.
- **Tiêu đề:** 1 lít cho 5.000 m³ nước
- **Mô tả:** Kèm công cụ tính liều miễn phí
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/super-yucca?utm_source=facebook&utm_medium=paid&utm_campaign=fb-super-yucca&utm_content=b`

### Phiên bản C
- **Văn bản chính:**
  Đêm lặng gió, sáng sớm tôm tấp mé?
  Mở quạt ngay, ngưng cho ăn, rồi xử lý khí độc. Noben có phác đồ khí độc với SUPER YUCCA, OXY 99, PROTICBEST và zeolite. Xem chi tiết hoặc gọi kỹ thuật 0934 246 420.
- **Tiêu đề:** Phác đồ khí độc, nổi đầu
- **Mô tả:** Hotline/Zalo 0934 246 420
- **Nút:** Gọi ngay
- **Link:** `https://thuysannoben.com/lp/super-yucca?utm_source=facebook&utm_medium=paid&utm_campaign=fb-super-yucca&utm_content=c`

**Lịch chạy riêng:** tăng ngân sách vào các đợt trời âm u, mưa trái mùa (theo dõi bản tin thời tiết).

---

## 7. TOP WEIGH: tăng trọng, tiết kiệm thức ăn

**Trang đích:** `https://thuysannoben.com/lp/top-weigh`

### Phiên bản A
- **Văn bản chính:**
  Tôm lột không đều, ốp thân, mềm vỏ, chậm lên size?
  TOP WEIGH của Noben bổ sung acid amin, vitamin và khoáng chất, giúp tôm tăng trọng nhanh, lột xác đúng chu kỳ, khắc phục ốp thân, mềm vỏ, vỏ xanh da trời.
- **Tiêu đề:** Tôm lớn nhanh, lột đúng chu kỳ
- **Mô tả:** Acid amin, vitamin, khoáng chất
- **Nút:** Tìm hiểu thêm
- **Link:** `https://thuysannoben.com/lp/top-weigh?utm_source=facebook&utm_medium=paid&utm_campaign=fb-top-weigh&utm_content=a`

### Phiên bản B
- **Văn bản chính:**
  Thức ăn là chi phí lớn nhất của vụ nuôi.
  Theo nhãn sản phẩm, TOP WEIGH giúp giảm 10–15% lượng thức ăn nhờ tôm hấp thu dinh dưỡng tốt hơn.
  Tôm dưới 45 ngày trộn 5 g/kg thức ăn, trên 45 ngày trộn 10 g/kg (theo nhãn).
- **Tiêu đề:** Giảm chi phí thức ăn cho vụ nuôi
- **Mô tả:** Giá nhà máy Noben
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/lp/top-weigh?utm_source=facebook&utm_medium=paid&utm_campaign=fb-top-weigh&utm_content=b`

> Kiểm tra lại với phòng kỹ thuật rằng câu "giảm 10–15% lượng thức ăn" nằm trên nhãn đã được duyệt. Nếu chưa có giấy xác nhận quảng cáo cho câu này, chỉ chạy phiên bản A và C.

### Phiên bản C
- **Văn bản chính:**
  Ao thu trước Tết cần tôm lên size đều.
  Kết hợp TOP WEIGH với men tiêu hóa, bổ gan và vitamin C theo phác đồ tăng trọng của Noben. Để lại số, kỹ thuật gọi lại tư vấn theo tuổi tôm.
- **Tiêu đề:** Phác đồ tăng trọng cuối vụ
- **Mô tả:** Tư vấn miễn phí
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/lp/top-weigh?utm_source=facebook&utm_medium=paid&utm_campaign=fb-top-weigh&utm_content=c`

---

## 8. Tuyển đại lý (`/tuyen-dai-ly`)

**Trang đích:** `https://thuysannoben.com/tuyen-dai-ly`
**Hình:** `/images/brand/banner-1.webp`; tốt nhất là ảnh thật kho hàng, xe giao hàng, dây chuyền nhà máy.

### Phiên bản A: lợi ích
- **Văn bản chính:**
  Noben tìm đại lý thuốc thủy sản tại các vùng nuôi tôm, cá.
  🤝 Nhập hàng giá nhà máy, gần 100 sản phẩm
  🤝 Chiết khấu, thưởng theo sản lượng
  🤝 Kỹ thuật viên hỗ trợ sản phẩm, phác đồ, ca khó tại ao
  🤝 Giao hàng toàn quốc từ nhà máy Củ Chi
  Để lại số, phòng kinh doanh gửi bảng giá và chính sách đại lý.
- **Tiêu đề:** Làm đại lý thuốc thủy sản Noben
- **Mô tả:** Giá nhà máy, giao toàn quốc
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/tuyen-dai-ly?utm_source=facebook&utm_medium=paid&utm_campaign=fb-tuyen-dai-ly&utm_content=a`

### Phiên bản B: nhà sản xuất
- **Văn bản chính:**
  Nhập trực tiếp từ nhà sản xuất: Noben làm thuốc thủy sản từ năm 2002, nhà máy tại Củ Chi đạt chuẩn ISO 9001:2015.
  Đủ 4 nhóm: chế phẩm sinh học và xử lý môi trường, khoáng chất, thức ăn bổ sung, gây màu nước và diệt ốc.
  Đại lý được kỹ thuật viên hỗ trợ tư vấn cho bà con.
- **Tiêu đề:** Nhập hàng tận gốc nhà máy
- **Mô tả:** Chiết khấu theo sản lượng
- **Nút:** Nhận báo giá
- **Link:** `https://thuysannoben.com/tuyen-dai-ly?utm_source=facebook&utm_medium=paid&utm_campaign=fb-tuyen-dai-ly&utm_content=b`

### Phiên bản C: chưa có cửa hàng
- **Văn bản chính:**
  Anh chị là kỹ thuật viên, chủ trại lớn, hoặc rành nghề nuôi và muốn mở điểm bán thuốc thủy sản?
  Noben trao đổi để chọn hình thức hợp tác phù hợp, tư vấn danh mục nhập ban đầu theo quy mô và vùng nuôi.
  Gọi 0934 246 420 hoặc để lại số trên web.
- **Tiêu đề:** Chưa có cửa hàng vẫn đăng ký được
- **Mô tả:** Noben tư vấn từ đầu
- **Nút:** Đăng ký
- **Link:** `https://thuysannoben.com/tuyen-dai-ly?utm_source=facebook&utm_medium=paid&utm_campaign=fb-tuyen-dai-ly&utm_content=c`

**Đối tượng riêng:**
- Khu vực: cùng vùng nuôi tôm như trên; ưu tiên tỉnh, huyện chưa có đại lý Noben. Danh sách đại lý hiện có: xem `/dai-ly`.
- Độ tuổi: 25–55.
- Sở thích: Kinh doanh nhỏ (Small business), Chủ doanh nghiệp (Business owners), Nuôi trồng thủy sản, Thức ăn chăn nuôi, Nông nghiệp.
- Hành vi (nếu có): Quản trị viên Trang doanh nghiệp (Facebook Page admins), Chủ doanh nghiệp nhỏ.

**Ngân sách:** [ĐIỀN: ngân sách/ngày]; gợi ý 100.000 đ/ngày, chạy 7–10 ngày trước khi đánh giá, vì khách đại lý ít hơn nhưng giá trị cao hơn khách lẻ.
