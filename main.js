/* D&J Style — interactions (classic IIFE, no modules, no dependencies) */
(function () {
  'use strict';
  var V = '20261016l';
  var doc = document.documentElement;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var DYJ = window.__DYJ__ = window.__DYJ__ || {};

  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn('[DYJ] ' + name + ' failed', e); } }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- Single rAF-throttled scroll/resize bus ---------- */
  var scrollSubs = [], resizeSubs = [];
  function onScroll(fn) { scrollSubs.push(fn); }
  function onResize(fn) { resizeSubs.push(fn); }
  function runScroll() { var y = window.scrollY; for (var i = 0; i < scrollSubs.length; i++) scrollSubs[i](y); }
  // scroll events already fire at most once per frame; running synchronously avoids a 1-frame lag in the sticky carousel
  window.addEventListener('scroll', runScroll, { passive: true });
  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { resizeSubs.forEach(function (f) { f(); }); runScroll(); }, 120);
  });

  /* Splash — short; CSS also auto-hides at 3s */
  function initSplash() {
    var sp = $('#splash'); if (!sp) return;
    var done = false, hide = function () { if (!done) { done = true; sp.classList.add('is-done'); } };
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (r) { setTimeout(r, 900); })]).then(function () { setTimeout(hide, 250); });
    setTimeout(hide, 1800);
  }

  /* Nav + FAB */
  function initNav() {
    var nav = $('#nav'), fab = $('.fab'), menu = $('#menu'), last = 0;
    onScroll(function (y) {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 400 && y > last && !menu.classList.contains('is-open'));
      if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * 0.6);
      last = y;
    });
  }

  function initMenu() {
    var b = $('#burger'), m = $('#menu');
    function set(open) { m.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; }
    b.addEventListener('click', function () { set(!m.classList.contains('is-open')); });
    $$('a', m).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  function initMagnetic() {
    if (!fine) return;
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.25 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.35 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* Split headings into words */
  function initSplit() {
    $$('[data-split]').forEach(function (el) {
      if (el.querySelector('.w')) return;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
          if (ch.nodeType === 3) {
            var frag = document.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w';
              var i = document.createElement('span'); i.textContent = part;
              w.appendChild(i); frag.appendChild(w);
            });
            node.replaceChild(frag, ch);
          } else if (ch.nodeType === 1) walk(ch);
        });
      })(el);
      $$('.w > span', el).forEach(function (s, i) { s.style.transitionDelay = (i * 0.04) + 's'; });
    });
    doc.classList.add('split-ready');
  }

  /* Reveal on scroll */
  function initReveal() {
    var els = $$('.reveal, .step');
    var showAll = function () { els.forEach(function (e) { e.classList.add('is-in'); }); };
    $$('.hero .reveal').forEach(function (e, i) { e.style.transitionDelay = (0.9 + i * 0.1) + 's'; e.classList.add('is-in'); });
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) {
      if (e.classList.contains('is-in')) return;
      if (!e.style.transitionDelay && e.parentElement) {
        e.style.transitionDelay = Math.min(Array.prototype.indexOf.call(e.parentElement.children, e), 4) * 0.08 + 's';
      }
      io.observe(e);
    });
    setTimeout(showAll, 6000);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), start = end > 1000 ? end - 25 : 0, t0 = null;
        requestAnimationFrame(function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1600);
          el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        });
      });
    }, { threshold: 0 });
    $$('[data-count]').forEach(function (e) { io.observe(e); });
  }

  function initTilt() {
    if (!fine) return;
    $$('.tilt').forEach(function (card) {
      var raf = 0, ev = null;
      function apply() {
        raf = 0;
        var r = card.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
      card.addEventListener('pointerenter', function () { card.classList.add('is-tilting'); });
      card.addEventListener('pointermove', function (e) { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* Polish swatches → 3D scene (queued if 3D not loaded yet) */
  function initSwatches() {
    var name = $('#swatchName');
    $$('.swatch').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-color');
        $$('.swatch').forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
        if (name) name.textContent = b.getAttribute('data-name');
        doc.style.setProperty('--rose', c === '#1a1a1f' || c === '#d9d9de' ? '#ff3d8b' : c);
        if (DYJ.setColor) DYJ.setColor(c); else DYJ.pendingColor = c;
      });
    });
  }

  function initHours() {
    var tabs = $('.hours__tabs'); if (!tabs) return;
    $$('button', tabs).forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-season');
        tabs.setAttribute('data-active', s);
        $$('button', tabs).forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
        $$('.hours__panel').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === s); });
      });
    });
    var m = new Date().getMonth();
    if (m >= 5 && m <= 8) { var v = $('[data-season="verano"]', tabs); if (v) v.click(); }
  }

  /* ---------- Studio carousel ----------
     Desktop: sticky section, vertical scroll drives horizontal track.
     Mobile: native swipe with scroll-snap. Same counter/progress/arrows in both. */
  function initStudio() {
    var studio = $('.studio'), track = $('#studioTrack');
    if (!studio || !track) return;
    var shots = $$('.shot', track), now = $('#studioNow'), bar = $('#studioBar'), prev = $('#studioPrev'), next = $('#studioNext');
    var mq = window.matchMedia('(min-width: 861px)');
    var desk = false, dist = 0, top = 0, centers = [], idx = -1, prog = -1, vw = innerWidth;

    function setUI(p, i) {
      if (p !== prog) { prog = p; bar.style.transform = 'scaleX(' + p.toFixed(4) + ')'; prev.disabled = p <= 0.002; next.disabled = p >= 0.998; }
      if (i !== idx) { idx = i; now.textContent = (i < 9 ? '0' : '') + (i + 1); }
    }
    function measure() {
      vw = window.innerWidth;
      desk = mq.matches;
      studio.classList.toggle('is-sticky', desk);
      track.style.transform = '';
      studio.style.height = '';
      centers = shots.map(function (s) { return s.offsetLeft + s.offsetWidth / 2; });
      if (desk) {
        dist = Math.max(0, track.scrollWidth - vw);
        studio.style.height = (window.innerHeight + dist) + 'px';
        top = studio.getBoundingClientRect().top + window.scrollY;
      } else {
        shots.forEach(function (s) { s.style.removeProperty('--ry'); s.style.removeProperty('--px'); });
      }
      update(window.scrollY);
    }
    function update(y) {
      if (!desk) return;
      var p = dist ? clamp((y - top) / dist, 0, 1) : 0, x = -p * dist;
      // skip work when the section is far off screen
      if (y + window.innerHeight < top - 200 || y > top + dist + window.innerHeight + 200) return;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      for (var i = 0; i < shots.length; i++) {
        var d = clamp((centers[i] + x - vw / 2) / vw, -1, 1);
        shots[i].style.setProperty('--ry', (d * -9).toFixed(2) + 'deg');
        shots[i].style.setProperty('--px', (d * -28).toFixed(1) + 'px');
      }
      setUI(p, Math.round(p * (shots.length - 1)));
    }
    function onTrackScroll() {
      if (desk) return;
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      setUI(p, Math.round(p * (shots.length - 1)));
    }
    function go(i) {
      i = clamp(i, 0, shots.length - 1);
      if (desk) {
        var p = dist ? clamp((centers[i] - vw / 2) / dist, 0, 1) : 0;
        window.scrollTo({ top: top + p * dist + 1, behavior: 'smooth' });
      } else {
        track.scrollTo({ left: shots[i].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: 'smooth' });
      }
    }
    prev.addEventListener('click', function () { go((idx < 0 ? 0 : idx) - 1); });
    next.addEventListener('click', function () { go((idx < 0 ? 0 : idx) + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    });
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    if (mq.addEventListener) mq.addEventListener('change', measure); else mq.addListener(measure);
    onScroll(update);
    onResize(measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* Scroll-linked extras (hero parallax, boutique frame, marquee) */
  function initScrollFx() {
    var hero = $('.hero__content'), frame = $('#frame3d'), mq = $('.marquee__track'), marq = $('.marquee');
    var wide = window.matchMedia('(min-width: 861px)');
    onScroll(function (y) {
      var vh = window.innerHeight;
      if (hero && y < vh * 1.2) {
        var k = clamp(y / vh, 0, 1);
        hero.style.transform = k ? 'translate3d(0,' + (-k * 18).toFixed(2) + '%,0)' : '';
        hero.style.opacity = k ? (1 - k * 0.8).toFixed(3) : '';
      }
      if (frame && wide.matches) {
        var r = frame.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
          frame.style.transform = 'perspective(1200px) rotateY(' + (22 - p * 32).toFixed(2) + 'deg) rotateX(' + (8 - p * 10).toFixed(2) + 'deg)';
        }
      }
      if (marq && mq) {
        var m = marq.getBoundingClientRect();
        if (m.bottom > 0 && m.top < vh) mq.style.translate = (-(vh - m.top) * 0.08).toFixed(1) + 'px 0';
      }
    });
  }

  /* Map: load Google Maps only on demand */
  function initMap() {
    var btn = $('#mapLoad'), box = $('#map');
    if (!btn || !box) return;
    btn.addEventListener('click', function () {
      if (box.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.title = 'Mapa de D&J Style en C/ Siena, Dos Hermanas';
      f.src = btn.getAttribute('data-src');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      box.classList.add('is-live');
    });
  }

  /* Lazy 3D: load Three.js after first paint, only if WebGL is usable */
  function init3D() {
    var conn = navigator.connection || {};
    if (conn.saveData) return;
    try {
      var t = document.createElement('canvas');
      if (!(t.getContext('webgl2') || t.getContext('webgl'))) return;
    } catch (e) { return; }
    function load(src) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script'); s.src = src; s.async = false; s.onload = res; s.onerror = rej;
        document.body.appendChild(s);
      });
    }
    var go = function () { load('lib/three.min.js?v=' + V).then(function () { return load('scene3d.js?v=' + V); }).catch(function () {}); };
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
    if (document.readyState === 'complete') idle(go, { timeout: 1200 });
    else window.addEventListener('load', function () { idle(go, { timeout: 1200 }); });
  }

  function initYear() { var y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

  function boot() {
    safe(initSplash, 'splash');
    safe(initNav, 'nav');
    safe(initMenu, 'menu');
    safe(initSplit, 'split');
    safe(initReveal, 'reveal');
    safe(initCounters, 'counters');
    safe(initMagnetic, 'magnetic');
    safe(initTilt, 'tilt');
    safe(initSwatches, 'swatches');
    safe(initHours, 'hours');
    safe(initStudio, 'studio');
    safe(initScrollFx, 'scrollfx');
    safe(initMap, 'map');
    safe(init3D, '3d');
    safe(initYear, 'year');
    runScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
