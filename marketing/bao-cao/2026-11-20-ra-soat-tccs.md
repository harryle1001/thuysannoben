# Rà soát dữ liệu sản phẩm theo hồ sơ TCCS (20/11/2026)

Nguồn: kho `harryle1001/CONG-TY-NOBEN`, ba thư mục `TCCS- XỬ LÝ MÔI TRƯỜNG (62SP)`, `38 TCCS-TA tccs`, `TCCS-7-SAN-PHAM-MOI`. Chưa commit, chưa push: mọi thay đổi đang nằm trong thư mục làm việc để duyệt.

## 1. Việc cần anh quyết trước (quan trọng nhất)

1. **Hồ sơ TCCS mới khác nhiều so với số liệu đang công bố trên CSDL Cục Thủy sản.** So tự động chỉ tiêu chất lượng (bảng 4.2) với bản trích CSDL ngày 16/11/2026 (`ho-so-san-pham/data.json`): 65/93 sản phẩm có chỉ tiêu khác, chỉ 28 trùng. Ví dụ: HEPATIC, LIVER-MAX trên CSDL là Sorbitol 350.000 mg/l, TCCS mới ghi 10.000 mg/l; SORBEST 5.000 → 500 mg/kg; MEGA CID NEW trên CSDL là canxi gluconat 270 mg/l, TCCS mới ghi acid formic 15,9 %, lactic 2,8 %, propionic 3,8 %; nhóm vi sinh xử lý đáy trên CSDL ghi Bacillus subtilis cỡ 10⁶, TCCS ghi Bacillus spp 1 × 10⁹ CFU/kg. Web và nhãn giờ theo TCCS như anh dặn; anh cần chắc là bộ TCCS ngày 01/11/2026 sẽ được nộp cập nhật lên CSDL, nếu không thì web và nhãn lệch với hồ sơ đang lưu hành. Danh sách 65 sản phẩm ở mục 7.
2. **Bốn mã số tiếp nhận trong hồ sơ TCCS trùng mã của sản phẩm khác hoặc lệch CSDL và danh mục 116 SP.** Web đang để theo TCCS, nhãn in thì tôi để `[ĐIỀN]` cho bốn sản phẩm này, chờ anh xác nhận:

   | Sản phẩm | Mã trong hồ sơ TCCS (web đang ghi) | Mã trên CSDL và danh mục 116 SP | Ghi chú |
   |---|---|---|---|
   | PROZYM (web: PROZYME) | 01-001524 | 01-002234 | 01-001524 là mã của PROLAC |
   | BIOTIC 99 | 01-023334 | 01-023341 | web cũ ghi 01-0233341 (thừa một số) |
   | AQUA BIOTIC | 01-001544 | 01-001540 | 01-001544 là mã của AMINOVIT |
   | AQUA C 30% | 01-002236 | 01-002231 | 01-002236 là mã của US LACTO |

   Hai hồ sơ chưa có trên web cũng lệch mã: CANCI MILK ghi 01-001528 (mã của LIVER-MAX, CSDL là 01-061772); VH-LIVER PRO ghi 01-028282 và TCCS 90:2021 (mã của HEPAPLUS, CSDL là 01-063186, TCCS 06:2026).
3. **Nhiều sản phẩm đổi hẳn công dụng và liều vì hồ sơ dùng chung một mẫu.** DOWN MAX và MARIMIX trước giờ bán là sản phẩm hạ phèn, MIRAL N8, PREMIX 10000, RIMIX, MIX 79 có công dụng tăng kiềm; hồ sơ TCCS của cả nhóm chỉ ghi "bổ sung khoáng chất vào môi trường ao nuôi, giúp tôm lột xác" với liều 5 kg/3.000 m³ (trước thả giống) và 5 kg/5.000 m³ (định kỳ). Web đã theo TCCS nên trang sản phẩm không còn chữ hạ phèn, tăng kiềm. Còn lại chưa đụng: tên đường dẫn `down-max-ha-phen`, ảnh sản phẩm, và các bài kiến thức vẫn giới thiệu các sản phẩm này để hạ phèn, tăng kiềm (danh sách ở mục 6.3). Nếu thực tế sản phẩm vẫn dùng để hạ phèn thì cần sửa hồ sơ TCCS, không phải sửa web.
4. **Ghép mơ hồ, tôi không tự ghép hết:**
   - **YUCCA VS ZEO**: tên trùng hồ sơ `43-YUCCA VS ZEO` (02-021732, TCCS 19:2020, saponin 7,5 mg/kg), nhưng mã số web đang ghi (02-037663, TCCS 06:2022) lại là của `57-YUCCA VS ZEO NEW` (SiO2 65 %, Fe2O3 1 %, Al2O3 8 %). Hai hồ sơ giống hệt nhau phần công dụng, liều, quy cách, hạn dùng nên tôi đã cập nhật các phần đó; **thành phần và mã số giữ nguyên như cũ** (thành phần đang trống), nhãn chưa điền mã. Anh cho biết sản phẩm đang bán là bản nào.
   - **BIO MAX**: không có hồ sơ tên BIO MAX. Mã web đang ghi 02-026753 trùng mã ghi trong hồ sơ `55-BIO CALMAX`; trên CSDL thì BIO CALMAX = 02-026753, BIO MAX = 02-026752, còn danh mục 116 SP ghi ngược lại. Chưa sửa gì cho BIO MAX.
   - **SUPER OXY 02**: có hai tệp cùng mã 02-000891. `2-SUPER OXY - O2.doc` ghi chất đệm Dextrose, `2-SUPER OXY O2.doc` ghi chất đệm bột zeolite (và ghi đơn vị "ppm 30%"). Tôi lấy bản Dextrose vì bảng ghi đúng đơn vị và khớp CSDL; web trước đó ghi bột zeolite.
   - **BEN BKC 80%** (đang ẩn): hồ sơ có BEN BKC (02-039607, Benzalkonium Chloride 50 %), tên và hàm lượng không khớp nên không ghép.
5. **Trang tiếng Anh còn một chỗ hiện tiếng Việt: dòng Packaging (quy cách)** ở 39 trang, ví dụ "1 lít, 2 lít", "Gói 227g". Lỗi có từ trước vì `src/en.js` không dịch trường quy cách; tôi không được sửa code nên chưa sửa. Đã thêm sẵn 6 bản dịch quy cách vào `strings.json`; chỉ cần thêm một dòng `packaging: tr(p.packaging),` vào đối tượng trả về trong `src/en.js` (cạnh dòng `composition:`) là hết.
6. **Nhãn in:** không nhãn nào tràn chữ, nhưng số nhãn phải dùng chữ dưới 5,5 pt tăng từ 19 lên 57 (tính trên cả ba khổ thử), nhỏ nhất là SORBEST khổ chai 3,9 pt, nhóm vi sinh 9 dòng hướng dẫn khổ chai 4,3 pt. Tôi không cắt nội dung TCCS. Các tệp `brand/nhan/*.svg` chưa sinh lại; sau khi duyệt chạy `node scripts/build-labels.js`.

