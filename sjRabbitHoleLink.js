/* ==================================================================================================
   sjRabbitHoleLink.js
   ✅ 2026-03-23 🧩 [SJ-RHL-JS-01] Portable link-opened Rabbit Hole engine

   PURPOSE
   - Reproduce the working "Glossary-style" behavior in a portable, section-agnostic module.
   - Keep assumptions intentionally small:
       1) a trigger points to a panel
       2) trigger + panel belong to an owning item
       3) owning item belongs to an optional group
   - Support BOTH:
       A) Envelope mode (term line + panel behave like one Rabbit Hole card)
       B) Plain mode (trigger opens only the panel)

   CORE FEATURES
   - Click / keyboard trigger handling
   - One-open-at-a-time groups (optional)
   - Singleton veil / overlay (optional per group)
   - ESC to close
   - Scroll opened owner/panel below fixed/sticky headers
   - Deterministic re-positioning on every open
   - Small public API for gradual integration

   MARKUP CONTRACT (minimal)
   - Group:   [data-sjrhl-group]                        (optional but recommended)
   - Item:    [data-sjrhl-item]                         (recommended)
   - Trigger: [data-sjrhl-trigger] + data-sjrhl-target="panelId"
              or aria-controls="panelId"
   - Panel:   [data-sjrhl-panel] id="panelId"

   OPTIONAL GROUP SETTINGS
   - data-sjrhl-single="true|false"                   default true
   - data-sjrhl-overlay="true|false"                  default true
   - data-sjrhl-scroll="owner|panel|none"             default owner
   - data-sjrhl-gap="8"                               default 8
   - data-sjrhl-header-selector="selector list"       default portable fallback selectors

   OPTIONAL ITEM / PANEL CLASSES
   - .sjrhl-item--envelope                              Envelope styling on owner when open
   - .sjrhl-panel--flatten-in-envelope                  Flatten inner panel when owner envelope is open
   - .sjrhl-panel--plain                                Plain standalone panel look
   ================================================================================================== */

