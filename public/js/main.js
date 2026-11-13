/* Thủy sản Noben – progressive enhancement. Every feature here also works without JavaScript. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Same diacritic folding as the server, so "phan trang" matches "phân trắng".
  function fold(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  /* ---------- Header: shadow on scroll, mobile menu ---------- */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var toggle = $('[data-menu-toggle]');
  var menu = $('#menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.sr-only').textContent = open ? 'Đóng menu' : 'Mở menu';
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Home: pond-problem finder ---------- */
  var finder = $('[data-finder]');
  if (finder) {
    var data = JSON.parse($('[data-finder-data]', finder).textContent);
    var list = $('[data-finder-list]', finder);
    var more = $('[data-finder-more]', finder);
    var count = $('[data-finder-count]', finder);
    var chips = $$('.chip', finder);
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var show = function (chip) {
      var sym = chip.getAttribute('data-sym');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var matches = data.filter(function (p) { return p.s.indexOf(sym) > -1; }).sort(function (a, b) { return b.r[sym] - a.r[sym]; });
      list.classList.add('is-swapping');
      window.setTimeout(function () {
        list.innerHTML = matches.slice(0, 5).map(function (p) {
          return '<li><a href="' + esc(p.u) + '"><span class="finder__shot"><img src="' + esc(p.i) + '" alt="" decoding="async"></span><span>' + esc(p.n) + '</span></a></li>';
        }).join('');
        list.classList.remove('is-swapping');
      }, 120);
      count.textContent = matches.length;
      more.href = '/san-pham?van-de=' + encodeURIComponent(sym);
    };
    chips.forEach(function (chip) {
      chip.setAttribute('role', 'button');
      chip.addEventListener('click', function (e) { e.preventDefault(); show(chip); chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
      chip.addEventListener('keydown', function (e) { if (e.key === ' ') { e.preventDefault(); show(chip); } });
    });
  }

  var EN = document.documentElement.lang === 'en';
  /* ---------- Catalog: instant filtering ---------- */
  var catalog = $('[data-catalog]');
  if (catalog) {
    var form = $('[data-filters]', catalog);
    var cards = $$('[data-product]', catalog);
    var countEl = $('[data-count]', catalog);
    var empty = $('[data-empty]', catalog);
    var q = $('[data-filter-q]', form);
    var locked = catalog.getAttribute('data-locked') === 'true';
    var timer;
    var current = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
    var apply = function () {
      var cat = locked ? '' : current(EN ? 'category' : 'nhom');
      var sym = current(EN ? 'issue' : 'van-de');
      var words = fold(q.value).trim().split(/\s+/).filter(Boolean);
      var n = 0;
      cards.forEach(function (card) {
        var ok = (!cat || card.getAttribute('data-cat') === cat) &&
          (!sym || (' ' + card.getAttribute('data-sym') + ' ').indexOf(' ' + sym + ' ') > -1) &&
          words.every(function (w) { return card.getAttribute('data-search').indexOf(w) > -1; });
        card.hidden = !ok;
        if (ok) n++;
      });
      countEl.textContent = n;
      empty.hidden = n > 0;
      var params = new URLSearchParams();
      if (cat) params.set(EN ? 'category' : 'nhom', cat);
      if (sym) params.set(EN ? 'issue' : 'van-de', sym);
      if (q.value.trim()) params.set('q', q.value.trim());
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    };
    // Bring the active chip into view inside horizontally scrolling rows on phones.
    $$('input:checked', form).forEach(function (i) {
      var row = i.closest('.filters__radios, .filters__chips');
      var lab = i.closest('label');
      if (row && lab && row.scrollWidth > row.clientWidth) row.scrollLeft = lab.offsetLeft - row.offsetLeft - 16;
    });
    form.addEventListener('change', apply);
    q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 140); });
    form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
    var reset = $('[data-reset]', catalog);
    if (reset) reset.addEventListener('click', function (e) {
      e.preventDefault();
      q.value = '';
      $$('input[type="radio"][value=""]', form).forEach(function (r) { r.checked = true; });
      apply();
      q.focus();
    });
  }

  /* ---------- Lead forms: inline validation + fetch submit ---------- */
  $$('[data-lead-form]').forEach(function (f) {
    // Time-trap stamp (see POST /lien-he); set as the default value so form.reset() keeps it.
    var stamp = document.createElement('input');
    stamp.type = 'hidden'; stamp.name = 't'; stamp.setAttribute('value', String(Date.now()));
    f.appendChild(stamp);
    var status = $('[data-form-status]', f);
    var btn = $('button[type="submit"]', f);
    var setError = function (name, msg) {
      var input = f.elements[name];
      var out = $('[data-error-for="' + name + '"]', f);
      if (!input || !out) return;
      out.textContent = msg || '';
      if (!out.id) out.id = input.id + '-err';
      if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', out.id); }
      else { input.removeAttribute('aria-invalid'); }
    };
    var check = function () {
      var errs = {};
      if (f.elements.name.value.trim().length < 2) errs.name = EN ? 'Please enter your name.' : 'Nhập họ tên để chúng tôi biết cách xưng hô.';
      var digits = f.elements.phone.value.replace(/\D/g, '');
      if (EN ? !/^\d{7,15}$/.test(digits) : !/^(0|84)\d{8,10}$/.test(digits)) errs.phone = EN ? 'Please enter a valid phone number with country code, e.g. +84 934 246 420.' : 'Số điện thoại chưa đúng. Ví dụ: 0934 246 420.';
      return errs;
    };
    ['name', 'phone'].forEach(function (n) {
      f.elements[n].addEventListener('blur', function () { if (f.elements[n].value) setError(n, check()[n]); });
      f.elements[n].addEventListener('input', function () { if (f.elements[n].getAttribute('aria-invalid')) setError(n, check()[n]); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = check();
      setError('name', errs.name); setError('phone', errs.phone);
      var first = Object.keys(errs)[0];
      if (first) { f.elements[first].focus(); return; }
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = EN ? 'Sending…' : 'Đang gửi…';
      status.className = 'form__status';
      status.textContent = '';
      fetch(f.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            f.reset();
            status.className = 'form__status is-ok';
            status.textContent = f.getAttribute('data-success') || (EN ? 'Sent. Our team will contact you soon.' : 'Đã gửi. Kỹ thuật viên Noben sẽ gọi lại cho bạn trong giờ làm việc.');
            f.dispatchEvent(new CustomEvent('lead:sent'));
          } else if (res.body.errors) {
            Object.keys(res.body.errors).forEach(function (k) { setError(k, res.body.errors[k]); });
          } else {
            throw new Error(res.body.message);
          }
        })
        .catch(function (err) {
          status.className = 'form__status is-error';
          status.textContent = (err && err.message) || (EN ? 'Could not send because of a connection error. Please try again or email us.' : 'Chưa gửi được do lỗi kết nối. Vui lòng thử lại hoặc gọi hotline.');
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });

  /* ---------- Lightbox for product labels, certificates and photos ---------- */
  var lb = $('[data-lightbox]');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('[data-lb-img]', lb);
    var lbCap = $('[data-lb-caption]', lb);
    var items = [];
    var idx = 0;
    var opener = null;
    var render = function () {
      var it = items[idx];
      lbImg.src = it.src;
      lbImg.alt = it.caption || '';
      lbCap.textContent = it.caption ? it.caption + (items.length > 1 ? ' (' + (idx + 1) + '/' + items.length + ')' : '') : '';
    };
    var open = function (group, i, from) {
      items = group; idx = i; opener = from;
      lb.toggleAttribute('data-single', items.length < 2);
      render();
      lb.showModal();
    };
    var step = function (d) { idx = (idx + d + items.length) % items.length; render(); };
    $$('[data-gallery]').forEach(function (g) {
      var links = $$('[data-lb]', g);
      var group = links.map(function (a) { return { src: a.getAttribute('data-lb'), caption: a.getAttribute('data-caption') }; });
      links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(group, i, a); }); });
      // Images inside article bodies.
      var imgs = $$('.prose img', g.parentNode).filter(function (im) { return g.contains(im); });
      if (!links.length && imgs.length) {
        var igroup = imgs.map(function (im) { return { src: im.currentSrc || im.src, caption: im.alt }; });
        imgs.forEach(function (im, i) {
          im.tabIndex = 0;
          im.setAttribute('role', 'button');
          im.addEventListener('click', function () { open(igroup, i, im); });
          im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(igroup, i, im); } });
        });
      }
    });
    $('[data-lb-close]', lb).addEventListener('click', function () { lb.close(); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { step(-1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    lb.addEventListener('close', function () { lbImg.removeAttribute('src'); if (opener) opener.focus(); });
  }

  /* ---------- YouTube: load the player only when asked ---------- */
  $$('[data-yt]').forEach(function (box) {
    var a = $('.yt__play', box);
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = 'Video Noben';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.appendChild(f);
      a.remove();
    });
  });
  /* ---------- Copy article link ---------- */
  $$('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = b.getAttribute('data-copy-link');
      var done = function () { var old = b.textContent; b.textContent = 'Đã sao chép'; setTimeout(function () { b.textContent = old; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Sao chép liên kết:', url); });
      else window.prompt('Sao chép liên kết:', url);
    });
  });
})();