## 2. Số liệu tổng quát

| Hạng mục | Số lượng |
|---|---|
| Tệp hồ sơ TCCS đã trích (`content/tccs.json`) | 115 tệp = 106 sản phẩm (62 xử lý môi trường, 37 thức ăn bổ sung, 7 sản phẩm mới) + 9 tệp trùng |
| Sản phẩm web đã ghép chắc chắn và cập nhật đủ các trường | 77 (71 đang hiển thị, 6 đang ẩn; sản phẩm ẩn vẫn ẩn) |
| Sản phẩm web ghép một phần | 1 (YUCCA VS ZEO) |
| Sản phẩm web không có hồ sơ TCCS, giữ nguyên | 26 (14 đang hiển thị, 12 đang ẩn) |
| Hồ sơ TCCS chưa có sản phẩm trên web | 27 |
| Trường dữ liệu đã đổi trong `products.json` | 237 (trong đó 109 chỉ đổi cách ghi, chính tả) |
| Nhãn đã cập nhật trong `brand/labels.json` | 72 |
| Bản dịch tiếng Anh thêm vào `content/en/strings.json` | 135 dòng nội dung + 6 dòng quy cách |

Cách ghép: chuẩn hóa tên (hoa thường, dấu, gạch, khoảng trắng) rồi đối chiếu mã số tiếp nhận và ký hiệu TCCS web đang ghi. Tên khác chút nhưng mã và ký hiệu trùng thì vẫn ghép: SUPER OXY 02 ↔ SUPER OXY – O2, SUPER CUT ALGAE ↔ SUPER CUT ALGA, DOWN MAX ↔ DOWN MAX NEW, VITA C TẠT ↔ VITA C TAT NEW, NB C SORMIN ↔ NB C SORMIN NEW, MEGA CID ↔ MEGA CID NEW, HEPALIVER FS ↔ HEPALIVE-FS, PROZYME ↔ PROZYM, BETA 1.3 ↔ BETA 1,3-1,6 GLUCAN, BRONOPOL ↔ BRONOPOL 99.

### Sản phẩm web KHÔNG có hồ sơ TCCS (không tự điền, giữ nguyên)

- Đang hiển thị (14): AMYLAC, BIO BOOK, NB-BIOPOND, PROTICBEST, TOXIC ALGAE, BIO MAX, NB MIX 5000, NB SORBITOL B12, PROLAC, TOP WEIGH, US LACTO, ANTILIV, BIO MOS, SUN BLUE. Cả 14 đều có trong danh mục 116 SP và CSDL nhưng không có tệp hồ sơ trong ba thư mục TCCS.
- Đang ẩn (12): BEN BKC 80%, SUPER DIN 600, VI SINH 3 TRONG 1, KALIMIX, BUTYPHO, D-OC, FLOPHEN, FLOPHENICOL 40, NB BROWN, PRAZI S, XO 09, ZICOTRIM.

### Hồ sơ TCCS chưa có sản phẩm trên web (27)

- Xử lý môi trường (14): BEN BKC, VH-GLUBENCO PRO, VH-DIO 99, TP66, PRO ALGA NEW (chưa ghi mã số), BENMER, AQUA MICRO, VH-YUCCA C, YUCCA C, SUPER CAL, PREMIX KHOÁNG NEW, NB-MIX 500 NEW, AQUA YUCCA C, BIO CALMAX.
- Thức ăn bổ sung (6): F.X ENZYME, VH-LIVER PRO, F.X ORGANIC, PREMIX ORA, CANCI MILK, VH-CANCIMILK.
- Sản phẩm mới, chưa có mã số (7): F.X LIVER SUPPORT, F.X GARLIC, F.X GROW, F.X PREMIX MILK, F.X-GLUBENCO, F.X PURE, F.X YUCCA RUS.
- Chưa thêm sản phẩm nào lên web.

## 3. Thay đổi đáng chú ý trong `content/products.json`

Bản đầy đủ xem bằng `git diff content/products.json`.

### 3.1 Mã số, ký hiệu TCCS, hạn dùng

| Sản phẩm | Trường | Trước | Sau |
|---|---|---|---|
| NB ALGAE | mã số tiếp nhận | 02-0000897 (sai, trùng mã NB-BIOPOND) | 02-002246 |
| NB ALGAE | ký hiệu TCCS | 20:2020/NOBEN | 25:2020/NOBEN |
| BIOTIC 99 | mã số tiếp nhận | 01-0233341 (thừa một số) | 01-023334 (theo TCCS; CSDL ghi 01-023341, xem mục 1) |
| AQUA BZ | ký hiệu TCCS | 83:2020/NOBEN | 83:2021/NOBEN |
| BIO EDTA | ký hiệu TCCS | 84:2020/NOBEN | 84:2021/NOBEN |
| KIA C TAT | ký hiệu TCCS | 85:2020/NOBEN | 85:2021/NOBEN |
| MIRAL N8 | ký hiệu TCCS | 78:2021/NOBEN | 79:2021/NOBEN (hồ sơ BIO PREMIX cũng ghi 79:2021) |
| SUPER AQUA 80 | ký hiệu TCCS | 12:2022/NOBEN | 12:2020/NOBEN |
| YUCCA 99 | ký hiệu TCCS | 55:2018/NOBEN | 35:2020/NOBEN |
| NB C SORMIN | ký hiệu TCCS | "05: 2022/NOBEN" (thừa dấu cách) | 05:2022/NOBEN |
| 18 sản phẩm | hạn dùng | (trống) | 24 tháng kể từ ngày sản xuất: AQUA SQUICK, AQUA TECH, AQUA YUCCA, BEN MKC 4000, BEN XID 3000, GRAND ZEOLITE, KIA C TAT, YUCCA VS ZEO, BIO PREMIX, DOWN MAX, MARIMIX, MIRAL N8, MIX 79, PREMIX 10000, PREMIX 9999, RIMIX, VITA C TẠT, NB C SORMIN |
| 18 sản phẩm trên | quy cách | (trống) | theo trang công bố của hồ sơ (ví dụ 0,5 kg; 1 kg; … 25 kg) |

### 3.2 Thành phần (17 sản phẩm trước đây để trống, nay có)

