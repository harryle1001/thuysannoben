# Bộ nhận diện in ấn Noben: nhãn sản phẩm và logo

Thư mục `brand/` **không được phục vụ trên web**, chỉ dùng để làm việc với nhà in. Logo trong toàn bộ thư mục này là **logo chính thức đã nắn theo tỷ lệ vàng, phương án A đã duyệt** (`public/images/brand/logo-noben-phi.svg`, sinh bằng `python3 scripts/build-logo-phi.py`): giữ nguyên màu và nét chữ NOBEN của logo đang dùng trên web, chỉ đặt lại kích thước theo φ. Logo trên web (`logo-noben.svg`) chưa thay. Bản logo φ/π trong `public/images/brand/golden/` chỉ là đề xuất, chưa dùng ở đây.

| Đường dẫn | Nội dung |
|---|---|
| `label-spec.json` | Khổ nhãn theo bao bì (túi, chai, xô), tràn lề, lề an toàn, màu nhóm, thông tin nhà sản xuất |
| `labels.json` | Nội dung nhãn của 94 sản phẩm đang hiển thị trên web. **Sửa chữ ở đây** |
| `nhan/<slug>.svg` | Nhãn chỉnh sửa được, kích thước thật theo mm |
| `nhan-png/<slug>.png` | Ảnh xem trước (trong đường xén). Không đưa vào Git, sinh lại bằng lệnh bên dưới |
| `nhan-pdf/<slug>.pdf`, `nhan-tong-hop.pdf` | PDF in thử (có tràn lề) và tờ tổng hợp A4. Không đưa vào Git, sinh lại bằng lệnh bên dưới |
| `nhan-bao-cao.json` | Kết quả tự kiểm tra: cỡ chữ từng nhãn, lỗi tràn chữ (nếu có) |
| `logo/` | Bộ logo in ấn và icon |

## 1. Việc cần làm trước khi in thật

1. **Kích thước khuôn bế thật.** Khổ trong `label-spec.json` chỉ là đề xuất theo tỷ lệ vàng (rộng : cao = 1 : 1,618): túi 100 × 161,8 mm, chai 70 × 113,26 mm, xô 130 × 210,34 mm. Hãy xin nhà in bản vẽ khuôn bế của từng loại bao bì, sửa `w`, `h` (và `tran_le`, `le_an_toan` nếu nhà in yêu cầu khác), đổi `khuon_be_that` thành `true`, rồi chạy lại lệnh sinh nhãn. Thêm khổ mới (ví dụ `"can"`) bằng cách thêm một mục trong `kho` và ghi `"bao_bi": "can"` cho sản phẩm.
2. **Thông tin pháp lý** trong `labels.json`, mục `phap_ly` của từng sản phẩm, đang để `[ĐIỀN]`: số đăng ký hoặc mã số lưu hành, NSX, HSD, khối lượng tịnh, mã vạch EAN-13. Lấy đúng theo hồ sơ công bố. Trường `so_dang_ky_doc_tu_anh` (nếu có) chỉ là chữ đọc tự động từ ảnh nhãn cũ, **phải đối chiếu lại với giấy tờ** rồi mới chép sang `phap_ly.so_dang_ky`.
   Trường `so_dang_ky_tham_khao` (13 sản phẩm) là **số đăng ký cũ** dạng `HCM.TS19-xx` lấy từ danh mục thuốc thú y thủy sản kèm Thông tư 10/2016/TT-BNNPTNT. Từ Luật Thủy sản 2017, sản phẩm xử lý môi trường và thức ăn bổ sung dùng **mã số tiếp nhận** công bố trên CSDL của Cục Thủy sản và Kiểm ngư (`csdl.tongcucthuysan.gov.vn`, chỉ truy cập được từ Việt Nam), nên cần kiểm tra số nào còn hiệu lực trước khi in.
3. **Kiểm tra nội dung.** Chữ công dụng, liều dùng lấy nguyên từ website (có chỗ còn lỗi chính tả từ website cũ). Thành phần hầu hết đang trống. Quy cách (`quy_cach`) đọc tự động từ dòng "Qui cách" ở ảnh sản phẩm, nên soát lại. Dòng `bao_quan` là câu mặc định, sửa theo hồ sơ nếu khác.
4. **Mã vạch:** nhập đủ 13 số EAN-13 (đúng số kiểm tra) vào `phap_ly.ma_vach`, bộ sinh nhãn sẽ vẽ mã vạch thật. Khung mã vạch rộng tối đa 38 mm; GS1 khuyên không nhỏ hơn 80 % kích thước chuẩn (khoảng 30 × 21 mm), nên nhờ nhà in quét thử.