// Product tabs on the home page (arrow keys move between tabs).
(function () {
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, j = null;
        if (k === 'ArrowRight') j = (i + 1) % n;
        else if (k === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
  });
})();

// Motion-graphic videos: play only while on screen, never for visitors who ask for reduced motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var videos = Array.prototype.slice.call(document.querySelectorAll('[data-hero-video], [data-inview-play]'));
  if (!videos.length) return;
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  videos.forEach(function (v) {
    v.muted = true;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); v.dataset.userPaused = '1'; }
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !v.dataset.userPaused) {
          if (v.preload === 'none') v.preload = 'auto';
          play(v);
        } else if (!e.isIntersecting) v.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  }
  document.querySelectorAll('[data-video-toggle]').forEach(function (btn) {
    var v = btn.parentNode.querySelector('video');
    if (!v) return;
    function label() {
      var paused = v.paused;
      btn.querySelector('span').textContent = paused ? 'Phát video' : 'Tạm dừng';
      btn.setAttribute('aria-label', paused ? 'Phát video' : 'Tạm dừng video');
      btn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
    }
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    btn.addEventListener('click', function () {
      if (v.paused) { delete v.dataset.userPaused; play(v); } else { v.dataset.userPaused = '1'; v.pause(); }
    });
    label();
  });
})();

