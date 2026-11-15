'use strict';
// Time-based one-time passwords (RFC 6238 / RFC 4226), the 6-digit codes of Google Authenticator,
// Microsoft Authenticator, Authy... Written with Node's crypto only. QR codes are drawn on the
// server as SVG (no outside service, no script).
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[\s=-]/g, '');
  if (!clean || /[^A-Z2-7]/.test(clean)) return null;
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

function hotp(key, counter, { digits = 6, algo = 'sha1' } = {}) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = crypto.createHmac(algo, key).update(msg).digest();
  const off = mac[mac.length - 1] & 15;
  const bin = ((mac[off] & 127) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

const STEP = 30;
const counterAt = (ms) => Math.floor(ms / 1000 / STEP);

function generate(key, { time = Date.now(), digits = 6, algo = 'sha1' } = {}) {
  return hotp(key, counterAt(time), { digits, algo });
}

// Returns the matched time step (to stop the same code being used twice) or -1.
// Accepts one step either side (about +/- 30 s) for phone clocks that drift.
function verify(secretB32, code, { time = Date.now(), window = 1 } = {}) {
  const key = base32Decode(secretB32);
  const given = String(code || '').replace(/\s/g, '');
  if (!key || key.length < 10 || !/^\d{6}$/.test(given)) return -1;
  const now = counterAt(time);
  let found = -1;
  for (let c = now - window; c <= now + window; c++) {
    const a = Buffer.from(hotp(key, c));
    const b = Buffer.from(given);
    if (crypto.timingSafeEqual(a, b) && found === -1) found = c; // keep looping: same work whatever the result
  }
  return found;
}

const newSecret = () => base32Encode(crypto.randomBytes(20));

function otpauthUrl(secret, { issuer = 'Noben', account = 'admin' } = {}) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function qrSvg(text, { scale = 6, margin = 4 } = {}) {
  const qrcode = require('qrcode-generator');
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x + margin} ${y + margin}h1v1h-1z`;
  const size = n + margin * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" shape-rendering="crispEdges" role="img" aria-label="Mã QR để thêm vào ứng dụng xác thực"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

module.exports = { base32Encode, base32Decode, hotp, generate, verify, newSecret, otpauthUrl, qrSvg, STEP };
