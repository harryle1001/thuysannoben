/* On-page editor: a pencil button (bottom-left) turns every marked text into an editable field.
   Loaded only for a signed-in admin. Saves to POST /quan-tri/noi-dung. */
(function () {
  'use strict';
  var fields = [].slice.call(document.querySelectorAll('[data-edit]'));
  var PREVIEW = Boolean(window.__NOBEN_PREVIEW);
  var editing = false;
  var original = {};

  var pencil = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var root = document.createElement('div');
  root.className = 'editor';
  root.innerHTML =
    '<div class="editor__panel" role="region" aria-label="Sửa nội dung" hidden>' +
      '<p class="editor__title">Đang sửa nội dung</p>' +
      '<p class="editor__hint">Bấm vào chữ có viền nét đứt để sửa. Ctrl+B để in đậm trong phần mô tả dài.</p>' +
      '<p class="editor__count" aria-live="polite"></p>' +
      '<div class="editor__actions">' +
        '<button type="button" class="editor__save">Lưu thay đổi</button>' +
        '<button type="button" class="editor__cancel">Hủy</button>' +
      '</div>' +
      '<p class="editor__links">' + (PREVIEW
        ? 'Bản xem thử: thay đổi chỉ lưu trên trình duyệt này.'
        : '<a href="/quan-tri/lien-he">Khách liên hệ</a> · <a href="/quan-tri/noi-dung.json">Tải nội dung đã sửa</a> · <a href="/quan-tri/dang-xuat">Đăng xuất</a>') + '</p>' +
      '<p class="editor__status" role="status"></p>' +
    '</div>' +
    '<button type="button" class="editor__fab" aria-pressed="false" aria-label="Sửa nội dung trang này" title="Sửa nội dung trang này">' + pencil + '</button>';
  document.body.appendChild(root);

  var fab = root.querySelector('.editor__fab');
  var panel = root.querySelector('.editor__panel');
  var countEl = root.querySelector('.editor__count');
  var statusEl = root.querySelector('.editor__status');
  var saveBtn = root.querySelector('.editor__save');

  var keyOf = function (el) { return el.getAttribute('data-edit'); };
  var isRich = function (el) { return el.getAttribute('data-edit-type') === 'rich'; };
  var valueOf = function (el) { return isRich(el) ? el.innerHTML.trim() : el.textContent.replace(/\s+/g, ' ').trim(); };

  function changes() {
    var out = {};
    fields.forEach(function (el) {
      var k = keyOf(el);
      var v = valueOf(el);
      if (v !== original[k]) out[k] = v;
    });
    return out;
  }
  function updateCount() {
    var n = Object.keys(changes()).length;
    countEl.textContent = n ? n + ' chỗ đã sửa, chưa lưu' : (fields.length ? 'Chưa có thay đổi' : 'Trang này không có nội dung sửa được');
    saveBtn.disabled = n === 0;
  }
  function setEditable(el, on) {
    if (!on) { el.removeAttribute('contenteditable'); el.removeAttribute('tabindex'); return; }
    if (isRich(el)) el.contentEditable = 'true';
    else { try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; } }
    el.setAttribute('spellcheck', 'false');
  }
  function setMode(on) {
    editing = on;
    document.documentElement.classList.toggle('is-editing', on);
    fab.setAttribute('aria-pressed', String(on));
    fab.setAttribute('aria-label', on ? 'Thoát chế độ sửa' : 'Sửa nội dung trang này');
    panel.hidden = !on;
    if (on) {
      fields.forEach(function (el) { if (!(keyOf(el) in original)) original[keyOf(el)] = valueOf(el); });
      statusEl.textContent = '';
      updateCount();
    }
    fields.forEach(function (el) { setEditable(el, on); });
    if (on && fields[0]) fields[0].focus();
  }
  function restore() {
    fields.forEach(function (el) {
      var v = original[keyOf(el)];
      if (v === undefined) return;
      if (isRich(el)) el.innerHTML = v; else el.textContent = v;
    });
  }

  fab.addEventListener('click', function () {
    if (editing && Object.keys(changes()).length) {
      statusEl.textContent = 'Còn thay đổi chưa lưu. Bấm "Lưu thay đổi" hoặc "Hủy" trước khi thoát.';
      return;
    }
    setMode(!editing);
  });
  root.querySelector('.editor__cancel').addEventListener('click', function () { restore(); setMode(false); });

  // Keep copies of the same value in sync (e.g. the hotline in header and footer).
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-edit]');
    if (!el || !editing) return;
    var k = keyOf(el), v = isRich(el) ? el.innerHTML : el.textContent;
    fields.forEach(function (other) { if (other !== el && keyOf(other) === k) { if (isRich(other)) other.innerHTML = v; else other.textContent = v; } });
    updateCount();
  });
  // While editing, links and buttons inside the page do not navigate.
  document.addEventListener('click', function (e) {
    if (!editing || root.contains(e.target)) return;
    var a = e.target.closest('a, button, [data-lb], label');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('[data-edit]');
    if (!el || !editing) return;
    if (e.key === 'Enter' && !isRich(el)) { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') el.blur();
  });
  // Paste as plain text so formatting from Word or Zalo does not come along.
  document.addEventListener('paste', function (e) {
    var el = e.target.closest && e.target.closest('[data-edit]');
    if (!el || !editing) return;
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, t);
  });
  window.addEventListener('beforeunload', function (e) {
    if (editing && Object.keys(changes()).length) { e.preventDefault(); e.returnValue = ''; }
  });

  saveBtn.addEventListener('click', function () {
    var c = changes();
    var n = Object.keys(c).length;
    if (!n) return;
    saveBtn.disabled = true;
    statusEl.textContent = 'Đang lưu…';
    fetch('/quan-tri/noi-dung', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ changes: c }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.body.ok) throw new Error(res.body.message || 'Chưa lưu được. Thử lại sau.');
        var applied = res.body.applied || c;
        Object.keys(applied).forEach(function (k) { original[k] = typeof applied[k] === 'string' ? applied[k] : c[k]; });
        restoreFromSaved(applied);
        statusEl.textContent = 'Đã lưu ' + res.body.saved + ' thay đổi.';
        updateCount();
      })
      .catch(function (err) {
        statusEl.textContent = err.message;
        saveBtn.disabled = false;
      });
  });
  // Show the cleaned value the server stored, so what you see is what visitors will see.
  function restoreFromSaved(applied) {
    fields.forEach(function (el) {
      var k = keyOf(el);
      if (!(k in applied)) return;
      if (isRich(el)) el.innerHTML = applied[k]; else el.textContent = applied[k];
      original[k] = valueOf(el);
    });
  }

  if (/[?&]sua=1\b/.test(location.search)) setMode(true);
})();
