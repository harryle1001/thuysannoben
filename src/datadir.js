'use strict';
// One place for where customer data lives (leads, lead status, reviews, review photos, on-page edits,
// IndexNow state). It sits OUTSIDE the app folder by default so a redeploy that replaces the app
// folder cannot wipe it:
//   1. DATA_DIR from the environment, when set;
//   2. otherwise ~/noben-data (the hosting account's home, which deploys never touch),
//      or ../noben-data next to the app folder, whichever is writable first;
//   3. otherwise the old data/ inside the app (last resort).
// On start, files found in the old data/ that the new folder does not have yet are copied over
// (never deleted, never overwritten), so nothing is lost when the location changes.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const APP_DIR = path.join(__dirname, '..');
const LEGACY_DIR = path.join(APP_DIR, 'data');

function writable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.probe-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function pick(env = process.env) {
  if (env.DATA_DIR) {
    const d = path.resolve(env.DATA_DIR);
    if (writable(d)) return { dir: d, source: 'DATA_DIR' };
    console.error(`[data] DATA_DIR không ghi được, dùng thư mục mặc định`);
  }
  const candidates = [];
  if (os.homedir()) candidates.push(['home', path.join(os.homedir(), 'noben-data')]);
  candidates.push(['app-parent', path.resolve(APP_DIR, '..', 'noben-data')]);
  for (const [kind, d] of candidates) if (writable(d)) return { dir: d, source: kind };
  return { dir: LEGACY_DIR, source: 'fallback' };
}

// Copies files from `from` into `to` when `to` does not have them yet. Returns the copied paths.
function copyMissing(from, to, rel = '') {
  const copied = [];
  let entries = [];
  try { entries = fs.readdirSync(path.join(from, rel), { withFileTypes: true }); } catch { return copied; }
  for (const e of entries) {
    const r = path.join(rel, e.name);
    if (e.name.startsWith('.') || e.name.endsWith('.tmp') || r === 'backups') continue;
    const src = path.join(from, r);
    const dst = path.join(to, r);
    if (e.isDirectory()) copied.push(...copyMissing(from, to, r));
    else if (e.isFile() && !fs.existsSync(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst, fs.constants.COPYFILE_EXCL);
      copied.push(r);
    }
  }
  return copied;
}

function migrate(from, to) {
  if (path.resolve(from) === path.resolve(to) || !fs.existsSync(from)) return [];
  try {
    const copied = copyMissing(from, to);
    if (copied.length) console.log(`[data] đã chép ${copied.length} file từ data/ cũ sang thư mục dữ liệu mới (bản cũ vẫn giữ nguyên)`);
    return copied;
  } catch (err) {
    console.error('[data] lỗi khi chép dữ liệu cũ:', err.message);
    return [];
  }
}

const chosen = pick();
const DIR = chosen.dir;
console.log(`[data] thư mục dữ liệu: ${chosen.source}`);
const migrated = migrate(LEGACY_DIR, DIR);

const file = (...parts) => path.join(DIR, ...parts);

// Atomic JSON write: write a temp file next to the target, then rename over it.
// Writes to the same file are queued so two quick saves never interleave.
const queues = new Map();
function writeJson(target, value, space = 1) {
  const run = async () => {
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(value, null, space), 'utf8');
    await fs.promises.rename(tmp, target);
  };
  const prev = queues.get(target) || Promise.resolve();
  const next = prev.then(run, run);
  queues.set(target, next.catch(() => {}));
  return next;
}

async function appendLine(target, line) {
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.appendFile(target, line.endsWith('\n') ? line : line + '\n', 'utf8');
}

module.exports = { DIR, LEGACY_DIR, SOURCE: chosen.source, migratedCount: migrated.length, file, writeJson, appendLine, isWritable: () => writable(DIR), _test: { pick, copyMissing, migrate } };