## 2. Sinh lại nhãn sau khi sửa `labels.json`

Cần Node 20+ và Playwright có Chromium (`npm i -D playwright && npx playwright install chromium` nếu máy chưa có).

```bash
node scripts/build-labels.js                 # tất cả: SVG + PNG + PDF + tờ tổng hợp
node scripts/build-labels.js --chi g7-phong-va-tri-benh-gan-chet-som,kalimix   # vài sản phẩm
node scripts/build-labels.js --khong-pdf     # nhanh, bỏ PDF
node scripts/build-labels.js --dung-ban-luu  # áp thêm thay đổi đã lưu ở trang quản trị /quan-tri/nhan
node scripts/test-labels.js                  # kiểm thử: đủ 94 nhãn, SVG hợp lệ, không tràn chữ ở mọi khổ
```

Bộ sinh nhãn đo chữ bằng phông thật trong Chromium. Khi nội dung dài, nó lần lượt thu gọn phần tên, giảm cỡ chữ nội dung (tối thiểu 1,6 mm ≈ 4,5 pt, đặt ở `co_chu_toi_thieu_mm`) và ngắt dòng, rồi đo lại từng dòng chữ bằng `getBBox` để chắc chắn không chữ nào tràn khung hay ra ngoài vùng an toàn. Nhãn nào phải dùng chữ dưới 5,5 pt sẽ được liệt kê khi chạy: nên dùng khổ lớn hơn hoặc rút gọn chữ.

**Trang quản trị `/quan-tri/nhan`** (đăng nhập quản trị): chọn sản phẩm và khổ, sửa chữ và màu nhấn, xem trước ngay, tải SVG hoặc PNG 300 dpi. Nút *Lưu* ghi vào `label-edits.json` trong thư mục dữ liệu trên máy chủ (`DATA_DIR`, có trong bản sao lưu hằng ngày), không sửa Git. Muốn đưa vào bộ file in: tải `label-edits.json` từ máy chủ về đặt vào `DATA_DIR` trên máy mình rồi chạy `--dung-ban-luu`, hoặc chép nội dung vào `labels.json`.

### Cấu trúc file nhãn SVG

- Kích thước thật: `width="106mm" height="167.8mm"` (= khổ xén + 3 mm tràn lề mỗi cạnh); 1 đơn vị toạ độ = 1 mm, gốc (0,0) ở góc trên trái đường xén.
- Bố cục theo đoạn vàng: dải thương hiệu cao H/φ³, vạch vàng = dải/φ⁶, nội dung bắt đầu ở H/φ (khi chữ ngắn), chân trang ≥ H/φ⁵.
- Chữ là `<text>` thật, không chuyển nét. Các lớp (`<g id>`): `nen`, `dai-thuong-hieu`, `logo`, `ten-san-pham`, `cong-dung`, `huong-dan`, `thanh-phan`, `phap-ly`, `ma-vach`, `vung-an-toan`.
- Lớp `vung-an-toan` bị ẩn: đường tràn lề (hồng), đường xén (xanh dương), vùng an toàn (xanh lá, nét đứt), đường H/φ (vàng). Bật lên khi dàn trang, **tắt trước khi xuất file in**.
- Màu theo nhóm (giống màu nhóm trên web): sinh học `#1f7a4d`, khoáng `#0e6c8a`, thức ăn bổ sung `#9a5a00`, trị bệnh `#b4232c`. Nền dải navy `#0b2347`, vạch vàng `#ffc20e`.

## 3. Mở và chỉnh file

**Cài phông trước** (miễn phí, Google Fonts, giấy phép OFL): *Be Vietnam Pro* (Regular 400, SemiBold 600) và *Playfair Display* (ExtraBold 800). Tải tại fonts.google.com, giải nén, chuột phải từng file `.ttf` → *Install for all users* (Windows) hoặc mở bằng Font Book → *Install* (macOS). Thiếu phông thì chữ bị thay bằng phông khác và có thể tràn khung.

