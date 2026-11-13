'use strict';
// Import dealers from a CSV file into content/dai-ly.json.
// Usage: node scripts/import-dai-ly.js danh-sach-dai-ly.csv
// Columns (header row, any order, Vietnamese or English names accepted):
//   ten | name, tinh | province, huyen | district, dia_chi | address, dien_thoai | phone,
//   nguoi_phu_trach | contact, ghi_chu | note
// Save the sheet as "CSV UTF-8" in Excel or Google Sheets.
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Cách dùng: node scripts/import-dai-ly.js danh-sach-dai-ly.csv'); process.exit(1); }

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const ALIASES = {
  name: ['ten', 'tên', 'ten dai ly', 'tên đại lý', 'name'],
  province: ['tinh', 'tỉnh', 'tinh thanh', 'tỉnh/thành', 'tỉnh thành', 'province'],
  district: ['huyen', 'huyện', 'xa', 'xã', 'phuong', 'phường', 'district'],
  address: ['dia chi', 'địa chỉ', 'dia_chi', 'address'],
  phone: ['dien thoai', 'điện thoại', 'dien_thoai', 'sdt', 'sđt', 'phone'],
  contact: ['nguoi phu trach', 'người phụ trách', 'nguoi_phu_trach', 'lien he', 'contact'],
  note: ['ghi chu', 'ghi chú', 'ghi_chu', 'note'],
};
const norm = (s) => s.toLowerCase().replace(/^﻿/, '').replace(/_/g, ' ').trim();

const rows = parseCsv(fs.readFileSync(file, 'utf8'));
const header = rows.shift().map(norm);
const col = {};
for (const [key, names] of Object.entries(ALIASES)) col[key] = header.findIndex((h) => names.map(norm).includes(h));
if (col.name < 0) { console.error('Không tìm thấy cột tên đại lý (ten / name). Cột hiện có:', header.join(', ')); process.exit(1); }

const out = rows.map((r) => Object.fromEntries(Object.entries(col).filter(([, i]) => i >= 0).map(([k, i]) => [k, (r[i] || '').trim()]))).filter((d) => d.name);
const dest = path.join(__dirname, '..', 'content', 'dai-ly.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`Đã nhập ${out.length} đại lý vào content/dai-ly.json`);
