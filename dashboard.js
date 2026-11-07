/* CYBERAURA security dashboard: live readiness, threat, response and vault overview. */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  const PATHS = {
    radar: ['M12 3a9 9 0 100 18 9 9 0 000-18z', 'M12 8a4 4 0 100 8 4 4 0 000-8z', 'M12 12l6-4'],
    privacy: ['M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z', 'M12 11v3', 'M12 8.5h.01'],
    gauge: ['M4 18a8 8 0 1116 0', 'M12 18l4-6'],
    layers: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5'],
    check: ['M20 6L9 17l-5-5'],
    fingerprint: ['M12 4a8 8 0 00-8 8v3', 'M20 15v-3a8 8 0 00-4-6.9', 'M8 20a12 12 0 002-6 2 2 0 014 0c0 3-.5 5-1.5 7', 'M12 10a4 4 0 00-4 4c0 2-.3 4-1 5.5', 'M16 14a4 4 0 00-1-2.6'],
    book: ['M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z', 'M8 7h8', 'M8 11h6'],
    user: ['M12 4a4 4 0 100 8 4 4 0 000-8z', 'M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1'],
    shield: ['M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z'],
    globe: ['M12 3a9 9 0 100 18 9 9 0 000-18z', 'M3 12h18', 'M12 3c3 3.5 3 14.5 0 18-3-3.5-3-14.5 0-18z'],
    phone: ['M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z'],
    mail: ['M3 6h18v12H3V6z', 'M3 7l9 6 9-6'],
    users: ['M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', 'M9 4a3.5 3.5 0 100 7 3.5 3.5 0 000-7z', 'M22 20v-2a4 4 0 00-3-3.9', 'M16 4.1a4 4 0 010 7.8'],
    pin: ['M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z', 'M12 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5z'],
    clock: ['M12 3a9 9 0 100 18 9 9 0 000-18z', 'M12 7v5l3 2'],
    grid: ['M4 4h6v6H4V4z', 'M14 4h6v6h-6V4z', 'M4 14h6v6H4v-6z', 'M14 14h6v6h-6v-6z'],
    key: ['M20 4l-8.5 8.5', 'M17.5 6.5l2.5 2.5', 'M11.5 12.5a4 4 0 11-5.7 5.7 4 4 0 015.7-5.7z'],
    folder: ['M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'],
    arrow: ['M4 12h16', 'M14 6l6 6-6 6'],
    sparkles: ['M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z', 'M18 15l.9 2.3 2.3.9-2.3.9L18 21.4l-.9-2.3-2.3-.9 2.3-.9L18 15z'],
    chart: ['M4 20V12', 'M9 20V6', 'M14 20v-9', 'M19 20V9', 'M3 20h18'],
    heart: ['M12 20s-7-4.4-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.6 12 20 12 20z'],
    target: ['M12 3a9 9 0 100 18 9 9 0 000-18z', 'M12 8a4 4 0 100 8 4 4 0 000-8z', 'M12 11.5a.5.5 0 100 1 .5.5 0 000-1z']
  };

  function ic(name, cls) {
    const paths = PATHS[name] || PATHS.sparkles;
    return '<svg class="' + (cls || 'icon icon-sm') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>';
  }

  const TONE_COLOR = { success: '#438B70', info: '#4A6FA5', warning: '#D49A50', danger: '#C76F78' };
  const RISK_COLOR = { High: '#C76F78', Medium: '#D49A50', Low: '#438B70' };
  const ACTIVITY_ICON = {
    analysis: 'radar', assessment: 'gauge', plan: 'layers', checklist: 'check',
    integrity: 'fingerprint', learning: 'book', session: 'user'
  };

  function emptyRow(message) {
    return '<p class="tiny text-center" style="padding:14px 0;color:var(--ink-3)">' + CA.escape(message) + '</p>';
  }

  /* ------------------------------------------------------------- welcome */
  function renderWelcome(data) {
    const first = (data.user.name || 'there').split(' ')[0];
    $('welcomeName').textContent = first;
    $('todayDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (data.user.is_demo) {
      $('demoNotice').hidden = false;
      $('welcomeSub').textContent = 'This is a demonstration workspace seeded with fictional sample data. Explore freely — nothing here is real.';
    } else {
      $('welcomeSub').textContent = 'Here is your current digital safety position, updated from your own activity.';
    }
  }

  /* ----------------------------------------------------------- readiness */
  function renderReadiness(data) {
    const r = data.readiness;
    if (!r.available) {
      CA.ring($('readinessRing'), { value: 0, size: 168, color: '#9583B9', label: 'not yet scored', displayValue: 0, suffix: '' });
      $('readinessRing').querySelector('[data-ring-num]').textContent = '—';
      $('readinessBand').textContent = 'No assessment';
      $('readinessBand').className = 'pill pill-outline';
      $('readinessNote').textContent = 'Complete the eight-question Digital Exposure Assessment to generate your readiness score.';
    } else {
      const tone = r.band.tone;
      CA.ring($('readinessRing'), { value: r.score, size: 168, color: TONE_COLOR[tone] || '#514078', label: 'readiness', suffix: '' });
      $('readinessBand').textContent = r.band.label;
      $('readinessBand').className = 'pill pill-' + tone;
      $('readinessNote').textContent = r.band.note + ' Last updated ' + CA.fmtDate(r.updated) + '.';
    }
    const points = (data.trend || []).map(function (t) {
      return { value: t.score, label: CA.fmtDate(t.created_at).replace(/,?\s*\d{4}$/, '') };
    });
    CA.lineChart($('trendChart'), points, { height: 150, aria: 'Privacy readiness score over time' });
  }

  /* --------------------------------------------------------------- threat */
  function renderThreat(data) {
    const a = data.analyses;
    $('analysisTotal').textContent = a.total + (a.total === 1 ? ' analysis' : ' analyses');
    const segments = [
      { value: a.high, color: RISK_COLOR.High },
      { value: a.medium, color: RISK_COLOR.Medium },
      { value: a.low, color: RISK_COLOR.Low }
    ];
    CA.donut($('riskDonut'), segments, { size: 168, stroke: 22, label: 'incidents', centerValue: a.total });
    $('riskLegend').innerHTML = ['High', 'Medium', 'Low'].map(function (level) {
      const count = level === 'High' ? a.high : level === 'Medium' ? a.medium : a.low;
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + RISK_COLOR[level] + '"></span>' +
        level + ' · ' + count + '</span>';
    }).join('');

    const recent = $('recentAnalyses');
    if (!a.recent.length) {
      recent.innerHTML = emptyRow('No analyses yet. Run your first threat interpretation.');
    } else {
      recent.innerHTML = a.recent.map(function (row) {
        const tone = row.risk_level === 'High' ? 'danger' : row.risk_level === 'Medium' ? 'warning' : 'success';
        return '<a class="signal-card" href="/threat-analysis" style="text-decoration:none;color:inherit;align-items:center">' +
          '<span class="icon-tile ' + tone + '" style="width:38px;height:38px;border-radius:12px;flex-shrink:0">' + ic('radar', 'icon icon-sm') + '</span>' +
          '<span style="flex:1;min-width:0"><strong style="display:block;font-size:.83rem;font-family:var(--font-head)">' + CA.escape(row.category_label) + '</strong>' +
          '<span class="tiny" style="color:var(--ink-3)">' + CA.escape(row.platform || 'Unknown platform') + ' · ' + CA.timeAgo(row.created_at) + '</span></span>' +
          '<span class="pill pill-' + tone + '" style="flex-shrink:0">' + CA.escape(row.risk_level) + '</span></a>';
      }).join('');
    }
  }

  /* ------------------------------------------------------------- response */
  function renderResponse(data) {
    const p = data.plans;
    $('planTotal').textContent = p.total + (p.total === 1 ? ' plan' : ' plans');
    CA.ring($('responseRing'), { value: p.percent, size: 168, color: '#514078', label: 'complete', suffix: '%' });
    $('responseNote').textContent = p.items_total
      ? p.items_done + ' of ' + p.items_total + ' response steps completed across your plans.'
      : 'Create a response plan to turn guidance into trackable steps.';
    const list = $('planMiniList');
    if (!p.list.length) {
      list.innerHTML = emptyRow('No response plans yet.');
    } else {
      list.innerHTML = p.list.map(function (plan) {
        return '<a href="/response-center?plan=' + encodeURIComponent(plan.id) + '" style="text-decoration:none;color:inherit;display:block">' +
          '<div class="flex justify-between items-center" style="margin-bottom:6px"><strong style="font-size:.82rem;font-family:var(--font-head)">' + CA.escape(plan.title) + '</strong>' +
          '<span class="tiny" style="color:var(--ink-3)">' + plan.percent + '%</span></div>' +
          '<span class="bar-track" style="display:block;height:7px;border-radius:99px;background:var(--lavender);overflow:hidden">' +
          '<span style="display:block;height:100%;width:' + plan.percent + '%;border-radius:99px;background:linear-gradient(90deg,var(--violet),var(--purple));transition:width 1s var(--ease-out)"></span></span></a>';
      }).join('');
    }
  }

  /* ------------------------------------------------- categories + activity */
  function renderCategories(data) {
    const rows = data.analyses.by_category;
    if (!rows.length) {
      $('categoryBars').innerHTML = emptyRow('Category breakdown appears after your first analysis.');
      return;
    }
    CA.bars($('categoryBars'), rows.map(function (r, i) {
      return { label: r.label, value: r.count, display: r.count, color: CA.palette[i % CA.palette.length] };
    }));
  }

  function renderActivity(data) {
    const list = $('activityTimeline');
    if (!data.activity.length) {
      list.innerHTML = '<li style="padding-left:44px"><span class="timeline-label" style="color:var(--ink-3)">No activity recorded yet.</span></li>';
      return;
    }
    list.innerHTML = data.activity.map(function (item) {
      return '<li><span class="timeline-dot">' + ic(ACTIVITY_ICON[item.kind] || 'sparkles', 'icon icon-xs') + '</span>' +
        '<div class="timeline-label">' + CA.escape(item.label) + '</div>' +
        '<div class="timeline-time">' + CA.timeAgo(item.created_at) + '</div></li>';
    }).join('');
  }

  /* ------------------------------------------------------ recommendations */
  function renderRecommendations(data) {
    const box = $('recommendations');
    if (!data.recommendations.length) {
      box.innerHTML = emptyRow('You are all caught up. Re-run your assessment to refresh priorities.');
      return;
    }
    box.innerHTML = data.recommendations.map(function (rec, i) {
      const tones = ['warning', 'info', 'success', 'danger'];
      return '<div class="signal-card" style="align-items:flex-start">' +
        '<span class="icon-tile ' + tones[i % tones.length] + '" style="width:40px;height:40px;border-radius:13px;flex-shrink:0">' + ic(rec.icon, 'icon icon-sm') + '</span>' +
        '<div style="flex:1;min-width:0"><div class="flex justify-between items-center gap-8" style="margin-bottom:3px">' +
        '<strong>' + CA.escape(rec.title) + '</strong></div>' +
        '<p style="margin:0">' + CA.escape(rec.action) + '</p>' +
        '<span class="pill pill-outline" style="margin-top:9px;font-size:.66rem">' + CA.escape(rec.category) + ' · priority ' + rec.weight + '</span></div></div>';
    }).join('');
  }

  /* --------------------------------------------------------------- impact */
  const IMPACT_META = [
    { key: 'assessments_completed', label: 'Assessments completed', icon: 'gauge' },
    { key: 'response_plans_generated', label: 'Response plans generated', icon: 'layers' },
    { key: 'integrity_checks_completed', label: 'Integrity checks completed', icon: 'fingerprint' },
    { key: 'recommendations_completed', label: 'Recommendations completed', icon: 'check' },
    { key: 'learning_completed', label: 'Learning activities finished', icon: 'book' }
  ];

  function renderImpact(data) {
    const box = $('impactMini');
    box.innerHTML = IMPACT_META.map(function (meta) {
      const value = data.impact[meta.key] || 0;
      return '<div class="signal-card" style="align-items:center;padding:12px 14px">' +
        '<span class="icon-tile" style="width:36px;height:36px;border-radius:11px;flex-shrink:0">' + ic(meta.icon, 'icon icon-sm') + '</span>' +
        '<div style="min-width:0"><strong data-impact="' + meta.key + '" style="font-size:1.05rem;font-family:var(--font-head);display:block;line-height:1.1">0</strong>' +
        '<span class="tiny" style="color:var(--ink-3);font-size:.68rem">' + CA.escape(meta.label) + '</span></div></div>';
    }).join('');
    IMPACT_META.forEach(function (meta) {
      const el = box.querySelector('[data-impact="' + meta.key + '"]');
      if (el) CA.animateCount(el, data.impact[meta.key] || 0, { duration: 1400 });
    });
  }

  /* ---------------------------------------------------------------- vault */
  function renderVault() {
    const countEl = $('dashVaultCount'), verifiedEl = $('dashVaultVerified'), sizeEl = $('dashVaultSize');
    function finish(count, verified, size) {
      CA.animateCount(countEl, count, { duration: 900 });
      CA.animateCount(verifiedEl, verified, { duration: 900 });
      sizeEl.textContent = CA.fmtBytes(size);
      const pct = count ? Math.round(100 * verified / count) : 0;
      CA.ring($('vaultRing'), { value: pct, size: 132, stroke: 11, color: '#438B70', label: 'verified', suffix: '%' });
    }
    if (!('indexedDB' in window)) { finish(0, 0, 0); return; }
    let request;
    try { request = indexedDB.open('cyberaura-vault', 1); }
    catch (err) { finish(0, 0, 0); return; }
    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('evidence')) db.createObjectStore('evidence', { keyPath: 'id' });
    };
    request.onerror = function () { finish(0, 0, 0); };
    request.onsuccess = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('evidence')) { db.close(); finish(0, 0, 0); return; }
      const tx = db.transaction('evidence', 'readonly');
      const getAll = tx.objectStore('evidence').getAll();
      getAll.onsuccess = function () {
        const records = getAll.result || [];
        let verified = 0, size = 0;
        records.forEach(function (rec) {
          if (rec.verifyStatus === 'verified') verified++;
          size += rec.size || (rec.file ? rec.file.size : 0) || 0;
        });
        db.close();
        finish(records.length, verified, size);
      };
      getAll.onerror = function () { db.close(); finish(0, 0, 0); };
    };
  }

  /* --------------------------------------------------------- clear data */
  function wireClear() {
    const btn = $('clearWorkspace');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const ok = await CA.confirm({
        title: 'Clear your workspace data?',
        message: 'This permanently removes your analyses, response plans, assessments and activity from the server. Evidence stored in this browser is not affected — clear it separately from the Evidence Vault.',
        confirmLabel: 'Clear my data',
        tone: 'danger'
      });
      if (!ok) return;
      btn.disabled = true;
      try {
        await CA.api('/api/workspace/clear', { method: 'POST', body: {} });
        CA.toast('Workspace data cleared.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        btn.disabled = false;
        CA.toast(err.message, 'error');
      }
    });
  }

  /* ----------------------------------------------------------------- boot */
  async function boot() {
    wireClear();
    renderVault();
    try {
      const data = await CA.api('/api/dashboard');
      renderWelcome(data);
      renderReadiness(data);
      renderThreat(data);
      renderResponse(data);
      renderCategories(data);
      renderActivity(data);
      renderRecommendations(data);
      renderImpact(data);
    } catch (err) {
      CA.toast(err.message, 'error');
      $('welcomeName').textContent = 'there';
      $('readinessNote').textContent = 'Could not load dashboard data. ' + err.message;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();