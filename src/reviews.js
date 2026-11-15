'use strict';
// Customer reviews: submitted at /danh-gia, held as "pending" until an admin approves them.
// Stored in data/reviews.json (git-ignored); photos in data/review-photos/ and served only once approved.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', 'data');
const file = path.join(dir, 'reviews.json');
const photoDir = path.join(dir, 'review-photos');
const SALUTES = ['Anh', 'Chị', 'Cô', 'Chú', 'Bác', 'Em'];
const ROLES = ['Người nuôi', 'Đại lý'];
const MAX_PHOTOS = 2;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

let all = [];
try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { all = []; }

async function persist() {
  await fs.promises.mkdir(dir, { recursive: true });
  const tmp = file + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(all, null, 1), 'utf8');
  await fs.promises.rename(tmp, file);
}

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const cap = (s) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

// "nguyễn văn minh" + "Anh" -> "Anh Minh": the given name is the last word of a Vietnamese name.
function displayName(salute, name) {
  const last = name.split(' ').filter(Boolean).pop() || '';
  return `${salute} ${cap(last.toLocaleLowerCase('vi'))}`.trim();
}

function validate(body, isProduct) {
  const r = {
    salute: SALUTES.includes(body.salute) ? body.salute : 'Anh',
    name: clean(body.name, 60),
    province: clean(body.province, 40),
    phone: clean(body.phone, 20),
    product: clean(body.product, 120),
    role: ROLES.includes(body.role) ? body.role : ROLES[0],
    stars: Number(body.stars),
    text: String(body.text || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1500),
  };
  const errors = {};
  if (r.name.length < 2) errors.name = 'Nhập họ tên của bạn.';
  if (r.province.length < 2) errors.province = 'Nhập tỉnh, thành nơi bạn nuôi hoặc bán hàng.';
  if (!/^(0|84)\d{8,10}$/.test(r.phone.replace(/\D/g, ''))) errors.phone = 'Số điện thoại chưa đúng. Ví dụ: 0934 246 420.';
  if (r.product !== 'khac' && !isProduct(r.product)) errors.product = 'Chọn sản phẩm bạn đã dùng.';
  if (!(Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 5)) errors.stars = 'Chọn số sao từ 1 đến 5.';
  if (r.text.length < 20) errors.text = 'Viết ít nhất vài câu (từ 20 ký tự) về kết quả bạn thấy.';
  if (!body.consent) errors.consent = 'Đánh dấu đồng ý để Noben được đăng đánh giá.';
  return { review: r, errors };
}

// Spam that slips past the honeypot and time trap usually carries links.
const looksSpam = (r) => (r.text.match(/https?:\/\/|www\./gi) || []).length > 0;

// At most 3 reviews per IP per hour.
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 3;
}

// ---------- Photos ----------
function kindOf(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return '';
}

// Remove EXIF/XMP/comments (GPS position, phone model) from a photo before it is kept.
function stripMeta(buf, kind) {
  try {
    if (kind === 'jpg') {
      const out = [buf.slice(0, 2)];
      let i = 2;
      while (i + 4 <= buf.length && buf[i] === 0xff) {
        const m = buf[i + 1];
        if (m === 0xda) { out.push(buf.slice(i)); return Buffer.concat(out); } // start of scan: image data follows
        const len = buf.readUInt16BE(i + 2);
        const keep = !((m >= 0xe1 && m <= 0xef) || m === 0xfe); // drop APP1..APP15 and comments, keep APP0/ICC-free JFIF
        if (keep) out.push(buf.slice(i, i + 2 + len));
        i += 2 + len;
      }
      return null;
    }
    if (kind === 'png') {
      const out = [buf.slice(0, 8)];
      let i = 8;
      while (i + 12 <= buf.length) {
        const len = buf.readUInt32BE(i);
        const type = buf.toString('ascii', i + 4, i + 8);
        if (!['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'].includes(type)) out.push(buf.slice(i, i + 12 + len));
        i += 12 + len;
        if (type === 'IEND') break;
      }
      return Buffer.concat(out);
    }
    if (kind === 'webp') {
      const out = [];
      let i = 12;
      while (i + 8 <= buf.length) {
        const type = buf.toString('ascii', i, i + 4);
        const len = buf.readUInt32LE(i + 4);
        const end = i + 8 + len + (len % 2);
        if (type === 'VP8X') {
          const c = Buffer.from(buf.slice(i, end));
          c[8] &= ~0x0c; // clear the EXIF and XMP flags
          out.push(c);
        } else if (type !== 'EXIF' && type !== 'XMP ') out.push(buf.slice(i, end));
        i = end;
      }
      const body = Buffer.concat(out);
      const head = Buffer.from('RIFF0000WEBP', 'ascii');
      head.writeUInt32LE(body.length + 4, 4);
      return Buffer.concat([head, body]);
    }
  } catch { /* fall through */ }
  return null;
}

