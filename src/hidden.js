'use strict';
// Products not shown on the website (antibiotics and antiparasitic products, by company
// decision). Their data stays in products.json; their pages redirect to the product group.
// Also used by scripts/build-labels.js: hidden products get no print label.
module.exports = new Set([
  'flophen', 'flophenicol-40', 'zicotrim', // kháng sinh
  'prazi-s', 'de-zoo', 'bronopol', 'ben-xid-3000', 'ben-mkc-4000', 'aqua-tech', 'super-gold', // ký sinh trùng
  // Không có trong danh mục công bố/lưu hành (116 sản phẩm) nên không bán.
  'ben-bkc-80', 'super-din-600', 'vi-sinh-3-trong-1-chuyen-lam-sach-day-nuoc-cat-tao-sach-nhot-bat',
  'kalimix', 'butypho', 'd-oc', 'nb-brown-gay-mau-nuoc-mau-tra', 'xo-09',
  // Chưa có hồ sơ TCCS (20/11/2026): bỏ khỏi web và nhãn.
  'amylac', 'bio-book', 'nb-biopond', 'proticbest', 'toxic-algae', 'bio-max',
  'nb-mix-5000-ho-tro-phong-cong-than-duc-co-mem-vo', 'nb-sorbitol-b12', 'prolac', 'top-weigh',
  'us-lacto', 'antiliv', 'bio-mos', 'sun-blue',
]);
