/* CYBERAURA About page: community feedback form. */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const form = $('feedbackForm');
  if (!form) return;

  const message = $('feedbackMessage');
  const role = $('feedbackRole');
  const consent = $('feedbackConsent');
  const countEl = $('feedbackCount');
  const errorEl = $('feedbackError');
  const successEl = $('feedbackSuccess');
  const submit = $('feedbackSubmit');

  function showError(text) {
    errorEl.innerHTML = '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg><span>' + CA.escape(text) + '</span>';
    errorEl.hidden = false;
    successEl.hidden = true;
  }

  if (message && countEl) {
    message.addEventListener('input', function () {
      countEl.textContent = message.value.length;
      const wrap = countEl.closest('.char-count');
      if (wrap) wrap.classList.toggle('is-over', message.value.length > 2000);
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    const text = (message.value || '').trim();
    if (text.length < 10) { showError('Tell us a little more — at least 10 characters.'); message.focus(); return; }
    if (text.length > 2000) { showError('Keep feedback under 2000 characters.'); message.focus(); return; }
    if (!consent.checked) { showError('Confirm that your feedback contains no personal or sensitive information.'); consent.focus(); return; }

    submit.disabled = true;
    const original = submit.innerHTML;
    submit.innerHTML = 'Sending…';
    try {
      const res = await CA.api('/api/feedback', { method: 'POST', body: { message: text, role: role.value, consent: true } });
      successEl.hidden = false;
      form.reset();
      if (countEl) countEl.textContent = '0';
      CA.toast(res.message || 'Thank you. Your feedback has been recorded.', 'success');
    } catch (err) {
      showError(err.message);
      CA.toast(err.message, 'error');
    } finally {
      submit.disabled = false;
      submit.innerHTML = original;
    }
  });
})();