- **Adobe Illustrator:** *File → Open* file `.svg`. Các lớp `<g id>` thành nhóm mang tên tương ứng trong bảng *Layers*. Đặt *Artboard* bằng đúng kích thước khổ + tràn lề (đã có sẵn trong file). Chỉnh xong: *File → Save As → Adobe PDF*, chọn *PDF/X-4*, *Marks and Bleeds → Use Document Bleed Settings* (3 mm). Muốn gửi file không cần phông: chọn hết chữ → *Type → Create Outlines* trên một bản sao.
- **Inkscape (miễn phí):** mở `.svg`, các lớp hiện trong *Layer → Layers and Objects*; lớp `vung-an-toan` đang ẩn, bấm con mắt để bật. Xuất PDF: *File → Save a Copy → PDF*, tích *Convert text to paths* nếu nhà in không có phông.
- **Figma:** kéo thả file `.svg` vào khung vẽ. Chữ vẫn sửa được nếu máy đã cài phông (Figma có sẵn cả hai phông trên Google Fonts). Lưu ý Figma tính theo px: 1 mm = 3,78 px ở 96 dpi; khi xuất PDF giữ nguyên tỷ lệ.
- **Canva:** *Tải lên* file `.svg` (Canva coi SVG là hình, không sửa chữ được) hoặc tải lên bản PDF rồi *Mở trong Canva* để sửa chữ. Canva có sẵn Be Vietnam Pro và Playfair Display. Với Canva, nên dùng trang `/quan-tri/nhan` để sửa chữ rồi tải PNG 300 dpi.

## 4. Bộ logo (`brand/logo/`)

Sinh lại: `python3 scripts/build-logo-kit.py` (cần `pip install picosvg uharfbuzz fonttools brotli`) rồi `node scripts/build-logo-icons.js` (icon PNG, ảnh xem trước `xem-truoc.png` và kiểm tra bản chữ sửa được trùng khít bản chuyển nét).

| File | Dùng khi |
|---|---|
| `noben-logo.svg` | Logo chính thức, có gradient: web, màn hình, in kỹ thuật số |
| `noben-logo-phang.svg` | Màu phẳng, không gradient, không trong suốt (vàng `#ffc20e`, xanh `#1590dd`, viền chữ `#0a5fb8`): in offset, in lụa nhiều màu |
| `noben-logo-den.svg`, `-trang.svg`, `-navy.svg` | **Một màu**: một path ghép duy nhất, phần trắng của logo là phần khoét (lộ nền). In lụa một màu, khắc, dập nổi, in trên bao tải |
| `noben-lockup-ngang-*.svg` | Logo + chữ "Noben / THUỐC THỦY SẢN" xếp ngang (giống đầu trang web) |
| `noben-lockup-doc-*.svg` | Xếp dọc: biểu tượng ở trên, chữ ở dưới |
| `…-chu.svg` | Chữ là `<text>` sửa được (Playfair Display 800 + Be Vietnam Pro 600) |
| `…-net.svg` | Chữ đã chuyển nét: gửi nhà in, không cần phông |
| `…-nen-toi-…` | Chữ trắng cho nền tối; `…-phang-`, `…-den-`, `…-trang-`, `…-navy-` như bản biểu tượng |
| `icons/` | `favicon.svg`, `favicon.ico`, `favicon-16/32.png`, `apple-touch-icon-180.png`, `icon-192/512.png`, `icon-maskable-512.png`, `site.webmanifest`. **Chỉ sinh sẵn, chưa thay trên web** |

### Quy tắc dùng logo

- **Khoảng trống quanh logo:** tối thiểu H/φ³ ≈ 0,236 × chiều cao biểu tượng (H) ở mọi phía; không đặt chữ, hình hay mép giấy vào vùng này.
- **Kích thước tối thiểu:** biểu tượng cao 10 mm khi in (chữ NOBEN trong khung xanh còn đọc được), 24 px trên màn hình. Logo ngang rộng tối thiểu 30 mm; dưới 10 mm dùng bản một màu.
- **Màu:** vàng `#ffc20e`, xanh logo `#0878cc` → `#22a8ec`, navy chữ `#0b2347`, xanh chữ "Noben" `#1b4db1`. Màu Pantone tương đương cần nhà in thử bài (gợi ý tham khảo: vàng ≈ Pantone 7549 C, xanh ≈ Pantone 2196 C, navy ≈ Pantone 2767 C).
- **Không:** kéo méo, xoay, đổi màu ngoài các bản có sẵn, thêm bóng đổ/viền, đặt bản màu lên nền rối hoặc nền vàng (dùng bản một màu thay thế).
