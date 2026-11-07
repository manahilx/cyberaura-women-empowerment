/* Digital Exposure Assessment: transparent scoring, exposure meters, history. */
(function () {
  'use strict';

  const answers = {};
  let cards = [];
  let lastResult = null;

  document.addEventListener('DOMContentLoaded', function () {
    cards = Array.from(document.querySelectorAll('.question-card'));
    const total = cards.length;
    const calcBtn = document.getElementById('calcScore');
    const hint = document.getElementById('calcHint');
    const bar = document.getElementById('assessBar');
    const countEl = document.getElementById('answeredCount');
    const resultBox = document.getElementById('assessmentResult');
    const ringEl = document.getElementById('scoreRing');
    const noteEl = document.getElementById('scoreNote');

    CA.ring(ringEl, { value: 0, size: 158, stroke: 13, label: 'readiness', suffix: '' });

    function answeredCount() { return Object.keys(answers).length; }

    function refreshProgress() {
      const n = answeredCount();
      countEl.textContent = n + ' / ' + total + ' answered';
      bar.style.width = (100 * n / total) + '%';
      calcBtn.disabled = n < total;
      hint.textContent = n < total ? (total - n) + ' question' + (total - n === 1 ? '' : 's') + ' remaining.' : 'Ready to calculate.';
    }

    cards.forEach(function (card) {
      const key = card.dataset.key;
      card.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const yes = btn.dataset.value === 'yes';
          answers[key] = yes;
          card.classList.add('answered');
          card.querySelectorAll('.answer-btn').forEach(function (b) {
            const selected = b === btn;
            b.classList.toggle('is-selected', selected);
            b.classList.toggle('risky', selected && yes);
            b.classList.toggle('safe', selected && !yes);
            b.setAttribute('aria-pressed', selected ? 'true' : 'false');
          });
          refreshProgress();
        });
      });
    });

    document.getElementById('resetAssessment').addEventListener('click', function () {
      Object.keys(answers).forEach(function (k) { delete answers[k]; });
      cards.forEach(function (card) {
        card.classList.remove('answered');
        card.querySelectorAll('.answer-btn').forEach(function (b) {
          b.classList.remove('is-selected', 'risky', 'safe');
          b.setAttribute('aria-pressed', 'false');
        });
      });
      refreshProgress();
      CA.toast('Answers cleared.', 'info', 2200);
    });

    function requireWorkspace() {
      CA.modal(
        '<div class="icon-tile" style="margin-bottom:16px"><svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/></svg></div>' +
        '<h3 id="modalTitle" style="margin-bottom:10px">Save your assessment to a workspace</h3>' +
        '<p class="muted" style="font-size:.9rem;margin-bottom:20px">Scores and history are kept in a private workspace so you can compare progress over time. The demo workspace is disposable and uses fictional sample data.</p>' +
        '<form method="post" action="/demo"><input type="hidden" name="csrf_token" value="' +
        document.querySelector('meta[name="csrf-token"]').content + '"><input type="hidden" name="next" value="/privacy-check">' +
        '<button class="btn btn-primary btn-block" type="submit">Try Demo workspace</button></form>' +
        '<div class="auth-alt">Already registered? <a href="/login">Sign in</a></div>'
      );
    }

    calcBtn.addEventListener('click', async function () {
      if (document.body.dataset.auth !== '1') { requireWorkspace(); return; }
      calcBtn.disabled = true;
      calcBtn.innerHTML = 'Calculating…';
      try {
        const result = await CA.api('/api/assessment', { method: 'POST', body: { answers: answers } });
        lastResult = result;
        renderResult(result);
        renderHistoryFrom(result);
        CA.toast('Assessment complete · score ' + result.score + '/100 · ' + result.band.label, 'success');
        resultBox.scrollIntoView({ behavior: CA.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      } catch (err) {
        CA.toast(err.message, 'error');
      }
      calcBtn.disabled = false;
      calcBtn.innerHTML = '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 18a8 8 0 1116 0"/><path d="M12 18l4-6"/></svg> Calculate my score';
    });

    function toneColor(tone) {
      return { success: '#438B70', info: '#4A6FA5', warning: '#D49A50', danger: '#C76F78' }[tone] || '#514078';
    }

    function renderResult(r) {
      const color = toneColor(r.band.tone);
      CA.ring(ringEl, { value: r.score, size: 158, stroke: 13, label: 'readiness', color: color });
      noteEl.textContent = r.band.note;

      const meters = document.getElementById('exposureMeters');
      CA.bars(meters, r.exposure.map(function (x, i) {
        return { label: x.category, value: x.percent, display: x.percent + '%', color: ['#514078', '#9583B9', '#D49A50', '#4A6FA5'][i % 4] };
      }));

      const recs = r.recommendations.length ? r.recommendations.map(function (rec, i) {
        return '<div class="signal-card" style="align-items:flex-start">' +
          '<span class="icon-tile ' + (i === 0 ? 'warning' : '') + '" style="width:38px;height:38px;border-radius:12px">' +
          '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/></svg></span>' +
          '<div style="flex:1"><div class="flex justify-between gap-12 items-center"><strong>' + CA.escape(rec.category) + '</strong><span class="pill pill-outline">' + rec.weight + ' pts</span></div>' +
          '<p style="margin-top:6px">' + CA.escape(rec.action) + '</p></div></div>';
      }).join('') : '<div class="notice notice-success"><div>No exposures flagged by your answers. Keep the habits and re-check periodically — platform defaults change over time.</div></div>';

      const breakdown = r.breakdown.map(function (b) {
        return '<div class="acc-item"><button type="button" class="acc-trigger" aria-expanded="false">' +
          '<span class="pill ' + (b.risky ? 'pill-warning' : 'pill-success') + '" style="flex-shrink:0">' + (b.risky ? '−' + b.deduction : '0') + '</span>' +
          '<span style="flex:1;font-size:.86rem">' + CA.escape(b.question) + '</span>' +
          '<svg class="icon icon-sm chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="acc-panel"><div class="acc-panel-inner"><div class="acc-content">Your answer: <strong>' + (b.answer ? 'Yes' : 'No') + '</strong>. ' +
          (b.risky ? 'This exposure deducts ' + b.deduction + ' points from the starting score of ' + r.max_score + '.' : 'This habit is protective, so no points are deducted.') +
          ' Category: ' + CA.escape(b.category) + '.</div></div></div></div>';
      }).join('');

      resultBox.innerHTML =
        '<div class="panel page-enter">' +
        '<div class="panel-head"><h3><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 20V12"/><path d="M9 20V6"/><path d="M14 20v-9"/><path d="M19 20V9"/><path d="M3 20h18"/></svg> Your assessment result</h3>' +
        '<span class="pill pill-' + r.band.tone + '">' + CA.escape(r.band.label) + '</span></div>' +
        '<div class="panel-body">' +
        '<div class="risk-banner" style="background:linear-gradient(120deg,' + color + '14, #fff);border-color:' + color + '40;color:' + color + '">' +
        '<div style="flex:1;color:var(--ink)"><div class="risk-title" style="color:' + color + '">' + r.score + ' / 100</div>' +
        '<div class="muted" style="font-size:.9rem">' + CA.escape(r.band.note) + '</div></div>' +
        '<div class="text-center"><div class="tiny">Areas to improve</div><strong style="font-family:var(--font-head);font-size:1.6rem;color:' + color + '">' + r.recommendations.length + '</strong></div></div>' +

        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg> Prioritised recommendations</h4>' +
        '<div class="flex flex-col gap-12">' + recs + '</div></div>' +

        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg> How this score was calculated</h4>' +
        '<p class="tiny mb-16">Starting score ' + r.max_score + '. Each flagged exposure deducts its listed weight. Nothing is hidden or weighted secretly.</p>' +
        '<div class="accordion">' + breakdown + '</div></div>' +

        '<div class="notice notice-info mt-24"><div>' + CA.escape(r.note || 'Self-assessment based only on your answers.') + '</div></div>' +
        '</div>' +
        '<div class="panel-foot flex gap-12 wrap">' +
        '<a class="btn btn-primary" href="/response-center">Build a response plan</a>' +
        '<button class="btn btn-outline" id="downloadAssessment">Download report</button>' +
        '<a class="btn btn-ghost" href="/resources">Find support resources</a>' +
        '</div></div>';

      resultBox.hidden = false;
      resultBox.querySelectorAll('.acc-trigger').forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          const item = trigger.closest('.acc-item');
          const open = item.classList.toggle('is-open');
          trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
      document.getElementById('downloadAssessment').addEventListener('click', function () {
        const lines = [
          'CYBERAURA — DIGITAL EXPOSURE ASSESSMENT REPORT', '='.repeat(58),
          'Score: ' + r.score + ' / ' + r.max_score + '  (' + r.band.label + ')',
          'Generated: ' + new Date().toISOString(), '',
          r.band.note, '',
          'CALCULATION',
          ...r.breakdown.map(function (b) { return '- ' + b.question + ' → ' + (b.answer ? 'Yes' : 'No') + ' · deduction ' + b.deduction + '/' + b.weight; }), '',
          'EXPOSURE BY CATEGORY',
          ...r.exposure.map(function (x) { return '- ' + x.category + ': ' + x.exposure + ' of ' + x.possible + ' points exposed (' + x.percent + '%)'; }), '',
          'PRIORITISED RECOMMENDATIONS',
          ...r.recommendations.map(function (x, i) { return (i + 1) + '. [' + x.category + '] ' + x.action; }), '',
          '-'.repeat(58),
          'This is a self-assessment based only on the answers provided.',
          'CYBERAURA does not scan the internet or connect to your accounts.'
        ];
        CA.download('cyberaura-privacy-assessment.txt', lines.join('\n'));
        CA.toast('Assessment report downloaded.', 'success');
      });
    }

    function renderHistory(history) {
      const box = document.getElementById('scoreHistory');
      if (!history || history.length < 1) {
        box.innerHTML = '<p class="tiny">Complete an assessment to start tracking progress over time.</p>';
        return;
      }
      CA.lineChart(box, history.map(function (h) {
        return { value: h.score, label: CA.fmtDate(h.created_at).split(' ').slice(0, 2).join(' ') };
      }), { height: 150, aria: 'Privacy readiness score history' });
    }

    function renderHistoryFrom(result) {
      renderHistory([{ score: result.score, created_at: result.created_at }]);
      if (document.body.dataset.auth === '1') {
        CA.api('/api/assessment/latest').then(function (data) {
          if (data.history) renderHistory(data.history);
        }).catch(function () { /* history is non-critical */ });
      }
    }

    refreshProgress();

    if (document.body.dataset.auth === '1') {
      CA.api('/api/assessment/latest').then(function (data) {
        if (!data.available) return;
        Object.keys(data.answers).forEach(function (key) {
          const card = cards.find(function (c) { return c.dataset.key === key; });
          if (!card) return;
          const yes = data.answers[key];
          answers[key] = yes;
          card.classList.add('answered');
          card.querySelectorAll('.answer-btn').forEach(function (b) {
            const selected = (b.dataset.value === 'yes') === yes;
            b.classList.toggle('is-selected', selected);
            b.classList.toggle('risky', selected && yes);
            b.classList.toggle('safe', selected && !yes);
            b.setAttribute('aria-pressed', selected ? 'true' : 'false');
          });
        });
        refreshProgress();
        lastResult = data;
        renderResult(data);
        renderHistory(data.history);
      }).catch(function () { /* first visit, no history */ });
    }
  });
})();