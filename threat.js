/* AI Threat Interpreter: form, staged analysis animation, structured result. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('incidentForm');
    if (!form) return;

    const description = document.getElementById('description');
    const charNow = document.getElementById('charNow');
    const consent = document.getElementById('consent');
    const errorBox = document.getElementById('formError');
    const loadingPanel = document.getElementById('loadingPanel');
    const resultBox = document.getElementById('analysisResult');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const demo = JSON.parse(document.getElementById('demoIncident').textContent);
    let lastResult = null;

    description.addEventListener('input', function () {
      charNow.textContent = description.value.length;
      charNow.parentElement.classList.toggle('is-over', description.value.length > 3900);
    });

    document.getElementById('loadSample').addEventListener('click', function () {
      const radio = form.querySelector('input[value="' + demo.category + '"]');
      if (radio) radio.checked = true;
      document.getElementById('platform').value = demo.platform;
      description.value = demo.description;
      charNow.textContent = description.value.length;
      consent.checked = true;
      hideError();
      CA.toast('Fictional sample incident loaded. Nothing here is real personal data.', 'info');
      description.focus();
    });

    document.getElementById('resetForm').addEventListener('click', function () {
      setTimeout(function () { charNow.textContent = '0'; hideError(); }, 0);
    });

    function showError(message) {
      errorBox.hidden = false;
      errorBox.querySelector('span').textContent = message;
    }
    function hideError() { errorBox.hidden = true; }

    function requireWorkspace() {
      CA.modal(
        '<div class="icon-tile" style="margin-bottom:16px"><svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/></svg></div>' +
        '<h3 id="modalTitle" style="margin-bottom:10px">Start a workspace to run the analysis</h3>' +
        '<p class="muted" style="font-size:.9rem;margin-bottom:20px">Analyses, plans and assessments are kept in a private workspace so they are never mixed with anyone else\'s. The demo workspace is disposable and pre-filled with fictional sample data.</p>' +
        '<form method="post" action="/demo"><input type="hidden" name="csrf_token" value="' +
        document.querySelector('meta[name="csrf-token"]').content + '">' +
        '<input type="hidden" name="next" value="/threat-analysis">' +
        '<button class="btn btn-primary btn-block" type="submit">Try Demo workspace</button></form>' +
        '<div class="auth-alt">Already registered? <a href="/login">Sign in</a></div>'
      );
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();
      const text = description.value.trim();
      if (text.length < 20) { showError('Describe what happened in at least 20 characters.'); description.focus(); return; }
      if (!consent.checked) { showError('Please confirm the processing notice before submitting.'); consent.focus(); return; }
      if (document.body.dataset.auth !== '1') { requireWorkspace(); return; }

      const payload = {
        category: form.querySelector('input[name="category"]:checked').value,
        platform: document.getElementById('platform').value,
        description: text,
        consent: true
      };

      analyzeBtn.disabled = true;
      resultBox.hidden = true;
      loadingPanel.hidden = false;
      loadingPanel.scrollIntoView({ behavior: CA.reducedMotion ? 'auto' : 'smooth', block: 'center' });
      runScanAnimation();

      try {
        const started = Date.now();
        const result = await CA.api('/api/analyze', { method: 'POST', body: payload });
        const elapsed = Date.now() - started;
        const wait = Math.max(0, (CA.reducedMotion ? 200 : 2100) - elapsed);
        setTimeout(function () {
          loadingPanel.hidden = true;
          analyzeBtn.disabled = false;
          lastResult = result;
          renderResult(result);
          loadRecent();
          CA.toast('Analysis complete · ' + result.category_label + ' · ' + result.risk_level + ' risk', 'success');
        }, wait);
      } catch (err) {
        loadingPanel.hidden = true;
        analyzeBtn.disabled = false;
        showError(err.message);
        CA.toast(err.message, 'error');
      }
    });

    function runScanAnimation() {
      const steps = document.querySelectorAll('#scanSteps li');
      steps.forEach(function (li) { li.classList.remove('is-done', 'is-active'); });
      if (CA.reducedMotion) { steps.forEach(function (li) { li.classList.add('is-done'); }); return; }
      steps.forEach(function (li, i) {
        setTimeout(function () { li.classList.add('is-active'); }, i * 480);
        setTimeout(function () { li.classList.remove('is-active'); li.classList.add('is-done'); }, i * 480 + 460);
      });
    }

    function listItems(items, numbered) {
      return '<ul class="result-list">' + items.map(function (item, i) {
        return '<li>' + (numbered ? '<span class="num">' + (i + 1) + '</span>' :
          '<span class="num"><svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg></span>') +
          '<span>' + CA.escape(item) + '</span></li>';
      }).join('') + '</ul>';
    }

    function renderResult(r) {
      const tone = r.risk_level === 'High' ? 'high' : (r.risk_level === 'Medium' ? 'medium' : 'low');
      const toneColor = r.risk_level === 'High' ? '#C76F78' : (r.risk_level === 'Medium' ? '#D49A50' : '#438B70');
      const meterOn = r.risk_level === 'High' ? 3 : (r.risk_level === 'Medium' ? 2 : 1);
      let meter = '';
      for (let i = 0; i < 3; i++) meter += '<span class="' + (i < meterOn ? 'on' : '') + '"></span>';

      const signs = r.warning_signs.map(function (s) {
        return '<div class="signal-card"><span class="icon-tile warning" style="width:34px;height:34px;border-radius:10px">' +
          '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg></span>' +
          '<div><strong>' + CA.escape(s.label) + '</strong>' + (s.detail ? '<p>' + CA.escape(s.detail) + '</p>' : '') + '</div></div>';
      }).join('');

      const escalations = (r.escalations || []).length ?
        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg> Escalation signals that raised the risk level</h4>' +
        '<div class="flex flex-col gap-8">' + r.escalations.map(function (x) {
          return '<div class="signal-card"><span class="pill pill-danger">+' + x.weight + '</span><div><strong>' + CA.escape(x.label) + '</strong><p>' + CA.escape(x.detail) + '</p></div></div>';
        }).join('') + '</div></div>' : '';

      resultBox.innerHTML =
        '<div class="panel page-enter">' +
        '<div class="panel-head"><h3><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M12 12l6-4"/></svg> Analysis result</h3>' +
        '<span class="pill ' + (r.simulated ? 'pill-soft' : 'pill-live') + '"><span class="dot dot-pulse"></span>' + CA.escape(r.engine_label) + '</span></div>' +
        '<div class="panel-body">' +

        '<div class="risk-banner ' + tone + '" style="color:' + toneColor + '">' +
        '<span class="icon-tile ' + (tone === 'high' ? 'danger' : tone === 'medium' ? 'warning' : 'success') + '" style="width:56px;height:56px;border-radius:16px">' +
        '<svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/></svg></span>' +
        '<div style="flex:1;color:var(--ink)"><div class="risk-title" style="color:' + toneColor + '">' + CA.escape(r.risk_level) + ' risk</div>' +
        '<div class="muted" style="font-size:.88rem">' + CA.escape(r.category_label) + ' · ' + CA.escape(r.platform) +
        (r.pattern_matches != null ? ' · ' + r.pattern_matches + ' detection pattern' + (r.pattern_matches === 1 ? '' : 's') + ' matched' : '') + '</div>' +
        '<div class="risk-meter" style="color:' + toneColor + '">' + meter + '</div></div></div>' +

        (r.simulated ? '<div class="notice notice-info mt-16"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg><div>' + CA.escape(r.method_note) + '</div></div>' : '') +
        (r.fallback_reason ? '<div class="notice notice-warning mt-16"><div>' + CA.escape(r.fallback_reason) + '</div></div>' : '') +
        (r.reclassified ? '<div class="notice notice-lav mt-16"><div>The language in your description matched <strong>' + CA.escape(r.category_label) + '</strong> more strongly than the category you selected, so the result is based on the detected pattern.</div></div>' : '') +

        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><path d="M12 9a3 3 0 100 6 3 3 0 000-6z"/></svg> Warning signs identified</h4>' +
        '<div class="grid-2">' + signs + '</div></div>' +

        escalations +

        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg> Why this situation may be risky</h4>' +
        '<p style="font-size:.92rem;line-height:1.75;color:var(--ink-2)">' + CA.escape(r.why_risky) + '</p></div>' +

        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg> Immediate recommended actions</h4>' + listItems(r.immediate_actions, true) + '</div>' +
        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 11h12v9H6v-9z"/><path d="M9 11V8a3 3 0 016 0v3"/></svg> Account security recommendations</h4>' + listItems(r.account_security, false) + '</div>' +
        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4a8 8 0 00-8 8v3"/><path d="M20 15v-3a8 8 0 00-4-6.9"/><path d="M8 20a12 12 0 002-6 2 2 0 014 0c0 3-.5 5-1.5 7"/></svg> Evidence preservation recommendations</h4>' + listItems(r.evidence_preservation, false) + '</div>' +
        '<div class="result-section"><h4><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 12h16"/><path d="M14 6l6 6-6 6"/></svg> Appropriate next steps</h4>' + listItems(r.next_steps, true) + '</div>' +

        '<div class="notice notice-warning mt-24"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg><div>' + CA.escape(r.disclaimer) + '</div></div>' +
        '</div>' +

        '<div class="panel-foot flex gap-12 wrap">' +
        '<button class="btn btn-primary" id="makePlan">Build response plan</button>' +
        '<a class="btn btn-outline" href="/evidence-vault">Preserve evidence</a>' +
        '<button class="btn btn-ghost" id="downloadAnalysis">Download summary</button>' +
        '</div></div>';

      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: CA.reducedMotion ? 'auto' : 'smooth', block: 'start' });

      document.getElementById('makePlan').addEventListener('click', async function () {
        const btn = this;
        btn.disabled = true;
        try {
          const data = await CA.api('/api/plans', { method: 'POST', body: { category: r.category } });
          CA.toast('Response plan created from this analysis.', 'success');
          window.location.href = '/response-center?plan=' + data.id;
        } catch (err) {
          btn.disabled = false;
          CA.toast(err.message, 'error');
        }
      });

      document.getElementById('downloadAnalysis').addEventListener('click', function () {
        const lines = [
          'CYBERAURA — PRELIMINARY THREAT ANALYSIS SUMMARY', '='.repeat(58),
          'Category:   ' + r.category_label,
          'Platform:   ' + r.platform,
          'Risk level: ' + r.risk_level,
          'Engine:     ' + r.engine_label + (r.simulated ? ' (simulated analysis)' : ''),
          'Generated:  ' + new Date().toISOString(), '',
          'WARNING SIGNS',
          ...r.warning_signs.map(function (s) { return '- ' + s.label + (s.detail ? ': ' + s.detail : ''); }), '',
          'WHY THIS MAY BE RISKY', r.why_risky, '',
          'IMMEDIATE ACTIONS', ...r.immediate_actions.map(function (x, i) { return (i + 1) + '. ' + x; }), '',
          'ACCOUNT SECURITY', ...r.account_security.map(function (x) { return '- ' + x; }), '',
          'EVIDENCE PRESERVATION', ...r.evidence_preservation.map(function (x) { return '- ' + x; }), '',
          'NEXT STEPS', ...r.next_steps.map(function (x, i) { return (i + 1) + '. ' + x; }), '',
          '-'.repeat(58), r.disclaimer
        ];
        CA.download('cyberaura-analysis-summary.txt', lines.join('\n'));
        CA.toast('Analysis summary downloaded.', 'success');
      });
    }

    async function loadRecent() {
      const box = document.getElementById('recentAnalyses');
      if (document.body.dataset.auth !== '1') {
        box.innerHTML = '<p class="tiny">Start a demo workspace to keep a history of your analyses.</p>' +
          '<form method="post" action="/demo" class="mt-16"><input type="hidden" name="csrf_token" value="' +
          document.querySelector('meta[name="csrf-token"]').content + '"><input type="hidden" name="next" value="/threat-analysis">' +
          '<button class="btn btn-soft btn-sm btn-block" type="submit">Try Demo</button></form>';
        return;
      }
      try {
        const data = await CA.api('/api/analyses');
        if (!data.items.length) {
          box.innerHTML = '<p class="tiny">No analyses yet. Your completed analyses will appear here with their category and risk band.</p>';
          return;
        }
        box.innerHTML = '<div class="flex flex-col gap-12">' + data.items.slice(0, 6).map(function (a) {
          const tone = a.risk_level === 'High' ? 'danger' : a.risk_level === 'Medium' ? 'warning' : 'success';
          return '<div class="flex gap-12 items-center"><span class="pill pill-' + tone + '">' + CA.escape(a.risk_level) + '</span>' +
            '<div style="min-width:0"><div style="font-size:.83rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + CA.escape(a.category_label) + '</div>' +
            '<div class="tiny">' + CA.escape(a.platform) + ' · ' + CA.timeAgo(a.created_at) + '</div></div></div>';
        }).join('') + '</div>';
      } catch (err) {
        box.innerHTML = '<p class="tiny">' + CA.escape(err.message) + '</p>';
      }
    }

    loadRecent();
  });
})();