| Sản phẩm | Trước | Sau (theo bảng 4.2) |
|---|---|---|
| AQUA SQUICK, AQUA TECH, BEN MKC 4000, BEN XID 3000 | (trống) | Glutaraldehyde (min): 15% · Dung môi (Nước RO) vừa đủ: 1 lít |
| AQUA YUCCA | (trống) | Saponin (từ cây Yucca schidigera) (min): 7,5 mg/kg · Chất đệm (bột zeolite+Dextrose) vừa đủ: 1 kg |
| BIO PREMIX, MARIMIX, MIRAL N8, MIX 79, PREMIX 10000, PREMIX 9999, RIMIX | (trống) | P (dạng CaHPO4) (min): 2.500 mg/kg · Mg (dạng MgO) (min): 1.200 mg/kg · Ca (dạng CaCO3) (min): 2.500 mg/kg · Chất đệm (Dextrose) vừa đủ: 1 kg |
| DOWN MAX | (trống) | Zn (Dạng ZnO) (min): 17.500 mg/kg · Mn (Dạng MnO) (min): 8.540 mg/kg · Mg (Dạng MgO) (min): 6.200 mg/kg · Chất đệm (Dextrose) vừa đủ: 1 kg |
| GRAND ZEOLITE | (trống) | SiO2 (min): 65% · Al2O3 (min): 13% · Fe2O3 (min): 1% · CaO (min): 3% · MgO (min): 0,1% |
| KIA C TAT, VITA C TẠT | (trống) | L-Ascorbate-2-Monophosphate (vitamin C 35%) (min): 250 mg/kg · Vitamin B3 (min): 150 mg/kg · Chất đệm Dextrose vừa đủ: 1 kg |
| NB C SORMIN | (trống) | Vitamin C (min): 315 mg/kg · Mg (MgO) (min): 1.210 mg/kg · Ca (CaHPO4) (min): 1.135 mg/kg · Chất đệm (Dextrose) vừa đủ: 1 kg |
| SUPER OXY 02 | Chất đệm (bột zeo lite): vừa đủ 1 kg | Chất đệm (Dextrose) vừa đủ: 1 kg (hàm lượng 30% giữ nguyên) |

59 sản phẩm còn lại đã có thành phần đúng số liệu TCCS từ trước, lần này chỉ đổi cách ghi cho thống nhất: "… vừa đủ: 1 kg", "1 × 10⁹ CFU/kg" (trước là `1x10<sup>9</sup> cfu/kg`), sửa tên vi khuẩn gõ sai.

### 3.3 Liều dùng đổi con số

| Sản phẩm | Trước | Sau (theo mục 5.2) |
|---|---|---|
| AQUA SQUICK (và 3 sản phẩm ẩn AQUA TECH, BEN MKC 4000, BEN XID 3000) | Trước thả giống 1 lít/2.000 m³; trong vụ 1 lít/3.000–5.000 m³, 7–10 ngày/lần; hỗ trợ xử lý bệnh 1 lít/2.000 m³ | Chuẩn bị ao 1,5 lít/1.000 m³, để 2–3 ngày; trong vụ 1 lít/1.000 m³; pha loãng 100 lần; ngưng trước thu hoạch 15 ngày |
| AQUA YUCCA | Định kỳ 500 g/5.000 m³, 7 ngày/lần; khí độc cao 500 g/3.000 m³ | Định kỳ 1–2 kg/1.000 m³, 7–10 ngày/lần; tôm nổi đầu do khí độc 3–4 kg/1.000 m³ |
| YUCCA VS ZEO | Định kỳ 10 kg/5.000 m³, 7 ngày/lần; khí độc cao 10 kg/3.000 m³ | Định kỳ 1–2 kg/1.000 m³, 7–10 ngày/lần; tôm nổi đầu do khí độc 3–4 kg/1.000 m³ |
| GRAND ZEOLITE | Định kỳ 20 kg/2.000 m², 5 ngày/lần; cấp cứu 20 kg/1.000 m², 2 ngày liên tục | Trước thả giống 10 kg/1.000 m³; định kỳ 10 kg/2.000 m³ |
| DOWN MAX | Trước thả giống 500 g/1.000 m³; trong vụ 500 g/2.000 m³, 3 ngày/lần | Trước thả giống 5 kg/3.000 m³; định kỳ 5 kg/5.000 m³ |
| MARIMIX | Trước thả giống 1 kg/2.000 m³; định kỳ 1 kg/5.000 m³; phèn cao 1 kg/2.000 m³, 2 ngày | Trước thả giống 5 kg/3.000 m³; định kỳ 5 kg/5.000 m³ |
| MIRAL N8, MIX 79, PREMIX 10000, PREMIX 9999, RIMIX | Định kỳ 5 kg/3.000 m³, 2 ngày/lần; tăng kiềm 5 kg/1.500 m³; cứng vỏ nhanh 3–5 kg/2.000 m³ | Trước thả giống 5 kg/3.000 m³; định kỳ 5 kg/5.000 m³ |
| BIO PREMIX | Định kỳ 3 kg/3.000 m³, 2 ngày/lần; cứng vỏ nhanh 3 kg/2.000 m³ | Trước thả giống 5 kg/3.000 m³; định kỳ 5 kg/5.000 m³ |
| KIA C TAT, VITA C TẠT | 5 kg/3.000 m³ khi tôm stress, thời tiết thay đổi (VITA C TẠT: trước khi thả tôm 5 kg/2.000 m³) | Thời tiết thay đổi 5 kg/3.000 m³; khi bị stress 5 kg/2.000 m³ |
| NB C SORMIN | Trộn 5–10 g/kg thức ăn; dịch bệnh 20 g/kg; tạt 1 kg/1.000 m³ | Chỉ còn tạt ao: thời tiết thay đổi 5 kg/3.000 m³; khi bị stress 5 kg/2.000 m³ (hồ sơ là sản phẩm xử lý môi trường) |
| BETA 1.3 | Trộn 5–10 g/kg thức ăn, 2–3 lần/ngày; tạt 1 kg/2.000 m³ khi sốc | Trộn 3–5 g/kg thức ăn, 3 lần/ngày; tôm ăn yếu, giao mùa: liều gấp đôi |
| IODINE 99, BEN IQ | (số liệu giữ nguyên) | Bỏ hai dòng bảo quản lẫn vào mục 5.2; "9000" ghi lại "9.000" |
| HEPATIC, NB HELVIROL B12, LIVER MAX, HEPALIVER FS, G7 | Có dòng "Liều dùng gấp đôi đối với tôm cá bị hiện tượng tiêu chảy, phân trắng, đường ruột đứt khúc…" | Bỏ dòng này (chép nhầm từ hồ sơ men tiêu hóa); các liều khác giữ nguyên |
| Nhóm vi sinh xử lý đáy (AQUA BAC, AQUA BZ, BACPOWER, BZT, CLEAR 12H, NB ALGAE, PRAWNZYME, PRO ALGAE, ROVA OTIC, ROVABIO AP, ROVAZYME) | Hai dòng rời: "…Dùng 1 kg/2.000 m³ nước," và "Sử dụng 2 ngày liên tục với liều như trên." | Nối thành một câu; số liệu giữ nguyên |

### 3.4 Công dụng đổi nội dung (ngoài sửa chính tả)

AQUA SQUICK (bỏ "khử mùi hôi đáy ao", "quản lý tảo"; nay là sát trùng nguồn nước), GRAND ZEOLITE, KIA C TAT, VITA C TẠT, NB C SORMIN, YUCCA VS ZEO, BIO PREMIX, DOWN MAX, MARIMIX, MIRAL N8, MIX 79, PREMIX 10000, PREMIX 9999, RIMIX, và 3 sản phẩm ẩn. BETA 1.3: phần liều trước đây nằm lẫn trong công dụng, nay tách đúng chỗ.

