'use strict';
// Backups of customer data as .tar.gz (opens with 7-Zip, WinRAR, macOS and `tar -xzf`).
// Holds leads, lead status, reviews, review photos and on-page edits. Never holds passwords:
// those live only in environment variables, not in the data folder.
// A copy is made once a day into DATA_DIR/backups/, keeping the 30 most recent.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const data = require('./datadir');

const INCLUDE = ['leads.jsonl', 'lead-status.json', 'reviews.json', 'overrides.json', 'review-photos', 'label-edits.json'];
const KEEP = 30;
const backupDir = () => data.file('backups');

function tarHeader(name, size, mtime) {
  const h = Buffer.alloc(512);
  h.write(name.slice(0, 100), 0, 'utf8');
  h.write('0000644\0', 100);
  h.write('0000000\0', 108);
  h.write('0000000\0', 116);
  h.write(size.toString(8).padStart(11, '0') + '\0', 124);
  h.write(Math.floor(mtime / 1000).toString(8).padStart(11, '0') + '\0', 136);
  h.write('        ', 148); // checksum placeholder
  h.write('0', 156);
  h.write('ustar\0', 257);
  h.write('00', 263);
  let sum = 0;
  for (const b of h) sum += b;
  h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return h;
}

function collect() {
  const files = [];
  for (const name of INCLUDE) {
    const p = data.file(name);
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isFile()) files.push([name, p, st]);
    else if (st.isDirectory()) {
      for (const f of fs.readdirSync(p).sort()) {
        const fp = path.join(p, f);
        const fst = fs.statSync(fp);
        if (fst.isFile() && !f.startsWith('.')) files.push([`${name}/${f}`, fp, fst]);
      }
    }
  }
  return files;
}

// Builds the archive in memory (the data is small: text plus a few compressed photos).
function build() {
  const parts = [];
  for (const [name, p, st] of collect()) {
    const body = fs.readFileSync(p);
    parts.push(tarHeader(`noben-data/${name}`, body.length, st.mtimeMs), body);
    const pad = (512 - (body.length % 512)) % 512;
    if (pad) parts.push(Buffer.alloc(pad));
  }
  parts.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(parts), { level: 9 });
}

const vnDay = (d = new Date()) => new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

async function daily() {
  const dir = backupDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const target = path.join(dir, `noben-${vnDay()}.tar.gz`);
  if (!fs.existsSync(target)) {
    const tmp = target + '.tmp';
    await fs.promises.writeFile(tmp, build());
    await fs.promises.rename(tmp, target);
    console.log(`[backup] đã tạo bản sao lưu ${path.basename(target)}`);
  }
  const all = (await fs.promises.readdir(dir)).filter((f) => /^noben-\d{4}-\d{2}-\d{2}\.tar\.gz$/.test(f)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP))) await fs.promises.unlink(path.join(dir, old)).catch(() => {});
  return target;
}

// First backup two minutes after start, then a check every hour (a new file only when the date changes).
function schedule() {
  const run = () => daily().catch((e) => console.error('[backup]', e.message));
  const t = setTimeout(run, 2 * 60 * 1000);
  const i = setInterval(run, 60 * 60 * 1000);
  if (t.unref) t.unref();
  if (i.unref) i.unref();
}

module.exports = { build, daily, schedule, vnDay, collect };
