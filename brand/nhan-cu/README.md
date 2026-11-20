# Nhãn cũ Noben vẽ lại nét (giữ y nhãn đăng ký, chỉ sửa chữ)

Mẫu đã duyệt: `g7-phong-va-tri-benh-gan-chet-som.json` (G7). Mọi nhãn làm giống vậy.

```
node scripts/build-old-labels.js <slug>     # → brand/nhan-cu/<slug>.png (≥ 6400 px ngang) + <slug>.pdf
```

Nguồn ảnh: `CONG-TY-NOBEN/ho-so-san-pham/nhan/<mã số>_<n>.jpg` (nhãn đã nộp CSDL Tổng cục). Mã số của sản phẩm: `brand/labels.json` → `phap_ly.so_dang_ky`.

## Quy tắc nội dung (bắt buộc)
- **Hình, màu, bố cục, kiểu chữ, tiêu đề mục giữ y nhãn cũ.** Chỉ sửa chữ sai.
- Thành phần, công dụng, hướng dẫn sử dụng, bảo quản, số TCCS: lấy đúng hồ sơ TCCS `content/tccs.json` (khớp `ma_so`). Dòng nào nhãn cũ có mà TCCS không ghi (kim loại nặng KPH, E.coli, Salmonella, Mã SPHQ, Nguyên liệu…) thì giữ như nhãn cũ.
- Mã số tiếp nhận: theo `labels.json` (CSDL Tổng cục).
- Điện thoại: **0934 246 420** (thay mọi số cũ). Giữ email, MST, địa chỉ như nhãn cũ.
- Thêm dòng **SẢN XUẤT TẠI VIỆT NAM** (đậm, đỏ #c8102e) ở cuối khối công ty (`cong_ty.xuat_xu`).
- Số lô, ngày sản xuất, hạn sử dụng, thể tích/khối lượng tịnh: để trống sau dấu hai chấm như nhãn cũ.
- Đơn vị viết thường sau số (30 hũ, 1 lít).

## File spec `<slug>.json` (toạ độ theo pixel ảnh gốc)
| Trường | Ý nghĩa |
|---|---|
| `slug`, `goc`, `kich_thuoc_goc` | slug sản phẩm, đường dẫn ảnh gốc `CONG-TY-NOBEN/ho-so-san-pham/nhan/…jpg`, [rộng, cao] |
| `bao_bi` | `chai` (nhãn quấn chai), `tui` (túi/gói/hũ), `xo` (xô) — theo ảnh nhãn và quy cách |
| `kich_thuoc_mm` | [rộng, cao] nhãn thật nếu ảnh có ghi (vd "230x295mm"), không thì ước: chai 1 lít quấn 240×135 |
| `mat_truoc` | [x0,y0,x1,y1] phần mặt trước (tên lớn, hình) để dựng ảnh 3D túi |
| `khung[]` | vùng chữ vẽ lại: `x,y,w,h,r` (bo góc), `nen` (`#fff` mặc định, mã màu, hoặc `trong` = trong suốt), `mau` (màu chữ), `co` (cỡ chữ gốc px, tự thu nhỏ cho vừa), `phong` (`sans`/`serif`), `dem` (đệm px), `cot` (số cột), `can`, `dong_cao`, `noi_dung[]` |
| `noi_dung[]` | `{kieu:"dong", dam:"THÀNH PHẦN:", chu:" trong 1 lít"}`, `{kieu:"muc", chu:"CÔNG DỤNG"}`, `{kieu:"gach", chu:"…"}` (gạch đầu dòng "- "), `{kieu:"dam"}`, `{kieu:"trong"}` (dòng trống), `{kieu:"html", chu:"NH<sub>3</sub>"}` |
| `xoa[]` | xóa chữ cũ trên nền màu trước khi đặt chữ mới (khung `nen:"trong"`): `{vung:[x,y,w,h], chu:"sang"|"toi"}` hoặc `{vung, mau:"#d61f2a", nguong:90}`; nền trắng: `{vung, nen:"trang", le:1}` |
| `chu_vector[]` | 1 dòng chữ lớn vẽ lại (vd "CHỈ DÙNG TRONG NUÔI TRỒNG THỦY SẢN", "ISO 9001:2015"): `chu,x,y(đường chân chữ),w(dài),co,phong,mau,bong` + `xoa,chu_cu,le,nen` để xóa chữ cũ |
| `logo[]` | logo NOBEN cũ vẽ vector: `{x,y,s}` hoặc `{x,y,w,h}` (bao trọn cả viền trắng của hình thoi) |
| `cong_ty` | khối công ty: `x,y,w`, `ten`, `dong[3]`, `xuat_xu`, `co` (cỡ dòng, mặc định 13.5), `mau` |
| `lam_net[]` | làm sắc mép hình nét vẽ (tên SP lớn, con tôm, con dấu ISO): `{vung:[x0,y0,x1,y1], bang_mau:[màu nét + màu nền xung quanh], net:[màu cần làm nét], mau:{màu cũ:màu ra}, mem:500}` |

Mẹo: đo vùng bằng numpy (ô trắng: `a.min(2)>235`), xem ảnh cắt phóng to trước khi đặt; sau khi dựng, cắt `brand/nhan-cu/<slug>.png` từng vùng để soát chữ tràn, chữ cũ còn lộ, lệch vị trí. Ảnh gốc 800 px thì hệ số phóng tự lên ×8.
