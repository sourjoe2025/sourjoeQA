/*
  Sourjoe | Pass 2D.1 - Public Preview polish and readable protected veils
  04 July 2026

  Public policy implemented here
  - Free: orientation, Book Welcome, Guidance, TOCs, chapter introductions, sign-in/up, and Plans.
  - One active public item at a time.
  - Six live preview items receive their own one-time allowance.
  - All other managed sections and calculator tools open behind a dark preview veil.
  - Any active public item (live or veiled) consumes the shared seven-minute allowance.
  - The shared allowance pauses when no public item is active.
  - On total expiry, every public item opens in the common conversion state and the header counts down
    the thirty-minute browser cooldown.

  This controller remains presentation/access-flow logic only. It does not write Book-auth state.
*/
(function sjPublicModePreviewInventory() {
  'use strict';

  var PUBLIC_MODE = 'public';
  var STATE_KEY = 'SJ_PUBLIC_MODE_PASS2D_STATE_V1';
  var COOLDOWN_KEY = 'SJ_PUBLIC_MODE_COOLDOWN_UNTIL_V1';
  var QA_CONFIG_KEY = 'SJ_PUBLIC_MODE_PASS2D_QA_CONFIG_V1';
  var QA_HOSTS = ['bookqa.sourjoe.com', 'sjqa.w3spaces.com'];
  var VERSION = '20260704_finalpolish1';
  var DEFAULT_TOTAL_MS = 7 * 60 * 1000;
  var COOLDOWN_MS = 30 * 60 * 1000;
  var tickTimer = null;
  var calculatorHookTimer = null;
  var calculatorDrawerObserver = null;
  var state = null;
  var config = null;
  var calculatorWrapped = false;
  var pendingCalculatorId = '';

  /*
    “Start” in the approved inventory is mapped to the Book's actual “Starter” entity.
    It is deliberately explicit here so the QA handoff can name the visible Book label.
  */
  var LIVE_ENTITIES = {
    essentialsIngredients: { label: 'Essential Ingredients', allowanceMs: 45 * 1000, kind: 'section' },
    leavenStarter: { label: 'Starter', allowanceMs: 45 * 1000, kind: 'section' },
    processMix: { label: 'Initial Mix', allowanceMs: 45 * 1000, kind: 'section' },
    grainsAtoZ: { label: 'Grains A to Z', allowanceMs: 60 * 1000, kind: 'section' },
    recipeFactoids: { label: 'Recipe Facts', allowanceMs: 90 * 1000, kind: 'section' },
    unitConvertor: { label: 'Unit Convertor', allowanceMs: 90 * 1000, kind: 'calculator' }
  };

  function safeNow() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  function isExplicitPublicRoute() {
    try {
      return (new URLSearchParams(window.location.search || '').get('mode') || '').toLowerCase() === PUBLIC_MODE;
    } catch (e) {
      return false;
    }
  }

  function isQaHost() {
    return QA_HOSTS.indexOf((window.location.hostname || '').toLowerCase()) !== -1;
  }

  function safeSessionGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSessionSet(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) {}
  }

  function safeSessionRemove(key) {
    try { window.sessionStorage.removeItem(key); } catch (e) {}
  }

  function safeLocalGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeLocalSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  function safeLocalRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }

  function normaliseDuration(value, fallback) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.max(1000, Math.round(numeric));
  }

  function cloneLiveDurationDefaults() {
    var out = {};
    Object.keys(LIVE_ENTITIES).forEach(function (id) {
      out[id] = LIVE_ENTITIES[id].allowanceMs;
    });
    return out;
  }

  function defaultConfig() {
    return {
      totalMs: DEFAULT_TOTAL_MS,
      entityMsById: cloneLiveDurationDefaults()
    };
  }

  function normaliseConfig(candidate) {
    var base = defaultConfig();
    var next = candidate || {};
    var allOverride = Number(next.entityMs);
    var specific = next.entityMsById && typeof next.entityMsById === 'object' ? next.entityMsById : {};

    base.totalMs = normaliseDuration(next.totalMs, DEFAULT_TOTAL_MS);
    Object.keys(base.entityMsById).forEach(function (id) {
      var fallback = base.entityMsById[id];
      var requested = Object.prototype.hasOwnProperty.call(specific, id) ? specific[id] : allOverride;
      base.entityMsById[id] = normaliseDuration(requested, fallback);
    });
    return base;
  }

  function readQaConfig() {
    if (!isQaHost()) return defaultConfig();
    var raw = safeSessionGet(QA_CONFIG_KEY);
    if (!raw) return defaultConfig();
    try { return normaliseConfig(JSON.parse(raw)); } catch (e) { return defaultConfig(); }
  }

  function writeQaConfig(nextConfig) {
    config = normaliseConfig(nextConfig);
    if (isQaHost()) {
      safeSessionSet(QA_CONFIG_KEY, JSON.stringify(config));
    }
  }

  function newState() {
    return {
      version: VERSION,
      totalElapsedMs: 0,
      entityElapsedById: {},
      entityExpiredById: {},
      activeEntityId: '',
      activeSinceMs: 0,
      totalExpired: false
    };
  }

  function sanitizeState(candidate) {
    var clean = newState();
    if (!candidate || typeof candidate !== 'object') return clean;

    clean.totalElapsedMs = Math.max(0, Number(candidate.totalElapsedMs) || 0);
    clean.totalExpired = candidate.totalExpired === true;

    var elapsed = candidate.entityElapsedById && typeof candidate.entityElapsedById === 'object'
      ? candidate.entityElapsedById
      : {};
    var expired = candidate.entityExpiredById && typeof candidate.entityExpiredById === 'object'
      ? candidate.entityExpiredById
      : {};

    Object.keys(LIVE_ENTITIES).forEach(function (id) {
      clean.entityElapsedById[id] = Math.max(0, Number(elapsed[id]) || 0);
      clean.entityExpiredById[id] = expired[id] === true;
    });

    var active = String(candidate.activeEntityId || '');
    if (getDescriptor(active)) {
      clean.activeEntityId = active;
      clean.activeSinceMs = Math.max(0, Number(candidate.activeSinceMs) || 0);
    }

    return clean;
  }

  function readState() {
    var raw = safeSessionGet(STATE_KEY);
    if (!raw) return newState();
    try { return sanitizeState(JSON.parse(raw)); } catch (e) { return newState(); }
  }

  function saveState() {
    safeSessionSet(STATE_KEY, JSON.stringify(state));
  }

  function getCooldownUntil() {
    var until = Number(safeLocalGet(COOLDOWN_KEY) || 0);
    if (!Number.isFinite(until) || until <= safeNow()) {
      if (until) safeLocalRemove(COOLDOWN_KEY);
      return 0;
    }
    return until;
  }

  function setCooldown() {
    var until = safeNow() + COOLDOWN_MS;
    safeLocalSet(COOLDOWN_KEY, String(until));
    return until;
  }

  function rearmAfterCooldownIfReady() {
    if (!state || !state.totalExpired || getCooldownUntil()) return false;
    state = newState();
    saveState();
    document.querySelectorAll('[data-sjp-public-policy]').forEach(function (element) {
      hidePresentation(element.id);
    });
    return true;
  }

  function formatDuration(ms) {
    var remaining = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    var minutes = Math.floor(remaining / 60);
    var seconds = remaining % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function deriveLabel(section) {
    if (!section) return 'this section';
    var explicit = (section.getAttribute('data-sj-public-label') || '').trim();
    if (explicit) return explicit;
    var title = section.querySelector('.content-section-title .center-box');
    if (title) return title.textContent.replace(/\s+/g, ' ').trim().replace(/\s*(?:×|More|Less).*$/, '') || 'this section';
    return 'this section';
  }

  function isCalculatorElement(element) {
    return !!(element && element.matches && element.matches('[data-sjcalc-drawer-section]'));
  }

  function getDescriptor(id) {
    if (!id) return null;
    if (Object.prototype.hasOwnProperty.call(LIVE_ENTITIES, id)) {
      var live = LIVE_ENTITIES[id];
      return {
        id: id,
        label: live.label,
        mode: 'live',
        kind: live.kind,
        allowanceMs: config && config.entityMsById ? config.entityMsById[id] : live.allowanceMs
      };
    }

    var element = document.getElementById(id);
    if (!element) return null;

    // A Chapter may deliberately expose a complete Public sample.  These Sections still use the
    // neutral managed-section controller, but must never start a local timer, consume the shared
    // preview allowance, receive a veil, or enter the conversion state.
    if (element.getAttribute && element.getAttribute('data-sj-public-preview') === 'free') {
      return { id: id, label: deriveLabel(element), mode: 'free', kind: 'section', allowanceMs: 0 };
    }

    if (element.matches && element.matches('[data-sj-section-parent]')) {
      return { id: id, label: deriveLabel(element), mode: 'veiled', kind: 'section', allowanceMs: 0 };
    }
    if (isCalculatorElement(element)) {
      return { id: id, label: deriveLabel(element), mode: 'veiled', kind: 'calculator', allowanceMs: 0 };
    }

    return null;
  }

  function getEntityElement(id) {
    return document.getElementById(id);
  }

  function isEntityVisible(id) {
    var element = getEntityElement(id);
    if (!element) return false;

    var descriptor = getDescriptor(id);
    if (descriptor && descriptor.kind === 'calculator') {
      return !!element.closest('.drawer-bottom.active .drawer-content');
    }
    return !element.hidden && element.getAttribute('aria-hidden') !== 'true';
  }

  function totalRemainingMs(projectedTotal) {
    return Math.max(0, config.totalMs - (typeof projectedTotal === 'number' ? projectedTotal : state.totalElapsedMs));
  }

  function entityElapsedMs(id, projected) {
    var elapsed = Math.max(0, Number(state.entityElapsedById[id]) || 0);
    if (projected && state.activeEntityId === id && state.activeSinceMs) {
      elapsed += Math.max(0, safeNow() - state.activeSinceMs);
    }
    return elapsed;
  }

  function entityRemainingMs(id, projected) {
    var descriptor = getDescriptor(id);
    if (!descriptor || descriptor.mode !== 'live') return 0;
    return Math.max(0, descriptor.allowanceMs - entityElapsedMs(id, projected));
  }

  function markPublicPolicyHosts() {
    document.querySelectorAll('[data-sj-section-parent], [data-sjcalc-drawer-section]').forEach(function (element) {
      var descriptor = getDescriptor(element.id);
      if (!descriptor) return;
      element.classList.add('sjp-public-policy-host');
      element.classList.toggle('sjp-public-live-entity', descriptor.mode === 'live');
      element.classList.toggle('sjp-public-veiled-entity', descriptor.mode === 'veiled');
      element.classList.toggle('sjp-public-free-entity', descriptor.mode === 'free');
      element.setAttribute('data-sjp-public-policy', descriptor.mode);
    });
  }

  function getPanel(element) {
    return element ? element.querySelector(':scope > .sjp-public-entity-expiry-panel') : null;
  }

  function getVeil(element) {
    return element ? element.querySelector(':scope > .sjp-public-preview-veil') : null;
  }

  // ✅ 2026-07-04 🧭 [SJ-PUBLIC-VEIL-INTERACTION-GUARD-01]
  // Protected content remains visibly scrollable beneath the Public veil, but its reading body is
  // inert. The title bar stays outside this guard so native More/Less and the Section close action
  // remain usable. This also prevents keyboard focus from entering protected links or Rabbit Holes.
  function setVeiledContentInteractivity(element, locked) {
    if (!element || !element.children) return;

    Array.prototype.forEach.call(element.children, function (child) {
      if (!child || !child.matches) return;
      if (child.matches('.content-section-title, .sjsc-special-close-row, .sjp-public-preview-veil, .sjp-public-entity-expiry-panel')) {
        return;
      }

      if (locked) {
        if (!child.hasAttribute('data-sjp-public-prior-inert')) {
          child.setAttribute('data-sjp-public-prior-inert', child.hasAttribute('inert') ? '1' : '0');
        }
        child.setAttribute('inert', '');
      } else if (child.hasAttribute('data-sjp-public-prior-inert')) {
        if (child.getAttribute('data-sjp-public-prior-inert') === '0') {
          child.removeAttribute('inert');
        }
        child.removeAttribute('data-sjp-public-prior-inert');
      }
    });
  }

  function insertAfterAnchor(element, node) {
    var anchor = element.querySelector(':scope > .content-section-title') || element.querySelector(':scope > .sjsc-special-close-row');
    if (anchor && anchor.nextSibling) {
      element.insertBefore(node, anchor.nextSibling);
    } else {
      element.appendChild(node);
    }
  }

  function ensureExpiryPanel(element) {
    if (!element) return null;
    var panel = getPanel(element);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.className = 'sjp-public-entity-expiry-panel';
    panel.setAttribute('aria-live', 'assertive');
    panel.setAttribute('aria-atomic', 'true');
    panel.hidden = true;
    insertAfterAnchor(element, panel);
    return panel;
  }

  function ensureVeil(element) {
    if (!element) return null;
    var veil = getVeil(element);
    if (veil) return veil;

    veil = document.createElement('section');
    veil.className = 'sjp-public-preview-veil';
    // The veil is a visual Public-preview treatment. It deliberately does not add a second
    // screen-reader announcement or block normal document scrolling.
    veil.setAttribute('aria-hidden', 'true');
    veil.hidden = true;
    element.appendChild(veil);
    return veil;
  }

  function layoutVeil(element, veil) {
    if (!element || !veil) return;
    var anchor = element.querySelector(':scope > .content-section-title') || element.querySelector(':scope > .sjsc-special-close-row');
    var top = 0;
    if (anchor) {
      top = Math.max(0, anchor.offsetTop + anchor.offsetHeight);
    }
    veil.style.top = top + 'px';
  }

  function closeEntityFromPanel(id) {
    var descriptor = getDescriptor(id);
    if (!descriptor) return;
    if (descriptor.kind === 'calculator') {
      if (typeof window.close_drawers === 'function') window.close_drawers();
      return;
    }
    if (typeof window.sjCloseSection === 'function') {
      window.sjCloseSection(id);
    }
  }

  function conversionMarkup(kind, descriptor) {
    var isTotal = kind === 'total';
    var title = isTotal
      ? 'Your Public Preview is complete'
      : 'Your ' + descriptor.label + ' preview is complete';
    var body = isTotal
      ? 'This browser\'s Public Preview is paused for 30 minutes. The header shows when your next preview becomes available.'
      : 'This section has reached its preview allowance. Continue with Sourjoe whenever you are ready to keep learning.';

    return ''
      + '<p class="sjp-public-expiry-panel__eyebrow">SOURJOE PUBLIC PREVIEW</p>'
      + '<h3 class="sjp-public-expiry-panel__title">' + title + '</h3>'
      + '<p class="sjp-public-expiry-panel__body">' + body + '</p>'
      + '<div class="sjp-public-expiry-panel__actions">'
      + '  <a class="sjp-public-expiry-panel__button sjp-public-expiry-panel__button--primary" href="https://app.sourjoe.com/register">CREATE ACCOUNT</a>'
      + '  <a class="sjp-public-expiry-panel__button" href="https://app.sourjoe.com/login">MEMBER SIGN IN</a>'
      + '</div>'
      + '<button class="sjp-public-expiry-panel__return" type="button" data-sjp-public-return="true">RETURN TO ' + (descriptor.kind === 'calculator' ? 'CALCULATORS' : 'CHAPTER') + '</button>';
  }

  function veilMarkup(descriptor) {
    // The protected-preview treatment is intentionally quiet. It lets visitors scroll through
    // the full section or calculator shape, while a dark, non-interactive visual veil keeps
    // the readable detail visibly distinct from a live Public preview.
    return ''
      + '<p class="sjp-public-preview-veil__notice">PUBLIC PREVIEW <span aria-hidden="true">•</span> FULL BOOK CONTENT</p>';
  }

  function hidePresentation(id) {
    var element = getEntityElement(id);
    if (!element) return;
    var panel = getPanel(element);
    var veil = getVeil(element);
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    if (veil) {
      veil.hidden = true;
      veil.innerHTML = '';
    }
    setVeiledContentInteractivity(element, false);
    element.classList.remove('sjp-public-entity-expired', 'sjp-public-total-expired');
    element.removeAttribute('data-sjp-public-expiry');
  }

  function showExpiry(id, kind) {
    var descriptor = getDescriptor(id);
    var element = getEntityElement(id);
    if (!descriptor || !element) return;

    var panel = ensureExpiryPanel(element);
    var veil = getVeil(element);
    if (veil) {
      veil.hidden = true;
      veil.innerHTML = '';
    }
    setVeiledContentInteractivity(element, false);

    if (!panel) return;
    panel.innerHTML = conversionMarkup(kind, descriptor);
    panel.hidden = false;
    element.classList.remove('sjp-public-entity-expired', 'sjp-public-total-expired');
    element.classList.add(kind === 'total' ? 'sjp-public-total-expired' : 'sjp-public-entity-expired');
    element.setAttribute('data-sjp-public-expiry', kind);

    var returnButton = panel.querySelector('[data-sjp-public-return="true"]');
    if (returnButton) {
      returnButton.addEventListener('click', function () {
        closeEntityFromPanel(id);
      });
    }
  }

  function showVeil(id) {
    var descriptor = getDescriptor(id);
    var element = getEntityElement(id);
    if (!descriptor || !element) return;

    var veil = ensureVeil(element);
    if (!veil) return;
    var panel = getPanel(element);
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }

    element.classList.remove('sjp-public-entity-expired', 'sjp-public-total-expired');
    element.removeAttribute('data-sjp-public-expiry');
    veil.innerHTML = veilMarkup(descriptor);
    veil.hidden = false;
    setVeiledContentInteractivity(element, true);
    layoutVeil(element, veil);
  }

  function stopTicker() {
    if (tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function startTicker() {
    stopTicker();
    tickTimer = window.setInterval(tick, 500);
  }

  function addElapsedThrough(nowMs) {
    if (!state.activeEntityId || !state.activeSinceMs) return;

    var elapsed = Math.max(0, Number(nowMs) - Number(state.activeSinceMs));
    if (!elapsed) return;

    state.totalElapsedMs += elapsed;
    var descriptor = getDescriptor(state.activeEntityId);
    if (descriptor && descriptor.mode === 'live') {
      state.entityElapsedById[descriptor.id] = (Number(state.entityElapsedById[descriptor.id]) || 0) + elapsed;
    }
    state.activeSinceMs = Number(nowMs);
  }

  function expireEntity(id) {
    var descriptor = getDescriptor(id);
    if (!descriptor || descriptor.mode !== 'live' || state.totalExpired) return;

    state.entityElapsedById[id] = descriptor.allowanceMs;
    state.entityExpiredById[id] = true;
    if (state.activeEntityId === id) {
      state.activeEntityId = '';
      state.activeSinceMs = 0;
    }
    saveState();
    stopTicker();
    showExpiry(id, 'entity');
  }

  function expireTotal(activeId) {
    if (state.totalExpired) return;

    state.totalElapsedMs = config.totalMs;
    state.totalExpired = true;
    var targetId = activeId || state.activeEntityId;
    state.activeEntityId = '';
    state.activeSinceMs = 0;
    saveState();
    // A second tab may have already created the shared cooldown. Do not extend it merely
    // because this tab received the storage event while an item was open.
    if (!getCooldownUntil()) setCooldown();
    stopTicker();
    if (targetId) showExpiry(targetId, 'total');
  }

  function assessExpiryForActive(id) {
    if (state.totalElapsedMs >= config.totalMs) {
      expireTotal(id);
      return true;
    }

    var descriptor = getDescriptor(id);
    if (descriptor && descriptor.mode === 'live' && entityElapsedMs(id, false) >= descriptor.allowanceMs) {
      expireEntity(id);
      return true;
    }
    return false;
  }

  function pauseActiveEntity(options) {
    var opts = options || {};
    var id = state && state.activeEntityId;
    if (!id) return;

    addElapsedThrough(safeNow());
    state.activeEntityId = '';
    state.activeSinceMs = 0;

    if (assessExpiryForActive(id)) return;

    saveState();
    stopTicker();

    if (opts.hideVeil === true) {
      var descriptor = getDescriptor(id);
      if (descriptor && descriptor.mode === 'veiled') hidePresentation(id);
    }
  }

  function closeManagedEntityIfNeeded(id) {
    var descriptor = getDescriptor(id);
    if (!descriptor || descriptor.kind !== 'section' || !isEntityVisible(id)) return;
    if (typeof window.sjCloseSection === 'function') {
      window.sjCloseSection(id);
    }
  }

  function activateEntity(id) {
    rearmAfterCooldownIfReady();
    var descriptor = getDescriptor(id);
    if (!descriptor || !state) return;

    if (state.activeEntityId && state.activeEntityId !== id) {
      var previousId = state.activeEntityId;
      pauseActiveEntity({ hideVeil: true });
      closeManagedEntityIfNeeded(previousId);
    }

    // Fully open Public samples are independent of every timing/conversion rule. Opening one still
    // cleanly pauses and closes a prior timed/veiled entity, but it never becomes the active timer.
    if (descriptor.mode === 'free') {
      hidePresentation(id);
      return;
    }

    if (getCooldownUntil()) {
      state.totalExpired = true;
      state.activeEntityId = '';
      state.activeSinceMs = 0;
      saveState();
      showExpiry(id, 'total');
      return;
    }

    if (state.totalExpired) {
      showExpiry(id, 'total');
      return;
    }

    if (descriptor.mode === 'live' && state.entityExpiredById[id] === true) {
      showExpiry(id, 'entity');
      return;
    }

    hidePresentation(id);
    if (descriptor.mode === 'veiled') showVeil(id);

    state.activeEntityId = id;
    state.activeSinceMs = safeNow();
    saveState();
    startTicker();
  }

  function tick() {
    if (!state) return;

    if (getCooldownUntil()) {
      if (!state.totalExpired && state.activeEntityId) {
        expireTotal(state.activeEntityId);
      }
      return;
    }

    if (!state.activeEntityId) return;
    var id = state.activeEntityId;
    addElapsedThrough(safeNow());
    if (assessExpiryForActive(id)) return;
    saveState();
  }

  function onSectionOpened(event) {
    var detail = event && event.detail ? event.detail : {};
    if (!getDescriptor(detail.sectionId)) return;
    activateEntity(detail.sectionId);
  }

  function onSectionClosed(event) {
    var detail = event && event.detail ? event.detail : {};
    if (state && state.activeEntityId === detail.sectionId) {
      pauseActiveEntity({ hideVeil: true });
    }
  }

  function activeCalculatorIdInDrawer() {
    var drawer = document.querySelector('.drawer-bottom.active .drawer-content');
    if (!drawer) return '';
    var element = drawer.querySelector('[data-sjcalc-drawer-section][id]');
    return element ? element.id : '';
  }

  function waitForCalculatorAndActivate(id, attempts) {
    var maxAttempts = 50;
    var count = Number(attempts) || 0;
    var visibleId = activeCalculatorIdInDrawer();
    if (visibleId === id) {
      pendingCalculatorId = '';
      activateEntity(id);
      return;
    }
    if (count >= maxAttempts) {
      pendingCalculatorId = '';
      return;
    }
    window.setTimeout(function () { waitForCalculatorAndActivate(id, count + 1); }, 30);
  }

  function installCalculatorHook() {
    if (calculatorWrapped || typeof window.sjOpenCalculatorDrawer !== 'function') return;

    var originalOpen = window.sjOpenCalculatorDrawer;
    window.sjOpenCalculatorDrawer = function sjPublicModeCalculatorWrapper(sectionId) {
      var targetId = String(sectionId || '');
      var descriptor = getDescriptor(targetId);

      if (descriptor) {
        if (state && state.activeEntityId && state.activeEntityId !== targetId) {
          var previousId = state.activeEntityId;
          pauseActiveEntity({ hideVeil: true });
          closeManagedEntityIfNeeded(previousId);
        }
        pendingCalculatorId = targetId;
      }

      var result = originalOpen.apply(this, arguments);
      if (descriptor) {
        waitForCalculatorAndActivate(targetId, 0);
      }
      return result;
    };
    calculatorWrapped = true;
  }

  function observeCalculatorDrawer() {
    var drawer = document.querySelector('.drawer-bottom');
    if (!drawer || calculatorDrawerObserver) return;

    calculatorDrawerObserver = new MutationObserver(function () {
      window.setTimeout(function () {
        var visibleId = activeCalculatorIdInDrawer();
        if (visibleId) {
          if (!pendingCalculatorId && (!state.activeEntityId || state.activeEntityId !== visibleId)) {
            activateEntity(visibleId);
          }
          return;
        }
        if (state && state.activeEntityId) {
          var descriptor = getDescriptor(state.activeEntityId);
          if (descriptor && descriptor.kind === 'calculator') {
            pauseActiveEntity({ hideVeil: true });
          }
        }
      }, 0);
    });
    calculatorDrawerObserver.observe(drawer, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  }

  function onVisibilityChange() {
    if (!document.hidden) {
      tick();
      if (state && state.activeEntityId && !state.totalExpired) startTicker();
      document.querySelectorAll('.sjp-public-preview-veil:not([hidden])').forEach(function (veil) {
        layoutVeil(veil.parentElement, veil);
      });
    }
  }

  function onPageHide() {
    // The next document does not preserve a visibly active public entity.
    pauseActiveEntity({ hideVeil: false });
  }

  function onStorage(event) {
    if (!event || event.key !== COOLDOWN_KEY) return;
    if (getCooldownUntil() && state && state.activeEntityId) {
      expireTotal(state.activeEntityId);
    }
  }

  function markDocument() {
    try {
      document.documentElement.classList.add('sj-public-mode');
      document.documentElement.setAttribute('data-sj-mode', PUBLIC_MODE);
    } catch (e) {}
    try {
      document.body.classList.add('sj-public-mode');
      document.body.setAttribute('data-sj-mode', PUBLIC_MODE);
    } catch (e) {}
  }

  function getEntityStatus(id, now) {
    var descriptor = getDescriptor(id);
    if (!descriptor) return null;
    var isActive = state.activeEntityId === id;
    var elapsed = descriptor.mode === 'live'
      ? entityElapsedMs(id, isActive)
      : 0;
    return Object.freeze({
      id: id,
      label: descriptor.label,
      mode: descriptor.mode,
      kind: descriptor.kind,
      active: isActive,
      expired: descriptor.mode === 'live' ? state.entityExpiredById[id] === true : false,
      allowanceMs: descriptor.mode === 'live' ? descriptor.allowanceMs : 0,
      elapsedMs: elapsed,
      remainingMs: descriptor.mode === 'live' ? Math.max(0, descriptor.allowanceMs - elapsed) : 0
    });
  }

  function getStatus() {
    rearmAfterCooldownIfReady();
    var now = safeNow();
    var projectedTotal = state.totalElapsedMs;
    if (state.activeEntityId && state.activeSinceMs) {
      projectedTotal += Math.max(0, now - state.activeSinceMs);
    }

    var cooldownUntil = getCooldownUntil();
    var entities = {};
    Object.keys(LIVE_ENTITIES).forEach(function (id) {
      entities[id] = getEntityStatus(id, now);
    });

    var activeDescriptor = getDescriptor(state.activeEntityId);
    return Object.freeze({
      active: true,
      route: PUBLIC_MODE,
      version: VERSION,
      activeEntityId: state.activeEntityId,
      activeEntityMode: activeDescriptor ? activeDescriptor.mode : '',
      entityActive: !!state.activeEntityId,
      entityExpired: activeDescriptor && activeDescriptor.mode === 'live' ? state.entityExpiredById[activeDescriptor.id] === true : false,
      totalExpired: state.totalExpired === true || !!cooldownUntil,
      totalElapsedMs: projectedTotal,
      totalRemainingMs: state.totalExpired || cooldownUntil ? 0 : Math.max(0, config.totalMs - projectedTotal),
      cooldownUntil: cooldownUntil,
      cooldownRemainingMs: Math.max(0, cooldownUntil - now),
      entities: Object.freeze(entities),
      configuration: Object.freeze({
        totalMs: config.totalMs,
        totalLabel: formatDuration(config.totalMs),
        entityMs: config.entityMsById.essentialsIngredients,
        entityLabel: formatDuration(config.entityMsById.essentialsIngredients),
        entityMsById: Object.freeze(Object.assign({}, config.entityMsById))
      })
    });
  }

  function qaReset(options) {
    if (!isQaHost()) return false;

    var opts = options || {};
    var base = defaultConfig();
    var totalSeconds = Number(opts.totalSeconds);
    var entitySeconds = Number(opts.entitySeconds);
    var entitySecondsById = opts.entitySecondsById && typeof opts.entitySecondsById === 'object'
      ? opts.entitySecondsById
      : {};

    var nextConfig = {
      totalMs: Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds * 1000 : base.totalMs,
      entityMs: Number.isFinite(entitySeconds) && entitySeconds > 0 ? entitySeconds * 1000 : undefined,
      entityMsById: {}
    };
    Object.keys(entitySecondsById).forEach(function (id) {
      var value = Number(entitySecondsById[id]);
      if (Object.prototype.hasOwnProperty.call(LIVE_ENTITIES, id) && Number.isFinite(value) && value > 0) {
        nextConfig.entityMsById[id] = value * 1000;
      }
    });

    var visibleId = '';
    document.querySelectorAll('[data-sj-section-parent], [data-sjcalc-drawer-section]').forEach(function (element) {
      if (!visibleId && isEntityVisible(element.id) && getDescriptor(element.id)) visibleId = element.id;
    });

    stopTicker();
    writeQaConfig(nextConfig);
    state = newState();
    saveState();
    document.querySelectorAll('[data-sjp-public-policy]').forEach(function (element) {
      hidePresentation(element.id);
    });

    if (opts.clearCooldown === true) safeLocalRemove(COOLDOWN_KEY);
    if (visibleId) activateEntity(visibleId);
    return getStatus();
  }

  function qaForceExpiry(kind, id) {
    if (!isQaHost()) return false;
    var targetId = id || state.activeEntityId || 'essentialsIngredients';
    if (kind === 'total') {
      state.totalElapsedMs = config.totalMs;
      expireTotal(targetId);
    } else {
      var descriptor = getDescriptor(targetId);
      if (descriptor && descriptor.mode === 'live') {
        state.entityElapsedById[targetId] = descriptor.allowanceMs;
        expireEntity(targetId);
      }
    }
    return getStatus();
  }

  function buildPublicApi() {
    var api = {
      active: true,
      route: PUBLIC_MODE,
      version: VERSION,
      isActive: function () {
        return isExplicitPublicRoute() && window.SJ_PUBLIC_MODE_ACTIVE === true;
      },
      getStatus: getStatus,
      getPolicy: function () {
        return Object.freeze({
          free: ['orientation', 'welcome', 'guidance', 'tocs', 'chapter introductions', 'plans', 'recipeAppPreview'],
          liveEntityIds: Object.freeze(Object.keys(LIVE_ENTITIES)),
          veiledRule: 'All other managed sections and calculators open behind the protected Public Preview veil.',
          totalRule: 'The shared timer advances while one public item is active and pauses when none is active.'
        });
      }
    };

    if (isQaHost()) {
      api.qa = Object.freeze({
        reset: qaReset,
        forceExpiry: qaForceExpiry,
        clearCooldown: function () {
          safeLocalRemove(COOLDOWN_KEY);
          return getStatus();
        },
        clearState: function () {
          stopTicker();
          safeSessionRemove(STATE_KEY);
          safeSessionRemove(QA_CONFIG_KEY);
          config = defaultConfig();
          state = newState();
          document.querySelectorAll('[data-sjp-public-policy]').forEach(function (element) {
            hidePresentation(element.id);
          });
          return getStatus();
        }
      });
    }

    window.SJPublicMode = Object.freeze(api);
  }

  function initialise() {
    markDocument();
    config = readQaConfig();
    state = readState();
    markPublicPolicyHosts();

    // A fresh document cannot retain an actually open managed section or calculator drawer.
    if (state.activeEntityId && !isEntityVisible(state.activeEntityId)) {
      state.activeEntityId = '';
      state.activeSinceMs = 0;
      saveState();
    }

    buildPublicApi();
    window.addEventListener('sj:section-opened', onSectionOpened);
    window.addEventListener('sj:section-closed', onSectionClosed);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', function () {
      document.querySelectorAll('.sjp-public-preview-veil:not([hidden])').forEach(function (veil) {
        layoutVeil(veil.parentElement, veil);
      });
    });

    calculatorHookTimer = window.setInterval(function () {
      installCalculatorHook();
      observeCalculatorDrawer();
      if (calculatorWrapped && calculatorDrawerObserver) {
        window.clearInterval(calculatorHookTimer);
        calculatorHookTimer = null;
      }
    }, 40);
    window.setTimeout(function () {
      if (calculatorHookTimer) {
        installCalculatorHook();
        observeCalculatorDrawer();
        window.clearInterval(calculatorHookTimer);
        calculatorHookTimer = null;
      }
    }, 4000);

    if (getCooldownUntil() && state.activeEntityId) {
      state.totalExpired = true;
      saveState();
      showExpiry(state.activeEntityId, 'total');
    }

    if (window.console && typeof window.console.info === 'function') {
      window.console.info('Sourjoe Public Mode preview inventory active (Pass 2D).');
    }
  }

  if (!isExplicitPublicRoute() || !window.SJ_PUBLIC_MODE_ACTIVE) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
}());