### 3.5 Dòng mô tả ngắn (tagline) đã sửa vì nêu công dụng không có trong TCCS

| Sản phẩm | Trước | Sau |
|---|---|---|
| AQUA SQUICK | Siêu diệt khuẩn, quản lý tảo | Sát trùng nguồn nước |
| DOWN MAX | Giải pháp hạ phèn, giả độc phèn, giải độc kim loại nặng | Bổ sung khoáng chất cần thiết vào môi trường ao nuôi, giúp tôm lột xác và tạo vỏ nhanh hơn |
| MARIMIX | Chuyên gia xử lý phèn nhôm- phèn sắt, giải độc phèn, giải độc nguồn nước | Bổ sung khoáng chất cần thiết vào môi trường ao nuôi, giúp tôm lột xác và tạo vỏ nhanh hơn |
| MIRAL N8, PREMIX 10000 | Khoáng tăng kiềm, cứng vỏ. chuyên dùng cho ao nuôi bạt và ao nuôi truyền thống | Khoáng cứng vỏ, chuyên dùng cho ao nuôi bạt và ao nuôi truyền thống |
| RIMIX | Khoáng tăng kiềm, cứng vỏ - chuyên dùng cho ao nuôi bạt | Khoáng cứng vỏ - chuyên dùng cho ao nuôi bạt |
| NO TOXIN | …môi trường mước ao nuôi | …môi trường nước ao nuôi (sửa lỗi gõ) |

Chưa sửa, để anh xem: MIX 79 ("…hỗ trợ phòng cong thân, đục cơ", TCCS không nêu), GRAND ZEOLITE và YUCCA VS ZEO ("làm sạch đáy ao…", gần đúng với TCCS).

## 4. Quy ước khi đưa chữ TCCS lên web

- Thành phần: mỗi chỉ tiêu một dòng "Tên (min): mức đơn vị"; dung môi, chất đệm ghi "… vừa đủ: 1 lít/1 kg"; vi khuẩn định danh ghi "…: định danh (+)".
- Công dụng lấy mục 5.1, liều dùng lấy mục 5.2, mỗi ý một dòng, giữ `m<sup>3</sup>` như dữ liệu cũ. Quy cách lấy ở trang công bố. Hạn dùng "NN tháng kể từ ngày sản xuất".
- Chữ "trị" trong TCCS đổi thành "hỗ trợ xử lý": DAVI CID liquid và MEGA CID NEW, câu "Trường hợp kết hợp để trị bệnh: Trộn 7- 10ml/1kg thức ăn…" → "Trường hợp kết hợp để hỗ trợ xử lý bệnh: …".
- Dòng không đưa lên web: dòng liều tiêu chảy, phân trắng chép nhầm trong 5 hồ sơ bổ gan (mục 3.3); hai dòng "Bảo quản: …", "Để xa trẻ em." lẫn trong mục 5.2 của IODINE 99, BEN IQ; dòng "Thời hạn sử dụng" lặp hai lần.
- Câu bỏ lửng trong hồ sơ YUCCA 99, SUPER YUCCA, SUPER BIOCA: "Hấp thụ khí độc, cấp cứu khi tôm nổi đầu do khí độc," (nhãn dự kiến trong chính hồ sơ ghi tiếp "cải thiện chất lượng nước ao nuôi"). Web bỏ dấu phẩy cuối, không thêm chữ.

### Lỗi gõ đã sửa (số lần gặp)

tíc tụ → tích tụ (11); FRC → FCR (11); lichenifomis → licheniformis (17); megateri → megaterium (11); mensentericus → mesentericus (11); bacillus subtilis → Bacillus subtilis (6); Lác kỹ → Lắc kỹ (6); tăng tăng cường → tăng cường (4); zeo lite → zeolite (3); cụt râu râu → cụt râu (2); 9000 → 9.000 (2); ô xy → oxy (2); m' → m³ (2, SORBEST); -M onophosphate → -Monophosphate (2); mước → nước (1); thức ăn tột → tốt (1); lơ lững → lơ lửng (1); cói cọc → còi cọc (1); hổ trợ → hỗ trợ (1); Định ỳ → Định kỳ (1); vitamin C → Vitamin C đầu dòng (1); MgO 0.1 → 0,1 (1); thiếu dấu đóng ngoặc ở tên chỉ tiêu; thừa dấu cách trước dấu câu; "....." → "..."; "4lần" → "4 lần"; "1Lít" → "1 lít".

## 5. Lỗi và điểm lạ trong hồ sơ TCCS (nên sửa ở hồ sơ gốc)

**Hai bản cùng một sản phẩm, nội dung khác nhau**

| Tệp | Khác nhau | Bản đã dùng |
|---|---|---|
| `2-SUPER OXY - O2.doc` / `2-SUPER OXY O2.doc` | Chất đệm Dextrose, "% 30" / bột zeolite, "ppm 30%" | bản thứ nhất |
| `25-NO TOXIN.doc` / `25- NOTOXIN.doc` | "g/lít 100, 150, 50" / đơn vị ghi "Lít", mức ghi "100g/lít", tên gõ sai "Sodium lauryi sulfate" | bản thứ nhất |
| `17-BEN COPPER 500.doc` / `17-BEN COPPER.doc` | dung môi "nước RO" / "Nước" | bản thứ nhất |
| `15-TP66.doc` / `15-TP 66.doc` | tên TP66 / TP 66; dung môi "nước RO" / "Nước" | chưa có trên web |
| `3-BEN BKC.doc` / `3-BEN BKC 3000.doc` | "% 50" / "ppm 50 %", bản 3000 ghi nguyên liệu là Glutaraldehyde | chưa có trên web |
| `11-IODINE 99` / `11-IODIN 99`, `23-BRONOPOL 99` / `23-BRONOPOL`, `26-AQUA BAC` / `26-AQUABAC`, `14-HEPATIC` / `19-HEPATIC` | giống hệt nhau | |

**Chép nhầm, thiếu, mâu thuẫn**

