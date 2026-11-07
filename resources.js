/* CYBERAURA Resource Navigator: live search/filter and the digital safety quiz. */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------------------ directory */
  const grid = $('resourceGrid');
  const cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.resource-card')) : [];
  const search = $('resourceSearch');
  const filters = $('resourceFilters');
  const countEl = $('resourceCount');
  const emptyEl = $('resourceEmpty');
  let activeType = 'all';

  function applyFilters() {
    const term = (search && search.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach(function (card) {
      const matchType = activeType === 'all' || card.dataset.type === activeType;
      const matchTerm = !term || (card.dataset.search || '').indexOf(term) !== -1;
      const visible = matchType && matchTerm;
      card.style.display = visible ? '' : 'none';
      if (visible) {
        shown++;
        card.classList.add('is-visible');
        card.style.animation = 'none';
        // retrigger entrance without forcing layout thrash on every keystroke
        void card.offsetWidth;
        card.style.animation = '';
      }
    });
    if (countEl) countEl.textContent = 'Showing ' + shown + (shown === 1 ? ' organisation' : ' organisations');
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (grid) grid.style.display = shown === 0 ? 'none' : '';
  }

  if (search) search.addEventListener('input', CA.debounce(applyFilters, 140));
  if (filters) {
    filters.addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filters.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      activeType = chip.dataset.type;
      applyFilters();
    });
  }
  const resetBtn = $('resourceReset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (search) search.value = '';
    activeType = 'all';
    if (filters) {
      filters.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-active', c.dataset.type === 'all'); });
    }
    applyFilters();
  });

  /* ----------------------------------------------------------------- quiz */
  const questions = Array.prototype.slice.call(document.querySelectorAll('.quiz-question'));
  const total = questions.length;
  const bar = $('quizBar');
  const progressLabel = $('quizProgressLabel');
  const scoreEl = $('quizScore');
  const completeBtn = $('quizComplete');
  const resetQuiz = $('quizReset');
  const hint = $('quizHint');
  let answered = 0, correct = 0, recorded = false;

  function refresh() {
    if (bar) bar.style.width = (total ? (100 * answered / total) : 0) + '%';
    if (progressLabel) progressLabel.textContent = answered + ' of ' + total + ' answered';
    if (scoreEl) scoreEl.textContent = answered ? 'Score: ' + correct + ' / ' + total : 'Score: —';
    if (completeBtn) completeBtn.disabled = !(answered === total && total > 0) || recorded;
    if (hint) {
      if (recorded) hint.textContent = 'Completion recorded. Thank you for strengthening the community.';
      else if (answered === total) hint.textContent = 'All scenarios answered — record your completion above.';
      else hint.textContent = 'Answer all ' + total + ' scenarios to record your completion.';
    }
  }

  questions.forEach(function (q) {
    const answer = parseInt(q.dataset.answer, 10);
    const options = Array.prototype.slice.call(q.querySelectorAll('.quiz-option'));
    const why = q.querySelector('.quiz-why');
    options.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (q.classList.contains('is-answered')) return;
        q.classList.add('is-answered');
        const chosen = parseInt(btn.dataset.index, 10);
        const isCorrect = chosen === answer;
        options.forEach(function (opt) {
          opt.disabled = true;
          const idx = parseInt(opt.dataset.index, 10);
          if (idx === answer) opt.classList.add('correct');
          else if (idx === chosen) opt.classList.add('wrong');
        });
        if (why) why.hidden = false;
        answered++;
        if (isCorrect) correct++;
        refresh();
      });
    });
  });

  function revealAll() {
    questions.forEach(function (q) {
      const answer = parseInt(q.dataset.answer, 10);
      q.classList.add('is-answered');
      q.querySelectorAll('.quiz-option').forEach(function (opt) {
        opt.disabled = true;
        if (parseInt(opt.dataset.index, 10) === answer) opt.classList.add('correct');
      });
      const why = q.querySelector('.quiz-why');
      if (why) why.hidden = false;
    });
  }

  async function recordResult(score, count) {
    const res = await CA.api('/api/learn', { method: 'POST', body: { correct: score, total: count } });
    recorded = true;
    answered = total; correct = score;
    revealAll();
    refresh();
    CA.toast('Learning completion recorded — ' + score + '/' + count + ' correct. Community total: ' + res.total + '.', 'success');
  }

  if (completeBtn) completeBtn.addEventListener('click', async function () {
    if (recorded) return;
    completeBtn.disabled = true;
    const authed = document.body.dataset.auth === '1';
    if (!authed) {
      try { sessionStorage.setItem('ca-quiz-pending', JSON.stringify({ correct: correct, total: total })); } catch (err) { /* storage blocked */ }
      CA.modal(
        '<span class="icon-tile info" style="margin-bottom:16px">' +
        '<svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/></svg></span>' +
        '<h3 id="modalTitle" style="margin-bottom:10px">Save your learning progress</h3>' +
        '<p class="muted" style="font-size:.9rem;margin-bottom:22px">Recording completion needs a workspace so the community indicator can attribute it. Start a free, disposable demo workspace — no personal details required. Your result is saved and will be recorded automatically when you return.</p>' +
        '<div class="flex gap-12"><button class="btn btn-outline" style="flex:1" data-modal-close>Not now</button>' +
        '<form method="post" action="/demo" style="flex:1"><input type="hidden" name="csrf_token" value="' +
        CA.escape((document.querySelector('meta[name="csrf-token"]') || {}).content || '') + '">' +
        '<input type="hidden" name="next" value="/resources#learning">' +
        '<button class="btn btn-primary btn-block" type="submit">Start demo &amp; save</button></form></div>'
      );
      completeBtn.disabled = false;
      return;
    }
    try {
      await recordResult(correct, total);
    } catch (err) {
      completeBtn.disabled = false;
      CA.toast(err.message, 'error');
    }
  });

  if (resetQuiz) resetQuiz.addEventListener('click', function () {
    answered = 0; correct = 0; recorded = false;
    questions.forEach(function (q) {
      q.classList.remove('is-answered');
      q.querySelectorAll('.quiz-option').forEach(function (opt) {
        opt.disabled = false;
        opt.classList.remove('correct', 'wrong');
      });
      const why = q.querySelector('.quiz-why');
      if (why) why.hidden = true;
    });
    refresh();
    CA.toast('Quiz reset. Give it another try.', 'info');
  });

  refresh();

  /* Auto-record a result saved before starting a demo workspace. */
  if (document.body.dataset.auth === '1' && total > 0) {
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem('ca-quiz-pending') || 'null'); } catch (err) { pending = null; }
    if (pending && pending.total === total) {
      try { sessionStorage.removeItem('ca-quiz-pending'); } catch (err) { /* ignore */ }
      recordResult(pending.correct, pending.total).catch(function (err) { CA.toast(err.message, 'error'); });
    }
  }
})();