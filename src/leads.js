'use strict';
// Contact-form submissions: validated, appended to data/leads.jsonl, and emailed when SMTP is configured.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'leads.jsonl');
const NEEDS = ['Mua sản phẩm', 'Yêu cầu báo giá', 'Làm đại lý', 'Gia công sản phẩm', 'Tư vấn kỹ thuật', 'Đăng ký nhận tin', 'Ứng tuyển', 'Khác'];

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const nodemailer = require('nodemailer');
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

function validate(body) {
  const lead = {
    name: clean(body.name, 80),
    phone: clean(body.phone, 20),
    province: clean(body.province, 60),
    need: clean(body.need, 40),
    product: clean(body.product, 1200),
    message: String(body.message || '').trim().slice(0, 2000),
  };
  const errors = {};
  const en = body.lang === 'en';
  if (lead.name.length < 2) errors.name = en ? 'Please enter your name.' : 'Nhập họ tên để chúng tôi biết cách xưng hô.';
  const digits = lead.phone.replace(/\D/g, '');
  if (en ? !/^\d{7,15}$/.test(digits) : !/^(0|84)\d{8,10}$/.test(digits)) errors.phone = en ? 'Please enter a valid phone number with country code.' : 'Số điện thoại chưa đúng. Ví dụ: 0934 246 420.';
  if (en) lead.message = '[EN] ' + lead.message;
  if (!NEEDS.includes(lead.need)) lead.need = 'Khác';
  return { lead, errors };
}

// Simple in-memory throttle: at most 5 submissions per IP every 10 minutes.
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

async function save(lead, meta) {
  const record = { ...lead, ...meta, at: new Date().toISOString() };
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.appendFile(file, JSON.stringify(record) + '\n', 'utf8');
  if (transporter) {
    const lines = [
      `Họ tên: ${lead.name}`,
      `Điện thoại: ${lead.phone}`,
      `Tỉnh/thành: ${lead.province || '-'}`,
      `Nhu cầu: ${lead.need}`,
      `Sản phẩm quan tâm: ${(lead.product || '-').split(' | ').join('\n  - ')}`,
      '',
      lead.message || '(không có lời nhắn)',
      '',
      `Gửi từ trang: ${meta.page || '-'}`,
    ];
    transporter
      .sendMail({
        from: `"Website Noben" <${process.env.SMTP_USER}>`,
        to: process.env.MAIL_TO || process.env.SMTP_USER,
        subject: `[Website] ${lead.need} – ${lead.name} ${lead.phone}`,
        text: lines.join('\n'),
      })
      .catch((err) => console.error('Không gửi được email liên hệ:', err.message));
  }
  return record;
}

async function list() {
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      .reverse();
  } catch {
    return [];
  }
}

module.exports = { NEEDS, validate, throttled, save, list, mailEnabled: () => Boolean(transporter) };
