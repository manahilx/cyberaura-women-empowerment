/* CYBERAURA Women's Safety Feedback & Resource Hub. */
(function () {
  const CA = window.CA;
  const data = JSON.parse(document.getElementById('hubData').textContent);
  const $ = (s) => document.querySelector(s);

  const LEARN_KEY = 'cyberaura-hub-learned';
  const VOTE_KEY = 'cyberaura-hub-votes';
  const readSet = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch (e) { return new Set(); } };
  const writeSet = (k, set) => { try { localStorage.setItem(k, JSON.stringify(Array.from(set))); } catch (e) { /* storage blocked */ } };
  const learned = readSet(LEARN_KEY);
  const votes = readSet(VOTE_KEY);

  const svg = (path, cls) => '<svg class="icon ' + (cls || 'icon-sm') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  const HEART = '<path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 5 8.8 10.4 8.8 10.4s8.8-5.4 8.8-10.4z"/>';
  const SHIELD = '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9.5 12l2 2 3.5-4"/>';
  const EXT = '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>';

  /* ---------------------------------------------------- larger text (a11y) */
  const textToggle = $('#textSizeToggle');
  if (textToggle) textToggle.addEventListener('click', function () {
    const on = $('#guides').classList.toggle('hub-large-text');
    textToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    CA.toast(on ? 'Larger text enabled for beginner guides.' : 'Standard text size restored.', 'info');
  });

  /* ------------------------------------------------------------- learning */
  function refreshLearning() {
    const total = data.lessons.length;
    const n = data.lessons.filter((l) => learned.has(l.id)).length;
    CA.ring($('#learnRing'), { value: n, max: total, label: 'learned', size: 150, stroke: 12, color: '#514078', displayValue: n });
    $('#learnCount').textContent = n + ' of ' + total + ' lessons learned';
    $('#learnBar').style.width = (total ? (100 * n / total) : 0) + '%';
    document.querySelectorAll('.hub-lesson').forEach(function (card) {
      const on = learned.has(card.dataset.lesson);
      card.classList.toggle('is-learned', on);
      card.querySelector('.hub-learned-badge').hidden = !on;
    });
  }

  function openLesson(id) {
    const l = data.lessons.find((x) => x.id === id);
    if (!l) return;
    const html =
      '<span class="eyebrow">' + CA.escape(l.level) + ' · ' + l.minutes + ' min read</span>' +
      '<h3 id="modalTitle" class="mt-8">' + CA.escape(l.title) + '</h3>' +
      '<p class="tiny mt-8">' + CA.escape(l.summary) + '</p>' +
      '<div class="mt-16">' + l.body.map((p) => '<p class="tiny mb-16">' + CA.escape(p) + '</p>').join('') + '</div>' +
      '<h4 class="mb-16">Put it into practice</h4>' +
      '<ol class="hub-steps">' + l.actions.map((a) => '<li>' + CA.escape(a) + '</li>').join('') + '</ol>' +
      '<button type="button" class="btn btn-primary btn-block mt-24" id="modalLearnBtn"></button>';
    CA.modal(html, function (body) {
      const btn = body.querySelector('#modalLearnBtn');
      const paint = () => { btn.innerHTML = (learned.has(l.id) ? svg('<path d="M20 6L9 17l-5-5"/>') + ' Learned — tap to undo' : svg('<path d="M12 5v14"/><path d="M5 12h14"/>') + ' Mark as learned'); };
      paint();
      btn.addEventListener('click', function () {
        if (learned.has(l.id)) learned.delete(l.id); else learned.add(l.id);
        writeSet(LEARN_KEY, learned);
        refreshLearning(); paint();
        CA.toast(learned.has(l.id) ? 'Lesson marked as learned.' : 'Lesson marked as not yet learned.', 'success');
      });
    });
  }
  document.querySelectorAll('.hub-open-lesson').forEach((b) => b.addEventListener('click', () => openLesson(b.dataset.lesson)));
  refreshLearning();

  /* ----------------------------------------------- reporting route panel */
  const resById = {};
  data.resources.forEach((r) => { resById[r.id] = r; });

  function orgCard(r) {
    const links = [];
    if (r.report_url) links.push('<a class="btn btn-soft btn-sm" href="' + CA.escape(r.report_url) + '" target="_blank" rel="noopener noreferrer">' + svg(EXT, 'icon-xs') + ' ' + CA.escape(r.report_label || 'Report') + '</a>');
    if (r.website) links.push('<a class="btn btn-ghost btn-sm" href="' + CA.escape(r.website) + '" target="_blank" rel="noopener noreferrer">' + svg(EXT, 'icon-xs') + ' Website</a>');
    (r.contacts || []).forEach(function (c) {
      links.push('<a class="pill pill-outline" href="' + CA.escape(c.href) + '">' + CA.escape(c.label) + ': ' + CA.escape(c.value) + '</a>');
    });
    return '<div class="hub-org"><span class="icon-tile ' + CA.escape(r.accent || '') + '">' + svg(SHIELD) + '</span>' +
      '<div class="hub-org-body"><strong>' + CA.escape(r.name) + '</strong><p>' + CA.escape(r.purpose) + '</p>' +
      '<div class="hub-org-links">' + links.join('') + '</div></div></div>';
  }

  function renderRoute(id) {
    const s = data.situations.find((x) => x.id === id);
    if (!s) return;
    $('#routePanel').innerHTML =
      '<h3>' + CA.escape(s.label) + '</h3>' +
      '<div class="notice notice-warning mt-8">' + svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>') + '<div>' + CA.escape(s.first) + '</div></div>' +
      '<ol class="hub-steps hub-route-steps">' + s.steps.map((x) => '<li>' + CA.escape(x) + '</li>').join('') + '</ol>' +
      '<h4 class="mb-16">Verified organisations for this route</h4>' +
      s.resources.map((rid) => resById[rid]).filter(Boolean).map(orgCard).join('');
  }
  document.querySelectorAll('.hub-situation').forEach((b) => b.addEventListener('click', function () {
    document.querySelectorAll('.hub-situation').forEach((x) => x.classList.toggle('is-active', x === b));
    renderRoute(b.dataset.situation);
  }));
  renderRoute(data.situations[0].id);

  /* ------------------------------------------------- anonymous feedback */
  function renderThemes(themes) {
    CA.bars($('#themeBars'), themes.map((t, i) => ({ label: t.label, value: t.value, color: CA.palette[i % CA.palette.length] })));
  }
  renderThemes(data.themes);

  const msg = $('#challengeMessage');
  msg.addEventListener('input', () => { $('#challengeCount').textContent = msg.value.length; });

  function showError(el, text) { el.textContent = text; el.hidden = false; }
  function clearError(el) { el.hidden = true; }

  $('#challengeForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const err = $('#challengeError'); clearError(err); $('#challengeSuccess').hidden = true;
    const payload = {
      category: $('#challengeCategory').value,
      platform: $('#challengePlatform').value,
      message: msg.value.trim(),
      consent: $('#challengeConsent').checked,
    };
    const btn = $('#challengeSubmit'); btn.disabled = true;
    try {
      const res = await CA.api('/api/hub/challenge', { method: 'POST', body: payload });
      const ok = $('#challengeSuccess'); ok.querySelector('div').textContent = res.message; ok.hidden = false;
      CA.toast(res.message, 'success');
      renderThemes(res.themes);
      this.reset(); $('#challengeCount').textContent = '0';
    } catch (ex) { showError(err, ex.message); }
    btn.disabled = false;
  });

  /* ---------------------------------------------------- suggestions board */
  let boardCat = 'all';
  let boardSort = 'supported';

  function renderBoard() {
    let rows = data.suggestions.slice();
    if (boardCat !== 'all') rows = rows.filter((r) => r.category === boardCat);
    rows.sort(boardSort === 'newest'
      ? (a, b) => (b.created || '').localeCompare(a.created || '') || b.id - a.id
      : (a, b) => b.supports - a.supports || b.id - a.id);
    const list = $('#boardList');
    if (!rows.length) { list.innerHTML = '<div class="hub-board-empty">No suggestions in this category yet. Be the first to share an idea.</div>'; return; }
    list.innerHTML = rows.map((r) => {
      const voted = votes.has(r.id);
      return '<article class="hub-suggestion-card">' +
        '<div class="flex items-center gap-8 wrap"><span class="pill pill-soft">' + CA.escape(r.category) + '</span>' +
        (r.sample ? '<span class="pill pill-outline">sample</span>' : '') + '</div>' +
        '<h4>' + CA.escape(r.title) + '</h4><p>' + CA.escape(r.body) + '</p>' +
        '<div class="hub-suggestion-foot">' +
        '<button type="button" class="hub-support ' + (voted ? 'is-voted' : '') + '" data-id="' + r.id + '" aria-pressed="' + voted + '">' + svg(HEART, 'icon-xs') + ' <span>' + r.supports + '</span> support</button>' +
        '<span class="tiny">' + CA.timeAgo(r.created) + '</span></div></article>';
    }).join('');
  }

  $('#boardList').addEventListener('click', async function (e) {
    const btn = e.target.closest('.hub-support');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const row = data.suggestions.find((r) => r.id === id);
    if (!row) return;
    const vote = !votes.has(id);
    btn.disabled = true;
    try {
      const res = await CA.api('/api/hub/suggestion/' + id + '/support', { method: 'POST', body: { vote: vote } });
      row.supports = res.supports;
      if (vote) votes.add(id); else votes.delete(id);
      writeSet(VOTE_KEY, votes);
      renderBoard();
      CA.toast(vote ? 'Thanks — your support was counted.' : 'Support removed.', 'success');
    } catch (ex) { CA.toast(ex.message, 'error'); btn.disabled = false; }
  });

  document.querySelectorAll('#boardFilters .chip').forEach((c) => c.addEventListener('click', function () {
    boardCat = c.dataset.cat;
    document.querySelectorAll('#boardFilters .chip').forEach((x) => x.classList.toggle('is-active', x === c));
    renderBoard();
  }));
  $('#boardSort').addEventListener('change', function () { boardSort = this.value; renderBoard(); });
  renderBoard();

  $('#suggestionForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const err = $('#suggestionError'); clearError(err); $('#suggestionSuccess').hidden = true;
    const payload = {
      title: $('#suggestionTitle').value.trim(),
      category: $('#suggestionCategory').value,
      body: $('#suggestionBody').value.trim(),
      share: $('#suggestionShare').checked,
      consent: $('#suggestionConsent').checked,
    };
    const btn = $('#suggestionSubmit'); btn.disabled = true;
    try {
      const res = await CA.api('/api/hub/suggestion', { method: 'POST', body: payload });
      if (res.suggestion) {
        data.suggestions.unshift(res.suggestion);
        boardCat = 'all';
        document.querySelectorAll('#boardFilters .chip').forEach((x) => x.classList.toggle('is-active', x.dataset.cat === 'all'));
        boardSort = 'newest';
        $('#boardSort').value = 'newest';
        renderBoard();
        $('#boardList').scrollTop = 0;
      }
      const ok = $('#suggestionSuccess'); ok.querySelector('div').textContent = res.message; ok.hidden = false;
      CA.toast(res.message, 'success');
      this.reset(); $('#suggestionShare').checked = true;
    } catch (ex) { showError(err, ex.message); }
    btn.disabled = false;
  });
})();