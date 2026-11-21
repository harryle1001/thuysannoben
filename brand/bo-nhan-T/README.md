# Bộ nhãn mẫu T (Noben)

Khung dựng nhãn, túi bột, ảnh 3D, catalogue và trang xoay 360° cho 19 sản phẩm theo danh mục Sơn Hà.
Mọi thứ dựng từ dữ liệu, nên khi đổi thông tin chỉ sửa dữ liệu rồi chạy lại, không vẽ lại.

## Sửa thông tin

| Muốn đổi | Sửa ở |
|---|---|
| Tên, thành phần, công dụng, liều dùng, quy cách, mã số, TCCS, hạn dùng | `nhan/san-pham-son-ha.json` (lấy đúng theo hồ sơ TCCS) |
| Thêm hoặc bớt sản phẩm | thêm hoặc xóa một mục trong `nhan/san-pham-son-ha.json` |
| Màu, tên loại, biểu tượng loại | `MAU_LOAI`, `LOAI`, `LOAI_CUM`, `TYPE_ICON` trong `nhan/build.js` |
| Mã VinaCert dưới dấu hợp quy | `VINACERT_CODE` trong `nhan/build.js` |
| Giá nhập (giá sỉ = giá nhập, giá lẻ = 3 × giá nhập) | `catalog/gia.json` |
| Kích thước túi theo khối lượng | `TUI` trong `xuat-360.py` |

## Chạy lại

```bash
bash brand/bo-nhan-T/lam-lai.sh
```

Ra: nhãn in PDF có tràn lề và dấu xén (`nhan/out/*.pdf`, chai 500 ml ở `nhan/out500/`), mặt trước và mặt sau túi (`out/tui/`), ảnh dán và danh sách cho trang xoay (`xoay-360/`).

```bash
bash brand/bo-nhan-T/lam-lai.sh --3d
```

Thêm ảnh 3D tĩnh (`out/3d/`) và catalogue PDF (`out/CATALOGUE-NOBEN-2026.pdf`).

Cần Node 20+, Playwright (Chromium) và Python 3 có Pillow. Thư mục `out/`, `nhan/out/`, `nhan/out500/` là sản phẩm dựng ra, không lưu vào kho.

## Trang xoay 360°

`xoay-360/index.html`: kéo để xoay một vòng, nút Mặt trước, Mặt sau, Tự xoay, cuộn hoặc chụm hai ngón để phóng to.
Chai dựng bằng three.js với nhãn quấn đúng khổ in (1 lít: 161,8 × 100 mm; 500 ml: 159,4 × 80 mm). Túi có mặt sau in thành phần, công dụng, hướng dẫn sử dụng lấy từ hai mặt bên của nhãn.
Mở trên máy: phục vụ thư mục `xoay-360/` qua một máy chủ web bất kỳ (trang tải `san-pham.json` và ảnh trong `tex/`).

## Ghi chú

- Kích thước túi đang là giả định (227/250 g: 12,4 × 22,5 cm; 500 g: 15 × 27,3 cm; 3 kg: 26 × 47,3 cm; 5 kg: 30 × 54,6 cm).
- Dấu hợp quy CR là bản vẽ lại để xem; bản in dùng file gốc của VinaCert.
- PRO ALGA NEW chưa có mã số tiếp nhận, PROZYM chưa có quy cách: đang để `[ĐIỀN]`.
