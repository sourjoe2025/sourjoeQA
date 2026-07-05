/*
  Sourjoe | Pass 2D.1 - Public Preview presentation companion
  04 July 2026

  Reads the public controller only. It never starts, pauses, resets, expires, or writes timer state.
*/
(function sjPublicModePresentation() {
  'use strict';

  var POLL_MS = 250;
  var readyTimer = null;
  var renderTimer = null;

  function formatDuration(ms) {
    var remaining = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    var minutes = Math.floor(remaining / 60);
    var seconds = remaining % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function headerHeight() {
    var header = document.querySelector('.header-container');
    return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  }

  function scrollToElement(target) {
    if (!target) return;
    var targetTop = target.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0) - headerHeight() - 14;
    window.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: 'smooth' });
  }

  function openPublicRecipePreview() {
    var preview = document.getElementById('recipeAppPreview');
    if (!preview) return false;

    // Recipe Preview is explicitly declared data-sj-public-preview="free" in sjLearn.html.
    // Opening it through the neutral Section Controller therefore starts no timer and creates no veil.
    if (typeof window.sjOpenSection === 'function') {
      window.sjOpenSection('recipeAppPreview');
    } else {
      scrollToElement(preview);
    }
    return false;
  }

  function configurePublicHeader() {
    var homeLink = document.querySelector('.back-to-recipes-link');
    if (homeLink) {
      homeLink.href = '#recipeAppPreview';
      homeLink.title = 'Open Recipe Preview';
      homeLink.setAttribute('aria-label', 'Open Recipe Preview');
      homeLink.onclick = function (event) {
        if (event) event.preventDefault();
        return openPublicRecipePreview();
      };

      var homeText = homeLink.querySelector('.back-to-recipes-text');
      if (homeText) {
        homeText.textContent = 'RECIPE PREVIEW';
        homeText.classList.add('sjp-public-preview-top-link');
      }
    }

    // Restore the Book's actual Guidance drawer. The former Public orientation modal is no longer used.
    var compass = document.getElementById('sjlTopBookGuideCompass');
    if (compass) {
      compass.title = 'Open Book of Sourjoe Guide';
      compass.setAttribute('aria-label', 'Open Book of Sourjoe Guide');
      compass.onclick = function (event) {
        if (event) event.preventDefault();
        if (typeof window.open_drawer === 'function') {
          window.open_drawer(
            'drawer-left',
            'info',
            document.getElementById('SJL-book-guide-title'),
            document.getElementById('SJL-book-guide-content')
          );
        }
        return false;
      };
    }

    var badge = document.querySelector('#mainTitle .sjp-public-mode-badge');
    if (badge) badge.remove();

    // Search can reveal content routes that have not been given an approved Public-preview policy.
    var search = document.getElementById('search');
    if (search) {
      search.disabled = true;
      search.value = '';
      search.title = 'Search is not available in this guided Public Preview.';
      search.setAttribute('aria-label', 'Search is not available in this guided Public Preview.');
    }

    var searchLauncher = document.getElementById('binocularSearch');
    if (searchLauncher) {
      searchLauncher.onclick = function (event) {
        if (event) event.preventDefault();
        return false;
      };
      searchLauncher.setAttribute('aria-disabled', 'true');
      searchLauncher.title = 'Search is not available in this guided Public Preview.';
    }
  }

  function bindPlansLinks() {
    document.addEventListener('click', function (event) {
      var trigger = event.target && event.target.closest
        ? event.target.closest('[data-sjp-public-ui-action="plans"]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      scrollToElement(document.getElementById('plans'));
    });
  }

  function bindGuidedPreviewAction() {
    document.addEventListener('click', function (event) {
      var trigger = event.target && event.target.closest
        ? event.target.closest('[data-sjp-public-intro-action="essentials"]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      // Begin Guided Preview is orientation navigation only. It reveals the Essentials Chapter
      // without opening Essential Ingredients, so no individual or shared timer starts here.
      scrollToElement(document.getElementById('essentialsIntro'));
    });
  }

  function extractInlineTargetId(element, functionName) {
    if (!element) return '';
    var handler = element.getAttribute('onclick') || '';
    var expression = new RegExp(functionName + '\\s*\\(\\s*[\'\"]([^\'\"]+)[\'\"]', 'i');
    var match = handler.match(expression);
    return match && match[1] ? match[1] : '';
  }

  function appendLiveMarker(target) {
    if (!target || target.getAttribute('data-sjp-public-live-toc') === 'true') return;
    target.setAttribute('data-sjp-public-live-toc', 'true');
    target.classList.add('sjp-public-live-toc-target');

    var marker = document.createElement('span');
    marker.className = 'sjp-public-live-toc-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = 'LIVE';
    target.appendChild(marker);
  }

  function decorateLiveTocLinks() {
    var status = getStatus();
    if (!status || !status.entities) return;

    var liveIds = Object.keys(status.entities);
    document.querySelectorAll('.sjsc-section-list [onclick*="sjOpenSection"], #TOC-calculator-content [onclick*="sjOpenCalculatorDrawer"]').forEach(function (target) {
      var sectionId = extractInlineTargetId(target, 'sjOpenSection');
      var calculatorId = extractInlineTargetId(target, 'sjOpenCalculatorDrawer');
      var entityId = sectionId || calculatorId;
      if (liveIds.indexOf(entityId) === -1) return;
      appendLiveMarker(target);
    });

    // ✅ 2026-07-04 🧭 [SJ-PUBLIC-LIVE-IMAGE-MARKER-01]
    // Culture/Starter/Leaven uses image links rather than a textual Chapter list. Mark only the
    // approved live Starter image with the same gold/LIVE signal used by other Public entry points.
    document.querySelectorAll('.sjsc-culture-image-link[onclick*="sjOpenSection"]').forEach(function (target) {
      var entityId = extractInlineTargetId(target, 'sjOpenSection');
      if (liveIds.indexOf(entityId) === -1) return;
      target.classList.add('sjp-public-live-image-target');
      target.setAttribute('data-sjp-public-live-image', 'true');
    });
  }

  function getStatus() {
    if (!window.SJPublicMode || typeof window.SJPublicMode.getStatus !== 'function') return null;
    try { return window.SJPublicMode.getStatus(); } catch (e) { return null; }
  }

  function setTimerVisible(node, visible) {
    if (node) node.hidden = !visible;
  }

  function entityVisible(id) {
    var element = document.getElementById(id);
    if (!element) return false;
    if (element.matches && element.matches('[data-sjcalc-drawer-section]')) {
      return !!element.closest('.drawer-bottom.active .drawer-content');
    }
    return !element.hidden && element.getAttribute('aria-hidden') !== 'true';
  }

  function timerSlotForEntity(id, entity) {
    var selector = '[data-sjp-entity-timer="' + id + '"]';
    var existing = document.querySelector(selector);
    if (existing) return existing;

    var section = document.getElementById(id);
    if (!section) return null;
    var target = section.querySelector('.content-section-title .center-box') || section.querySelector('.sjsc-special-close-row');
    if (!target) return null;

    var timer = document.createElement('span');
    timer.className = 'sjp-public-entity-timer';
    timer.hidden = true;
    timer.setAttribute('data-sjp-entity-timer', id);
    timer.setAttribute('aria-label', entity.label + ' preview time remaining');
    timer.innerHTML = '<span class="sjp-public-timer__label"></span><span class="sjp-public-timer__value"></span><span class="sjp-public-timer__state"></span>';
    if (target.classList.contains('sjsc-special-close-row')) {
      timer.classList.add('sjp-public-entity-timer--special');
    }
    target.appendChild(timer);
    return timer;
  }

  function renderTopTimer(status) {
    var topTimer = document.getElementById('sjp-public-total-timer');
    var totalLabel = topTimer ? topTimer.querySelector('.sjp-public-timer__label') : null;
    var totalValue = topTimer ? topTimer.querySelector('[data-sjp-total-timer-value]') : null;
    var totalState = topTimer ? topTimer.querySelector('[data-sjp-total-timer-state]') : null;
    var hasStarted = status.entityActive || status.totalElapsedMs > 0 || status.totalExpired;

    setTimerVisible(topTimer, hasStarted);
    if (!topTimer) return;

    topTimer.classList.remove('sjp-public-timer--live', 'sjp-public-timer--paused', 'sjp-public-timer--complete', 'sjp-public-timer--cooldown');

    if (status.totalExpired) {
      if (totalLabel) totalLabel.textContent = 'NEXT PREVIEW IN';
      if (totalValue) totalValue.textContent = formatDuration(status.cooldownRemainingMs);
      if (totalState) totalState.textContent = 'LOCKED';
      topTimer.classList.add('sjp-public-timer--cooldown');
      return;
    }

    if (totalLabel) totalLabel.textContent = 'PUBLIC PREVIEW TIME';
    if (totalValue) totalValue.textContent = formatDuration(status.totalRemainingMs);
    if (totalState) totalState.textContent = status.entityActive ? 'LIVE' : 'PAUSED';
    topTimer.classList.add(status.entityActive ? 'sjp-public-timer--live' : 'sjp-public-timer--paused');
  }

  function renderEntityTimers(status) {
    var entities = status.entities || {};
    Object.keys(entities).forEach(function (id) {
      var entity = entities[id];
      if (!entity || entity.mode !== 'live') return;

      var slot = timerSlotForEntity(id, entity);
      if (!slot) return;

      var label = slot.querySelector('.sjp-public-timer__label');
      var value = slot.querySelector('.sjp-public-timer__value');
      var state = slot.querySelector('.sjp-public-timer__state');
      var started = entity.active || entity.elapsedMs > 0 || entity.expired;
      var visible = entityVisible(id) && started && !status.totalExpired;
      var isLive = entity.active && !entity.expired && !status.totalExpired;
      var isComplete = entity.expired || status.totalExpired;

      setTimerVisible(slot, visible);
      if (label) label.textContent = entity.label.toUpperCase() + ' PREVIEW';
      if (value) value.textContent = formatDuration(entity.remainingMs);
      if (state) state.textContent = isComplete ? 'COMPLETE' : (isLive ? 'LIVE' : 'PAUSED');
      slot.classList.toggle('sjp-public-timer--live', isLive);
      slot.classList.toggle('sjp-public-timer--paused', !isLive && !isComplete);
      slot.classList.toggle('sjp-public-timer--complete', isComplete);
    });
  }

  function renderTimers() {
    var status = getStatus();
    if (!status) return;
    renderTopTimer(status);
    renderEntityTimers(status);
  }

  function initialise() {
    if (!window.SJ_PUBLIC_MODE_ACTIVE || !window.SJPublicMode) return false;
    configurePublicHeader();
    bindPlansLinks();
    bindGuidedPreviewAction();
    decorateLiveTocLinks();
    renderTimers();
    renderTimer = window.setInterval(renderTimers, POLL_MS);
    window.SJPublicModePresentation = Object.freeze({
      active: true,
      version: '20260704_finalpolish2',
      refreshTimers: renderTimers
    });

    // Release the route-specific pre-paint hold only after the policy controller, public header,
    // live markers and timer presentation have all been initialized.
    window.requestAnimationFrame(function () {
      document.documentElement.classList.remove('sj-public-pending');
      document.documentElement.classList.add('sj-public-ready');
    });
    return true;
  }

  function awaitController() {
    if (initialise() && readyTimer) {
      window.clearInterval(readyTimer);
      readyTimer = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', awaitController, { once: true });
  } else {
    awaitController();
  }

  if (!window.SJPublicModePresentation) {
    readyTimer = window.setInterval(awaitController, 50);
    window.setTimeout(function () {
      if (readyTimer) {
        window.clearInterval(readyTimer);
        readyTimer = null;
      }
    }, 5000);
  }
}());
