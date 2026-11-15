'use strict';
// Unit tests: TOTP (RFC 6238 test vectors), moving data to DATA_DIR, backups and the lead webhook.
// Run with: node scripts/test-security.js (also part of npm run check)
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'noben-test-'));
process.env.DATA_DIR = path.join(tmpRoot, 'data-main');
const log = console.log;
console.log = () => {}; // keep module start-up lines out of the test output
const totp = require('../src/totp');
const datadir = require('../src/datadir');
const backup = require('../src/backup');
const webhook = require('../src/webhook');
console.log = log;

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`OK   ${name}`); } catch (err) { console.log(`FAIL ${name}\n     ${err.message}`); process.exitCode = 1; }
}

(async () => {
  // RFC 6238 appendix B: SHA1 secret "12345678901234567890", 8 digits.
  const key = Buffer.from('12345678901234567890');
  const vectors = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']];
  await test('TOTP khớp vector chuẩn RFC 6238 (SHA1)', () => {
    for (const [t, want] of vectors) assert.strictEqual(totp.generate(key, { time: t * 1000, digits: 8 }), want, `t=${t}`);
  });
  await test('TOTP SHA256/SHA512 khớp RFC 6238', () => {
    assert.strictEqual(totp.generate(Buffer.from('12345678901234567890123456789012'), { time: 59000, digits: 8, algo: 'sha256' }), '46119246');
    assert.strictEqual(totp.generate(Buffer.from('1234567890123456789012345678901234567890123456789012345678901234'), { time: 59000, digits: 8, algo: 'sha512' }), '90693936');
  });
  await test('Base32 mã hóa và giải mã đúng', () => {
    assert.strictEqual(totp.base32Encode(key), 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    assert.deepStrictEqual(totp.base32Decode('gezd gnbv gy3t qojq gezd gnbv gy3t qojq'), key);
    assert.strictEqual(totp.base32Decode('abc1'), null);
  });
  await test('verify chấp nhận lệch ±1 bước, từ chối ±2 và mã sai', () => {
    const s = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const t = 1111111109 * 1000;
    const code = totp.generate(key, { time: t });
    assert.ok(totp.verify(s, code, { time: t }) >= 0);
    assert.ok(totp.verify(s, code, { time: t + 30000 }) >= 0);
    assert.ok(totp.verify(s, code, { time: t - 30000 }) >= 0);
    assert.strictEqual(totp.verify(s, code, { time: t + 61000 }), -1);
    assert.strictEqual(totp.verify(s, '000000', { time: t }) === -1 || code === '000000', true);
    assert.strictEqual(totp.verify(s, 'abcdef', { time: t }), -1);
  });
  await test('Mã chỉ dùng được một lần, không có biến thì không bắt mã', () => {
    delete require.cache[require.resolve('../src/auth')];
    delete process.env.ADMIN_TOTP_SECRET;
    let auth = require('../src/auth');
    assert.strictEqual(auth.totpEnabled(), false);
    assert.strictEqual(auth.checkCode(''), true);
    process.env.ADMIN_TOTP_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    delete require.cache[require.resolve('../src/auth')];
    auth = require('../src/auth');
    const code = totp.generate(key);
    assert.strictEqual(auth.checkCode(code), true);
    assert.strictEqual(auth.checkCode(code), false, 'dùng lại mã cũ phải bị từ chối');
    assert.strictEqual(auth.basicAuthOk({ get: () => 'Basic ' + Buffer.from('admin:x').toString('base64') }), false);
    delete process.env.ADMIN_TOTP_SECRET;
  });
  await test('QR là SVG thuần, không có script', () => {
    const svg = totp.qrSvg(totp.otpauthUrl(totp.newSecret()));
    assert.ok(svg.startsWith('<svg') && !/script|style=/i.test(svg));
  });

  await test('Chép data/ cũ sang DATA_DIR: chép file thiếu, không ghi đè, giữ bản cũ', () => {
    const legacy = path.join(tmpRoot, 'legacy');
    const target = path.join(tmpRoot, 'target');
    fs.mkdirSync(path.join(legacy, 'review-photos'), { recursive: true });
    fs.writeFileSync(path.join(legacy, 'leads.jsonl'), '{"a":1}\n{"a":2}\n');
    fs.writeFileSync(path.join(legacy, 'reviews.json'), '[1]');
    fs.writeFileSync(path.join(legacy, 'review-photos', 'abc-1.webp'), 'img');
    fs.writeFileSync(path.join(legacy, 'x.tmp'), 'skip');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'reviews.json'), '[2]');
    console.log = () => {};
    const copied = datadir._test.migrate(legacy, target);
    const again = datadir._test.migrate(legacy, target);
    console.log = log;
    assert.deepStrictEqual(copied.sort(), ['leads.jsonl', path.join('review-photos', 'abc-1.webp')].sort());
    assert.deepStrictEqual(again, []);
    assert.strictEqual(fs.readFileSync(path.join(target, 'leads.jsonl'), 'utf8').split('\n').filter(Boolean).length, 2);
    assert.strictEqual(fs.readFileSync(path.join(target, 'reviews.json'), 'utf8'), '[2]', 'không ghi đè file đã có');
    assert.ok(fs.existsSync(path.join(legacy, 'leads.jsonl')), 'bản cũ phải còn');
    assert.ok(!fs.existsSync(path.join(target, 'x.tmp')));
  });
  await test('DATA_DIR không ghi được thì dùng thư mục dự phòng', () => {
    const blocker = path.join(tmpRoot, 'file-not-dir');
    fs.writeFileSync(blocker, '');
    console.error = () => {};
    const r = datadir._test.pick({ DATA_DIR: path.join(blocker, 'sub') });
    assert.notStrictEqual(r.source, 'DATA_DIR');
  });
  await test('writeJson ghi nguyên vẹn khi nhiều lần ghi liên tiếp', async () => {
    const f = datadir.file('t.json');
    await Promise.all(Array.from({ length: 20 }, (_, i) => datadir.writeJson(f, { i })));
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(f, 'utf8')), { i: 19 });
    assert.deepStrictEqual(fs.readdirSync(datadir.DIR).filter((x) => x.endsWith('.tmp')), []);
  });
  await test('Bản sao lưu .tar.gz có đủ file khách, không có file lạ', async () => {
    fs.writeFileSync(datadir.file('leads.jsonl'), '{"n":1}\n');
    fs.writeFileSync(datadir.file('lead-status.json'), '{}');
    fs.writeFileSync(datadir.file('indexnow-sent.json'), '{}');
    const tar = zlib.gunzipSync(backup.build());
    const names = [];
    for (let off = 0; off + 512 <= tar.length; ) {
      const name = tar.toString('utf8', off, off + 100).replace(/\0.*$/s, '');
      if (!name) break;
      const size = parseInt(tar.toString('ascii', off + 124, off + 136), 8);
      names.push(name);
      off += 512 + Math.ceil(size / 512) * 512;
    }
    assert.deepStrictEqual(names, ['noben-data/leads.jsonl', 'noben-data/lead-status.json']);
    console.log = () => {};
    const file = await backup.daily();
    console.log = log;
    assert.ok(fs.existsSync(file));
  });
  await test('Webhook: thử lại 2 lần, gửi khóa, không gửi IP', async () => {
    const calls = [];
    const fake = async (url, opts) => { calls.push(opts); return { ok: calls.length === 3, status: 500 }; };
    const ok = await webhook.post('https://example.test/hook', { name: 'A', ip: '1.2.3.4' }, { secret: 's3', fetchImpl: fake, delay: 1 });
    assert.strictEqual(ok, true);
    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[0].headers['X-Noben-Secret'], 's3');
    const body = JSON.parse(calls[0].body);
    assert.strictEqual(body.ip, undefined);
    assert.strictEqual(body.secret, 's3');
    console.error = () => {};
    const fail = await webhook.post('https://example.test/hook', {}, { fetchImpl: async () => { throw new Error('down'); }, delay: 1 });
    assert.strictEqual(fail, false);
  });

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log(process.exitCode ? '\nCó kiểm thử thất bại' : `\n${passed} kiểm thử bảo mật/dữ liệu đều đạt`);
})();
