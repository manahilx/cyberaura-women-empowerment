/* Evidence Vault: IndexedDB storage, SHA-256 fingerprinting, integrity verification.
   Files never leave the browser. */
(function () {
  'use strict';

  const DB_NAME = 'cyberaura-vault';
  const STORE = 'evidence';
  const MAX_BYTES = 10 * 1024 * 1024;

  let db = null;
  let records = [];
  let filter = 'all';
  let query = '';
  let sort = 'newest';
  let pendingDelete = null;
  let thumbUrls = [];

  function revokeThumbs() {
    thumbUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    thumbUrls = [];
  }

  /* ------------------------------------------------------------ storage */
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('This browser does not support IndexedDB, so local evidence storage is unavailable.')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(new Error('Local storage could not be opened. Private browsing modes may block it.')); };
    });
  }

  function tx(mode, fn) {
    return new Promise(function (resolve, reject) {
      const transaction = db.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);
      const request = fn(store);
      transaction.oncomplete = function () { resolve(request ? request.result : undefined); };
      transaction.onerror = function () { reject(new Error('Local storage operation failed.')); };
      transaction.onabort = function () { reject(new Error('Local storage operation was cancelled.')); };
    });
  }

  const getAll = function () { return tx('readonly', function (s) { return s.getAll(); }); };
  const put = function (rec) { return tx('readwrite', function (s) { return s.put(rec); }); };
  const remove = function (id) { return tx('readwrite', function (s) { return s.delete(id); }); };
  const clear = function () { return tx('readwrite', function (s) { return s.clear(); }); };

  /* ------------------------------------------------------------- SHA-256 */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const rotr = function (x, n) { return (x >>> n) | (x << (32 - n)); };

  /* Pure-JS fallback for non-secure contexts where crypto.subtle is unavailable. */
  function sha256Fallback(bytes) {
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const len = bytes.length;
    const padded = new Uint8Array(Math.ceil((len + 9) / 64) * 64);
    padded.set(bytes);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    const bits = len * 8;
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296), false);
    view.setUint32(padded.length - 4, bits >>> 0, false);
    const w = new Uint32Array(64);
    for (let i = 0; i < padded.length; i += 64) {
      for (let j = 0; j < 16; j++) w[j] = view.getUint32(i + j * 4, false);
      for (let j = 16; j < 64; j++) {
        const x = w[j - 15], y = w[j - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let j = 0; j < 64; j++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H = [(H[0] + a) >>> 0, (H[1] + b) >>> 0, (H[2] + c) >>> 0, (H[3] + d) >>> 0,
           (H[4] + e) >>> 0, (H[5] + f) >>> 0, (H[6] + g) >>> 0, (H[7] + h) >>> 0];
    }
    return H.map(function (x) { return x.toString(16).padStart(8, '0'); }).join('');
  }

  async function sha256(buffer) {
    const bytes = new Uint8Array(buffer);
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    return sha256Fallback(bytes);
  }
  window.CA_SHA256 = sha256;

  /* -------------------------------------------------------------- helpers */
  function kindOf(rec) {
    if (rec.kind === 'note') return 'note';
    if ((rec.type || '').startsWith('image/')) return 'image';
    return 'document';
  }

  function glyph(kind) {
    if (kind === 'image') return '<path d="M4 5h16v14H4V5z"/><path d="M4 16l5-5 4 4 3-3 4 4"/><path d="M9 9h.01"/>';
    if (kind === 'note') return '<path d="M5 4h14v16H5V4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>';
    return '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5"/>';
  }

  function fingerprintBars(hash) {
    if (!hash) return '';
    let bars = '';
    for (let i = 0; i < 32; i++) {
      const v = parseInt(hash[i * 2], 16);
      bars += '<span style="height:' + (25 + (v / 15) * 75) + '%"></span>';
    }
    return '<div class="fingerprint-viz" aria-hidden="true">' + bars + '</div>';
  }

  function verifyBadge(rec) {
    if (rec.kind === 'note') return '<span class="verify-state none">Note · no file</span>';
    if (rec.verifyStatus === 'verified') return '<span class="verify-state verified"><svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Integrity verified</span>';
    if (rec.verifyStatus === 'failed') return '<span class="verify-state failed"><svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg> Mismatch detected</span>';
    return '<span class="verify-state pending">Not yet verified</span>';
  }

  function visibleRecords() {
    let list = records.slice();
    if (filter === 'verified') list = list.filter(function (r) { return r.verifyStatus === 'verified'; });
    else if (filter !== 'all') list = list.filter(function (r) { return kindOf(r) === filter; });
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(function (r) {
        return [r.name, r.description, r.notes, r.urls, r.hash].join(' ').toLowerCase().includes(q);
      });
    }
    list.sort(function (a, b) {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size') return (b.size || 0) - (a.size || 0);
      if (sort === 'oldest') return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
    return list;
  }

  /* --------------------------------------------------------------- render */
  function render() {
    revokeThumbs();
    const list = visibleRecords();
    const box = document.getElementById('vaultList');
    document.getElementById('recordCount').textContent = records.length;

    if (!records.length) {
      box.innerHTML = '<div class="empty-state"><span class="icon-tile"><svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg></span>' +
        '<h4>Your vault is empty</h4><p>Add a demonstration file or a text note to see fingerprinting and integrity verification in action. The sample record contains no real personal data.</p>' +
        '<button class="btn btn-primary" id="emptySample">Add sample record</button></div>';
      const btn = document.getElementById('emptySample');
      if (btn) btn.addEventListener('click', addSample);
    } else if (!list.length) {
      box.innerHTML = '<div class="empty-state"><span class="icon-tile"><svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 4a7 7 0 100 14 7 7 0 000-14z"/><path d="M20 20l-4-4"/></svg></span>' +
        '<h4>No records match</h4><p>Try a different search term or filter.</p></div>';
    } else {
      box.innerHTML = '<div class="evidence-grid">' + list.map(function (rec, i) {
        const kind = kindOf(rec);
        let thumb;
        if (kind === 'image' && rec.blob) {
          const url = URL.createObjectURL(rec.blob);
          thumbUrls.push(url);
          thumb = '<img src="' + url + '" alt="Preview of ' + CA.escape(rec.name) + '">';
        } else {
          thumb = '<svg class="file-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + glyph(kind) + '</svg>';
        }
        return '<article class="evidence-card" style="animation-delay:' + (i * 45) + 'ms" data-id="' + rec.id + '">' +
          '<div class="evidence-thumb">' + thumb + '<span class="pill pill-soft evidence-type">' + kind + '</span></div>' +
          '<div class="evidence-body">' +
          '<div class="evidence-title">' + CA.escape(rec.name) + '</div>' +
          '<div class="evidence-meta"><span>' + CA.fmtBytes(rec.size) + '</span><span>·</span><span>' + CA.fmtDate(rec.incidentDate || new Date(rec.createdAt).toISOString()) + '</span></div>' +
          (rec.description ? '<p class="tiny" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + CA.escape(rec.description) + '</p>' : '') +
          (rec.hash ? '<div class="hash-box"><svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4l-2 16"/><path d="M16 4l-2 16"/></svg><span class="hash-text mono" title="' + rec.hash + '">' + rec.hash + '</span></div>' + fingerprintBars(rec.hash) : '') +
          '<div>' + verifyBadge(rec) + '</div>' +
          '<div class="evidence-actions">' +
          (rec.kind !== 'note' ? '<button class="btn btn-soft btn-sm" data-act="verify">' + (rec.verifyStatus === 'verified' ? 'Re-verify' : 'Verify integrity') + '</button>' : '') +
          '<button class="btn btn-outline btn-sm" data-act="open">Details</button>' +
          '<button class="icon-btn danger" data-act="delete" aria-label="Remove ' + CA.escape(rec.name) + '" style="width:34px;height:34px"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></svg></button>' +
          '</div></div></article>';
      }).join('') + '</div>';
    }
    updateStats();
  }

  function updateStats() {
    const files = records.filter(function (r) { return r.kind !== 'note'; });
    const verified = files.filter(function (r) { return r.verifyStatus === 'verified'; }).length;
    const checks = records.reduce(function (s, r) { return s + (r.verifyCount || 0); }, 0);
    const size = records.reduce(function (s, r) { return s + (r.size || 0); }, 0);
    document.getElementById('statRecords').textContent = records.length;
    document.getElementById('statSize').textContent = CA.fmtBytes(size);
    document.getElementById('statVerified').textContent = verified + ' / ' + files.length;
    document.getElementById('statChecks').textContent = checks;
    const pct = files.length ? Math.round(100 * verified / files.length) : 0;
    CA.ring(document.getElementById('vaultRing'), {
      value: pct, size: 150, stroke: 12, label: 'verified', suffix: '%',
      color: pct === 100 && files.length ? '#438B70' : '#514078'
    });
  }

  /* ------------------------------------------------------------ add flow */
  function addModal(options) {
    const opts = options || {};
    const file = opts.file || null;
    const isNote = opts.note === true;
    const today = new Date().toISOString().slice(0, 10);
    const preview = file && file.type.startsWith('image/')
      ? '<img src="' + URL.createObjectURL(file) + '" alt="Selected file preview" style="width:100%;max-height:180px;object-fit:cover;border-radius:14px;margin-bottom:16px">'
      : '';

    CA.modal(
      '<h3 id="modalTitle" style="margin-bottom:6px">' + (isNote ? 'Add a text note' : 'Add evidence record') + '</h3>' +
      '<p class="tiny mb-16">' + (file ? CA.escape(file.name) + ' · ' + CA.fmtBytes(file.size) : 'Describe what you observed. No file is attached.') + '</p>' +
      preview +
      '<form id="evidenceForm">' +
      '<div class="field"><label class="field-label" for="evName">Record name</label>' +
      '<input class="input" id="evName" required maxlength="120" value="' + CA.escape(opts.name || (file ? file.name : 'Observation note')) + '"></div>' +
      '<div class="field"><label class="field-label" for="evDesc">Description</label>' +
      '<textarea class="textarea" id="evDesc" style="min-height:88px" maxlength="1000" placeholder="What does this record show?">' + CA.escape(opts.description || '') + '</textarea></div>' +
      '<div class="input-row"><div class="field"><label class="field-label" for="evDate">Incident date</label>' +
      '<input class="input" type="date" id="evDate" value="' + (opts.incidentDate || today) + '"></div>' +
      '<div class="field"><label class="field-label" for="evUrls">Related URLs</label>' +
      '<input class="input" id="evUrls" maxlength="600" placeholder="https://…" value="' + CA.escape(opts.urls || '') + '"></div></div>' +
      '<div class="field"><label class="field-label" for="evNotes">Notes</label>' +
      '<textarea class="textarea" id="evNotes" style="min-height:70px" maxlength="1500" placeholder="Context, who supplied it, anything to remember.">' + CA.escape(opts.notes || '') + '</textarea></div>' +
      '<div class="notice notice-warning mb-16" style="font-size:.78rem"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>' +
      '<div>This record is stored unencrypted in this browser. Do not store intimate images, identity documents or anything highly sensitive here.</div></div>' +
      '<label class="check-line mb-16"><input type="checkbox" id="evConsent"><span>I understand this is local demonstration storage, not an encrypted vault, and this record contains nothing intimate or highly sensitive.</span></label>' +
      '<div id="evProgress" hidden style="margin-bottom:16px"><div class="flex justify-between tiny mb-0"><span id="evProgressLabel">Computing SHA-256 fingerprint…</span></div><div class="progress-track mt-8"><div class="progress-fill" id="evProgressBar" style="width:12%"></div></div></div>' +
      '<div class="flex gap-12"><button type="button" class="btn btn-outline" style="flex:1" data-modal-close>Cancel</button>' +
      '<button type="submit" class="btn btn-primary" style="flex:1" id="evSave">' + (isNote ? 'Save note' : 'Fingerprint & save') + '</button></div>' +
      '</form>',
      function (body) {
        body.querySelector('#evidenceForm').addEventListener('submit', async function (e) {
          e.preventDefault();
          if (!body.querySelector('#evConsent').checked) { CA.toast('Please confirm the storage notice first.', 'warning'); return; }
          const saveBtn = body.querySelector('#evSave');
          saveBtn.disabled = true;
          const progress = body.querySelector('#evProgress');
          const bar = body.querySelector('#evProgressBar');
          progress.hidden = false;
          bar.style.width = '30%';

          const rec = {
            id: 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
            name: body.querySelector('#evName').value.trim() || 'Untitled record',
            description: body.querySelector('#evDesc').value.trim(),
            incidentDate: body.querySelector('#evDate').value,
            urls: body.querySelector('#evUrls').value.trim(),
            notes: body.querySelector('#evNotes').value.trim(),
            kind: isNote ? 'note' : 'file',
            type: file ? file.type : 'text/note',
            size: file ? file.size : (isNote ? new Blob([body.querySelector('#evNotes').value]).size : 0),
            blob: file || null,
            hash: null,
            verifyStatus: 'pending',
            verifyCount: 0,
            lastVerified: null,
            createdAt: Date.now()
          };

          try {
            if (file) {
              body.querySelector('#evProgressLabel').textContent = 'Reading file…';
              const buffer = await file.arrayBuffer();
              bar.style.width = '62%';
              body.querySelector('#evProgressLabel').textContent = 'Computing SHA-256 fingerprint…';
              await new Promise(function (r) { setTimeout(r, CA.reducedMotion ? 0 : 380); });
              rec.hash = await sha256(buffer);
              bar.style.width = '100%';
              body.querySelector('#evProgressLabel').textContent = 'Fingerprint complete';
            }
            await put(rec);
            records.push(rec);
            await new Promise(function (r) { setTimeout(r, CA.reducedMotion ? 0 : 320); });
            CA.closeModal();
            render();
            CA.toast(file ? 'Evidence stored and fingerprinted locally.' : 'Note saved to your local vault.', 'success');
          } catch (err) {
            saveBtn.disabled = false;
            progress.hidden = true;
            CA.toast(err.message || 'Could not save the record.', 'error');
          }
        });
      }
    );
  }

  function addSample() {
    const text = 'CYBERAURA demonstration evidence record\n' +
      '---------------------------------------\n' +
      'Incident: impersonation using photographs (fictional sample)\n' +
      'Captured: profile URL, handle and message thread\n' +
      'This file contains no real personal data. It exists so the SHA-256\n' +
      'fingerprint and integrity verification flow can be demonstrated safely.\n';
    const file = new File([text], 'sample-impersonation-record.txt', { type: 'text/plain' });
    addModal({
      file: file,
      name: 'Sample impersonation record',
      description: 'Fictional demonstration record showing a captured profile URL and message thread. Contains no real personal data.',
      urls: 'https://example.com/fictional-profile',
      notes: 'Created by the Try Demo flow so integrity verification can be shown safely.'
    });
  }

  function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) { CA.toast('That file is larger than 10 MB. Choose a smaller demonstration file.', 'error'); return; }
    addModal({ file: file });
  }

  /* -------------------------------------------------------------- verify */
  async function verifyRecord(rec, cardEl) {
    if (!rec.blob) { CA.toast('This record has no file to verify.', 'warning'); return; }
    const btn = cardEl ? cardEl.querySelector('[data-act="verify"]') : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }
    try {
      const buffer = await rec.blob.arrayBuffer();
      const current = await sha256(buffer);
      const match = current === rec.hash;
      rec.verifyStatus = match ? 'verified' : 'failed';
      rec.verifyCount = (rec.verifyCount || 0) + 1;
      rec.lastVerified = Date.now();
      rec.lastComputed = current;
      await put(rec);
      render();
      if (match) {
        CA.toast('Integrity verified — the file is byte-for-byte identical to the original fingerprint.', 'success');
        if (document.body.dataset.auth === '1') {
          try { await CA.api('/api/impact/integrity', { method: 'POST', body: {} }); } catch (err) { /* counter is non-critical */ }
        }
      } else {
        CA.toast('Mismatch detected — this file no longer matches its original fingerprint.', 'error', 8000);
      }
    } catch (err) {
      CA.toast('Verification failed: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Verify integrity'; }
    }
  }

  /* -------------------------------------------------------------- detail */
  function openDetail(rec) {
    const kind = kindOf(rec);
    const preview = (kind === 'image' && rec.blob)
      ? '<img src="' + URL.createObjectURL(rec.blob) + '" alt="Preview of ' + CA.escape(rec.name) + '" style="width:100%;max-height:220px;object-fit:cover;border-radius:16px;margin-bottom:18px">'
      : '';
    CA.modal(
      '<h3 id="modalTitle" style="margin-bottom:4px;word-break:break-word">' + CA.escape(rec.name) + '</h3>' +
      '<p class="tiny mb-16">' + kind + ' · ' + CA.fmtBytes(rec.size) + ' · added ' + CA.fmtDateTime(new Date(rec.createdAt).toISOString()) + '</p>' +
      preview +
      '<div class="flex flex-col gap-12 mb-16">' +
      (rec.description ? '<div><span class="tiny">Description</span><p style="font-size:.9rem;margin-top:3px">' + CA.escape(rec.description) + '</p></div>' : '') +
      '<div class="grid-2"><div><span class="tiny">Incident date</span><p style="font-size:.9rem;margin-top:3px">' + CA.fmtDate(rec.incidentDate) + '</p></div>' +
      '<div><span class="tiny">Verification status</span><div style="margin-top:5px">' + verifyBadge(rec) + '</div></div></div>' +
      (rec.urls ? '<div><span class="tiny">Related URLs</span><p style="font-size:.85rem;margin-top:3px;word-break:break-all">' + CA.escape(rec.urls) + '</p></div>' : '') +
      (rec.notes ? '<div><span class="tiny">Notes</span><p style="font-size:.88rem;margin-top:3px;white-space:pre-wrap">' + CA.escape(rec.notes) + '</p></div>' : '') +
      '</div>' +
      (rec.hash ? '<div class="mb-16"><span class="tiny">SHA-256 fingerprint</span><div class="hash-box mt-8"><span class="hash-text mono" style="white-space:normal;word-break:break-all">' + rec.hash + '</span>' +
        '<button class="icon-btn" data-act="copy" aria-label="Copy fingerprint" style="width:30px;height:30px"><svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 9h11v11H9V9z"/><path d="M5 15H4V4h11v1"/></svg></button></div>' +
        fingerprintBars(rec.hash) + '</div>' : '') +
      (rec.lastVerified ? '<p class="tiny mb-16">Last checked ' + CA.fmtDateTime(new Date(rec.lastVerified).toISOString()) + ' · ' + (rec.verifyCount || 0) + ' check' + (rec.verifyCount === 1 ? '' : 's') + ' performed.</p>' : '') +
      '<div class="notice notice-info mb-16" style="font-size:.78rem"><div>A matching fingerprint confirms the file is unchanged since capture. It does not confirm that the content is authentic or that an allegation is true.</div></div>' +
      '<div class="flex gap-12 wrap">' +
      (rec.kind !== 'note' ? '<button class="btn btn-primary" data-act="verify-detail">Verify integrity</button>' +
        '<button class="btn btn-outline" data-act="compare">Compare with a local file</button>' : '') +
      '<button class="btn btn-ghost" data-act="delete-detail">Remove record</button>' +
      '<input type="file" id="compareInput" hidden>' +
      '</div>',
      function (body) {
        const copyBtn = body.querySelector('[data-act="copy"]');
        if (copyBtn) copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(rec.hash).then(function () { CA.toast('Fingerprint copied.', 'success'); },
            function () { CA.toast('Clipboard unavailable in this browser.', 'warning'); });
        });
        const vBtn = body.querySelector('[data-act="verify-detail"]');
        if (vBtn) vBtn.addEventListener('click', async function () {
          vBtn.disabled = true; vBtn.textContent = 'Verifying…';
          await verifyRecord(rec, null);
          CA.closeModal();
        });
        const cBtn = body.querySelector('[data-act="compare"]');
        const cInput = body.querySelector('#compareInput');
        if (cBtn) cBtn.addEventListener('click', function () { cInput.click(); });
        if (cInput) cInput.addEventListener('change', async function () {
          const file = cInput.files[0];
          if (!file) return;
          cBtn.disabled = true; cBtn.textContent = 'Comparing…';
          try {
            const hash = await sha256(await file.arrayBuffer());
            if (hash === rec.hash) CA.toast('The selected file matches the stored fingerprint exactly.', 'success');
            else CA.toast('The selected file does not match the stored fingerprint.', 'error', 8000);
          } catch (err) { CA.toast('Comparison failed: ' + err.message, 'error'); }
          cBtn.disabled = false; cBtn.textContent = 'Compare with a local file';
        });
        body.querySelector('[data-act="delete-detail"]').addEventListener('click', async function () {
          CA.closeModal();
          await deleteRecord(rec);
        });
      }
    );
  }

  /* -------------------------------------------------------------- delete */
  async function deleteRecord(rec) {
    const ok = await CA.confirm({
      title: 'Remove this record?',
      message: '"' + rec.name + '" will be deleted from this browser. You can undo this for a few seconds afterwards.',
      confirmLabel: 'Remove record'
    });
    if (!ok) return;
    await remove(rec.id);
    records = records.filter(function (r) { return r.id !== rec.id; });
    render();
    pendingDelete = rec;
    const region = document.getElementById('toastRegion');
    const el = document.createElement('div');
    el.className = 'toast info';
    el.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></svg>' +
      '<div style="flex:1">Record removed. <button class="btn btn-soft btn-sm" style="margin-top:8px" data-undo>Undo</button></div>';
    region.appendChild(el);
    const timer = setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 320); pendingDelete = null; }, 7000);
    el.querySelector('[data-undo]').addEventListener('click', async function () {
      clearTimeout(timer);
      if (pendingDelete) {
        await put(pendingDelete);
        records.push(pendingDelete);
        pendingDelete = null;
        render();
        CA.toast('Record restored.', 'success');
      }
      el.remove();
    });
  }

  /* ---------------------------------------------------------------- boot */
  document.addEventListener('DOMContentLoaded', async function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    try {
      db = await openDB();
      records = (await getAll()) || [];
      render();
    } catch (err) {
      document.getElementById('vaultList').innerHTML = '<div class="notice notice-danger"><div>' + CA.escape(err.message) + '</div></div>';
      return;
    }

    dropzone.addEventListener('click', function () { fileInput.click(); });
    dropzone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', function () { handleFile(fileInput.files[0]); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove('is-over'); });
    });
    dropzone.addEventListener('drop', function (e) { handleFile(e.dataTransfer.files[0]); });

    document.getElementById('addSample').addEventListener('click', addSample);
    document.getElementById('addNote').addEventListener('click', function () { addModal({ note: true }); });

    document.getElementById('vaultSearch').addEventListener('input', CA.debounce(function (e) { query = e.target.value.trim(); render(); }, 180));
    document.getElementById('vaultSort').addEventListener('change', function (e) { sort = e.target.value; render(); });
    document.getElementById('vaultFilters').addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#vaultFilters .chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      filter = chip.dataset.filter;
      render();
    });

    document.getElementById('vaultList').addEventListener('click', function (e) {
      const card = e.target.closest('.evidence-card');
      if (!card) return;
      const rec = records.find(function (r) { return r.id === card.dataset.id; });
      if (!rec) return;
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'verify') verifyRecord(rec, card);
      else if (act.dataset.act === 'open') openDetail(rec);
      else if (act.dataset.act === 'delete') deleteRecord(rec);
    });

    document.getElementById('exportManifest').addEventListener('click', function () {
      if (!records.length) { CA.toast('There are no records to export yet.', 'warning'); return; }
      const manifest = {
        application: 'CYBERAURA Evidence Vault',
        exported: new Date().toISOString(),
        notice: 'Browser-local demonstration manifest. A SHA-256 fingerprint confirms file integrity only, not the truth of any allegation.',
        records: records.map(function (r) {
          return { name: r.name, kind: r.kind, type: r.type, size: r.size, sha256: r.hash, incident_date: r.incidentDate,
                   description: r.description, urls: r.urls, notes: r.notes, verification_status: r.verifyStatus,
                   checks: r.verifyCount || 0, added: new Date(r.createdAt).toISOString() };
        })
      };
      CA.download('cyberaura-evidence-manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
      CA.toast('Manifest exported. Files themselves stay on this device.', 'success');
    });

    document.getElementById('clearVault').addEventListener('click', async function () {
      if (!records.length) { CA.toast('The vault is already empty.', 'info'); return; }
      const ok = await CA.confirm({
        title: 'Clear the entire vault?',
        message: 'All ' + records.length + ' records will be permanently deleted from this browser. This cannot be undone.',
        confirmLabel: 'Delete everything'
      });
      if (!ok) return;
      await clear();
      records = [];
      render();
      CA.toast('Vault cleared.', 'success');
    });
  });
})();