(function (window, document) {
  'use strict';

  if (!window || !document) return;

  var MODULE = window.SJRabbitHoleLink || {};

  var DEFAULTS = {
    groupSelector: '[data-sjrhl-group]',
    itemSelector: '[data-sjrhl-item]',
    triggerSelector: '[data-sjrhl-trigger]',
    panelSelector: '[data-sjrhl-panel]',
    openClass: 'sjrhl-open',
    overlayVisibleClass: 'visible',
    overlayId: 'sjrhlOverlay',
    overlayClass: 'sjrhl-overlay',
    single: true,
    overlay: true,
    scroll: 'owner',
    gap: 8,
    headerSelector: '[data-sjrhl-fixed-header], .header-container, .content-section-title'
  };

  var state = {
    initialized: false,
    overlayEl: null,
    scrollLockY: 0,
    backgroundLocked: false,
    activeTrigger: null,
    activePanel: null
  };

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-02] Small utility helpers
     ---------------------------------------------------------------------------------------------- */
  function toBool(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    var v = String(value).trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
    return fallback;
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function isElement(value) {
    return !!(value && value.nodeType === 1);
  }

  function getClosest(el, selector) {
    return isElement(el) ? el.closest(selector) : null;
  }

  function getGroup(el) {
    return getClosest(el, DEFAULTS.groupSelector);
  }

  function getItemFromTrigger(trigger) {
    if (!isElement(trigger)) return null;
    return getClosest(trigger, DEFAULTS.itemSelector);
  }

  function getPanelIdFromTrigger(trigger) {
    if (!isElement(trigger)) return '';
    return (
      trigger.getAttribute('data-sjrhl-target') ||
      trigger.getAttribute('aria-controls') ||
      ''
    ).trim();
  }

  function getPanelFromTrigger(trigger) {
    var panelId = getPanelIdFromTrigger(trigger);
    if (!panelId) return null;
    return document.getElementById(panelId);
  }

  function getItemFromPanel(panel) {
    if (!isElement(panel)) return null;
    return getClosest(panel, DEFAULTS.itemSelector);
  }

  function getTriggerForPanel(panel) {
    if (!isElement(panel) || !panel.id) return null;
    var item = getItemFromPanel(panel);
    var root = item || document;
    return root.querySelector(
      DEFAULTS.triggerSelector + '[data-sjrhl-target="' + cssEscape(panel.id) + '"],' +
      DEFAULTS.triggerSelector + '[aria-controls="' + cssEscape(panel.id) + '"]'
    );
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return String(value).replace(/([ #;?%&,.+*~\':"!^$\[\]()=>|\/])/g, '\\$1');
  }

  function isPanelOpen(panel) {
    if (!isElement(panel)) return false;
    if (panel.hidden) return false;
    var cs = window.getComputedStyle(panel);
    return !!(cs && cs.display !== 'none' && cs.visibility !== 'hidden');
  }

  function getGroupOptions(group) {
    var host = isElement(group) ? group : null;
    return {
      single: toBool(host && host.getAttribute('data-sjrhl-single'), DEFAULTS.single),
      overlay: toBool(host && host.getAttribute('data-sjrhl-overlay'), DEFAULTS.overlay),
      scroll: (host && host.getAttribute('data-sjrhl-scroll')) || DEFAULTS.scroll,
      gap: toNumber(host && host.getAttribute('data-sjrhl-gap'), DEFAULTS.gap),
      headerSelector: (host && host.getAttribute('data-sjrhl-header-selector')) || DEFAULTS.headerSelector
    };
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-03] Fixed/sticky header math
     - Same idea as the working Glossary code, but portable.
     - Counts only fixed/sticky elements occupying the upper viewport band.
     ---------------------------------------------------------------------------------------------- */
  function computeFixedHeaderBottom(selector) {
    var maxBottom = 0;
    var list;

    try {
      list = document.querySelectorAll(selector || DEFAULTS.headerSelector);
    } catch (e) {
      list = [];
    }

    Array.prototype.forEach.call(list, function (el) {
      if (!isElement(el)) return;

      var cs = window.getComputedStyle(el);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return;

      var rect = el.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;
      if (rect.bottom <= 0) return;
      if (rect.top > 220) return;

      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });

    return Math.max(0, Math.ceil(maxBottom));
  }

  function scrollElementBelowFixedHeaders(targetEl, gapPx, selector) {
    if (!isElement(targetEl)) return;

    var gap = toNumber(gapPx, DEFAULTS.gap);

    function pass() {
      try {
        var rect = targetEl.getBoundingClientRect();
        if (!rect) return;

        var desiredTop = computeFixedHeaderBottom(selector) + gap;
        var delta = rect.top - desiredTop;

        if (Math.abs(delta) < 4) return;
        window.scrollBy({ top: delta, behavior: 'smooth' });
      } catch (e) {}
    }

    window.setTimeout(pass, 20);
    window.setTimeout(pass, 150); /* sticky headers sometimes settle after first pass */
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-06-08 🧩 [SJ-RHL-JS-15] Top-pinned modal Rabbit Hole behavior
     - Click-opened plain Rabbit Holes now keep the page position intact.
     - The veil turns on, the panel pins to the top of the viewport, and only the panel content scrolls.
     - The older trigger-alignment helpers remain below for safety/history, but normal open/close no longer
       scrolls the page to line the rabbit icon up with the header band.
     ---------------------------------------------------------------------------------------------- */
  function isSearchingActive() {
    try {
      return !!(typeof window.isSearching !== 'undefined' && window.isSearching);
    } catch (e) {
      return false;
    }
  }

  function isRenderableElement(el) {
    return !!(isElement(el) && el.isConnected && el.getClientRects && el.getClientRects().length > 0);
  }

  function getStrictTriggerTop(trigger, panel, owner, options) {
    var headerSelector = options && options.headerSelector;
    var stickyBottom = getSectionStickyHeaderBottom(owner, panel, headerSelector);
    var gap = Math.max(8, toNumber(options && options.gap, DEFAULTS.gap));
    var viewport = getViewportMetrics();
    return Math.max(viewport.offsetTop + 6, stickyBottom + gap);
  }

  function scheduleStrictTriggerAlignment(trigger, panel, owner, options) {
    if (!isRenderableElement(trigger) || isSearchingActive()) return;

    window.clearTimeout(trigger.__sjrhlAlignTimer1 || 0);
    window.clearTimeout(trigger.__sjrhlAlignTimer2 || 0);
    window.clearTimeout(trigger.__sjrhlAlignTimer3 || 0);
    window.clearTimeout(trigger.__sjrhlAlignTimer4 || 0);
    window.clearTimeout(trigger.__sjrhlAlignTimer5 || 0);

    function syncPinnedPanelAfterAlignment() {
      if (!isElement(panel) || !isPanelOpen(panel) || !shouldUseStrictRabbitAnchoring(panel, options)) return;

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (!isElement(panel) || !isPanelOpen(panel)) return;
          pinPanel(panel, owner, options, trigger);
        });
      });
    }

    function pass() {
      if (!isRenderableElement(trigger) || isSearchingActive()) return;

      try {
        var rect = trigger.getBoundingClientRect();
        if (!rect) return;

        var desiredTop = getStrictTriggerTop(trigger, panel, owner, options);
        var delta = rect.top - desiredTop;

        if (Math.abs(delta) >= 2) {
          /* ✅ 2026-04-12 🧩 [SJ-RHL-JS-13]
             Mobile Safari/Chrome can ignore a deferred scrollBy() once the veil has already
             locked body/html overflow. Do one immediate absolute scroll NOW (before overlay lock),
             then keep the delayed correction passes for sticky/header settling. */
          var currentX = window.pageXOffset || window.scrollX || 0;
          var currentY = window.pageYOffset || window.scrollY || 0;
          var targetY = Math.max(0, Math.round(currentY + delta));
          window.scrollTo(currentX, targetY);
        }

        /* ✅ 2026-04-12 🧩 [SJ-RHL-JS-14]
           On mobile, the trigger can finish aligning AFTER an earlier pin pass already froze the panel.
           Re-pin immediately after each alignment pass so the panel follows the trigger's final top position. */
        syncPinnedPanelAfterAlignment();
      } catch (e) {}
    }

    pass();
    trigger.__sjrhlAlignTimer1 = window.setTimeout(pass, 30);
    trigger.__sjrhlAlignTimer2 = window.setTimeout(pass, 110);
    trigger.__sjrhlAlignTimer3 = window.setTimeout(pass, 240);
    trigger.__sjrhlAlignTimer4 = window.setTimeout(pass, 420);
    trigger.__sjrhlAlignTimer5 = window.setTimeout(pass, 700);
  }

  function shouldUseStrictRabbitAnchoring(panel, options) {
    return !!(isElement(panel) && options && options.overlay && panel.classList.contains('sjrhl-panel--plain'));
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-04] Overlay / veil
     - One singleton veil for the module.
     - Any open group that opted into overlay keeps the veil visible.
     ---------------------------------------------------------------------------------------------- */
  function ensureOverlay() {
    if (state.overlayEl) return state.overlayEl;

    var el = document.getElementById(DEFAULTS.overlayId);
    if (!el) {
      el = document.createElement('div');
      el.id = DEFAULTS.overlayId;
      el.className = DEFAULTS.overlayClass;
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }

    el.addEventListener('click', function () {
      MODULE.closeAll({ restoreTrigger: true });
    });

    function swallowScrollIntent(evt) {
      if (!evt) return;
      if (evt.cancelable) evt.preventDefault();
    }

    el.addEventListener('wheel', swallowScrollIntent, { passive: false });
    el.addEventListener('touchmove', swallowScrollIntent, { passive: false });

    state.overlayEl = el;
    return state.overlayEl;
  }

  function lockBackgroundScroll() {
    if (state.backgroundLocked) return;

    state.backgroundLocked = true;
    document.documentElement.classList.add('sjrhl-scrollLock');
    document.body.classList.add('sjrhl-scrollLockBody');
  }

  function unlockBackgroundScroll() {
    if (!state.backgroundLocked) return;

    document.documentElement.classList.remove('sjrhl-scrollLock');
    document.body.classList.remove('sjrhl-scrollLockBody');
    state.backgroundLocked = false;
  }

  function showOverlay() {
    ensureOverlay().classList.add(DEFAULTS.overlayVisibleClass);
    lockBackgroundScroll();
  }

  function hideOverlay() {
    ensureOverlay().classList.remove(DEFAULTS.overlayVisibleClass);
    unlockBackgroundScroll();
  }

  function updateOverlay() {
    // ✅ 2026-03-24 🧩 [SJ-RHL-JS-08] Search in sjLearn expands Rabbit Holes so their text is searchable.
    // During Search we MUST suppress the sjrhl veil, otherwise Search looks like it launched an overlay.
    try {
      if (typeof window.isSearching !== 'undefined' && window.isSearching) {
        hideOverlay();
        return;
      }
    } catch (e) {}

    var anyOverlayOpen = false;

    document.querySelectorAll(DEFAULTS.groupSelector).forEach(function (group) {
      var options = getGroupOptions(group);
      if (!options.overlay) return;

      if (group.querySelector(DEFAULTS.itemSelector + '.' + DEFAULTS.openClass)) {
        anyOverlayOpen = true;
      }
    });

    if (anyOverlayOpen) showOverlay();
    else hideOverlay();
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-05] Open / close mechanics
     ---------------------------------------------------------------------------------------------- */
  function syncAccessibility(trigger, panel, isOpen) {
    if (isElement(trigger)) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (!trigger.hasAttribute('type') && trigger.tagName === 'BUTTON') {
        trigger.setAttribute('type', 'button');
      }

      /* ✅ 2026-03-24 🧩 [SJ-RHL-JS-09] Mirror host rabbit-icon state explicitly
         - The SourJoe host swaps More/Less rabbit images via CSS.
         - We keep both aria-expanded AND a host-friendly data-rabbit-state in sync so the
           visual icon cannot drift from the actual open/closed state. */
      trigger.setAttribute('data-rabbit-state', isOpen ? 'open' : 'closed');
      trigger.setAttribute('data-sjml-state', isOpen ? 'less' : 'more');
      trigger.setAttribute('aria-label', isOpen ? 'Less...' : 'More...');
    }

    if (isElement(panel)) {
      panel.hidden = !isOpen;
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
  }


  // ✅ 2026-06-08 🧩 [SJ-RHL-JS-22]
  // Add a close X inside top-pinned Rabbit Hole panels so users are not forced to find
  // the original rabbit icon when the panel covers it on small screens.
  function ensurePinnedPanelCloseButton(panel) {
    if (!isElement(panel) || !panel.id) return;

    var existing = panel.querySelector('.sj-rabbit-panel-x[data-sj-rh-close="sjrhl"]');
    if (existing) return;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sj-rabbit-panel-x sjrhl-panel-x';
    closeBtn.setAttribute('data-sj-rh-close', 'sjrhl');
    closeBtn.setAttribute('aria-label', 'Close Rabbit Hole');
    closeBtn.title = 'Close Rabbit Hole';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      closeByPanelId(panel.id, { restoreTrigger: false });
    });

    panel.insertBefore(closeBtn, panel.firstChild);
  }


  function clearPanelModeClasses(panel) {
    if (!isElement(panel)) return;
    panel.classList.remove('sjrhl-open--search', 'sjrhl-panel--pinned');
  }

  function clearPinnedPanelInlineStyles(panel) {
    if (!isElement(panel)) return;
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.width = '';
    panel.style.maxHeight = '';
    panel.style.overflow = '';
    panel.style.margin = '';
    panel.style.webkitOverflowScrolling = '';
  }

  function unpinPanel(panel, owner) {
    if (!isElement(panel)) return;

    window.clearTimeout(panel.__sjrhlPinTimer1 || 0);
    window.clearTimeout(panel.__sjrhlPinTimer2 || 0);
    panel.__sjrhlPinTimer1 = 0;
    panel.__sjrhlPinTimer2 = 0;

    clearPanelModeClasses(panel);
    clearPinnedPanelInlineStyles(panel);
    panel.classList.remove('sjrhl-panel--compactPinned');

    var item = isElement(owner) ? owner : getItemFromPanel(panel);
    if (isElement(item) && item.dataset && item.dataset.sjrhlPinnedMinHeight) {
      item.style.minHeight = '';
      delete item.dataset.sjrhlPinnedMinHeight;
    }
  }

  function isCompactPinnedViewport() {
    try {
      if (window.matchMedia('(max-width: 1100px)').matches) return true;
      if (window.matchMedia('(hover: none) and (pointer: coarse) and (max-width: 1366px)').matches) return true;
    } catch (e) {}

    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    return vw > 0 && vw <= 1100;
  }

  function getPinningSection(item, panel) {
    var base = isElement(item) ? item : panel;
    if (!isElement(base) || !base.closest) return null;
    return base.closest('.content-section') || null;
  }

  function getPinningHost(item, panel) {
    var base = isElement(item) ? item : panel;
    if (!isElement(base) || !base.closest) return null;

    return base.closest('.content-section-moreMsg, .content-section-verbiage, .content-section-style, .content-section') ||
           getPinningSection(item, panel);
  }

  function getElementInnerRect(el) {
    if (!isElement(el)) return null;

    var rect = el.getBoundingClientRect();
    if (!rect) return null;

    var cs = window.getComputedStyle(el);
    var borderLeft = toNumber(cs && cs.borderLeftWidth, 0);
    var borderRight = toNumber(cs && cs.borderRightWidth, 0);

    return {
      left: rect.left + borderLeft,
      right: rect.right - borderRight,
      top: rect.top,
      bottom: rect.bottom,
      width: Math.max(0, rect.width - borderLeft - borderRight),
      height: rect.height
    };
  }

  function getViewportMetrics() {
    var docEl = document.documentElement;
    var vv = window.visualViewport || null;
    var layoutWidth = window.innerWidth || (docEl && docEl.clientWidth) || 0;
    var layoutHeight = window.innerHeight || (docEl && docEl.clientHeight) || 0;
    var height = (vv && vv.height) || layoutHeight;
    var offsetTop = (vv && vv.offsetTop) || 0;

    return {
      // Use the layout viewport for horizontal centering. Some tablet browsers report
      // visualViewport.offsetLeft in landscape, which can shove fixed panels under the right edge.
      width: Math.max(0, Math.round(layoutWidth)),
      height: Math.max(0, Math.round(height)),
      offsetLeft: 0,
      offsetTop: Math.max(0, Math.round(offsetTop))
    };
  }

  // ✅ 2026-06-08 🧩 [SJ-RHL-JS-23]
  // Mobile/tablet browser chrome can cover top-fixed Rabbit Hole controls.
  // Use a larger top clearance for touch/compact viewports so the panel X remains visible.
  function getRabbitSafeTopGap() {
    var touchViewport = false;
    try {
      touchViewport = !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    } catch (e) {}
    try {
      touchViewport = touchViewport || !!(navigator && navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    } catch (e) {}

    return touchViewport ? 56 : 10;
  }

  function getSectionStickyHeaderBottom(item, panel, selector) {
    var maxBottom = computeFixedHeaderBottom(selector);
    var section = getPinningSection(item, panel);

    if (!isElement(section)) return maxBottom;

    var title = section.querySelector('.content-section-title');
    if (!isElement(title)) return maxBottom;

    var rect = title.getBoundingClientRect();
    if (!rect || rect.height <= 0) return maxBottom;

    /* ✅ 2026-03-25 🧩 [SJ-RHL-JS-10] Only treat the section title as the sticky anchor when it is
       actually occupying the upper sticky-header band.
       - On some phones after orientation changes, the title can be far down the viewport while the
         Rabbit Hole re-pin math is running.
       - If we blindly use that deep rect.bottom as the sticky floor, the panel can end up pushed
         off-screen or squeezed to a tiny height.
       - So: only adopt the title bottom when the title is close to the top/header region. */
    var titleNearHeaderBand = (rect.top <= Math.max(220, maxBottom + 80));
    var titleOverlapsTopBand = (rect.bottom > 0);

    if (titleNearHeaderBand && titleOverlapsTopBand && rect.bottom > maxBottom) {
      maxBottom = rect.bottom;
    }

    return Math.max(0, Math.ceil(maxBottom));
  }

  function pinPanel(panel, owner, options, trigger) {
    if (!isElement(panel) || panel.hidden) return;

    var item = isElement(owner) ? owner : getItemFromPanel(panel);
    if (!isElement(item)) return;

    unpinPanel(panel, item);

    /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-16]
       New standard Rabbit Hole geometry:
       - never scroll the page to the rabbit icon;
       - pin the popup to the top of the visible viewport;
       - size the panel from the top pin to the viewport bottom;
       - let only the panel content scroll when its content is taller than the screen. */
    var itemRect = item.getBoundingClientRect();
    var viewport = getViewportMetrics();
    var viewportWidth = viewport.width;
    var viewportHeight = viewport.height;
    var sideGap = 8;
    var topGap = getRabbitSafeTopGap();
    var bottomGap = 12;
    var minPanelHeight = 140;

    var top = Math.round(viewport.offsetTop + topGap);
    var maxHeight = Math.max(minPanelHeight, Math.floor((viewport.offsetTop + viewportHeight - bottomGap) - top));

    /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-24]
       Top-pinned Rabbit Holes now use the shared 940px target width,
       clear mobile/tablet browser chrome, and center against the layout viewport. */
    var width = Math.min(940, viewportWidth - (sideGap * 2));
    width = Math.max(220, width);
    var left = Math.round((viewportWidth - width) / 2);
    left = Math.max(sideGap, Math.min(left, viewportWidth - sideGap - width));

    if (!isFinite(width) || width < 220) {
      width = Math.max(220, viewportWidth - (sideGap * 2));
      left = sideGap;
    }

    if (maxHeight > viewportHeight - (topGap + bottomGap)) {
      maxHeight = Math.max(minPanelHeight, viewportHeight - (topGap + bottomGap));
    }

    item.style.minHeight = Math.ceil(itemRect.height) + 'px';
    item.dataset.sjrhlPinnedMinHeight = '1';

    panel.classList.add('sjrhl-panel--pinned');
    panel.style.position = 'fixed';
    panel.style.top = Math.round(top) + 'px';
    panel.style.left = Math.round(left) + 'px';
    panel.style.width = Math.round(width) + 'px';
    panel.style.maxHeight = Math.round(maxHeight) + 'px';
    panel.style.overflow = 'auto';
    panel.style.margin = '0';
    panel.style.webkitOverflowScrolling = 'touch';
  }

  function schedulePinPanel(panel, owner, options, trigger) {
    if (!isElement(panel)) return;

    window.clearTimeout(panel.__sjrhlPinTimer1 || 0);
    window.clearTimeout(panel.__sjrhlPinTimer2 || 0);
    window.clearTimeout(panel.__sjrhlPinTimer3 || 0);
    window.clearTimeout(panel.__sjrhlPinTimer4 || 0);

    function pass() {
      var searching = false;
      try {
        searching = !!(typeof window.isSearching !== 'undefined' && window.isSearching);
      } catch (e) {
        searching = false;
      }

      if (searching || !isPanelOpen(panel)) return;
      pinPanel(panel, owner, options, trigger);
    }

    panel.__sjrhlPinTimer1 = window.setTimeout(pass, 120);
    panel.__sjrhlPinTimer2 = window.setTimeout(pass, 260);
    panel.__sjrhlPinTimer3 = window.setTimeout(pass, 460);
    panel.__sjrhlPinTimer4 = window.setTimeout(pass, 760);
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-25 🧩 [SJ-RHL-JS-09] Re-pin open Rabbit Holes after mobile/tablet orientation changes
     - On compact viewports, an already-open pinned Rabbit Hole can drift after orientation/viewport changes.
     - Re-using the existing pin math is safer than force-closing the panel.
     ---------------------------------------------------------------------------------------------- */
  function repinOpenPanels() {
    document.querySelectorAll(
      DEFAULTS.panelSelector + '.' + DEFAULTS.openClass + '.sjrhl-panel--pinned'
    ).forEach(function (panel) {
      if (!isElement(panel) || !isPanelOpen(panel)) return;

      var owner = getItemFromPanel(panel);
      var group = getGroup(owner || panel);
      var options = getGroupOptions(group);
      var shouldPin = !!(options && options.overlay) && panel.classList.contains('sjrhl-panel--plain');

      if (!shouldPin) return;
      schedulePinPanel(panel, owner, options);
    });
  }

  function scheduleRepinOpenPanels() {
    window.clearTimeout(state.repinTimer1 || 0);
    window.clearTimeout(state.repinTimer2 || 0);
    window.clearTimeout(state.repinTimer3 || 0);
    window.clearTimeout(state.repinTimer4 || 0);
    window.clearTimeout(state.repinTimer5 || 0);

    state.repinTimer1 = window.setTimeout(repinOpenPanels, 40);
    state.repinTimer2 = window.setTimeout(repinOpenPanels, 180);
    state.repinTimer3 = window.setTimeout(repinOpenPanels, 420);
    state.repinTimer4 = window.setTimeout(repinOpenPanels, 760);
    state.repinTimer5 = window.setTimeout(repinOpenPanels, 1150);
  }

  function setOpenState(item, panel, trigger, shouldOpen, options) {
    if (!isElement(panel)) return;

    var owner = isElement(item) ? item : getItemFromPanel(panel);

    if (owner) {
      owner.classList.toggle(DEFAULTS.openClass, !!shouldOpen);
    }

    panel.classList.toggle(DEFAULTS.openClass, !!shouldOpen);
    syncAccessibility(trigger, panel, !!shouldOpen);

    var searching = isSearchingActive();

    if (!shouldOpen) {
      unpinPanel(panel, owner);
      return;
    }

    if (searching) {
      unpinPanel(panel, owner);
      panel.classList.add('sjrhl-open--search');
      return;
    }

    clearPanelModeClasses(panel);

    var scrollMode = (options && options.scroll) || DEFAULTS.scroll;
    var gap = (options && options.gap);
    var headerSelector = (options && options.headerSelector);
    var shouldPin = shouldUseStrictRabbitAnchoring(panel, options);

    if (shouldPin) {
      /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-17]
         Top-pinned Rabbit Holes must not move the background page. The panel now pins to
         the top of the viewport instead of scrolling the rabbit icon/panel into alignment. */
    } else if (scrollMode === 'owner' && owner) {
      scrollElementBelowFixedHeaders(owner, gap, headerSelector);
    } else if (scrollMode === 'panel') {
      scrollElementBelowFixedHeaders(panel, gap, headerSelector);
    }

    if (shouldPin) {
      ensurePinnedPanelCloseButton(panel);
      schedulePinPanel(panel, owner, options, trigger);
      state.activeTrigger = trigger || getTriggerForPanel(panel) || null;
      state.activePanel = panel;
    }
  }

  function closeItem(item) {
    if (!isElement(item)) return null;

    var panel = item.querySelector(DEFAULTS.panelSelector);
    var trigger = panel ? getTriggerForPanel(panel) : item.querySelector(DEFAULTS.triggerSelector);
    var options = getGroupOptions(getGroup(item));

    setOpenState(item, panel, trigger, false, options);

    if (state.activePanel === panel) {
      state.activePanel = null;
      state.activeTrigger = null;
    }

    return { item: item, panel: panel, trigger: trigger, options: options };
  }

  function closeSiblings(item, panel) {
    var group = getGroup(item || panel);
    if (!isElement(group)) return;

    group.querySelectorAll(DEFAULTS.itemSelector + '.' + DEFAULTS.openClass).forEach(function (openItem) {
      if (item && openItem === item) return;
      closeItem(openItem);
    });
  }

  function toggleTrigger(trigger, forceOpen) {
    if (!isElement(trigger)) return;

    var panel = getPanelFromTrigger(trigger);
    if (!isElement(panel)) return;

    var item = getItemFromTrigger(trigger) || getItemFromPanel(panel);
    var group = getGroup(trigger) || getGroup(panel);
    var options = getGroupOptions(group);
    var currentlyOpen = isPanelOpen(panel);
    var shouldOpen = (typeof forceOpen === 'boolean') ? forceOpen : !currentlyOpen;

    if (shouldOpen && options.single) {
      closeSiblings(item, panel);
    }

    setOpenState(item, panel, trigger, shouldOpen, options);
    updateOverlay();

    /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-18]
       Closing no longer realigns the rabbit icon; page position stays exactly where it was. */
  }

  function openByPanelId(panelId) {
    if (!panelId) return;
    var panel = document.getElementById(panelId);
    if (!isElement(panel)) return;

    var trigger = getTriggerForPanel(panel);
    if (trigger) toggleTrigger(trigger, true);
  }

  function toggleByIds(triggerId, panelId, forceOpen) {
    var trigger = triggerId ? document.getElementById(triggerId) : null;
    if (!isElement(trigger) && panelId) {
      var panel = document.getElementById(panelId);
      trigger = isElement(panel) ? getTriggerForPanel(panel) : null;
    }
    if (trigger) {
      toggleTrigger(trigger, forceOpen);
    }
  }

  function closeByPanelId(panelId, behavior) {
    if (!panelId) return;
    var panel = document.getElementById(panelId);
    if (!isElement(panel)) return;

    var item = getItemFromPanel(panel);
    var closed = item ? closeItem(item) : null;
    updateOverlay();

    /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-19]
       Do not scroll/restore to the trigger after close; background page position is preserved. */
  }

  function closeGroup(groupElOrName) {
    var group = null;

    if (typeof groupElOrName === 'string') {
      group = document.querySelector(DEFAULTS.groupSelector + '[data-sjrhl-group="' + cssEscape(groupElOrName) + '"]');
    } else if (isElement(groupElOrName)) {
      group = groupElOrName;
    }

    if (!isElement(group)) return;

    group.querySelectorAll(DEFAULTS.itemSelector + '.' + DEFAULTS.openClass).forEach(closeItem);
    updateOverlay();
  }

  function closeAll(behavior) {
    var restoreTrigger = state.activeTrigger;
    var restorePanel = state.activePanel;
    var restoreItem = restorePanel ? getItemFromPanel(restorePanel) : null;
    var restoreOptions = getGroupOptions(getGroup(restoreItem || restorePanel || restoreTrigger));

    document.querySelectorAll(DEFAULTS.itemSelector + '.' + DEFAULTS.openClass).forEach(closeItem);
    updateOverlay();

    /* ✅ 2026-06-08 🧩 [SJ-RHL-JS-20]
       Do not scroll/restore to the trigger after close; background page position is preserved. */
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-06] Auto-init + delegated events
     ---------------------------------------------------------------------------------------------- */
  function preparePanels(root) {
    (root || document).querySelectorAll(DEFAULTS.panelSelector).forEach(function (panel) {
      if (!panel.id) return;

      if (!panel.hasAttribute('role')) {
        panel.setAttribute('role', 'region');
      }

      if (!panel.hasAttribute('aria-hidden')) {
        panel.setAttribute('aria-hidden', isPanelOpen(panel) ? 'false' : 'true');
      }

      if (!isPanelOpen(panel)) {
        panel.hidden = true;
      }
    });

    (root || document).querySelectorAll(DEFAULTS.triggerSelector).forEach(function (trigger) {
      var panelId = getPanelIdFromTrigger(trigger);
      var panel = panelId ? document.getElementById(panelId) : null;

      if (!panelId || !isElement(panel)) return;

      trigger.setAttribute('aria-controls', panelId);
      trigger.setAttribute('aria-expanded', isPanelOpen(panel) ? 'true' : 'false');

      if (trigger.tagName !== 'BUTTON' && !trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }

      if (!trigger.hasAttribute('role') && trigger.tagName !== 'BUTTON' && trigger.tagName !== 'A') {
        trigger.setAttribute('role', 'button');
      }
    });
  }

  function onDocumentClick(event) {
    var trigger = getClosest(event.target, DEFAULTS.triggerSelector);
    if (!trigger) return;

    event.preventDefault();
    toggleTrigger(trigger);
  }

  function onDocumentKeydown(event) {
    if (event && event.key === 'Escape') {
      MODULE.closeAll({ restoreTrigger: true });
      return;
    }

    var trigger = getClosest(event.target, DEFAULTS.triggerSelector);
    if (!trigger) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTrigger(trigger);
    }
  }

  function init(root) {
    preparePanels(root || document);
    ensureOverlay();

    if (!state.initialized) {
      document.addEventListener('click', onDocumentClick);
      document.addEventListener('keydown', onDocumentKeydown);
      window.addEventListener('orientationchange', scheduleRepinOpenPanels);
      window.addEventListener('resize', scheduleRepinOpenPanels);

      if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
        window.visualViewport.addEventListener('resize', scheduleRepinOpenPanels);
      }

      state.initialized = true;
    }

    updateOverlay();
  }

  /* ----------------------------------------------------------------------------------------------
     ✅ 2026-03-23 🧩 [SJ-RHL-JS-07] Public API
     ---------------------------------------------------------------------------------------------- */
  MODULE.init = init;
  MODULE.refresh = init;
  MODULE.toggleTrigger = toggleTrigger;
  MODULE.toggleByIds = toggleByIds;
  MODULE.openByPanelId = openByPanelId;
  MODULE.closeByPanelId = closeByPanelId;
  MODULE.closeGroup = closeGroup;
  MODULE.closeAll = closeAll;
  MODULE.computeFixedHeaderBottom = computeFixedHeaderBottom;
  MODULE.scrollElementBelowFixedHeaders = scrollElementBelowFixedHeaders;

  window.SJRabbitHoleLink = MODULE;

  document.addEventListener('DOMContentLoaded', function () {
    init(document);
  });

})(window, document);