// Scroll motion: blocks rise in when scrolling down and settle in from above when scrolling up.
// Added by script only, so without JavaScript (and for search engines) everything stays visible.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var header = document.querySelector('[data-header]');
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var lastY = window.scrollY, dirDown = true, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    dirDown = y >= lastY; lastY = y;
    var max = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (header) header.classList.toggle('is-scrolled', y > 40);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;
  var sel = '.section-head, .h2, .pcard, .acard, .tile, .stage, .fact, .qc__step, .qc__frame, .qc__certs li, .cert, .faq__item, .group, .mvv__item, .about-facts > div, .showcase, .quick-contact, .oem-band__grid > *, .spec__block, .post-item, .policy__main, .why__list > div';
  var els = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el) {
    return !el.closest('.hero, .chatbot, .site-header, .site-footer') && !el.parentElement.closest('.rv');
  });
  els.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) return; // already on screen: never hide it
    var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty('--rv-delay', Math.min(sibs % 6, 5) * 70 + 'ms');
    el.classList.add('rv');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting) {
        el.classList.toggle('rv--from-top', !dirDown);
        requestAnimationFrame(function () { el.classList.add('is-in'); });
      } else {
        el.classList.remove('is-in');
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (el) { if (el.classList.contains('rv')) io.observe(el); });
})();
