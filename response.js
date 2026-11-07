/* Personalised Cyber Response Center: playbooks, live checklist, progress, export. */
(function () {
  'use strict';

  let plans = [];
  let active = null;

  document.addEventListener('DOMContentLoaded', function () {
    const listEl = document.getElementById('planList');
    const activeEl = document.getElementById('activePlan');
    const ringEl = document.getElementById('planRing');
    const barEl = document.getElementById('planBar');
    const progressText = document.getElementById('planProgressText');
    const downloadBtn = document.getElementById('downloadPlan');
    const deleteBtn = document.getElementById('deletePlan');

    async function load(selectId) {
      try {
        const data = await CA.api('/api/plans');
        plans = data.items;
        document.getElementById('planCount').textContent = plans.length;
        renderList();
        const wanted = selectId || new URLSearchParams(window.location.search).get('plan');
        const target = plans.find(function (p) { return String(p.id) === String(wanted); }) || plans[0] || null;
        select(target);
      } catch (err) {
        listEl.innerHTML = '<div class="notice notice-danger"><div>' + CA.escape(err.message) + '</div></div>';
      }
    }

    function renderList() {
      if (!plans.length) {
        listEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:30px 16px"><span class="icon-tile"><svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg></span>' +
          '<h4>No response plans yet</h4><p>Choose an incident type above and generate a checklist tailored to it.</p></div>';
        return;
      }
      listEl.innerHTML = plans.map(function (p) {
        return '<button type="button" class="plan-card ' + (active && active.id === p.id ? 'is-active' : '') + '" data-plan="' + p.id + '">' +
          '<div class="flex justify-between items-center gap-12"><strong>' + CA.escape(p.title) + '</strong>' +
          '<span class="pill ' + (p.percent === 100 ? 'pill-success' : 'pill-soft') + '">' + p.percent + '%</span></div>' +
          '<span class="tiny">' + CA.escape(p.category_label) + ' · ' + p.done + ' of ' + p.total + ' steps · ' + CA.fmtDate(p.created_at) + '</span>' +
          '<span class="progress-track" style="height:6px"><span class="progress-fill" style="width:' + p.percent + '%"></span></span>' +
          '</button>';
      }).join('');
    }

    function select(plan) {
      active = plan;
      renderList();
      if (!plan) {
        activeEl.innerHTML = '';
        ringEl.innerHTML = '';
        barEl.style.width = '0%';
        progressText.textContent = 'Select or create a plan to begin.';
        downloadBtn.disabled = true;
        deleteBtn.disabled = true;
        return;
      }
      downloadBtn.disabled = false;
      deleteBtn.disabled = false;
      renderActive();
      updateProgress();
    }

    function renderActive() {
      const phases = [];
      active.items.forEach(function (item) {
        let group = phases.find(function (g) { return g.name === item.phase; });
        if (!group) { group = { name: item.phase, items: [] }; phases.push(group); }
        group.items.push(item);
      });

      activeEl.innerHTML =
        '<div class="panel page-enter">' +
        '<div class="panel-head"><h3><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg> ' + CA.escape(active.title) + '</h3>' +
        '<span class="pill pill-soft">' + CA.escape(active.category_label) + '</span></div>' +
        '<div class="panel-body">' +
        '<p class="muted mb-24" style="font-size:.92rem">' + CA.escape(active.summary) + '</p>' +
        '<div id="completeBanner"></div>' +
        phases.map(function (group) {
          const done = group.items.filter(function (i) { return i.done; }).length;
          return '<div class="phase-group"><div class="phase-title">' + CA.escape(group.name) +
            '<span class="pill ' + (done === group.items.length ? 'pill-success' : 'pill-outline') + '" style="margin-left:8px">' + done + '/' + group.items.length + '</span></div>' +
            '<ul class="checklist">' + group.items.map(function (item) {
              return '<li><label class="check-item ' + (item.done ? 'is-done' : '') + '" data-item="' + item.id + '">' +
                '<input type="checkbox" ' + (item.done ? 'checked' : '') + ' aria-label="' + CA.escape(item.label) + '">' +
                '<span class="check-box"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>' +
                '<span><span class="check-label">' + CA.escape(item.label) + '</span><span class="check-detail">' + CA.escape(item.detail) + '</span></span>' +
                '</label></li>';
            }).join('') + '</ul></div>';
        }).join('') +
        '<div class="notice notice-warning mt-24"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg><div>' + CA.escape(active.disclaimer) + '</div></div>' +
        '</div></div>';

      activeEl.querySelectorAll('.check-item input').forEach(function (input) {
        input.addEventListener('change', function () {
          const label = input.closest('.check-item');
          toggleItem(label.dataset.item, input.checked, label);
        });
      });
      renderCompleteBanner();
    }

    function renderCompleteBanner() {
      const box = document.getElementById('completeBanner');
      if (!box) return;
      if (active.percent === 100) {
        box.innerHTML = '<div class="notice notice-success mb-24"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' +
          '<div><strong>Every step in this plan is complete.</strong> Keep the downloaded summary with your evidence. Completion improves preparedness; it does not guarantee the incident is resolved.</div></div>';
      } else {
        box.innerHTML = '';
      }
    }

    function updateProgress() {
      const pct = active ? active.percent : 0;
      CA.ring(ringEl, {
        value: pct, size: 158, stroke: 13, label: 'complete', suffix: '%',
        color: pct === 100 ? '#438B70' : '#514078'
      });
      barEl.style.width = pct + '%';
      progressText.textContent = active ? active.done + ' of ' + active.total + ' steps complete' : '';
    }

    async function toggleItem(itemId, done, labelEl) {
      const item = active.items.find(function (i) { return i.id === itemId; });
      if (!item) return;
      const previous = item.done;
      item.done = done;
      labelEl.classList.toggle('is-done', done);
      recompute();
      renderList();
      updateProgress();
      renderCompleteBanner();
      try {
        const updated = await CA.api('/api/plans/' + active.id + '/toggle', { method: 'POST', body: { item_id: itemId, done: done } });
        const idx = plans.findIndex(function (p) { return p.id === updated.id; });
        if (idx >= 0) plans[idx] = updated;
        active = updated;
        renderList();
        updateProgress();
        renderCompleteBanner();
        if (done) CA.toast('Step marked complete.', 'success', 2200);
        if (updated.percent === 100 && previous !== done) CA.toast('Plan complete — download your summary to keep a record.', 'success', 6000);
      } catch (err) {
        item.done = previous;
        labelEl.classList.toggle('is-done', previous);
        labelEl.querySelector('input').checked = previous;
        recompute();
        renderList();
        updateProgress();
        CA.toast(err.message, 'error');
      }
    }

    function recompute() {
      const done = active.items.filter(function (i) { return i.done; }).length;
      active.done = done;
      active.total = active.items.length;
      active.percent = active.total ? Math.round(100 * done / active.total) : 0;
      const idx = plans.findIndex(function (p) { return p.id === active.id; });
      if (idx >= 0) plans[idx] = active;
    }

    listEl.addEventListener('click', function (e) {
      const card = e.target.closest('[data-plan]');
      if (!card) return;
      const plan = plans.find(function (p) { return String(p.id) === card.dataset.plan; });
      if (plan) {
        select(plan);
        activeEl.scrollIntoView({ behavior: CA.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });

    document.getElementById('createPlan').addEventListener('click', async function () {
      const btn = this;
      btn.disabled = true;
      try {
        const plan = await CA.api('/api/plans', { method: 'POST', body: { category: document.getElementById('planCategory').value } });
        plans.unshift(plan);
        document.getElementById('planCount').textContent = plans.length;
        select(plan);
        CA.toast('Response plan generated.', 'success');
        activeEl.scrollIntoView({ behavior: CA.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      } catch (err) {
        CA.toast(err.message, 'error');
      }
      btn.disabled = false;
    });

    downloadBtn.addEventListener('click', async function () {
      if (!active) return;
      downloadBtn.disabled = true;
      try {
        const response = await fetch('/api/plans/' + active.id + '/report', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('The summary could not be generated.');
        const text = await response.text();
        CA.download('cyberaura-response-plan-' + active.id + '.txt', text);
        CA.toast('Response summary downloaded.', 'success');
      } catch (err) {
        CA.toast(err.message, 'error');
      }
      downloadBtn.disabled = false;
    });

    deleteBtn.addEventListener('click', async function () {
      if (!active) return;
      const ok = await CA.confirm({
        title: 'Delete this response plan?',
        message: 'The checklist and its progress will be removed from your workspace. Downloaded summaries are not affected.',
        confirmLabel: 'Delete plan'
      });
      if (!ok) return;
      try {
        await CA.api('/api/plans/' + active.id, { method: 'DELETE' });
        plans = plans.filter(function (p) { return p.id !== active.id; });
        document.getElementById('planCount').textContent = plans.length;
        select(plans[0] || null);
        CA.toast('Plan deleted.', 'success');
      } catch (err) {
        CA.toast(err.message, 'error');
      }
    });

    load();
  });
})();