'use strict';
// Contact-form submissions: validated, appended to leads.jsonl in the data folder (src/datadir.js),
// emailed when SMTP is configured and POSTed to LEADS_WEBHOOK_URL (e.g. a Google Sheet) when set.
const fs = require('fs');
const data = require('./datadir');
const webhook = require('./webhook');

const file = data.file('leads.jsonl');
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
  await data.appendLine(file, JSON.stringify(record));
  webhook.send(record); // fire and forget: a slow or broken webhook never blocks the form
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
  let raw = '';
  try { raw = await fs.promises.readFile(file, 'utf8'); } catch { return []; }
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    try { out.push(withMeta(JSON.parse(line))); } catch { /* skip a broken line */ }
  }
  return out.reverse();
}

// ---------- Admin: lead source, landing page and follow-up status ----------
const crypto = require('crypto');
const statusFile = data.file('lead-status.json');
const STATUSES = ['Mới', 'Đã gọi', 'Đã chốt', 'Không tiềm năng'];

// The form's "page" field holds the page path, plus "utm_source=...&utm_campaign=..." on ad visits (public/js/main.js).
function withMeta(l) {
  const page = String(l.page || '').trim();
  const sp = page.indexOf(' ');
  let landing = sp > -1 ? page.slice(0, sp) : page;
  const q = new URLSearchParams(sp > -1 ? page.slice(sp + 1) : '');
  try { if (/^https?:/.test(landing)) landing = new URL(landing).pathname; } catch { /* keep as is */ }
  const source = q.get('utm_source') || (q.get('gclid') ? 'google-ads' : q.get('fbclid') ? 'facebook-ads' : '');
  return {
    ...l,
    id: crypto.createHash('sha1').update(`${l.at}|${l.phone}|${l.name}`).digest('hex').slice(0, 12),
    landing: landing || '(không rõ)',
    source: source || 'Tự nhiên',
    campaign: q.get('utm_campaign') || '',
  };
}

async function statuses() {
  try { return JSON.parse(await fs.promises.readFile(statusFile, 'utf8')); } catch { return {}; }
}
async function setStatus(id, status) {
  if (!/^[a-f0-9]{12}$/.test(String(id)) || !STATUSES.includes(status)) return false;
  const all = await statuses();
  if (status === 'Mới') delete all[id];
  else all[id] = status;
  await data.writeJson(statusFile, all);
  return true;
}

module.exports = { NEEDS, STATUSES, validate, throttled, save, list, statuses, setStatus, mailEnabled: () => Boolean(transporter) };
