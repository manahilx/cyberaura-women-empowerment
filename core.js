/* CYBERAURA shared runtime: API, toasts, modals, reveals, charts, navigation. */
(function () {
  'use strict';

  document.documentElement.classList.add('has-js');

  const CA = {};
  window.CA = CA;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  CA.reducedMotion = reducedMotion;

  /* ---------------------------------------------------------------- utils */
  CA.escape = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  CA.debounce = function (fn, wait) {
    let timer;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  };

  CA.fmtDate = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  CA.fmtDateTime = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  CA.timeAgo = function (iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const secs = Math.max(1, Math.round((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.round(secs / 60);
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.round(hours / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    return CA.fmtDate(iso);
  };

  CA.fmtBytes = function (bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  CA.download = function (filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };

  /* ------------------------------------------------------------------ API */
  CA.api = async function (path, options) {
    const opts = options || {};
    const headers = { 'Accept': 'application/json' };
    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) headers['X-CSRFToken'] = token.content;
    let body;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
    let response;
    try {
      response = await fetch(path, { method: opts.method || 'GET', headers: headers, body: body, credentials: 'same-origin' });
    } catch (err) {
      throw new Error('Network unavailable. Check your connection and try again.');
    }
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
      if (response.status === 401) throw new Error('Your session ended. Sign in or start a demo workspace again.');
      throw new Error('Unexpected server response (' + response.status + ').');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed (' + response.status + ').');
    return data;
  };

  /* --------------------------------------------------------------- toasts */
  const ICONS = {
    success: '<path d="M20 6L9 17l-5-5"/>',
    error: '<path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
    info: '<path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    warning: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'
  };

  CA.toast = function (message, type, timeout) {
    const region = document.getElementById('toastRegion');
    if (!region) return;
    const kind = type || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[kind] || ICONS.info) + '</svg><div>' + CA.escape(message) + '</div>';
    region.appendChild(el);
    const life = timeout || (kind === 'error' ? 6500 : 4200);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 320);
    }, life);
    while (region.children.length > 4) region.firstChild.remove();
  };

  /* --------------------------------------------------------------- modals */
  let lastFocused = null;

  CA.modal = function (html, onOpen) {
    const root = document.getElementById('modalRoot');
    const body = document.getElementById('modalBody');
    if (!root || !body) return;
    lastFocused = document.activeElement;
    body.innerHTML = html;
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    const focusable = body.querySelector('button, [href], input, select, textarea');
    if (focusable) focusable.focus();
    if (typeof onOpen === 'function') onOpen(body);
  };

  CA.closeModal = function () {
    const root = document.getElementById('modalRoot');
    if (!root || root.hidden) return;
    root.hidden = true;
    document.getElementById('modalBody').innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  CA.confirm = function (options) {
    return new Promise(function (resolve) {
      const opts = options || {};
      CA.modal(
        '<div class="icon-tile ' + (opts.tone || 'danger') + '" style="margin-bottom:16px">' +
        '<svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg></div>' +
        '<h3 id="modalTitle" style="margin-bottom:10px">' + CA.escape(opts.title || 'Are you sure?') + '</h3>' +
        '<p class="muted" style="font-size:.9rem;margin-bottom:22px">' + CA.escape(opts.message || '') + '</p>' +
        '<div class="flex gap-12"><button class="btn btn-outline" style="flex:1" data-act="cancel">Cancel</button>' +
        '<button class="btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger') + '" style="flex:1" data-act="confirm">' +
        CA.escape(opts.confirmLabel || 'Confirm') + '</button></div>',
        function (body) {
          body.querySelector('[data-act="cancel"]').addEventListener('click', function () { CA.closeModal(); resolve(false); });
          body.querySelector('[data-act="confirm"]').addEventListener('click', function () { CA.closeModal(); resolve(true); });
        }
      );
    });
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-modal-close]')) CA.closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const root = document.getElementById('modalRoot');
      if (root && !root.hidden) { CA.closeModal(); return; }
      const nav = document.getElementById('mobileNav');
      if (nav && !nav.hidden) closeNav();
    }
  });

  /* ------------------------------------------------------------ counters */
  CA.animateCount = function (el, target, options) {
    const opts = options || {};
    const duration = reducedMotion ? 0 : (opts.duration || 1300);
    const suffix = opts.suffix || '';
    const decimals = opts.decimals || 0;
    const start = performance.now();
    const from = opts.from || 0;
    function frame(now) {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      el.textContent = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* -------------------------------------------------------------- charts */
  const PALETTE = ['#514078', '#9583B9', '#438B70', '#D49A50', '#C76F78', '#4A6FA5', '#B08BB9', '#6E8F86'];
  CA.palette = PALETTE;

  CA.ring = function (container, options) {
    const opts = options || {};
    const size = opts.size || 168;
    const stroke = opts.stroke || 13;
    const value = Math.max(0, Math.min(opts.max || 100, opts.value || 0));
    const max = opts.max || 100;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = max ? value / max : 0;
    const color = opts.color || '#514078';
    const gid = 'ring-grad-' + Math.random().toString(36).slice(2, 8);
    container.innerHTML =
      '<div class="ring-wrap" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg class="ring-svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity=".75"/><stop offset="100%" stop-color="' + color + '"/></linearGradient></defs>' +
      '<circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ring-value" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#' + gid + ')" stroke-width="' + stroke + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '"/>' +
      '</svg><div class="ring-center"><strong data-ring-num>0</strong><span>' + CA.escape(opts.label || 'score') + '</span></div></div>';
    const circle = container.querySelector('.ring-value');
    const num = container.querySelector('[data-ring-num]');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { circle.style.strokeDashoffset = String(c * (1 - pct)); });
    });
    CA.animateCount(num, opts.displayValue != null ? opts.displayValue : value, { suffix: opts.suffix || '', duration: 1400 });
    return container;
  };

  CA.donut = function (container, segments, options) {
    const opts = options || {};
    const size = opts.size || 180;
    const stroke = opts.stroke || 22;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const total = segments.reduce(function (s, x) { return s + x.value; }, 0);
    let offset = 0;
    let circles = '';
    segments.forEach(function (seg, i) {
      const frac = total ? seg.value / total : 0;
      const len = c * frac;
      circles += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' +
        (seg.color || PALETTE[i % PALETTE.length]) + '" stroke-width="' + stroke + '" stroke-dasharray="0 ' + c +
        '" data-len="' + len + '" data-offset="' + (-offset) + '" stroke-dashoffset="' + (-offset) + '" style="transition:stroke-dasharray 1s cubic-bezier(.16,1,.3,1) ' + (i * 90) + 'ms"/>';
      offset += len;
    });
    container.innerHTML = '<div class="ring-wrap" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg class="ring-svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#EAE4F4" stroke-width="' + stroke + '"/>' +
      circles + '</svg><div class="ring-center"><strong data-donut-num>0</strong><span>' + CA.escape(opts.label || 'total') + '</span></div></div>';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        container.querySelectorAll('[data-len]').forEach(function (el) {
          const len = parseFloat(el.dataset.len);
          el.setAttribute('stroke-dasharray', len + ' ' + (c - len));
        });
      });
    });
    CA.animateCount(container.querySelector('[data-donut-num]'), opts.centerValue != null ? opts.centerValue : total, { duration: 1200 });
  };

  CA.bars = function (container, rows) {
    const max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    container.innerHTML = rows.map(function (row, i) {
      const color = row.color || PALETTE[i % PALETTE.length];
      return '<div class="bar-row"><span class="bar-name" title="' + CA.escape(row.label) + '">' + CA.escape(row.label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" data-w="' + (100 * row.value / max) + '" style="background:linear-gradient(90deg,' + color + '99,' + color + ')"></span></span>' +
        '<span class="bar-val">' + CA.escape(row.display != null ? row.display : row.value) + '</span></div>';
    }).join('');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        container.querySelectorAll('.bar-fill').forEach(function (el) { el.style.width = el.dataset.w + '%'; });
      });
    });
  };

  CA.lineChart = function (container, points, options) {
    const opts = options || {};
    const w = 520, h = opts.height || 170, pad = 26;
    if (!points.length) {
      container.innerHTML = '<p class="tiny text-center" style="padding:30px 0">No history yet.</p>';
      return;
    }
    const values = points.map(function (p) { return p.value; });
    const min = Math.min.apply(null, values.concat([0]));
    const max = Math.max.apply(null, values.concat([100]));
    const span = (max - min) || 1;
    const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
    const coords = points.map(function (p, i) {
      const x = pad + i * step + (points.length === 1 ? (w - pad * 2) / 2 : 0);
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const line = coords.map(function (pt, i) { return (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1); }).join(' ');
    const area = line + ' L' + coords[coords.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + coords[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
    const gid = 'area-' + Math.random().toString(36).slice(2, 8);
    let grid = '';
    for (let g = 0; g <= 2; g++) {
      const y = pad + g * (h - pad * 2) / 2;
      grid += '<line class="chart-grid-line" x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '"/>';
      grid += '<text class="chart-axis" x="4" y="' + (y + 3) + '">' + Math.round(max - g * span / 2) + '</text>';
    }
    const dots = coords.map(function (pt, i) {
      return '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="4" fill="#fff" stroke="#514078" stroke-width="2.2" opacity="0" style="transition:opacity .4s ease ' + (400 + i * 90) + 'ms"><title>' +
        CA.escape(points[i].label || '') + ': ' + points[i].value + '</title></circle>';
    }).join('');
    const labels = points.map(function (p, i) {
      if (points.length > 5 && i % 2 === 1 && i !== points.length - 1) return '';
      return '<text class="chart-axis" x="' + coords[i][0] + '" y="' + (h - 6) + '" text-anchor="middle">' + CA.escape(p.label || '') + '</text>';
    }).join('');
    container.innerHTML = '<div class="chart-box"><svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + CA.escape(opts.aria || 'Trend chart') + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#9583B9" stop-opacity=".38"/><stop offset="100%" stop-color="#9583B9" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#' + gid + ')" opacity="0" style="transition:opacity .9s ease .3s"/>' +
      '<path d="' + line + '" fill="none" stroke="#514078" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="transition:stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)"/>' +
      dots + labels + '</svg></div>';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        const path = container.querySelector('path[stroke-dasharray]');
        if (path) path.style.strokeDashoffset = '0';
        const areaEl = container.querySelector('path[fill^="url"]');
        if (areaEl) areaEl.style.opacity = '1';
        container.querySelectorAll('circle').forEach(function (c) { c.style.opacity = '1'; });
      });
    });
  };

  /* ------------------------------------------------------------- reveals */
  CA.initReveal = function () {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
    // Safety net: instant jumps, fast scrolls and static captures can skip the
    // observer entirely, so force-reveal everything shortly after load.
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2500);
  };

  /* ---------------------------------------------------------- accordions */
  CA.initAccordions = function () {
    document.querySelectorAll('.acc-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const item = trigger.closest('.acc-item');
        const open = item.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  };

  /* -------------------------------------------------------------- header */
  function closeNav() {
    const nav = document.getElementById('mobileNav');
    const toggle = document.getElementById('navToggle');
    if (!nav) return;
    nav.hidden = true;
    document.body.style.overflow = '';
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  }

  function initHeader() {
    const header = document.getElementById('siteHeader');
    const onScroll = function () {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mobileNav');
    const close = document.getElementById('navClose');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.hidden = false;
        document.body.style.overflow = 'hidden';
        toggle.setAttribute('aria-expanded', 'true');
        const first = nav.querySelector('.mobile-link');
        if (first) first.focus();
      });
      nav.addEventListener('click', function (e) { if (e.target === nav) closeNav(); });
    }
    if (close) close.addEventListener('click', closeNav);

    const exit = document.getElementById('quickExit');
    if (exit) exit.addEventListener('click', quickExit);

    let lastEscape = 0;
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      const modalOpen = !document.getElementById('modalRoot').hidden;
      const navOpen = nav && !nav.hidden;
      if (!modalOpen && !navOpen && now - lastEscape < 600) quickExit();
      lastEscape = now;
    });
  }

  function quickExit() {
    try { sessionStorage.clear(); } catch (err) { /* storage may be blocked */ }
    window.location.replace('https://www.wikipedia.org/');
  }
  CA.quickExit = quickExit;

  /* ------------------------------------------------------------ particles */
  CA.networkCanvas = function (canvas) {
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, nodes = [], raf = null, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(46, Math.max(16, Math.round(width / 34)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.7 + 0.9
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 132) {
            ctx.strokeStyle = 'rgba(149,131,185,' + (0.20 * (1 - dist / 132)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(108,90,168,.34)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener('resize', CA.debounce(resize, 220));
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; if (raf) cancelAnimationFrame(raf); }
      else if (!running) { running = true; frame(); }
    });
  };

  /* ------------------------------------------------------------- booting */
  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    CA.initReveal();
    CA.initAccordions();
    const main = document.getElementById('main');
    if (main) main.classList.add('page-enter');
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const target = parseFloat(el.dataset.count);
      if (!isNaN(target)) CA.animateCount(el, target, { suffix: el.dataset.suffix || '', decimals: parseInt(el.dataset.decimals || '0', 10) });
    });
  });
})();