/* =========================================================================================
   sjCalculatorShell.js

   ✅ 2026-06-12 🧮 [SJ-CALC-PASS5-SHELL-JS-01]
   Controller for standalone sjCalculators.html.
   ========================================================================================= */
(function (window, document) {
  'use strict';

  if (!window || !document) return;

  // NOTE (2026-06-30 cleanup): The diagnostic "Diagnostics" button/popup and the
  // capture-phase delegated [data-sjcalc-exit] click handler that used to live here have
  // been removed. Root cause of the wireControls() "not firing" mystery (Phase 5 handoff
  // Section 3): that delegated handler was registered on `document` with useCapture=true,
  // and called exitCalculatorSession(), which calls event.stopPropagation(). Because that
  // ran during the CAPTURE phase (before the event reached the button), it stopped the
  // event before it could ever reach the real wireControls() listener bound directly on
  // the button. The real binding was never broken — it was being pre-empted on every click.
  // With the diagnostic listener gone, wireControls() below is the sole exit handler again.

  var AUTH_KEY = 'SJ_CALC_AUTHED_FROM_APPROVED_SURFACE';
  var DEV_BYPASS_KEY = 'SJ_CALC_DEV_BYPASS';
  var FALLBACK_ALLOWED_HOSTS = [
    'app.sourjoe.com',
    'stage.sourjoe.com',
    'sourjoe.com',
    'www.sourjoe.com',
    'book.sourjoe.com',
    'sourjoe.w3spaces.com',
    'bookqa.sourjoe.com',
    'sjqa.w3spaces.com'
  ];

  var CALCULATORS = {
    unitConvertor: 'Unit Conversion Calculator',
    bakersMathCalculator: "Baker's Math Calculator",
    leavenCalculator: 'Leaven Calculator',
    breadHydrationCalculator: 'Bread Recipe Hydration Calculator',
    riseTimeCalculator: 'Rise Time Calculator',
    riseFactorCalculator: 'Rise Factor Calculator',
    ddtCalculator: 'Desired Dough Temperature (DDT) Calculator',
    desiredWaterTemperatureCalculator: 'Desired Water Temperature Calculator'
  };

  var PUBLIC_UNLOCKED_CALCULATOR = 'unitConvertor';
  var PUBLIC_LOCKED_PREVIEW_DURATION_MS = 12000;
  var publicPreviewMode = false;
  var returnHref = '';
  var returnY = 0;
  var allowed = false;
  var activePublicCalcPreview = null;


  // Lightweight legacy Rabbit Hole toggle used by the calculator HTML fragments.
  // sjMathScripts.js enhances this at DOMContentLoaded by pinning calculator panels
  // to the viewport and adding the internal X button.
  if (typeof window.toggleRabbitHole !== 'function') {
    window.toggleRabbitHole = function toggleRabbitHole(buttonID, panelID) {
      var btn = document.getElementById(buttonID);
      var panel = document.getElementById(panelID);
      if (!panel) return false;

      var isOpen = panel.style.display !== 'none' && window.getComputedStyle(panel).display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
      if (btn) btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      return false;
    };
  }


  function $(id) { return document.getElementById(id); }

  function hostFromUrl(urlText) {
    try { return new URL(urlText, window.location.href).hostname.toLowerCase(); }
    catch (e) { return ''; }
  }

  function isAllowedHost(host) {
    if (window.SJ_ENV && typeof window.SJ_ENV.isApprovedCalculatorHost === 'function') {
      return window.SJ_ENV.isApprovedCalculatorHost(host);
    }
    return FALLBACK_ALLOWED_HOSTS.indexOf(String(host || '').toLowerCase()) !== -1;
  }

  function getAllowedReturnCandidate(value) {
    if (!value) return null;
    try {
      var u = new URL(value, window.location.href);
      return isAllowedHost(u.hostname) ? u : null;
    } catch (e) {
      return null;
    }
  }

  function originStartsWithAllowedHost(urlText) {
    if (!urlText) return false;
    var ref = String(urlText || '').toLowerCase();
    if (window.SJ_ENV && typeof window.SJ_ENV.isApprovedCalculatorOrigin === 'function') {
      return window.SJ_ENV.isApprovedCalculatorOrigin(ref);
    }
    return FALLBACK_ALLOWED_HOSTS.some(function (host) {
      return ref.indexOf('https://' + host) === 0 || ref.indexOf('http://' + host) === 0;
    });
  }

  function getModeParam() {
    try {
      return (new URLSearchParams(window.location.search || '').get('sjmode') || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }


  function isPublicPreviewSourceUrl(urlText) {
    if (!urlText) return false;
    try {
      var u = new URL(urlText, window.location.href);
      var host = (u.hostname || '').toLowerCase();
      var path = (u.pathname || '').toLowerCase();

      if (path.endsWith('/p.html') || path.endsWith('/p0.html') || path === '/p') return true;

      // ✅ 2026-06-16 🧮 [SJCALC-PUBLIC-ROOT-SOURCE-01]
      // The canonical public site can launch calculators from https://sourjoe.com/ itself.
      // Referrer/return checks must therefore recognize the root URL as public preview too.
      if ((host === 'sourjoe.com' || host === 'www.sourjoe.com') && (path === '/' || path === '')) return true;

      return false;
    } catch (e) {
      return false;
    }
  }

  function readPublicPreviewMode(params) {
    if (params && params.get('sjPublicPreview') === '1') return true;
    if (isPublicPreviewSourceUrl(params ? params.get('returnUrl') : '')) return true;
    if (isPublicPreviewSourceUrl(document.referrer || '')) return true;
    return false;
  }

  function isLockedInPublicPreview(id) {
    return publicPreviewMode && id && id !== PUBLIC_UNLOCKED_CALCULATOR;
  }

  function publicLockMessage(id) {
    var label = CALCULATORS[id] || 'That calculator';
    return label + ' is available inside the full Sourjoe app. This preview gives a brief veiled look at the calculator, then returns to the Calculator List.';
  }

  function ensurePublicLockNotice() {
    var toc = $('sjcalcTocCard');
    var list = toc ? toc.querySelector('.sjcalc-shell-list') : null;
    var notice = $('sjcalcPublicLockNotice');
    if (!notice && toc && list) {
      notice = document.createElement('div');
      notice.id = 'sjcalcPublicLockNotice';
      notice.className = 'sjcalc-public-lock-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.hidden = true;
      toc.insertBefore(notice, list);
    }
    return notice;
  }

  function ensurePublicPreviewVeil() {
    var veil = $('sjcalcPublicPreviewVeil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'sjcalcPublicPreviewVeil';
      veil.className = 'sjcalc-public-preview-veil';
      veil.setAttribute('aria-hidden', 'true');
      document.body.appendChild(veil);
    }
    return veil;
  }

  function ensurePublicPreviewNotice() {
    var notice = $('sjcalcPublicPreviewNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'sjcalcPublicPreviewNotice';
      notice.className = 'sjcalc-public-preview-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.hidden = true;
      document.body.appendChild(notice);
    }
    return notice;
  }

  function renderPublicPreviewNotice(id, secondsLeft) {
    var notice = ensurePublicPreviewNotice();
    var label = CALCULATORS[id] || 'Calculator';
    notice.innerHTML = '';

    var topLine = document.createElement('div');
    topLine.className = 'sjcalc-public-preview-notice__topline';

    var message = document.createElement('div');
    message.className = 'sjcalc-public-preview-notice__message';
    message.textContent = label + ' is a locked full-app calculator. This is a brief veiled preview.';
    topLine.appendChild(message);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sjcalc-public-preview-notice__close';
    closeBtn.textContent = 'Close';
    closeBtn.setAttribute('aria-label', 'Close this calculator preview now');
    closeBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      finishPublicCalculatorPreview('manual');
    });
    topLine.appendChild(closeBtn);

    var countdown = document.createElement('div');
    countdown.className = 'sjcalc-public-preview-notice__countdown';
    countdown.textContent = 'Preview closes in ' + secondsLeft + ' seconds';

    notice.appendChild(topLine);
    notice.appendChild(countdown);
    notice.hidden = false;
  }

  function updatePublicPreviewCountdown(secondsLeft) {
    var notice = $('sjcalcPublicPreviewNotice');
    var countdown = notice ? notice.querySelector('.sjcalc-public-preview-notice__countdown') : null;
    if (countdown) countdown.textContent = 'Preview closes in ' + secondsLeft + ' seconds';
  }

  function clearPublicPreviewTimers() {
    if (!activePublicCalcPreview) return;
    clearInterval(activePublicCalcPreview.intervalId);
    clearTimeout(activePublicCalcPreview.timeoutId);
  }

  function finishPublicCalculatorPreview(reason) {
    if (!activePublicCalcPreview) return false;

    clearPublicPreviewTimers();
    activePublicCalcPreview = null;

    var veil = $('sjcalcPublicPreviewVeil');
    var notice = $('sjcalcPublicPreviewNotice');
    var toc = $('sjcalcTocCard');
    var workspace = $('sjcalcWorkspace');
    var backBtn = $('sjcalcBackToList');

    if (veil) veil.classList.remove('sjcalc-public-preview-veil--visible');
    if (notice) notice.hidden = true;
    document.documentElement.classList.remove('sjcalc-public-calculator-preview-active');
    if (document.body) document.body.classList.remove('sjcalc-public-calculator-preview-active-body');

    // ✅ 26Jun26d 🧮 [SJP-CALC-SHELL-PUBLIC-FINISH-01]
    // In public preview mode, when a timed/manual locked preview ends, return to the
    // calling page (p.html) instead of showing the intermediate Calculator List.
    if (publicPreviewMode) {
      exitCalculatorSession(null);
      return false;
    }

    hideAllCalculatorSections();
    if (toc) toc.hidden = false;
    if (workspace) workspace.hidden = true;
    if (backBtn) backBtn.hidden = true;

    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch (e) { window.scrollTo(0, 0); }

    return false;
  }

  function startPublicCalculatorPreview(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var section = $(id);
    if (!section) {
      var notice = ensurePublicLockNotice();
      if (notice) {
        notice.innerHTML = '<strong>Locked preview.</strong> ' + publicLockMessage(id);
        notice.hidden = false;
      }
      return false;
    }

    if (activePublicCalcPreview) finishPublicCalculatorPreview('switch');

    var inlineNotice = $('sjcalcPublicLockNotice');
    if (inlineNotice) inlineNotice.hidden = true;

    var toc = $('sjcalcTocCard');
    var workspace = $('sjcalcWorkspace');
    var backBtn = $('sjcalcBackToList');
    var veil = ensurePublicPreviewVeil();

    hideAllCalculatorSections();
    makeRabbitLaunchersVisible(section);
    resetVisibleRabbitPanels(section);

    section.classList.add('sjcalc-shell-active');
    if (toc) toc.hidden = true;
    if (workspace) workspace.hidden = false;
    if (backBtn) backBtn.hidden = false;

    document.documentElement.classList.add('sjcalc-public-calculator-preview-active');
    if (document.body) document.body.classList.add('sjcalc-public-calculator-preview-active-body');
    veil.classList.add('sjcalc-public-preview-veil--visible');

    var startedAt = Date.now();
    var totalSeconds = Math.ceil(PUBLIC_LOCKED_PREVIEW_DURATION_MS / 1000);
    renderPublicPreviewNotice(id, totalSeconds);

    activePublicCalcPreview = {
      id: id,
      intervalId: null,
      timeoutId: null
    };

    activePublicCalcPreview.intervalId = setInterval(function () {
      if (!activePublicCalcPreview || activePublicCalcPreview.id !== id) return;
      var elapsed = Date.now() - startedAt;
      var remaining = Math.max(0, Math.ceil((PUBLIC_LOCKED_PREVIEW_DURATION_MS - elapsed) / 1000));
      updatePublicPreviewCountdown(remaining);
    }, 250);

    activePublicCalcPreview.timeoutId = setTimeout(function () {
      finishPublicCalculatorPreview('timeout');
    }, PUBLIC_LOCKED_PREVIEW_DURATION_MS);

    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch (e) { window.scrollTo(0, 0); }

    return false;
  }

  function showPublicLockNotice(id, event) {
    return startPublicCalculatorPreview(id, event);
  }

  function applyPublicPreviewMode() {
    if (!publicPreviewMode) return;

    document.documentElement.classList.add('sjcalc-public-preview');
    if (document.body) document.body.classList.add('sjcalc-public-preview-body');

    var note = document.querySelector('#sjcalcTocCard .sjcalc-shell-note');
    if (note) {
      note.textContent = 'Public preview: the Unit Convertor is active. Clock-marked calculators open as brief veiled previews; Sign In or Sign Up for full access.';
    }

    // ✅ 29Jun26e 🧮 [SJP-CALC-SHELL-PUBLIC-BACKBTN-02]
    // Hide back button entirely in public preview; X is the only close control.
    var backBtn = $('sjcalcBackToList');
    if (backBtn) { backBtn.hidden = true; }
    // Retitle bar so it reads as a live demo
    var barSpan = document.querySelector('.sjcalc-shell-logo span');
    if (barSpan) barSpan.textContent = 'Sourjoe — Unit Convertor Live Demo';

    ensurePublicLockNotice();

    document.querySelectorAll('[data-sjcalc-open]').forEach(function (btn) {
      var id = btn.getAttribute('data-sjcalc-open');
      if (!isLockedInPublicPreview(id)) {
        btn.classList.add('sjcalc-shell-live-demo');
        return;
      }

      var label = (btn.textContent || '').replace(/^\s*🔒\s*/, '').trim();
      btn.classList.add('sjcalc-shell-locked');
      btn.setAttribute('aria-disabled', 'false');
      btn.setAttribute('title', 'Timed preview: Sign In or Sign Up for full access');
      btn.innerHTML = '<span class="sjcalc-shell-locked-label">' + label + '</span><span class="sjcalc-shell-lock" aria-hidden="true">🕒</span>';
    });
  }

  function refreshDevBypassFromUrl() {
    var mode = getModeParam();
    try {
      if (mode === 'dev') {
        sessionStorage.setItem(DEV_BYPASS_KEY, '1');
      } else if (mode === 'prod') {
        sessionStorage.removeItem(DEV_BYPASS_KEY);
      }
    } catch (e) {}
    return mode;
  }

  function isDevBypassEnabled() {
    refreshDevBypassFromUrl();
    try { return sessionStorage.getItem(DEV_BYPASS_KEY) === '1'; }
    catch (e) { return false; }
  }

  function getFallbackHome() {
    var host = (window.location.hostname || '').toLowerCase();
    if (host === 'stage.sourjoe.com') return 'https://stage.sourjoe.com/recipes';
    if (host === 'app.sourjoe.com') return 'https://app.sourjoe.com/recipes';
    if (window.SJ_ENV && window.SJ_ENV.isPublicHost && typeof window.SJ_ENV.publicUrl === 'function') return window.SJ_ENV.publicUrl('');
    if (window.SJ_ENV && typeof window.SJ_ENV.bookUrl === 'function') return window.SJ_ENV.bookUrl('');
    if (host === 'bookqa.sourjoe.com' || host === 'sjqa.w3spaces.com') return 'https://bookqa.sourjoe.com';
    return 'https://book.sourjoe.com';
  }

  function readLaunchContext() {
    var params = new URLSearchParams(window.location.search || '');
    var currentHost = (window.location.hostname || '').toLowerCase();
    publicPreviewMode = readPublicPreviewMode(params);
    var sourceHost = (params.get('sourceHost') || '').toLowerCase();

    // 2026-06-12 Pass5b: Mirror the sjLearn.html gate.
    // The shell may run only on approved Sourjoe hosts. It opens when launched
    // from an approved Sourjoe referrer, or when the current tab/session has
    // already been authorized, or when ?sjmode=dev is explicitly enabled.
    if (!isAllowedHost(currentHost)) return false;

    if (isDevBypassEnabled()) {
      allowed = true;
    } else {
      try {
        allowed = sessionStorage.getItem(AUTH_KEY) === '1';
      } catch (e) {
        allowed = false;
      }

      if (!allowed && originStartsWithAllowedHost(document.referrer || '')) {
        allowed = true;
        // Public preview launches should not authorize a later direct full-suite calculator session.
        // Full app/book launches can still store the same-tab authorization marker.
        if (!publicPreviewMode) {
          try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
        }
      }

      // ✅ 2026-06-16 🧮 [SJCALC-PUBLIC-ROOT-AUTH-01]
      // Some public-root launches can arrive with a stripped referrer.  Permit the shell only
      // when the launcher explicitly marked the session as PUBLIC PREVIEW, so spoofed params
      // cannot unlock the full calculator suite.
      if (!allowed && publicPreviewMode && isAllowedHost(sourceHost)) {
        allowed = true;
      }
    }

    if (!allowed) return false;

    // These values are now optional fallbacks only. Normal exit behavior uses
    // browser history / opener, just like sjLearn.html.
    var returnUrl = getAllowedReturnCandidate(params.get('returnUrl')) || getAllowedReturnCandidate(document.referrer || '');
    returnHref = returnUrl ? returnUrl.toString() : '';

    returnY = parseInt(params.get('returnY') || '0', 10);
    if (!Number.isFinite(returnY) || returnY < 0) returnY = 0;

    return true;
  }

  function showBlocked() {
    var session = $('sjcalcSession');
    var blocked = $('sjcalcBlocked');
    if (session) session.hidden = true;
    if (blocked) blocked.hidden = false;
  }

  var CALC_RETURN_KEY = 'SJ_CALC_RETURN_Y';

  function exitCalculatorSession(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Match sjLearn.html: if this was opened in a separate tab/window, focus the
    // opener and try to close the calculator tab.
    if (window.opener && !window.opener.closed) {
      try { window.opener.focus(); } catch (e) {}
      try { window.close(); } catch (e) {}
      return false;
    }

    // ✅ 29Jun26e 🧮 [SJP-CALC-SHELL-EXIT-PUBLIC-01]
    // Public preview: always navigate directly to returnHref (history.back fails in incognito)
    // ✅ 30Jun30g 🧮 [SJP-CALC-CROSSORIGIN-RETURN-01] ROOT CAUSE FIX:
    // sessionStorage CANNOT cross origins (e.g. bookqa.sourjoe.com -> sjqa.w3spaces.com are
    // different origins). Every value written here via sessionStorage.setItem was invisible
    // the instant the browser landed on returnHref's origin. Pass the same data through the
    // URL query string instead — the only hand-off mechanism that survives a cross-origin
    // navigation. sessionStorage writes are kept as a same-origin fallback/no-op-safe extra,
    // but the URL params are now the source of truth that the return page actually reads.
    if (publicPreviewMode) {
      if (returnY > 0) {
        try { sessionStorage.setItem(CALC_RETURN_KEY, String(returnY)); } catch (e) {}
        try { sessionStorage.setItem('SJ_CALC_SAVED_Y', String(returnY)); } catch (e) {}
      }
      try { sessionStorage.setItem('SJP_CALC_REOPEN_TOC', '1'); } catch (e) {}

      var finalReturnUrl = returnHref || getFallbackHome();
      try {
        var ru = new URL(finalReturnUrl, window.location.href);
        if (returnY > 0) ru.searchParams.set('sjCalcReturn', '1');
        if (returnY > 0) ru.searchParams.set('sjReturnY', String(returnY));
        ru.searchParams.set('sjReopenCalcToc', '1');
        finalReturnUrl = ru.toString();
      } catch (e) {}
      window.location.href = finalReturnUrl;
      return false;
    }

    // ✅ 26Jun26f 🧮 [SJP-CALC-SHELL-EXIT-SESSIONSTORAGE-01]
    // Store the return scroll position in sessionStorage before navigating back.
    // history.back() restores BFCache (no full reload, no entry cloud, no white flash).
    // sjCalculatorLaunch.js reads SJ_CALC_RETURN_Y on pageshow to restore scroll.
    if (returnY > 0) {
      try { sessionStorage.setItem(CALC_RETURN_KEY, String(returnY)); } catch (e) {}
    }

    function isStillInCalculator() {
      var p = (window.location.pathname || '').toLowerCase();
      return p.indexOf('sjcalculators') !== -1 || p.endsWith('sjcalculators.html');
    }

    function fallback() {
      if (returnHref) {
        window.location.href = returnHref;
      } else if (document.referrer && originStartsWithAllowedHost(document.referrer)) {
        window.location.href = document.referrer;
      } else {
        window.location.href = getFallbackHome();
      }
    }

    // Best same-tab behavior: browser Back restores BFCache without a page reload.
    if (window.history.length > 1) {
      var MAX_BACK_STEPS = 8;
      var steps = 0;

      function stepBackUntilExit() {
        if (!isStillInCalculator()) return;

        if (steps >= MAX_BACK_STEPS) {
          fallback();
          return;
        }

        steps++;
        window.history.back();
        window.setTimeout(stepBackUntilExit, 90);
      }

      stepBackUntilExit();
      return false;
    }

    fallback();
    return false;
  }

  function hideAllCalculatorSections() {
    Object.keys(CALCULATORS).forEach(function (id) {
      var section = $(id);
      if (section) section.classList.remove('sjcalc-shell-active');
    });
  }

  function makeRabbitLaunchersVisible(section) {
    if (!section) return;

    section.querySelectorAll('.content-section-moreMsg').forEach(function (node) {
      node.style.display = 'block';
    });

    section.querySelectorAll('.sjRabbitHole-wrap[hidden]').forEach(function (wrap) {
      wrap.removeAttribute('hidden');
    });
  }

  function resetVisibleRabbitPanels(section) {
    if (!section) return;

    section.querySelectorAll('.sjRabbitHole-panel, .sjcalc-rabbit-panel').forEach(function (panel) {
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('sjcalc-rabbit-panel--pinned');
    });

    section.querySelectorAll('.sjRabbitHole-button[aria-expanded="true"]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function showList(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (activePublicCalcPreview) return finishPublicCalculatorPreview('list');

    // ✅ 26Jun26d 🧮 [SJP-CALC-SHELL-PUBLIC-SHOWLIST-01]
    // In public preview mode, "Calculator List" / subMenu icon should return to the
    // calling page (p.html) rather than showing the intermediate list — the list
    // has only one unlocked calculator, making it a confusing dead end for public users.
    if (publicPreviewMode) {
      return exitCalculatorSession(event);
    }

    hideAllCalculatorSections();

    var toc = $('sjcalcTocCard');
    var workspace = $('sjcalcWorkspace');
    var backBtn = $('sjcalcBackToList');

    if (toc) toc.hidden = false;
    if (workspace) workspace.hidden = true;
    if (backBtn) backBtn.hidden = true;

    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch (e) { window.scrollTo(0, 0); }

    return false;
  }

  function showCalculator(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!CALCULATORS[id]) return false;
    if (isLockedInPublicPreview(id)) return showPublicLockNotice(id, event);

    var toc = $('sjcalcTocCard');
    var workspace = $('sjcalcWorkspace');
    var backBtn = $('sjcalcBackToList');
    var section = $(id);

    if (!section) return false;

    hideAllCalculatorSections();
    makeRabbitLaunchersVisible(section);
    resetVisibleRabbitPanels(section);

    section.classList.add('sjcalc-shell-active');
    if (toc) toc.hidden = true;
    if (workspace) workspace.hidden = false;
    if (backBtn) backBtn.hidden = false;

    if (id === 'unitConvertor' && typeof window.sjInitValues === 'function') {
      window.sjInitValues();
    }

    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch (e) { window.scrollTo(0, 0); }

    return false;
  }

  function wireControls() {
    document.querySelectorAll('[data-sjcalc-exit]').forEach(function (btn) {
      btn.addEventListener('click', exitCalculatorSession);
    });

    document.querySelectorAll('[data-sjcalc-back-list]').forEach(function (btn) {
      btn.addEventListener('click', showList);
    });

    document.querySelectorAll('[data-sjcalc-open]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        showCalculator(btn.getAttribute('data-sjcalc-open'), event);
      });
    });

    // Black background is intentionally inert: no click-to-dismiss binding here.
  }

  function boot() {
    if (!readLaunchContext()) {
      showBlocked();
      return;
    }

    wireControls();
    applyPublicPreviewMode();

    var requested = (new URLSearchParams(window.location.search || '')).get('calc') || '';
    // ✅ 29Jun26e 🧮 [SJP-CALC-SHELL-PUBLIC-BOOT-01] Skip list in public preview to avoid flash
    if (publicPreviewMode) {
      showCalculator(CALCULATORS[requested] ? requested : 'unitConvertor');
    } else if (CALCULATORS[requested]) {
      showCalculator(requested);
    } else {
      showList();
    }

    if (typeof window.sjInitValues === 'function') {
      // Seed the Unit Convertor once so its summary fields are sane when first opened.
      try { window.sjInitValues(); } catch (e) {}
    }
  }

  window.sjCalcShellShowList = showList;
  window.sjCalcShellShowCalculator = showCalculator;
  window.sjCalcShellExit = exitCalculatorSession;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})(window, document);