- 5 hồ sơ bổ gan đang bán (HEPATIC, NB HELVIROL B12, LIVER-MAX, HEPALIVE-FS, G7) và VH-LIVER PRO, F.X LIVER SUPPORT, F.X GARLIC có dòng liều tiêu chảy, phân trắng của men tiêu hóa.
- Công dụng 5 hồ sơ bổ gan ghi "Bổ sung sorbitol, methionine, Lysine…" nhưng bảng thành phần là Sorbitol, Methionine, Betain (không có Lysine). Web giữ nguyên câu TCCS.
- F.X GARLIC: thành phần và công dụng giống hệt F.X LIVER SUPPORT, không có chỉ tiêu nào liên quan đến tỏi.
- GRAND ZEOLITE: công dụng đầu tiên ghi "Cung cấp oxy nhanh cho ao nuôi" (zeolite không sinh oxy, có vẻ lấy từ mẫu OXY 99). Web đang ghi theo TCCS, anh xem lại.
- OXY 99: mục 1.2 ghi công dụng của khoáng ("Bổ sung khoáng chất… lột xác"), mục 5.1 ghi "Cung cấp nhanh oxy". Web theo mục 5.1.
- YUCCA VS ZEO NEW, AQUA YUCCA C (thành phần SiO2, Fe2O3, Al2O3) dùng nguyên công dụng và liều của YUCCA C; DOWN MAX NEW (Zn, Mn, Mg) và BIO CALMAX dùng nguyên công dụng và liều của SUPER CAL.
- PREMIX KHOÁNG (01-001523): bảng thành phần tính theo mg/kg với chất đệm dextrose, quy cách theo kg, nhưng dạng hàng hóa ghi "Dạng lỏng" và liều ghi "3-5 ml/kg". HI-WEIGH: dạng bột, thành phần "Protein (đạm sữa)" nhưng công dụng ghi "Bổ sung đạm cá" và liều ghi ml/kg. PROZYM: thành phần chỉ có Amylase, Protease nhưng công dụng ghi "Bổ sung lợi khuẩn".
- BETA 1,3-1,6 GLUCAN: thiếu tiêu đề "5.2 Hướng dẫn sử dụng" (liều dùng nằm liền sau công dụng). VH-CANXI MILK: tiêu đề ghi "5.3" thay vì "5.2"; tên ở trang tiêu chuẩn là VH-CANCIMILK.
- SORBEST: "cho ăn ngày 3 - lần" (thiếu số), "tạt cách xa bờ 1,5 -20m" (có lẽ là 1,5 - 2,0 m). HUFA: "cho ăn 2-3/ ngày" (thiếu chữ lần). Web giữ nguyên các chỗ này vì không chắc ý gốc.
- Tên tệp gõ sai: `12-F.X EMZYME` (tên trong hồ sơ F.X ENZYME), `35-F.X OGANIX` (F.X ORGANIC), `17-HEPALIVE-FS` (danh mục ghi HEPALIVER-FS), `37-CANCI MILK` / `38-VH-CANXI MILK`.
- Ký hiệu TCCS: MIRAL N.8 và BIO PREMIX cùng ghi 79:2021 (danh mục: MIRAL N.8 là 78:2021); AQUALAC-FS, PRO AQ, BIOZYME ghi 86, 87, 88:2020 trong khi CSDL ghi :2021.
- Quy cách ở trang công bố khác mục 6.1 trong 34 tệp hồ sơ (30 sản phẩm) (ví dụ trang công bố "250ml … 5 lít", mục 6.1 thêm "10 lít, 20 lít"; bột "0,5 kg…" so với "100 g; 200 g…"). Web lấy theo trang công bố. Chi tiết từng hồ sơ nằm ở trường `canh_bao` trong `content/tccs.json`.
- Hồ sơ PRO ALGA NEW và 7 sản phẩm F.X mới chưa ghi mã số tiếp nhận.
- Các căn cứ pháp lý trong quyết định ban hành có ngày chưa khớp nhau (Nghị định 37/2026/NĐ-CP ghi cả 23/11/2026 và 23/01/2026, trong khi hồ sơ ký 01/11/2026).

## 6. Chỗ đã sửa ngoài `products.json`

### 6.1 `brand/labels.json` (72 nhãn)

Cập nhật `cong_dung`, `huong_dan`, `thanh_phan`, `quy_cach` (ghi nguồn "theo hồ sơ TCCS (trang công bố)"), `bao_quan` ("Nơi khô, thoáng, tránh ánh nắng trực tiếp. Để xa tầm tay trẻ em."), `phu_de` (lấy theo dòng mô tả ngắn trên web, vì phụ đề cũ còn các câu như "Phòng và trị…", "Tiêu diệt nhanh… vi rus"), và `phap_ly.so_dang_ky` cho 67 nhãn. Năm nhãn để `[ĐIỀN]`: PROZYME, BIOTIC 99, AQUA BIOTIC, AQUA C30% (mã đang tranh chấp) và YUCCA VS ZEO. 22 nhãn của sản phẩm không có hồ sơ TCCS giữ nguyên, trong đó vẫn còn chữ cũ.

### 6.2 Bài kiến thức và landing: 31 chỗ tiếng Việt, 7 chỗ tiếng Anh

