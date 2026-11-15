# Noben motion (Remotion)

Motion graphics cho website thuysannoben.com. Không thuộc bản build của web.

```bash
cd motion && npm ci
npm run studio            # xem và chỉnh trong trình duyệt
bash render-ads.sh        # 3 video quảng cáo sản phẩm
bash render-factory.sh    # phim nhà máy và đội ngũ (FactoryFilm)
```

## FactoryFilm: phim nhà máy và đội ngũ

- Mã nguồn: `src/scenes/FactoryFilm.tsx`, hình minh họa vẽ tay `src/factory/LineArt.tsx`,
  danh sách hình thật `src/factory/media.ts` (`FACTORY_MEDIA`), nhịp cảnh `src/factory/timing.json`.
- 4 composition: `FactoryFilm` (16:9, ≈54 giây), `FactoryFilmVertical` (9:16), `FactoryFilm20` và
  `FactoryFilm20Vertical` (bản cắt 20 giây).
- Nhịp: mỗi cảnh dài một bội số của π giây, chuyển cảnh π/4 giây; bố cục chia khung theo tỷ lệ vàng φ.
- Âm thanh: tự tổng hợp bằng `make-factory-sfx.mjs` (không dùng nhạc có bản quyền).
- `render-factory.sh` xuất bản chất lượng cao vào `motion/out/` (không đưa vào git) và bản nén cho web vào
  `public/media/factory/`.

### Nguyên tắc hình ảnh

Chỉ dùng hình thật của Noben cho "nhà máy", "đội ngũ". Không dùng clip hoặc ảnh stock quay nhà máy, con người
của công ty khác. Hiện chưa có ảnh bên trong xưởng, nên cảnh nguyên liệu và dây chuyền là hình vẽ minh họa.

### Thay ảnh bằng clip quay thật tại nhà máy

1. Đặt clip vào `motion/public/factory/clips/` (ví dụ `04-tron.mp4`).
2. Thêm hoặc sửa dòng trong `FACTORY_MEDIA` (`src/factory/media.ts`):
   ```ts
   { slot: "line", type: "video", src: "factory/clips/04-tron.mp4", caption: "Trộn nguyên liệu", startFrom: 2 },
   ```
   `slot` là cảnh sẽ hiện clip: `raw`, `formula`, `line`, `qc`, `team`. Cảnh `raw` và `line` tự hiện khung clip
   cạnh hình vẽ khi có clip; `team` dùng tối đa 12 ô; `formula` dùng 2 khung.
3. Chạy lại `bash render-factory.sh`, xem lại, rồi commit các file trong `public/media/factory/`.

### Hướng dẫn quay 10 cảnh (mỗi cảnh 5–8 giây)

Thiết bị và cài đặt chung:
- Quay **ngang**, **4K** (3840×2160), 25 hoặc 30 khung/giây, nếu được thì 50/60 khung/giây cho cảnh chuyển động để làm chậm.
- Dùng gimbal hoặc chân máy; chuyển động máy chậm, đều (trượt ngang, đẩy vào). Không zoom số.
- Ánh sáng: tắt đèn huỳnh quang nhấp nháy nếu có thể, ưu tiên đèn LED trắng 5000–5600K; khóa cân bằng trắng
  và phơi sáng (không để tự động). Không quay ngược sáng cửa sổ.
- Mỗi cảnh quay dư 2 giây đầu và cuối. Chủ thể ở giữa khung, chừa khoảng trống hai bên vì video còn được cắt dọc 9:16.
- Nhân viên mặc đồng phục, đội mũ, đeo khẩu trang, găng tay đúng quy định; dọn gọn khu vực trước khi quay.
- Không quay giấy tờ có số liệu chưa công bố, công thức, màn hình máy tính nội bộ.

| # | Cảnh (slot) | Nội dung | Gợi ý góc máy |
|---|---|---|---|
| 1 | `intro` | Cổng và biển hiệu nhà máy Noben, Củ Chi | Toàn cảnh, đẩy máy chậm vào biển hiệu, nắng sáng sớm |
| 2 | `raw` | Bao nguyên liệu nhập về, xếp trên pallet | Trượt ngang dọc hàng bao, ánh sáng đều |
| 3 | `raw` | Nhân viên kiểm tra nguyên liệu (xem nhãn, lấy mẫu) | Cận tay và nhãn bao, nền xưởng mờ |
| 4 | `formula` | Đội kỹ thuật trao đổi công thức, ghi chép | Trung cảnh, 2–3 người, không lộ nội dung giấy |
| 5 | `line` | Cân định lượng nguyên liệu | Cận mặt cân và tay thao tác |
| 6 | `line` | Máy trộn đang chạy | Cận cửa máy trộn, quay 50/60 fps |
| 7 | `line` | Máy đóng gói, gói thành phẩm rơi xuống băng tải | Ngang tầm băng tải, theo dòng sản phẩm |
| 8 | `qc` | Kiểm tra thành phẩm trước khi xuất xưởng | Cận tay cầm sản phẩm, đọc nhãn, đóng dấu đạt |
| 9 | `team` | Đội ngũ đứng trước nhà máy hoặc trong xưởng | Toàn cảnh, mọi người mỉm cười, máy đẩy chậm vào |
| 10 | `reach` | Xếp hàng lên xe giao, xe rời cổng | Trung cảnh rồi toàn cảnh, chiều muộn ánh nắng vàng |
