/* =========================================================================================
   sjCalculatorLaunch.js

   ✅ 2026-06-12 🧮 [SJ-CALC-PASS5-LAUNCH-01]
   Shared launcher/return helper for the standalone Sourjoe calculator session.
   - Opens sjCalculators.html in the same tab.
   - Sends the invoking URL + scroll position as explicit return parameters.
   - Restores the source page scroll position after the calculator session exits.
   ========================================================================================= */
(function (window, document) {
  'use strict';

  if (!window || !document) return;

  var LAUNCH_TOKEN_KEY = 'SJ_CALC_LAUNCH_TOKEN';
  var FALLBACK_ALLOWED_SOURCE_HOSTS = [
    'app.sourjoe.com',
    'stage.sourjoe.com',
    'sourjoe.com',
    'www.sourjoe.com',
    'book.sourjoe.com',
    'sourjoe.w3spaces.com',
    'bookqa.sourjoe.com',
    'sjqa.w3spaces.com'
  ];

  function hostOf(urlText) {
    try { return new URL(urlText, window.location.href).hostname.toLowerCase(); }
    catch (e) { return ''; }
  }

  function isAllowedSourceHost(host) {
    if (window.SJ_ENV && typeof window.SJ_ENV.isApprovedCalculatorHost === 'function') {
      return window.SJ_ENV.isApprovedCalculatorHost(host);
    }
    return FALLBACK_ALLOWED_SOURCE_HOSTS.indexOf(String(host || '').toLowerCase()) !== -1;
  }

  function getCalculatorBaseUrl() {
    if (window.SJ_ENV && typeof window.SJ_ENV.calculatorUrl === 'function') {
      return window.SJ_ENV.calculatorUrl();
    }

    var host = (window.location.hostname || '').toLowerCase();

    // QA/STAGE surfaces should launch the QA calculator shell.
    if (host === 'stage.sourjoe.com') return 'https://bookqa.sourjoe.com/sjCalculators.html';
    if (host === 'bookqa.sourjoe.com') return 'https://bookqa.sourjoe.com/sjCalculators.html';
    if (host === 'sjqa.w3spaces.com') return 'https://bookqa.sourjoe.com/sjCalculators.html';

    // PROD public/app/book surfaces should launch the PROD calculator shell.
    if (host === 'sourjoe.com') return 'https://book.sourjoe.com/sjCalculators.html';
    if (host === 'www.sourjoe.com') return 'https://book.sourjoe.com/sjCalculators.html';
    if (host === 'app.sourjoe.com') return 'https://book.sourjoe.com/sjCalculators.html';
    if (host === 'book.sourjoe.com') return 'https://book.sourjoe.com/sjCalculators.html';
    if (host === 'sourjoe.w3spaces.com') return 'https://book.sourjoe.com/sjCalculators.html';

    // Local/fallback path is useful only during development; the calculator shell itself
    // still enforces the allowed opener/return-host rule.
    return './sjCalculators.html';
  }


  function isPublicPreviewSurface() {
    var body = document.body;
    var host = (window.location.hostname || '').toLowerCase();
    var path = (window.location.pathname || '').toLowerCase();

    // Public preview p.html carries the sjp-* markers; the full book/app does not.
    if (body && body.classList && body.classList.contains('sjp-guided-cues')) return true;
    if (document.querySelector && document.querySelector('.sjp-public-welcome')) return true;
    if (path.endsWith('/p.html') || path.endsWith('/p0.html') || path === '/p') return true;

    // ✅ 2026-06-16 🧮 [SJP-PUBLIC-ROOT-CALC-LAUNCH-01]
    // sourjoe.com often serves the public preview from the root URL, not /p.html.
    // Treat that root surface as public preview so calculator-shell locking remains active.
    if ((host === 'sourjoe.com' || host === 'www.sourjoe.com') && (path === '/' || path === '')) return true;

    return false;
  }

  function currentScrollY() {
    // ✅ 30Jun26e 🧮 [SJP-CALC-LAUNCH-LOCKED-SCROLL-01] ROOT CAUSE FIX:
    // The Unit Convertor link lives inside the Calculator List TOC drawer
    // (#TOC-calculator-content in p.html). To click it, that drawer must already be open,
    // which means sjLockPageScroll() has already pinned <body> with position:fixed —
    // and while that's active, window.scrollY always reads 0 (the body isn't actually
    // scrolled anymore; it's frozen in place and visually offset via the `top` CSS property).
    // This is why currentScrollY() always returned 0 for the Unit Convertor launch even when
    // the visitor had genuinely scrolled down: when scroll is locked, the real position lives
    // in sjScrollLockY (set by sjDrawerScripts.js), not window.scrollY.
    if (typeof window.sjScrollLocked !== 'undefined' && window.sjScrollLocked
        && typeof window.sjScrollLockY === 'number' && window.sjScrollLockY > 0) {
      return Math.max(0, Math.round(window.sjScrollLockY));
    }
    return Math.max(0, Math.round(window.scrollY || window.pageYOffset || 0));
  }

  function cleanReturnParamsFromCurrentUrl() {
    var u;
    try { u = new URL(window.location.href); }
    catch (e) { return; }

    var changed = false;
    ['sjCalcReturn', 'sjReturnY'].forEach(function (key) {
      if (u.searchParams.has(key)) {
        u.searchParams.delete(key);
        changed = true;
      }
    });

    if (changed && window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState({}, document.title, u.toString());
    }
  }

  function restoreCalculatorReturnScroll() {
    var u;
    try { u = new URL(window.location.href); }
    catch (e) { return; }

    if (u.searchParams.get('sjCalcReturn') !== '1') return;

    var y = parseInt(u.searchParams.get('sjReturnY') || '0', 10);
    if (!Number.isFinite(y) || y < 0) y = 0;

    cleanReturnParamsFromCurrentUrl();

    function restore() {
      try { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); }
      catch (e) { window.scrollTo(0, y); }
    }

    // ✅ 02Jul26 🧮 [SJP-CALC-RETURN-COORDINATE-02]
    // Public Unit Convertor returns are coordinated by p.js: it opens the Calculator List
    // while the return page is still held hidden, then reveals it at the saved position.
    // A late second scroll correction would fight the drawer's body lock and reintroduce the
    // visible top-of-page snap, so leave the coordinated path to that single owner.
    var coordinatedReturn = !!(window.__sjpCalcReturnInfo
      && window.__sjpCalcReturnInfo.isCalcReturn
      && window.__sjpCalcReturnInfo.reopenToc);
    if (coordinatedReturn) {
      window.__sjpCalcReturnScrollY = y;
      return;
    }

    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 400);
  }

  window.sjLaunchCalculators = function sjLaunchCalculators(event, calculatorId) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var currentUrl = window.location.href;
    var currentHost = hostOf(currentUrl);

    if (!isAllowedSourceHost(currentHost)) {
      console.warn('Sourjoe calculator launch blocked from unapproved host:', currentHost);
      return false;
    }

    var target = new URL(getCalculatorBaseUrl(), window.location.href);
    var launchToken = '';
    try {
      launchToken = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
      sessionStorage.setItem(LAUNCH_TOKEN_KEY, launchToken);
    } catch (e) {}

    // ✅ 30Jun26d: clear the pre-paint-hide consumed flag so the NEXT return from this new
    // session correctly re-triggers the hide-until-restored behavior in p.html's head script.
    try { sessionStorage.removeItem('SJ_CALC_PREPAINT_CONSUMED'); } catch (e) {}

    target.searchParams.set('returnUrl', currentUrl);
    target.searchParams.set('returnY', String(currentScrollY()));
    target.searchParams.set('sourceHost', currentHost);
    if (isPublicPreviewSurface()) {
      target.searchParams.set('sjPublicPreview', '1');
      target.searchParams.set('sjLaunchSurface', 'public');
    }
    if (launchToken) target.searchParams.set('launchToken', launchToken);

    if (calculatorId) {
      target.searchParams.set('calc', String(calculatorId));
    }

    window.location.href = target.toString();
    return false;
  };

  window.sjHandleCalculatorReturn = restoreCalculatorReturnScroll;

  // ✅ 30Jun26d 🧮 [SJP-CALC-PREPAINT-REVEAL-01]
  // Companion to the inline <head> hide in p.html (SJP-CALC-PREPAINT-HIDE-01). That script
  // hides <html> as early as possible if a calculator return is detected, so the browser never
  // paints a visible top-of-page frame before scroll restore runs. This script tag sits near
  // the bottom of <body>, so by the time it executes the DOM/layout already exists — apply the
  // sessionStorage-based restore pass immediately (synchronously, before this IIFE returns),
  // THEN reveal. This collapses the old "flash at top, then jump to position" into a single
  // already-correct visible frame.
  (function revealAfterFirstRestore() {
    try {
      // ✅ 30Jun30g [SJP-CALC-CROSSORIGIN-RETURN-01] Prefer the value captured synchronously
      // in p.html's <head> script (window.__sjpCalcReturnInfo) — it's immune to later URL
      // stripping. Fall back to re-parsing the URL, then sessionStorage, for safety.
      var stored;
      if (window.__sjpCalcReturnInfo && window.__sjpCalcReturnInfo.isCalcReturn && window.__sjpCalcReturnInfo.returnY > 0) {
        stored = String(window.__sjpCalcReturnInfo.returnY);
      }
      if (stored === undefined) {
        try {
          var urlY = new URLSearchParams(window.location.search).get('sjReturnY');
          if (urlY !== null) stored = urlY;
        } catch (e) {}
      }
      if (stored === undefined) {
        try { stored = sessionStorage.getItem('SJ_CALC_SAVED_Y') || sessionStorage.getItem('SJ_CALC_RETURN_Y'); } catch (e) {}
      }
      var y = parseInt(stored || '0', 10);
      if (Number.isFinite(y) && y > 0) {
        try { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); }
        catch (e) { window.scrollTo(0, y); }
      }
      // ✅ Mark the pre-paint return state as consumed for this load. The saved Y remains
      // available as a legacy fallback, but coordinated public returns use the head-captured URL.
      try { sessionStorage.setItem('SJ_CALC_PREPAINT_CONSUMED', '1'); } catch (e) {}
    } catch (e) {
    }

    // Do not reveal a coordinated public return here. p.js opens the Calculator List at the
    // saved Y first, then removes p.html's holding class on the following animation frame.
    if (!(window.__sjpCalcReturnInfo
        && window.__sjpCalcReturnInfo.isCalcReturn
        && window.__sjpCalcReturnInfo.reopenToc)) {
      try { document.documentElement.style.visibility = 'visible'; } catch (e) {}
    }
  }());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreCalculatorReturnScroll, { once: true });
  } else {
    restoreCalculatorReturnScroll();
  }

  // ✅ 30Jun26h [SJP-CALC-RESTORE-CONSOLIDATE-01] Removed the window 'load' listener that used
  // to call restoreCalculatorReturnScroll() a second time here. cleanReturnParamsFromCurrentUrl()
  // strips sjCalcReturn/sjReturnY from the URL on the very first call above (which always fires
  // before 'load'), so restoreCalculatorReturnScroll()'s early-return guard made this call a
  // guaranteed no-op in every case — it never restored anything, just added noise.

  // ✅ 26Jun26f 🧮 [SJP-CALC-RETURN-SESSIONSTORAGE-01]
  // When the browser restores p.html from BFCache after calculator exit (history.back()),
  // DOMContentLoaded does not re-fire. Listen on pageshow with event.persisted=true
  // and read the scroll position from sessionStorage (stored by sjCalculatorShell.js
  // before history.back()). This avoids a full page reload while still landing at
  // the Calculator chapter position.
  var CALC_RETURN_KEY = 'SJ_CALC_RETURN_Y';
  window.addEventListener('pageshow', function (e) {
    // Always try URL-based restore first (covers direct navigation return)
    restoreCalculatorReturnScroll();

    // ✅ 29Jun26e: read on all pageshow (full-nav return from public preview)
    if (true || e.persisted) {
      var stored;
      try { stored = sessionStorage.getItem(CALC_RETURN_KEY); } catch (_) {}
      if (stored !== null && stored !== undefined) {
        try { sessionStorage.removeItem(CALC_RETURN_KEY); } catch (_) {}
        var y = parseInt(stored, 10);
        if (Number.isFinite(y) && y > 0) {
          function restoreFromStorage() {
            try { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); }
            catch (_) { window.scrollTo(0, y); }
          }
          // ✅ 30Jun26h [SJP-CALC-RESTORE-CONSOLIDATE-01] Trimmed from 5 passes down to 3.
          // Unlike the public-preview path, this BFCache path has no earlier pre-paint restore
          // to rely on, so the immediate call still matters here. rAF catches next-frame
          // settling; the single 400ms pass is a late safety net for slow-loading content.
          restoreFromStorage();
          window.requestAnimationFrame(restoreFromStorage);
          window.setTimeout(restoreFromStorage, 400);
        }
      }
    }
  });

})(window, document);