| Tệp (trong `content/`) | Trước | Sau |
|---|---|---|
| `kien-thuc/ao-tom-bi-phen-dau-hieu-cach-xu-ly.md` | - Bổ sung khoáng tăng kiềm như [MIX 79](/san-pham/mix-79) hoặc [MIRAL N8](/san-pham/miral-n8): **5 kg cho 1.500 m³ nước**, dùng liên tục 2 ngày khi cần tăng kiềm, tạt và… | - Bổ sung khoáng như [MIX 79](/san-pham/mix-79) hoặc [MIRAL N8](/san-pham/miral-n8): định kỳ **5 kg cho 5.000 m³ nước** (trước khi thả giống 5 kg cho 3.000 m³), hòa với … |
| `kien-thuc/ao-tom-bi-phen-dau-hieu-cach-xu-ly.md` | - [DOWN MAX](/san-pham/down-max-ha-phen): hạ phèn, giải độc phèn, tẩy phèn dính chân và mang tôm. Trong quá trình nuôi dùng **500 g cho 2.000 m³ nước**, định kỳ 3 ngày/l… | - [DOWN MAX](/san-pham/down-max-ha-phen): theo hồ sơ công bố là khoáng bổ sung vào môi trường ao nuôi, giúp tôm lột xác đúng chu kỳ, vỏ cứng dày. Định kỳ dùng **5 kg cho… |
| `kien-thuc/ao-tom-bi-phen-dau-hieu-cach-xu-ly.md` | - [MARIMIX](/san-pham/marimix): chuyên xử lý phèn nhôm, phèn sắt. Khi phèn cao dùng **1 kg cho 2.000 m³ nước**, xử lý 2 ngày liên tục; định kỳ dùng 1 kg cho 5.000 m³, 3 … | - [MARIMIX](/san-pham/marimix): theo hồ sơ công bố là khoáng bổ sung vào môi trường ao nuôi, giúp tôm lột xác đúng chu kỳ, vỏ cứng dày. Định kỳ dùng **5 kg cho 5.000 m³ … |
| `kien-thuc/ao-tom-bi-phen-dau-hieu-cach-xu-ly.md` | (ví dụ DOWN MAX 3 ngày/lần) | (ví dụ DOWN MAX 5 kg cho 5.000 m³ nước) |
| `kien-thuc/ao-tom-bi-sup-tao-rot-tao-cach-xu-ly.md` | [AQUA YUCCA](/san-pham/aqua-yucca) 500 g cho 3.000 m³ nước khi khí độc cao, dùng liên tục 2 đến 3 lần. | [AQUA YUCCA](/san-pham/aqua-yucca) 3 đến 4 kg cho 1.000 m³ nước khi tôm nổi đầu do khí độc (định kỳ 1 đến 2 kg cho 1.000 m³, 7 đến 10 ngày/lần). |
| `kien-thuc/ao-tom-nhieu-bot-bot-kho-tan-cach-xu-ly.md` | [AQUA YUCCA](/san-pham/aqua-yucca) 500 g cho 3.000 m³ hoặc [SUPER YUCCA](/san-pham/super-yucca) 1 lít cho 3.000 m³ nước khi khí độc cao | [AQUA YUCCA](/san-pham/aqua-yucca) 3 đến 4 kg cho 1.000 m³ hoặc [SUPER YUCCA](/san-pham/super-yucca) 1 lít cho 3.000 đến 4.000 m³ nước khi khí độc cao |
| `kien-thuc/tom-bi-do-than-nguyen-nhan-cach-xu-ly.md` | [AQUA YUCCA](/san-pham/aqua-yucca) 500 g cho 3.000 m³ nước khi khí độc cao | [AQUA YUCCA](/san-pham/aqua-yucca) 3 đến 4 kg cho 1.000 m³ nước khi tôm nổi đầu do khí độc |
| `kien-thuc/tom-bi-do-than-nguyen-nhan-cach-xu-ly.md` | [KIA C TẠT](/san-pham/kia-c-tat) 5 kg cho 3.000 m³ nước ngay khi tôm bị stress | [KIA C TẠT](/san-pham/kia-c-tat) 5 kg cho 2.000 m³ nước ngay khi tôm bị stress |
| `kien-thuc/zeolite-va-yucca-cho-ao-tom-cach-dung.md` | định kỳ **20 kg cho 2.000 m² mặt nước**, 5 ngày/lần; khi khí độc cao, cấp cứu nổi đầu dùng 20 kg cho 1.000 m², 2 ngày liên tục. Rải khắp ao, tập trung nơi có nhiều chất … | trước khi thả giống **10 kg cho 1.000 m³ nước**; định kỳ 10 kg cho 2.000 m³ nước. Hòa với nước sạch rồi tạt đều xuống ao. |
| `kien-thuc/zeolite-va-yucca-cho-ao-tom-cach-dung.md` | định kỳ 10 kg cho 5.000 m³ nước, 7 ngày/lần; khi khí độc cao dùng 10 kg cho 3.000 m³. | định kỳ 1 đến 2 kg cho 1.000 m³ nước, 7 đến 10 ngày/lần; khi tôm nổi đầu do khí độc dùng 3 đến 4 kg cho 1.000 m³. Rải đều khắp mặt ao, không dùng chung với hóa chất khác. |
| `kien-thuc/zeolite-va-yucca-cho-ao-tom-cach-dung.md` | (bột): định kỳ 500 g cho 5.000 m³, 7 ngày/lần; khí độc cao 500 g cho 3.000 m³, dùng 2 đến 3 lần. | (bột): định kỳ 1 đến 2 kg cho 1.000 m³ nước, 7 đến 10 ngày/lần; khi tôm nổi đầu do khí độc 3 đến 4 kg cho 1.000 m³. |
| `kien-thuc/zeolite-va-yucca-cho-ao-tom-cach-dung.md` | Theo nhãn GRAND ZEOLITE, định kỳ 5 ngày/lần; ao đáy sạch, ít chất thải có thể giãn ra lâu hơn. | Hồ sơ công bố của GRAND ZEOLITE ghi liều định kỳ 10 kg cho 2.000 m³ nước và không ấn định số ngày giữa hai lần; ao đáy sạch, ít chất thải có thể giãn ra lâu hơn. |
| `kien-thuc/vitamin-c-cho-tom-chong-soc-tang-de-khang.md` | - [NB C SORMIN](/san-pham/nb-c-sormin) (vitamin + khoáng chống sốc): trộn 5 đến 10 g/kg thức ăn, 2 đến 3 lần/ngày; khi có dấu hiệu dịch bệnh hoặc thời tiết thay đổi đột … | (xóa dòng, chuyển xuống mục tạt ao) |
| `kien-thuc/vitamin-c-cho-tom-chong-soc-tang-de-khang.md` | - [VITA C TẠT](/san-pham/vita-c-tat): tạt **5 kg cho 3.000 m³ nước** ngay sau khi tôm bị stress, thời tiết thay đổi; trước khi thả tôm dùng 5 kg cho 2.000 m³, tạt trước … | - [VITA C TẠT](/san-pham/vita-c-tat): tạt **5 kg cho 3.000 m³ nước** khi thời tiết thay đổi; khi tôm bị stress dùng 5 kg cho 2.000 m³. ⏎ - [KIA C TẠT](/san-pham/kia-c-ta… |
| `kien-thuc/cach-chon-tom-giong-the-tot-kiem-tra-pcr.md` | trước khi thả tôm dùng 5 kg/2.000 m³ nước, tạt trước khi thả 30 phút. | khi thời tiết thay đổi dùng 5 kg/3.000 m³ nước, khi tôm bị stress dùng 5 kg/2.000 m³ nước. |
| `kien-thuc/cach-chon-tom-giong-the-tot-kiem-tra-pcr.md` | tăng sức đề kháng, tăng khả năng miễn dịch cho tôm; trộn 5 đến 10 g/kg thức ăn. | hỗ trợ hoạt hóa hệ miễn dịch tự nhiên của tôm; trộn 3 đến 5 g/kg thức ăn, 3 lần/ngày. |
| `kien-thuc/cach-tha-tom-giong-thuan-do-man-nhiet-do.md` | trước khi thả tôm dùng 5 kg/2.000 m³ nước, tạt trước khi thả 30 phút. | khi thời tiết thay đổi dùng 5 kg/3.000 m³ nước, khi tôm bị stress dùng 5 kg/2.000 m³ nước. |
| `kien-thuc/cach-tha-tom-giong-thuan-do-man-nhiet-do.md` | hỗ trợ chống sốc, giảm stress khi môi trường thay đổi; trộn 5 đến 10 g/kg thức ăn. | hỗ trợ chống sốc, giảm stress khi môi trường thay đổi; tạt 5 kg/3.000 m³ nước khi thời tiết thay đổi, 5 kg/2.000 m³ khi tôm bị stress. |
| `kien-thuc/cach-danh-khoang-cho-tom-dung-thoi-diem-lieu-luong.md` | khoáng tăng kiềm, cứng vỏ; định kỳ **5 kg cho 3.000 m³ nước, 2 ngày/lần**; khi cần tăng kiềm dùng 5 kg cho 1.500 m³, liên tục 2 ngày. | khoáng tạt ao giúp tôm lột xác đúng chu kỳ, vỏ cứng dày; định kỳ **5 kg cho 5.000 m³ nước**; trước khi thả giống 5 kg cho 3.000 m³. |
| `kien-thuc/cach-danh-khoang-cho-tom-dung-thoi-diem-lieu-luong.md` | khoáng tăng kiềm, cứng vỏ cho ao bạt; định kỳ 5 kg cho 3.000 m³, 2 ngày/lần. | khoáng cứng vỏ cho ao bạt; định kỳ 5 kg cho 5.000 m³ nước; trước khi thả giống 5 kg cho 3.000 m³. |
| `kien-thuc/cach-do-va-doc-chi-tieu-nuoc-ao-tom.md` | Định kỳ 500g/5.000m³, 7 ngày/lần; khí độc cao 500g/3.000m³, dùng liên tục 2 đến 3 lần. | Định kỳ 1 đến 2 kg/1.000m³, 7 đến 10 ngày/lần; khi tôm nổi đầu do khí độc 3 đến 4 kg/1.000m³. |
| `kien-thuc/tao-day-lab-lab-rong-nhot-ao-tom-cach-xu-ly.md` | Khi khí độc cao: 500g/3.000m³, dùng liên tục 2 đến 3 lần. | Khi tôm nổi đầu do khí độc: 3 đến 4kg/1.000m³ nước. |
| `kien-thuc/nuoi-tom-mua-mua-phong-soc-ph-do-kiem-tao-tan.md` | - [DOWN MAX](/san-pham/down-max-ha-phen): hạ phèn, giải độc phèn, tẩy phèn đáy, phèn nước, phèn dính chân và mang tôm; trong quá trình nuôi dùng 500 g/2.000 m³ nước. | - [DOWN MAX](/san-pham/down-max-ha-phen): theo hồ sơ công bố là khoáng bổ sung vào môi trường ao nuôi, giúp tôm lột xác đúng chu kỳ, vỏ cứng dày; định kỳ dùng 5 kg/5.000… |
| `kien-thuc/tom-bi-xanh-vo-xanh-da-troi-nguyen-nhan.md` | [MIX 79](/san-pham/mix-79) 5 kg cho 3.000 m³ nước, 2 ngày/lần vào chiều tối. | [MIX 79](/san-pham/mix-79) 5 kg cho 5.000 m³ nước theo liều định kỳ. |
| `kien-thuc/tom-mem-vo-cham-lot-nguyen-nhan-cach-xu-ly.md` | - Tạt [MIX 79](/san-pham/mix-79) 3 kg cho 2.000 m³ nước, liên tục 2 ngày. | - Tạt [MIX 79](/san-pham/mix-79) 5 kg cho 5.000 m³ nước theo liều định kỳ. |
| `kien-thuc/men-vi-sinh-cho-tom-cach-chon-va-su-dung.md` | [PROZYME](/san-pham/prozyme) (enzyme + vi sinh) | [PROZYME](/san-pham/prozyme) (enzyme tiêu hóa amylase, protease) |
| `kien-thuc/an-toan-sinh-hoc-ao-lang-ao-chua-phong-benh-tom.md` | - [AQUA SQUICK](/san-pham/aqua-squick): sát trùng nguồn nước ao nuôi tôm, khử mùi hôi đáy ao, hỗ trợ quản lý tảo. | - [AQUA SQUICK](/san-pham/aqua-squick): sát trùng nguồn nước, giúp làm giảm vi khuẩn, nấm, nguyên sinh động vật gây hại trong môi trường nước. |
| `landings.json` | Theo nhãn CLEAR 12H, ao bạt dùng 15 đến 20 lít vi sinh đã ủ cho 1.000 m³ nước, định kỳ 3 ngày một lần, mở quạt hoặc sục khí liên tục khi dùng. | Theo hồ sơ công bố của CLEAR 12H, dùng định kỳ 454 g cho 3.000 đến 5.000 m³ nước, 5 đến 7 ngày một lần; có thể ủ sục khí trên 12 tiếng trước khi dùng để tăng hiệu quả. |
| `landings.json` | Ví dụ CLEAR 12H với ao đất dùng 10 đến 15 lít/1.000 m³, định kỳ 5 ngày một lần. | Ví dụ CLEAR 12H khi ao bị ô nhiễm nặng dùng 1 kg/2.000 đến 3.000 m³ nước, liên tục 2 ngày. |
| `landings.json` | Theo nhãn MIX 79, khi cần tăng kiềm dùng 5 kg/1.500 m³ nước, liên tục 2 ngày, tạt lúc chiều tối. | Theo hồ sơ công bố, khoáng MIX 79 dùng định kỳ 5 kg/5.000 m³ nước, hòa với nước sạch rồi tạt đều xuống ao. |
| `landings.json` | Theo nhãn MARIMIX, khi phèn cao dùng 1 kg/2.000 m³ nước, xử lý 2 ngày liên tục, và nên dùng 1 đến 2 giờ trước các sản phẩm xử lý khác. | Theo hồ sơ công bố, khoáng MARIMIX dùng định kỳ 5 kg/5.000 m³ nước, hòa với nước sạch rồi tạt đều xuống ao. |
| `en/knowledge/cach-chon-tom-giong-the-tot-kiem-tra-pcr.md` | before stocking use 5 kg/2,000 m³ of water, applied 30 minutes before stocking. | when the weather changes use 5 kg/3,000 m³ of water, when shrimp are stressed use 5 kg/2,000 m³ of water. |
| `en/knowledge/cach-chon-tom-giong-the-tot-kiem-tra-pcr.md` | strengthens resistance and boosts the immunity of shrimp; mix 5–10 g/kg of feed. | helps activate the natural immune system of shrimp; mix 3–5 g/kg of feed, 3 times a day. |
| `en/knowledge/cach-danh-khoang-cho-tom-dung-thoi-diem-lieu-luong.md` | alkalinity-raising, shell-hardening minerals; routine dose **5 kg per 3,000 m³ of water, every 2 days**; when alkalinity needs raising, use 5 kg per 1,500 m³ for 2 conse… | pond-applied minerals that help shrimp moult on schedule with a thick, hard shell; routine dose **5 kg per 5,000 m³ of water**; before stocking 5 kg per 3,000 m³. |
| `en/knowledge/cach-danh-khoang-cho-tom-dung-thoi-diem-lieu-luong.md` | alkalinity-raising, shell-hardening mineral for lined ponds; routine dose 5 kg per 3,000 m³, every 2 days. | shell-hardening mineral for lined ponds; routine dose 5 kg per 5,000 m³ of water; before stocking 5 kg per 3,000 m³. |
| `en/knowledge/cach-do-va-doc-chi-tieu-nuoc-ao-tom.md` | Routine 500g/5,000m³ every 7 days; when toxic compounds are high 500g/3,000m³, applied 2–3 times in a row. | Routine 1–2 kg/1,000m³ every 7–10 days; when shrimp surface because of toxic gas 3–4 kg/1,000m³. |
| `en/knowledge/tao-day-lab-lab-rong-nhot-ao-tom-cach-xu-ly.md` | When toxic gases are high: 500g/3,000m³, applied 2–3 times in succession. | When shrimp surface because of toxic gas: 3–4kg/1,000m³ of water. |
| `en/knowledge/nuoi-tom-mua-mua-phong-soc-ph-do-kiem-tao-tan.md` | reduces acidity and neutralises alum toxicity, removes alum from the bottom and water and alum adhering to shrimp legs and gills; during the culture cycle use 500 g/2,00… | according to its registered standard, a mineral supplement for the pond environment that helps shrimp moult on schedule with a thick, hard shell; routine dose 5 kg/5,000… |

`content/giai-phap.json`, `content/lich-cham-soc.json`, `src/chat.js` không có con số liều nào trái TCCS nên không sửa.

### 6.3 Chỗ còn lệch TCCS nhưng chưa sửa (ngoài phạm vi "chỉ đổi số liệu")

- Bài vẫn giới thiệu DOWN MAX, MARIMIX để hạ phèn, giải độc phèn (không kèm liều): `mo-hinh-tom-lua-ben-vung.md`, `nuoi-tom-quang-canh-cai-tien-mat-do-thap.md`, `phoi-ao-luan-canh-nghi-ao-giua-cac-vu.md`, `quan-ly-ph-do-kiem-ao-nuoi-tom.md`; hai câu hỏi đáp trong `landings.json` về mưa và đất phèn đã đổi liều MIX 79, MARIMIX theo TCCS nhưng câu hỏi vẫn nói về tăng kiềm, phèn.
- Bài vẫn gọi MIRAL N8, PREMIX 10000, RIMIX là khoáng tăng kiềm: `quan-ly-ph-do-kiem-ao-nuoi-tom.md`, `cach-gay-mau-nuoc-ao-nuoi-tom.md`, `quy-trinh-cai-tao-ao-chuan-bi-tha-tom-giong.md`, `lich-cham-soc-tom-the-theo-ngay-tuoi.md`, `ky-thuat-nuoi-tom-2-giai-doan.md`, `ky-thuat-san-tom-tia-tom-thu-tia.md`, `tom-mem-vo-cham-lot-nguyen-nhan-cach-xu-ly.md`.
- `content/posts.json` (bài cũ "Bệnh đốm đen trên tôm thẻ", ngoài danh sách tệp được sửa): ghi BENXID 3000 1 lít/3.000 m³, TCCS của BEN XID 3000 ghi 1 lít/1.000 m³ (sản phẩm đang ẩn).
- `src/en.js` còn một bản dịch gắn cứng cho dòng liều cũ của GRAND ZEOLITE (20 kg/1.000 m²), nay không còn dùng tới.
- Phần chữ quảng cáo của các landing (`landings.json`: tiêu đề, điểm nổi bật) chưa rà theo TCCS.

## 7. 65 sản phẩm có chỉ tiêu chất lượng TCCS khác CSDL

IODINE 99, DE-ZOO, TP 66, SUPER VIDAL, BRONOPOL 99, NO TOXIN, AQUA BAC, AQUA BZ, AQUA MICRO, BZT, BACPOWER, CLEAR 12H, ROVABIO AP, ROVAZYME, PRO ALGAE, ROVA OTIC, NB-ALGAE, PRAWNZYME, YUCCA C, YUCCA VS ZEO, AQUA YUCCA, SUPER CAL, RIMIX, MIRAL N.8, BIO PREMIX, MARIMIX, PREMIX 9999, PREMIX 10.000, MIX 79, PREMIX KHOÁNG NEW, NB-MIX 500 NEW, BIO CALMAX, YUCCA VS ZEO NEW, GRAND ZEOLITE, VITA C TAT NEW, KIA C TẠT, AQUALAC-FS, AQUALACTO Q, AP 79, BIO AQ, NB-BIOBEST, PRO AQ, BIOTIC 99, BZ 99, AQUA BIOTIC, BIOZYME, F.X ENZYME, BETA 1,3-1,6 GLUCAN, HEPATIC, NB HELVIROL B12, LIVER-MAX, G7, VH-LIVER PRO, HI-WEIGH, AMINOVIT, AMIN CARE, BENCOM, SORBEST, DAVI CID liquid, MEGA CID NEW, PREMIX KHOÁNG, CAPHOTE, ROCAPHOS, CALCIPHO, VH-CANCIMILK.

(Bảng so từng chỉ tiêu có thể sinh lại từ `content/tccs.json` và `ho-so-san-pham/data.json`.)

## 8. Tệp thêm mới và kết quả kiểm tra

- `content/tccs.json`: 115 hồ sơ (tên, tệp nguồn, nhóm, mã số, ký hiệu TCCS, dạng, quy cách, hạn dùng, bảo quản, thành phần, công dụng, hướng dẫn, cảnh báo). Chữ giữ nguyên như hồ sơ, chưa sửa lỗi gõ.
- `scripts/build-tccs.py`: sinh lại tệp trên, chạy `python3 scripts/build-tccs.py <đường dẫn kho CONG-TY-NOBEN>` (cần LibreOffice và python-docx).
- `scripts/test-en-strings.js` và dòng `"test:en"` trong `package.json`: kiểm tra mọi dòng tagline, công dụng, liều dùng, thành phần của sản phẩm hiển thị đều có bản dịch tiếng Anh. Đây là thay đổi duy nhất ngoài nội dung.

Kiểm tra việc trích: mọi dòng công dụng, liều, thành phần, quy cách, bảo quản của cả 115 hồ sơ đều được dò lại với bản chuyển văn bản độc lập (LibreOffice, bộ lọc UTF8), không lệch dòng nào; đọc bằng mắt 17 hồ sơ so với văn bản gốc (OXY 99, BEN BKC hai bản, SUPER GOLD, DE-ZOO, YUCCA 99, GRAND ZEOLITE, AQUA BAC, NO TOXIN, DOWN MAX NEW, LIVER-MAX, F.X LIVER SUPPORT, F.X ENZYME, BETA GLUCAN, VH-CANXI MILK, SORBEST, HI-WEIGH).

| Lệnh | Kết quả |
|---|---|
| `npm run check` | Đạt ("Tất cả kiểm tra đều đạt") |
| `node scripts/test-labels.js` | Đạt: 94 nhãn, dàn trang 282 nhãn ở ba khổ, 0 nhãn tràn chữ; 57 nhãn dùng chữ dưới 5,5 pt (trước là 19) |
| `node scripts/test-en-strings.js` | Đạt: 86 sản phẩm hiển thị, 0 dòng thiếu bản dịch (trước khi sửa thiếu 37 dòng) |
| `node scripts/test-dose.js` | Đạt: 217/219 dòng liều đọc được, như trước khi sửa |
| `node scripts/test-security.js` | Đạt: 11 kiểm thử |
| Máy chủ cổng 3399 | Mở 6 trang sản phẩm tiếng Việt và tiếng Anh (DOWN MAX, SORBEST, AQUA BAC, HEPATIC, YUCCA VS ZEO, IODINE 99): hiển thị đúng. Quét cả 86 trang `/en/products/…`: chỉ còn dòng Packaging hiện tiếng Việt (mục 1.5). Đã tắt máy chủ. |