// Files come from parseMultipart(); the page script has already resized them and turned them into WebP.
async function savePhotos(files, id) {
  const names = [];
  for (const f of files.slice(0, MAX_PHOTOS)) {
    if (!f.data.length || f.data.length > MAX_PHOTO_BYTES) continue;
    const kind = kindOf(f.data);
    if (!kind) continue;
    const data = stripMeta(f.data, kind);
    if (!data) continue;
    const name = `${id}-${names.length + 1}.${kind}`;
    await fs.promises.mkdir(photoDir, { recursive: true });
    await fs.promises.writeFile(path.join(photoDir, name), data);
    names.push(name);
  }
  return names;
}

const photoPath = (name) => (/^[a-f0-9]{12}-[12]\.(webp|jpg|png)$/.test(name) ? path.join(photoDir, name) : '');

// Minimal multipart/form-data parser (no extra dependency). Returns { fields, files }.
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const fields = {};
  const files = [];
  if (!m) return { fields, files };
  const sep = Buffer.from('--' + (m[1] || m[2]).trim());
  let pos = buf.indexOf(sep);
  while (pos > -1) {
    const start = pos + sep.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    const next = buf.indexOf(sep, start);
    if (next < 0) break;
    const part = buf.slice(start + 2, next - 2); // skip CRLF after boundary and before the next one
    const hEnd = part.indexOf('\r\n\r\n');
    if (hEnd > -1) {
      const head = part.slice(0, hEnd).toString('utf8');
      const data = part.slice(hEnd + 4);
      const name = (/name="([^"]*)"/i.exec(head) || [])[1];
      const filename = (/filename="([^"]*)"/i.exec(head) || [])[1];
      if (name && filename !== undefined) { if (data.length) files.push({ name, filename, data }); }
      else if (name && Object.keys(fields).length < 40) fields[name] = data.toString('utf8').slice(0, 4000);
    }
    pos = next;
  }
  return { fields, files };
}

// ---------- Store ----------
async function add(r, photos, meta) {
  const id = crypto.randomBytes(6).toString('hex');
  const rec = {
    id,
    status: 'pending',
    at: new Date().toISOString(),
    display: displayName(r.salute, r.name),
    ...r,
    phone: r.phone.replace(/[^\d+]/g, ''),
    photos: [],
    ip: meta.ip,
  };
  rec.photos = await savePhotos(photos, id);
  all.push(rec);
  await persist();
  notify(rec, meta);
  return rec;
}

async function setStatus(id, status) {
  const r = all.find((x) => x.id === id);
  if (!r || !['pending', 'approved'].includes(status)) return false;
  r.status = status;
  if (status === 'approved') r.approvedAt = new Date().toISOString();
  await persist();
  return true;
}

async function remove(id) {
  const r = all.find((x) => x.id === id);
  if (!r) return false;
  all = all.filter((x) => x.id !== id);
  await persist();
  for (const p of r.photos || []) fs.promises.unlink(path.join(photoDir, p)).catch(() => {});
  return true;
}

const byDate = (a, b) => (b.approvedAt || b.at).localeCompare(a.approvedAt || a.at);
const approved = (product) => all.filter((r) => r.status === 'approved' && (!product || r.product === product)).sort(byDate);
const listAll = () => [...all].sort((a, b) => (a.status === b.status ? b.at.localeCompare(a.at) : a.status === 'pending' ? -1 : 1));
const isApprovedPhoto = (name) => all.some((r) => r.status === 'approved' && (r.photos || []).includes(name));
function summary(list) {
  if (!list.length) return null;
  const avg = list.reduce((s, r) => s + r.stars, 0) / list.length;
  return { count: list.length, avg: Math.round(avg * 10) / 10 };
}

// Email the sales team when a new review waits for approval (same SMTP settings as the contact form).
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = require('nodemailer').createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}
function notify(r, meta) {
  if (!transporter) return;
  transporter
    .sendMail({
      from: `"Website Noben" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      subject: `[Website] Đánh giá mới chờ duyệt – ${r.display} ${r.stars} sao`,
      text: [`${r.name} (${r.role}, ${r.province}) – ${r.phone}`, `Sản phẩm: ${meta.productName || r.product}`, `${r.stars} sao`, '', r.text, '', `Duyệt tại: ${meta.adminUrl}`].join('\n'),
    })
    .catch((err) => console.error('Không gửi được email đánh giá:', err.message));
}

module.exports = { SALUTES, ROLES, MAX_PHOTOS, MAX_PHOTO_BYTES, validate, looksSpam, throttled, parseMultipart, add, setStatus, remove, approved, listAll, summary, photoPath, isApprovedPhoto };
