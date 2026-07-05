// ✅ 27Jun26d 🧩 [SJP-PHASE1-JS-01] New p.js — lightweight shell JS.
function scrollToTarget(hash, offset, behavior = 'smooth') {
    if (!hash) return; // Ensure hash is valid before proceeding

    // Remove the '#' if it exists; if it's already an ID, this does nothing
    const targetId = hash.startsWith("#") ? hash.slice(1) : hash;
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: behavior, // Use the passed parameter (defaults to 'smooth')
        });
    }
}

function resetAndScroll(targetId, offset = 100, behavior = 'smooth') {
  // =========================================================================================
  // 🧩 [SJ-NAV-JS-RESET-02] 14Feb26 - Make drawer-close + scroll deterministic
  //     Why:
  //       close_drawers() now unlocks scroll *after* the drawer has fully closed and content has
  //       been restored (fixes the "re-scroll on close" issue).
  //     Therefore:
  //       We trigger the scroll only after close completes.
  // =========================================================================================
  close_drawers({
    keepScrollLocked: false,
    onClosed: () => {
      // Temporarily clear the hash (prevents the browser from snapping before our custom scroll)
      history.replaceState(null, "", window.location.pathname + window.location.search);

      // ✅ 26Jun26a 🧩 [SJP-NAV-SCROLL-DELAY-01] / ✅ 26Jun26c 🧩 [SJP-NAV-SCROLL-DELAY-02]
      // 250ms initial delay (up from 150ms) gives lazy-loaded images and collapsed-content
      // reflow enough time to settle before we measure the target position.
      // Second scroll at 500ms catches any remaining late-loading image reflow.
      // Third scroll at 1200ms catches slow-loading images (e.g. Recipe Preview).
      setTimeout(() => {
        scrollToTarget(targetId, offset, behavior);
        setTimeout(() => { scrollToTarget(targetId, offset, 'auto'); }, 500);
        setTimeout(() => { scrollToTarget(targetId, offset, 'auto'); }, 1200);
      }, 250);
    }
  });
}

//TOC links targetting an expandable content element use this function.
//targetId = id of the expandable element's hidden content block (moreMsg).
//offset is distance from top the target scrolls to.
/* ✅ 2026-03-04 🧩 [SJ-REF-SCROLL-01] Reference TOC: compute subsection scroll offset from the sticky section header
   Why:
   - Tools/Grains were landing right on the section-header bottom border.
   - Glossary was landing slightly UNDER the section-header bottom border (header is a bit taller), hiding the target.
   Fix:
   - For Reference subsections only (Glossary/Tools/Grains) compute:
       offset = (sticky header top) + (sticky header height) + (small gap)
   - Leave all other callers (e.g., Breads) unchanged.
*/
function sjRefComputeSubsectionOffset(parentId, gapPx = 6) {
  const parent = document.getElementById(parentId);
  if (!parent) return null;

  const titleBar = parent.querySelector('.content-section-title');
  if (!titleBar) return null;

  // sticky 'top' resolves calc(var(--appTop) + 100px) → px at runtime
  const topPx = parseFloat(getComputedStyle(titleBar).top) || 0;
  const hPx   = Math.ceil(titleBar.getBoundingClientRect().height) || 0; // includes the bottom border
  return topPx + hPx + gapPx;
}

function expandAndScroll(parentId, targetId, offset) {
  clickAllLess('Less...'); // Close previously expanded elements
  setTimeout(() => {
    // Only expand if a valid `parentId` is provided
    if (parentId) {
      clickMoreForId(parentId); // Expand only within the given parent ID
    }
    // If `parentId` is not provided, do nothing (no expansion)
  }, 10); // Small delay for better UI timing

  // ✅ 2026-03-04 🧩 [SJ-REF-SCROLL-01A] Reference subsections: land just BELOW the sticky header border
  let finalOffset = offset;
  if (
    parentId &&
    targetId &&
    parentId !== targetId && // do not affect "top of section" jumps
    (parentId === 'glossaryAtoZ' || parentId === 'toolsAtoZ' || parentId === 'grainsAtoZ') &&
    Number(offset) >= 130    // subsection-style calls (historically 140)
  ) {
    const dyn = sjRefComputeSubsectionOffset(parentId, 6); // "few pixels" breathing room
    if (dyn) finalOffset = dyn;
  }

  resetAndScroll(targetId, finalOffset); // Scroll to target
}

//TOC links targetting non-expandable elements (like all the Intro contents) use this function.
//Passed parameters are simply passed onto resetAndScroll() once all expanded lements are 
//collapsed using clickAllLess().
function collapseAndScroll(targetId, offset = 100) {
  // ✅ 26Jun26b/c/f 🧩 [SJP-COLLAPSE-SCROLL-REFLOW-03]
  clickAllLess('Less...');
  setTimeout(function () { resetAndScroll(targetId, offset); }, 300);
  // ✅ 29Jun26e 🧩 [SJP-COLLAPSE-SCROLL-REFLOW-04] Second pass for Welcome Sign Up first-click
  setTimeout(function () { resetAndScroll(targetId, offset); }, 850);
}
// END of scrolling to target navigation functions.


// --------------------------------------------------------------------------------------------
// 26Jan26 - More/Less button labels: remove "..." and use chevrons (UI) WITHOUT breaking logic
// [SJ-ML-CHV-01] Centralized labels + state helpers (no code should depend on literal button text)
// --------------------------------------------------------------------------------------------

const SJ_MORE_LABEL = 'More \u25BE'; // ▾
const SJ_LESS_LABEL = 'Less \u25B4'; // ▴
const SJ_MORE_ARIA  = 'More';
const SJ_LESS_ARIA  = 'Less';

function sjSetMoreState(btn) {
  if (!btn) return;
  btn.textContent = SJ_MORE_LABEL;
  btn.setAttribute('aria-label', SJ_MORE_ARIA);
  btn.setAttribute('aria-expanded', 'false');
      btn.dataset.sjMlState = 'more';
btn.dataset.sjMlState = 'more';
}

function sjSetLessState(btn) {
  if (!btn) return;
  btn.textContent = SJ_LESS_LABEL;
  btn.setAttribute('aria-label', SJ_LESS_ARIA);
  btn.setAttribute('aria-expanded', 'true');
  btn.dataset.sjMlState = 'less';
}

function sjIsExpanded(btn) {
  if (!btn) return false;
  const a = (btn.getAttribute('aria-expanded') || '').toLowerCase();
  if (a === 'true') return true;
  if (a === 'false') return false;
  // Fallback for legacy markup
  return /^less\b/i.test((btn.textContent || '').trim());
}

function toggleMore(buttonID, msgID, parentID = 'lead-box') {
  const button  = document.getElementById(buttonID);     // More/Less button ID
  const message = document.getElementById(msgID);        // moreMsg ID
  if (!button || !message) return;

  const isHidden = (window.getComputedStyle(message).display === 'none'); // Check for moreMsg display state

  if (isHidden) {
    // Expand
    sjSetLessState(button);
    button.style.backgroundColor = 'rgb(253,193,17)';  // Orange background for "Less"
    button.style.color = 'black';                      // Black font for "Less"
    message.style.display = 'flow-root';  // 🐇 28Jan26 - allow Rabbit Hole halo shadow + contain floats (flow-root)                   // Show moreMsg

    // ✅ 2026-04-28 🧩 [SJ-MORE-SCROLL-01]
    // Match the excellent existing "Less" behaviour: after a user opens a section with
    // More, bring that section header back just below the fixed headers. Search-owned
    // auto-expands must not scroll the page, so keep the same !isSearching guard used below.
    if (!isSearching) { scrollToTarget(parentID, 100); }
  }
  else {
    // Collapse
    sjSetMoreState(button);
    button.style.backgroundColor = 'rgb(20,137,84)';   // Green background for "More"
    button.style.color = 'white';                      // White font for "More"

    // ----------------------------------------------------------------------------------------
    // 🐇 23Jan26 - IMPORTANT
    // [SJ-RH-JS-05] If the user collapses the parent section, also collapse any Rabbit Hole
    // nerd panels inside it so Nerd Mode never stays open across re-opens.
    // ----------------------------------------------------------------------------------------
    // ✅ 15Feb26 [SJ-RH-JS-05A]
    // Close Rabbit Holes across the *entire* section container (not only the hidden moreMsg).
    // This fixes the Glossary A-Z case where A&B live outside moreAtoZmsg.
    const parentContainer = document.getElementById(parentID);
    closeRabbitHolesInContainer(parentContainer || message);

    message.style.display = 'none';                    // Hide moreMsg
    if (!isSearching) { scrollToTarget(parentID, 100); } // Show start of section at top
  }
}


// ============================================================================================
// 🐇 23Jan26 - Rabbit Hole "More..." icon toggle (Nerdy Deep Dive blocks)
// [SJ-RH-JS-01] Drop-in show/hide for rabbit-hole panels
// - No logic depends on literal "More..." / "Less..." text tokens; state is tracked via aria-expanded + data-sjAutoOpened
//   clickAllMore() / clickAllLess() Search logic continues to work unchanged.
// - The rabbit icon itself is a CSS background-image, so changing text won't affect it.
// ============================================================================================
function toggleRabbitHole(buttonID, panelID) {

  const button = document.getElementById(buttonID);
  const panel  = document.getElementById(panelID);

  if (!button || !panel) { return; }

  const panelStyle = window.getComputedStyle(panel);
  const isHidden   = (panelStyle.display === 'none');

  // ------------------------------------------------------------------------------------------
  // 🐇 23Jan26 - Subtle bounce affordance (hover + click)
  // [SJ-RH-JS-02] Trigger a tiny bounce on click/tap so users notice it's interactive.
  // NOTE: We do this here (instead of hover-only) so mobile users get the same delightful cue.
  // ------------------------------------------------------------------------------------------
  button.classList.remove('sjRabbitHole-bounce');
  void button.offsetWidth; // reflow so animation can restart on repeated clicks
  button.classList.add('sjRabbitHole-bounce');
  window.setTimeout(() => button.classList.remove('sjRabbitHole-bounce'), 650);

  if (isHidden) {
    panel.style.display = 'block';
    button.textContent  = SJ_LESS_ARIA;
    button.setAttribute('data-rabbit-state', 'open');
        button.dataset.sjMlState = 'less';
button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', SJ_LESS_ARIA);
  } 
  else {
    panel.style.display = 'none';
    button.textContent  = SJ_MORE_ARIA;
    button.setAttribute('data-rabbit-state', 'closed');
        button.dataset.sjMlState = 'more';
button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', SJ_MORE_ARIA);
  }

  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-03A] Keep veil in sync with Rabbit Hole open/close state (open OR close)
  if (typeof sjUpdateRabbitHoleOverlay === 'function') { sjUpdateRabbitHoleOverlay(); }

  // ✅ 2026-03-07 🧩 [SJ-PANEL-SCROLL-03] Bring the opened Rabbit Hole pane just below the fixed headers.
  if (isHidden) {
    sjScrollElementBelowFixedHeaders(panel, 8);
  }

}


// ------------------------------------------------------------------------------------------
// 🐇 23Jan26 - Rabbit Hole safety reset on section collapse
// [SJ-RH-JS-04] If a parent section collapses (header Less... / global collapse),
// force-close any Rabbit Hole nerd panels inside so they never re-open unexpectedly.
// ------------------------------------------------------------------------------------------
// ✅ 30Jun26j [SJP-RH-CONTAINER-MISSING-01] Phase 5 New-5 fix: this function was called
// (below, and from the "Less..." collapse handler above) but never actually defined in
// p.js — it only existed in sjLearnScripts.js and p0.js, neither of which p.html loads.
// Clicking the Up Arrow (sjpGoUpArrow -> clickAllLess -> closeAllRabbitHoles) threw
// "closeRabbitHolesInContainer is not defined". Ported the implementation from p0.js
// unchanged; all of its dependencies (SJ_MORE_ARIA, sjForceCloseGlossaryOverlay,
// sjForceCloseRabbitHoleOverlay, window.SJRabbitHoleLink) already exist in this file or
// are safely guarded with typeof checks.
function closeRabbitHolesInContainer(containerEl) {
  if (!containerEl || !containerEl.querySelectorAll) { return; }

  // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-JS-02] Close converted sjRabbitHoleLink panels in this container
  if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.closeByPanelId === 'function') {
    containerEl.querySelectorAll('[data-sjrhl-panel]').forEach(panel => {
      if (panel && panel.id) {
        window.SJRabbitHoleLink.closeByPanelId(panel.id, { restoreTrigger: false });
      }
    });
  }

  // 1) Hide all legacy nerd panels in this container
  containerEl.querySelectorAll('.sjRabbitHole-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  // ----------------------------------------------------------------------------------------
  // 🐇 15Feb26 - Glossary Rabbit Hole envelope reset on parent collapse
  // [SJ-GLOSS-RH-ENVELOPE-02]
  // When a Glossary term is open, JS adds .sjGlossary-open to the owning <li> so the border
  // wraps BOTH the term line and the panel.
  // If the parent section collapses while a term is open, we MUST remove that envelope class
  // as well as hiding the panel, otherwise reopening the section can show only the border +
  // term line (panel stays hidden), which looks like a "half-open" rabbit hole.
  // ----------------------------------------------------------------------------------------
  containerEl.querySelectorAll('.sjGlossary-open').forEach(li => {
    li.classList.remove('sjGlossary-open');
  });

  // ✅ 2026-03-04 🧩 [SJ-GLOSS-OVERLAY-02] If a section collapse closes glossary panels,
  // also ensure the grey veil is removed (otherwise it can look "stuck" until a click).
  if (typeof sjForceCloseGlossaryOverlay === 'function') {
    sjForceCloseGlossaryOverlay();
  }

  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-10] If a section collapse closes rabbit holes,
  // also ensure the general Rabbit Hole veil is removed (otherwise it can look "stuck").
  if (typeof sjForceCloseRabbitHoleOverlay === 'function') {
    sjForceCloseRabbitHoleOverlay();
  }

  // 2) Reset all legacy rabbit buttons in this container
  containerEl.querySelectorAll('.sjRabbitHole-button').forEach(btn => {
    btn.textContent = SJ_MORE_ARIA;     // IMPORTANT: Search logic relies on this text token
    btn.setAttribute('data-rabbit-state', 'closed');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', SJ_MORE_ARIA);
  });

  // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-JS-03] Reset converted sjRabbitHoleLink rabbit triggers too
  containerEl.querySelectorAll('[data-sjrhl-trigger]').forEach(btn => {
    btn.textContent = SJ_MORE_ARIA;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', SJ_MORE_ARIA);
  });
}

function closeAllRabbitHoles() {
  closeRabbitHolesInContainer(document);

  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-09] If we close panels programmatically, also force-hide the Rabbit Hole veil
  if (typeof sjForceCloseRabbitHoleOverlay === 'function') { sjForceCloseRabbitHoleOverlay(); }

  // ✅ 2026-03-07 🧩 [SJ-GLOSS-OVERLAY-05] Closing all rabbit holes should also clear Glossary veil if active
  if (typeof sjForceCloseGlossaryOverlay === 'function') { sjForceCloseGlossaryOverlay(); }
}



// ✅ 2026-03-24 🧩 [SJ-RHL-HOST-SEARCH-05] Helpers for sjRabbitHoleLink during Search
// Search opens expandables so hidden text becomes searchable, but converted Rabbit Holes need one extra pass:
//   - snapshot which ones were user-open BEFORE Search
//   - keep open ONLY the panels whose OWN content contains the search hit
//   - restore any pre-search-open panels after Search ends
function sjGetSjrhlPanelFromTrigger(trigger) {
  if (!trigger) return null;
  const panelId = trigger.getAttribute('data-sjrhl-target') || trigger.getAttribute('aria-controls');
  return panelId ? document.getElementById(panelId) : null;
}

function sjSnapshotSjrhlSearchStates() {
  document.querySelectorAll('[data-sjrhl-trigger]').forEach(trigger => {
    const isOpen = (trigger.getAttribute('aria-expanded') === 'true');
    trigger.dataset.sjSearchWasOpen = isOpen ? '1' : '0';
  });
}

function sjSyncSjrhlPanelsForSearch(searchTerm) {
  const api = window.SJRabbitHoleLink;
  const term = (searchTerm || '').trim().toLowerCase();

  document.querySelectorAll('[data-sjrhl-trigger]').forEach(trigger => {
    const panel = sjGetSjrhlPanelFromTrigger(trigger);
    if (!panel) return;

    const wasOpenBeforeSearch = (trigger.dataset.sjSearchWasOpen === '1');
    const hasHitInOwnPanel = !!term && panel.textContent.toLowerCase().includes(term);

    if (!term) {
      if (api && typeof api.closeByPanelId === 'function') { api.closeByPanelId(panel.id, { restoreTrigger: false }); }
      delete trigger.dataset.sjAutoOpened;
      return;
    }

    if (hasHitInOwnPanel) {
      if (api && typeof api.openByPanelId === 'function') { api.openByPanelId(panel.id); }
      if (!wasOpenBeforeSearch) {
        trigger.dataset.sjAutoOpened = '1';
      } else {
        delete trigger.dataset.sjAutoOpened;
      }
    } else {
      if (api && typeof api.closeByPanelId === 'function') { api.closeByPanelId(panel.id, { restoreTrigger: false }); }
      delete trigger.dataset.sjAutoOpened;
    }
  });

  if (api && typeof api.refresh === 'function') { api.refresh(); }
}

function sjRestoreSjrhlPanelsAfterSearch() {
  const api = window.SJRabbitHoleLink;

  document.querySelectorAll('[data-sjrhl-trigger]').forEach(trigger => {
    const panel = sjGetSjrhlPanelFromTrigger(trigger);
    if (!panel) return;

    const wasOpenBeforeSearch = (trigger.dataset.sjSearchWasOpen === '1');

    if (wasOpenBeforeSearch) {
      if (api && typeof api.openByPanelId === 'function') { api.openByPanelId(panel.id); }
    } else {
      if (api && typeof api.closeByPanelId === 'function') { api.closeByPanelId(panel.id, { restoreTrigger: false }); }
    }

    delete trigger.dataset.sjSearchWasOpen;
    delete trigger.dataset.sjAutoOpened;
  });

  if (api && typeof api.refresh === 'function') { api.refresh(); }
}

//The More/Less buttons on sections and divs need to be clicked for a proper search
//This code expands all elements belonging to the data-group 'expandable'.
//If the element was already expanded, we do NOT mark it as auto-opened (so Search cleanup won't close it)
//instead of the usual three dots so the clickAllLess will not close them.
function clickAllMore(whichLess = 'Less..') {
  document.querySelectorAll('[data-group="expandable"]').forEach(el => {

    // Initialize aria-expanded if missing (legacy safety)
    if (!el.hasAttribute('aria-expanded')) {
      const t = (el.textContent || '').trim();
      el.setAttribute('aria-expanded', /^less\b/i.test(t) ? 'true' : 'false');
    }

    const wasExpanded = (el.getAttribute('aria-expanded') === 'true');

    // Expand ONLY if it was closed, then mark as auto-opened for search cleanup.
    if (!wasExpanded) {
      el.click(); // Triggers the onclick event
      el.dataset.sjAutoOpened = '1'; // [SJ-ML-CHV-02] token used instead of "Less.."
    }
  });
}
//This function expands an expandable element  with id = id.
//Note the 'Less.. with two dots instead of 3 to identify already expanded elements
function clickMoreForId(id, whichLess = 'Less...') {
  // Get the specific element by ID
  const parentElement = document.getElementById(id);
  if (!parentElement) return; // Exit if the element doesn't exist

  // Find all expandable elements inside the given ID
  parentElement.querySelectorAll('[data-group="expandable"]').forEach(el => {

    // ----------------------------------------------------------------------------------------
    // 🐇 23Jan26 - IMPORTANT
    // [SJ-RH-JS-03] Menu navigation uses clickMoreForId() to auto-expand a section.
    // If we also auto-click the Rabbit Hole icon, it opens Nerd Mode unintentionally.
    // So we skip only the rabbit button here.
    // Search expand/collapse still uses clickAllMore()/clickAllLess().
    // ----------------------------------------------------------------------------------------
    if (el.classList && el.classList.contains('sjRabbitHole-button')) { return; }
    if (el.hasAttribute && el.hasAttribute('data-sjrhl-trigger')) { return; }

    // Initialize aria-expanded if missing (legacy safety)
    if (!el.hasAttribute('aria-expanded')) {
      const t = (el.textContent || '').trim();
      el.setAttribute('aria-expanded', /^less\b/i.test(t) ? 'true' : 'false');
    }

    if (el.getAttribute('aria-expanded') === 'false') {
      el.click(); // Triggers the onclick event
    }
  });
}
//Once a search is done, all elements in the expandable group are closed by
//a click event, except those that were already expanded at start of search.
function clickAllLess(whichLess = 'Less..') {
  expanded = false; //

  // Compatibility:
  // - clickAllLess('Less...')  => close ALL expanded elements (TOC/navigation/global collapse)
  // - clickAllLess('Less..')   => close ONLY auto-opened elements (Search cleanup)
  const closeAll = (String(whichLess).trim() === 'Less...');

  document.querySelectorAll('[data-group="expandable"]').forEach(el => {

    // Initialize aria-expanded if missing (legacy safety)
    if (!el.hasAttribute('aria-expanded')) {
      const t = (el.textContent || '').trim();
      el.setAttribute('aria-expanded', /^less\b/i.test(t) ? 'true' : 'false');
    }

    const isOpen = (el.getAttribute('aria-expanded') === 'true');
    const wasAutoOpened = (el.dataset.sjAutoOpened === '1');

    if (isOpen && (closeAll || wasAutoOpened)) {
      el.click(); // Triggers the onclick event to re-close section
    }

    // Clear markers so state doesn't leak across subsequent actions
    if (closeAll || wasAutoOpened) {
      delete el.dataset.sjAutoOpened;
    }
  });

  // 🐇 23Jan26 - Safety: guarantee Rabbit Holes are closed on global collapse
  // [SJ-RH-JS-06] Even if a Rabbit button's text token isn't what we expect, force-reset them.
  closeAllRabbitHoles();
}
//This function collapses an expandable element with id = id.
function clickLessForId(id, whichLess = 'Less..') {
  // Get the specific element by ID
  const parentElement = document.getElementById(id);
  if (!parentElement) return; // Exit if the element doesn't exist

  // Compatibility:
  // - clickLessForId(id, 'Less...') => close ALL expanded elements within parent
  // - clickLessForId(id, 'Less..')  => close ONLY auto-opened elements within parent
  const closeAll = (String(whichLess).trim() === 'Less...');

  // Find all expandable elements inside the given ID
  parentElement.querySelectorAll('[data-group="expandable"]').forEach(el => {

    // Initialize aria-expanded if missing (legacy safety)
    if (!el.hasAttribute('aria-expanded')) {
      const t = (el.textContent || '').trim();
      el.setAttribute('aria-expanded', /^less\b/i.test(t) ? 'true' : 'false');
    }

    const isOpen = (el.getAttribute('aria-expanded') === 'true');
    const wasAutoOpened = (el.dataset.sjAutoOpened === '1');

    if (isOpen && (closeAll || wasAutoOpened)) {
      el.click(); // Triggers the onclick event to collapse the section
    }

    if (closeAll || wasAutoOpened) {
      delete el.dataset.sjAutoOpened;
    }
  });
}
//END of expand all "More..."

// 12Dec25 Gemeni
/**
 * Finds the topmost element matching the selector that is visible near the
 * determined content scroll-in point.
 * @param {string} selector - The CSS selector for the desired element group (e.g., [data-group="startOfsection"])
 * @param {number} startY - The vertical starting position for the search (i.e., below the fixed header).
 * @param {number} bandHeight - The size of the band (in pixels) to check within.
 * @returns {string | null} The ID of the found element, or null.
 */
function getStickySectionByPoint(
  selector = '[data-group="startOfsection"]',
  startY = getHeaderOffsets().fixedOffset, // Use dynamic fixed offset as base
  bandHeight = getHeaderOffsets().stickyBandHeight // Use dynamic sticky title height
) {
    const x = window.innerWidth / 2;

    // Check at three strategic points within the expected sticky band
    const offsets = [
        0,                                   // 1. Right at the sticky content start point (most reliable)
        Math.round(bandHeight / 2),          // 2. In the middle of the sticky content (fallback)
        Math.round(bandHeight) - 5           // 3. Near the bottom of the sticky content (fallback)
    ];

    for (const o of offsets) {
      // Find the element at the sensor point (X, startY + o)
      const el = document
        .elementFromPoint(x, startY + o)
        ?.closest(selector);
        
      if (el) return el.id;
    }
    return null;
}


function sjpGoHome(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (typeof close_drawers === 'function') {
    close_drawers({
      keepScrollLocked: false,
      onClosed: function () {
        setTimeout(function () {
          scrollToTarget('lead-box', 100, 'smooth');
        }, 20);
      }
    });
  } else if (typeof scrollToTarget === 'function') {
    scrollToTarget('lead-box', 100, 'smooth');
  } else {
    window.location.hash = 'lead-box';
  }
}

// =================================================================================================
// ✅ 2026-05-30 🧩 [SJP-PUBLIC-PASS14-HEADER-JS-01]
// Header Recipes/Start Here baby step:
// - Reuse the existing smooth same-page navigation pattern for the new header links.
// - Keep the Start Here arrow centered between the measured right edge of Recipes and left edge of SOURJOE.
// ✅ 2026-06-02 🧩 [SJP-PUBLIC-PASS15-PREVIEW-EYE-JS-00]
// - Top-header preview-eye now resets the preview to the top and opens the Preview Guide drawer.
// =================================================================================================
function sjpScrollHeaderTarget(event, targetId) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const goNow = function () {
    if (typeof scrollToTarget === 'function') {
      scrollToTarget(targetId, 100, 'smooth');
    } else {
      window.location.hash = targetId;
    }
  };

  if (typeof close_drawers === 'function') {
    close_drawers({
      keepScrollLocked: false,
      onClosed: function () {
        setTimeout(goNow, 20);
      }
    });
  } else {
    goNow();
  }
}

function sjpGoRecipesPreview(event) {
  sjpScrollHeaderTarget(event, 'recipesIntro');
}

function sjpOpenMainTocAfterTopReset() {
  // ✅ 2026-06-02 🧩 [SJP-PUBLIC-PASS15-PREVIEW-EYE-JS-01]
  // Function name retained for compatibility with the existing inline header onclick.
  // The former blue up-arrow is now a preview-eye reset:
  // 1) close open public-preview content,
  // 2) return to the top/WELCOME position,
  // 3) open the Preview Guide drawer so the user immediately sees the control legend.

  if (typeof window.SJBubbles !== 'undefined' && window.SJBubbles && typeof window.SJBubbles.hide === 'function') {
    try { window.SJBubbles.hide(); } catch (error) {}
  }

  if (typeof clickAllLess === 'function') {
    clickAllLess('Less...');
  }

  if (typeof sjpHideGatedLiveDemoSections === 'function') {
    try { sjpHideGatedLiveDemoSections(); } catch (error) {}
  }

  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (error) {
    // Hash cleanup is helpful, but not required for navigation.
  }

  function forceInstantTopScroll() {
    // ✅ 2026-05-30 🧩 [SJP-PUBLIC-PASS14G-TOP-TOC-SEQUENCE-01]
    // Keep the arrow reset deterministic: force the page to top with CSS smooth-scrolling
    // temporarily disabled, then open the TOC only after the browser reports top position.
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlScrollBehavior = html ? html.style.scrollBehavior : '';
    const prevBodyScrollBehavior = body ? body.style.scrollBehavior : '';

    if (html) html.style.scrollBehavior = 'auto';
    if (body) body.style.scrollBehavior = 'auto';

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    window.requestAnimationFrame(function () {
      if (html) html.style.scrollBehavior = prevHtmlScrollBehavior;
      if (body) body.style.scrollBehavior = prevBodyScrollBehavior;
    });
  }

  function openPreviewGuideNow() {
    if (typeof sjpOpenPublicWelcomeDrawer === 'function') {
      sjpOpenPublicWelcomeDrawer('how');
      return;
    }

    const titleEl = document.getElementById('SJP-public-how-title');
    const contentEl = document.getElementById('SJP-public-how-content');

    if (typeof open_drawer === 'function' && titleEl && contentEl) {
      open_drawer('drawer-left', 'url', titleEl, contentEl, '100%');
    }
  }

  function openPreviewGuideAfterTopIsStable() {
    let attempts = 0;
    let stableTopFrames = 0;
    const MAX_ATTEMPTS = 18;

    function checkTopThenOpen() {
      forceInstantTopScroll();

      const y = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(y) <= 2) {
        stableTopFrames += 1;
      } else {
        stableTopFrames = 0;
      }

      if (stableTopFrames >= 2 || attempts >= MAX_ATTEMPTS) {
        forceInstantTopScroll();
        window.setTimeout(function () {
          forceInstantTopScroll();
          openPreviewGuideNow();
        }, 90);
        return;
      }

      attempts += 1;
      window.requestAnimationFrame(checkTopThenOpen);
    }

    window.requestAnimationFrame(checkTopThenOpen);
  }

  forceInstantTopScroll();
  openPreviewGuideAfterTopIsStable();
}

// ✅ 26Jun26a 🧩 [SJP-UP-ARROW-JS-01]
// New Up Arrow in header: close all open items and scroll to top.
// This is the behavior the Compass used to have; the Compass now only toggles the Guidance drawer.
function sjpGoUpArrow(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Immediately unlock any scroll-lock from drawer scripts and jump to top
  var body = document.body;
  var html = document.documentElement;
  if (body && body.style.position === 'fixed') {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    if (html) html.style.overflow = '';
  }
  if (html) html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);

  if (typeof window.SJBubbles !== 'undefined' && window.SJBubbles && typeof window.SJBubbles.hide === 'function') {
    try { window.SJBubbles.hide(); } catch (e) {}
  }
  if (typeof clickAllLess === 'function') {
    clickAllLess('Less...');
  }
  if (typeof sjpHideGatedLiveDemoSections === 'function') {
    try { sjpHideGatedLiveDemoSections(); } catch (e) {}
  }
  if (typeof close_drawers === 'function') {
    try { close_drawers({ keepScrollLocked: false }); } catch (e) {}
  }
  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (e) {}

  // Re-confirm scroll position after any reflow
  window.setTimeout(function () {
    if (html) html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    if (html) html.style.scrollBehavior = '';
  }, 80);
}

function sjpGoStartHere(event) {
  // Compass now ONLY toggles the Guidance (Preview Guide / How to Use) drawer.
  // Close-all + scroll-to-top has moved to the new Up Arrow in the header.
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // If the Guidance drawer is already open, close it; otherwise open it.
  const guidanceDrawer = document.querySelector('.drawer-left.active.sjp-public-drawer-how');
  if (guidanceDrawer) {
    if (typeof close_drawers === 'function') {
      close_drawers({ keepScrollLocked: false });
    }
    return;
  }

  // Clear any preview-guide return attributes so this compass open is always clean.
  document.querySelectorAll('.drawer').forEach(function (drawer) {
    drawer.removeAttribute('data-sjp-preview-guide-return');
    drawer.removeAttribute('data-sjp-preview-guide-return-y');
    drawer.removeAttribute('data-sjp-opened-from-gated-demo');
    drawer.removeAttribute('data-sjp-live-demo-owner');
  });

  if (typeof sjpOpenPublicWelcomeDrawer === 'function') {
    sjpOpenPublicWelcomeDrawer('how');
  } else {
    const titleEl = document.getElementById('SJP-public-how-title');
    const contentEl = document.getElementById('SJP-public-how-content');
    if (typeof open_drawer === 'function' && titleEl && contentEl) {
      open_drawer('drawer-left', 'url', titleEl, contentEl, '100%');
    }
  }
}

(function sjpInstallPass14HeaderArrowPlacement() {
  const ARROW_ID = 'sjpTopStartHereArrow';
  const TIGHT_CLASS = 'sjp-top-start-arrow-link--tight';
  const HIDDEN_CLASS = 'sjp-top-start-arrow-link--hidden';
  const POSITIONED_CLASS = 'sjp-top-start-arrow-link--positioned'; // ✅ 26Jun26f [SJP-COMPASS-NO-JERK-01]

  function positionArrow() {
    const header = document.querySelector('.header-top-center-container');
    const title = document.getElementById('mainTitle');
    const tocIcon = document.querySelector('#openMainTOC .header-icon-top-menu, #openMainTOC .sj-app-hamburger');
    const arrow = document.getElementById(ARROW_ID);
    if (!header || !title || !tocIcon || !arrow) return;

    const headerRect = header.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const tocRect = tocIcon.getBoundingClientRect();

    if (!headerRect.width || !titleRect.width || !tocRect.width) return;

    arrow.classList.remove(HIDDEN_CLASS);

    // ✅ 2026-06-04 🧩 [SJP-PUBLIC-PASS16B-PREVIEW-EYE-RIGHT-SIDE-01]
    // Move the Preview Guide eye to the opposite side of the title: centered between SOURJOE and the main TOC icon.
    const leftEdge = titleRect.right - headerRect.left;
    const rightEdge = tocRect.left - headerRect.left;
    const availableSpace = rightEdge - leftEdge;

    arrow.classList.toggle(TIGHT_CLASS, availableSpace < 34);

    const arrowWidth = arrow.getBoundingClientRect().width || 24;
    const safeGap = availableSpace < 34 ? 3 : 6;
    let desiredCenter = leftEdge + (availableSpace / 2);

    const minCenter = leftEdge + (arrowWidth / 2) + safeGap;
    const maxCenter = rightEdge - (arrowWidth / 2) - safeGap;

    if (maxCenter >= minCenter) {
      desiredCenter = Math.max(minCenter, Math.min(maxCenter, desiredCenter));
      arrow.classList.remove(HIDDEN_CLASS);
    } else if (availableSpace > 14) {
      arrow.classList.add(TIGHT_CLASS);
      desiredCenter = leftEdge + (availableSpace / 2);
      arrow.classList.remove(HIDDEN_CLASS);
    } else {
      arrow.classList.add(HIDDEN_CLASS);
    }

    arrow.style.setProperty('--sjp-start-arrow-left', `${desiredCenter}px`);
    // Reveal the icon now that it's in the correct position (prevents load-jerk)
    arrow.classList.add(POSITIONED_CLASS);
  }

  function schedulePositionArrow() {
    window.requestAnimationFrame(positionArrow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePositionArrow);
  } else {
    schedulePositionArrow();
  }

  window.addEventListener('resize', schedulePositionArrow, { passive: true });
  window.addEventListener('orientationchange', function () {
    window.setTimeout(schedulePositionArrow, 80);
  }, { passive: true });

  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(schedulePositionArrow).catch(function () {});
  }
})();

(function () {

  const ENTRY_CLOUD_ID = 'sjpEntryCloudOverlay';
  const ENTRY_LOGO_SRC = 'https://sjmedia0.w3spaces.com/sjNewsletterPICS/sjNewsletterHeader.png';

  // ✅ 2026-05-25 🧩 [SJP-PASS13-ENTRY-HOME-SETTLE-01]
  // If the intro cloud is going to show, keep the page underneath settled at HOME/top.
  // This prevents browser scroll-restoration, late image layout, or a previous visit from leaving the
  // public preview at a random section after EXPLORE SOURJOE is clicked.
  const ENTRY_STARTED_AT_HOME = !window.location.hash || window.location.hash === '#lead-box';

  if (ENTRY_STARTED_AT_HOME) {
    try {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    } catch (error) {
      // Older browsers can ignore this safely.
    }
  }

  // ✅ 2026-05-25 🧩 [SJP-PASS13-ENTRY-LOGO-PREFETCH-01]
  // Start the logo request before the overlay markup is injected.
  try {
    const entryLogoPreload = new Image();
    entryLogoPreload.decoding = 'sync';
    entryLogoPreload.fetchPriority = 'high';
    entryLogoPreload.src = ENTRY_LOGO_SRC;
  } catch (error) {
    // Image() may be unavailable in unusual non-browser contexts. The normal <img> still loads.
  }

  // ✅ 2026-05-17 🧭 [SJP-ENTRY-CLOUD-30MIN-01]
  // Suppress the first-entry yellow guidance cloud for 30 minutes after it appears.
  // This survives navigation away from sourjoe.com and back again, which keeps Register,
  // Subscribe, Chapter Guide, and other exploratory paths from re-triggering the cloud repeatedly.
  const ENTRY_CLOUD_SUPPRESS_KEY = 'sjpEntryCloudSuppressUntil';
  const ENTRY_CLOUD_SUPPRESS_MS = 30 * 60 * 1000;

  function getNowMs() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  function rememberEntryCloudShownForThirtyMinutes() {
    try {
      window.localStorage.setItem(ENTRY_CLOUD_SUPPRESS_KEY, String(getNowMs() + ENTRY_CLOUD_SUPPRESS_MS));
    } catch (error) {
      // Storage can be blocked in strict privacy modes. In that case, fall back to normal page-entry behavior.
    }
  }

  // ✅ 2026-06-10 🧭 [SJP-ENTRY-CLOUD-SIGNIN-BACK-01]
  // Member Sign In should not suppress the intro cloud.  If the visitor backs out of
  // app.sourjoe.com/login, show the yellow guidance cloud again so EXPLORE SOURJOE is obvious.
  function clearEntryCloudSuppressWindow() {
    try {
      window.localStorage.removeItem(ENTRY_CLOUD_SUPPRESS_KEY);
    } catch (error) {
      // Storage can be blocked in strict privacy modes; the normal page-entry behavior remains safe.
    }
  }

  function isEntryCloudSuppressedForVisitWindow() {
    try {
      const suppressUntil = Number(window.localStorage.getItem(ENTRY_CLOUD_SUPPRESS_KEY) || 0);
      if (!suppressUntil || Number.isNaN(suppressUntil)) return false;

      if (getNowMs() < suppressUntil) return true;

      window.localStorage.removeItem(ENTRY_CLOUD_SUPPRESS_KEY);
      return false;
    } catch (error) {
      return false;
    }
  }


  function forceEntryCloudHomePosition() {
    if (!ENTRY_STARTED_AT_HOME) return;

    try {
      const rootScroller = document.scrollingElement || document.documentElement;
      if (rootScroller) {
        rootScroller.scrollTop = 0;
        rootScroller.scrollLeft = 0;
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (error) {
      try { window.scrollTo(0, 0); } catch (fallbackError) {}
    }
  }

  function settleEntryCloudHomePosition() {
    if (!ENTRY_STARTED_AT_HOME) return;

    [0, 40, 140, 360, 800].forEach(function (delayMs) {
      window.setTimeout(forceEntryCloudHomePosition, delayMs);
    });

    window.addEventListener('load', function () {
      [0, 120, 360].forEach(function (delayMs) {
        window.setTimeout(forceEntryCloudHomePosition, delayMs);
      });
    }, { once: true });
  }

  // ✅ 2026-05-16 🧭 [SJP-SEO-GUIDE-RETURN-01]
  // When a visitor returns from a static Chapter Guide page, skip the entry cloud once.
  // ✅ 2026-05-17 🧭 [SJP-ENTRY-CLOUD-30MIN-02]
  // Also start the same 30-minute suppression window so future returns from Register/Subscribe/etc. stay clean.
  // The guide pages use /?from=chapter-guide so normal first-time visitors still see the welcome overlay.
  const suppressEntryCloudFromChapterGuide = (function () {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') !== 'chapter-guide') return false;

      rememberEntryCloudShownForThirtyMinutes();

      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      return true;
    } catch (error) {
      return false;
    }
  })();

  // ✅ 2026-05-23 🧩 [SJP-PUBLIC-PASS11-GLOW-01]
  // Public-site glow cues are disabled for Pass11, but the original pulse code is intentionally retained below.
  // Flip this back to true if the permanent glow experiment is restored later.
  const SJP_GUIDE_GLOW_ENABLED = false;

  function findGuideIcons() {
    return Array.from(document.querySelectorAll('.sj-app-hamburger, img.content-title-menu, .moreButton, .sjp-live-demo-rabbit'));
  }

  function startGuidePulse() {
    if (!SJP_GUIDE_GLOW_ENABLED) return;

    findGuideIcons().forEach(function (icon) {
      icon.classList.add('sjp-guide-pulse');
      if (!icon.hasAttribute('title')) {
        icon.setAttribute('title', 'Tap to explore this section');
      }
    });

    document.body.classList.add('sjp-guide-cues-active');
  }

  function hideEntryCloud() {
    const overlay = document.getElementById(ENTRY_CLOUD_ID);
    if (!overlay) return;


    overlay.classList.remove('sjp-entry-cloud-overlay--visible');
    document.body.classList.remove('sjp-entry-cloud-active');
    settleEntryCloudHomePosition();

    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      forceEntryCloudHomePosition();
    }, 220);
  }

  // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-QA1-EXPLORE-01]
  // QA requested removal of the second EXPLORE follow-up panel.
  // EXPLORE SOURJOE now closes the opening cloud immediately and starts the permanent guide cues.

  function ensureEntryCloud() {
    let overlay = document.getElementById(ENTRY_CLOUD_ID);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = ENTRY_CLOUD_ID;
    overlay.className = 'sjp-entry-cloud-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'sjpEntryCloudTitle');
    overlay.setAttribute('aria-describedby', 'sjpEntryCloudCopy');
    overlay.innerHTML = `
      <section class="sjp-entry-cloud-card" aria-label="Sourjoe public preview welcome">
        <div class="sjp-entry-cloud-logo-wrap">
          <img class="sjp-entry-cloud-logo" src="${ENTRY_LOGO_SRC}" alt="Sourjoe" loading="eager" fetchpriority="high" decoding="sync" width="500" height="136">
        </div>
        <div id="sjpEntryCloudCopy" class="sjp-entry-cloud-copy">
          <p id="sjpEntryCloudTitle">Thanks for your interest in what we think is the best online sourdough companion for home bakers.</p>
          <p>This Sourjoe Homepage is designed to mimic our app rather than be an advertising brochure. It will give you a feel for what you get with the app.</p>
          <p class="sjp-entry-cloud-trial">Free, no credit card required Trial!</p>
        </div>
        <!-- ✅ 2026-06-10 🧭 [SJP-ENTRY-CLOUD-SIGNIN-01] Add Member Sign In as a peer action below Explore. -->
        <div class="sjp-entry-cloud-actions" aria-label="Choose how to enter Sourjoe">
          <button class="sjp-entry-cloud-button" type="button">EXPLORE</button>
          <div class="sjp-entry-cloud-choice" aria-hidden="true">- OR -</div>
          <button class="sjp-entry-cloud-button sjp-entry-cloud-signin-button" type="button">MEMBER SIGN IN</button>
        </div>
      </section>`;

    document.body.appendChild(overlay);

    const exploreButton = overlay.querySelector('.sjp-entry-cloud-button:not(.sjp-entry-cloud-signin-button)');
    if (exploreButton) {
      exploreButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        hideEntryCloud();
      });
    }

    const signInButton = overlay.querySelector('.sjp-entry-cloud-signin-button');
    if (signInButton) {
      signInButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        clearEntryCloudSuppressWindow();
        window.location.href = 'https://app.sourjoe.com/login';
      });
    }

    return overlay;
  }

  function showEntryCloud() {
    rememberEntryCloudShownForThirtyMinutes();
    forceEntryCloudHomePosition();

    const overlay = ensureEntryCloud();
    document.body.classList.add('sjp-entry-cloud-active');
    settleEntryCloudHomePosition();

    window.requestAnimationFrame(function () {
      forceEntryCloudHomePosition();
      overlay.classList.add('sjp-entry-cloud-overlay--visible');
      const exploreButton = overlay.querySelector('.sjp-entry-cloud-button');
      if (exploreButton) exploreButton.focus({ preventScroll: true });
    });
  }

  // Compatibility no-ops: older HOME logic or inline handlers can call these safely without recreating
  // the retired floating yellow guide popup.
  window.sjpShowGuideNotice = function () {};
  window.sjpHideGuideNotice = function () {};
  window.sjpHideEntryCloud = hideEntryCloud;

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    const overlay = document.getElementById(ENTRY_CLOUD_ID);
    if (!overlay || !overlay.classList.contains('sjp-entry-cloud-overlay--visible')) return;
    event.preventDefault();
    hideEntryCloud();
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('sjp-guided-cues');
    window.setTimeout(function () {
      startGuidePulse();
      // ✅ 26Jun26e 🧮 [SJP-CALC-RETURN-CLOUD-01] / ✅ 26Jun26f [SJP-CALC-RETURN-CLOUD-02]
      // Suppress the entry cloud when returning from a calculator session, so it doesn't
      // reset the page to the Welcome position. Checks both URL param (direct nav fallback)
      // and sessionStorage (BFCache restore via history.back).
      // ✅ 30Jun26b 🧮 [SJP-CALC-RETURN-CLOUD-RACE-01] ROOT CAUSE FIX:
      // This check previously read SJ_CALC_RETURN_Y, but sjCalculatorLaunch.js's own
      // pageshow listener deletes that key immediately on pageshow (before this 350ms
      // setTimeout fires). On fast page loads pageshow can fire and clear the key before
      // this check runs, so isCalcReturn evaluated false, the entry cloud showed, and
      // showEntryCloud() force-scrolled to (0,0) via forceEntryCloudHomePosition() — this
      // was the actual cause of "X jumps to top of page". SJ_CALC_SAVED_Y is written at the
      // same time as SJ_CALC_RETURN_Y but is never deleted before this point, so check it
      // instead — also fall back to SJP_CALC_REOPEN_TOC as a second safety net.
      var isCalcReturn = false;
      try {
        isCalcReturn = (window.__sjpCalcReturnInfo && window.__sjpCalcReturnInfo.isCalcReturn)
          || new URLSearchParams(window.location.search).get('sjCalcReturn') === '1'
          || sessionStorage.getItem('SJ_CALC_RETURN_Y') !== null
          || sessionStorage.getItem('SJ_CALC_SAVED_Y') !== null
          || sessionStorage.getItem('SJP_CALC_REOPEN_TOC') !== null;
      } catch (e) {}
      if (!suppressEntryCloudFromChapterGuide && !isEntryCloudSuppressedForVisitWindow() && !isCalcReturn) {
        showEntryCloud();
      }
    }, 350);
  });
})();


/* =================================================================================================
   ✅ 2026-05-04 🧩 [SJP-RECIPE-STEPS-AUTOPLAY-01]
   Public Recipe Steps video tweak:
   - Keep this as a tiny public-only patch in p.js.
   - sjRecipes.js still owns the real Recipe Steps engine and sets #stepsVideo.src.
   - This observer only adds Cloudflare Stream iframe options after sjRecipes.js chooses a video.
   - Autoplay is intentionally paired with muted=true because many browsers block autoplay with sound.
   ================================================================================================= */


/* =================================================================================================
   ✅ 2026-05-04 🧩 [SJP-WELCOME-DRAWERS-01]
   Welcome-panel public guide drawers:
   - About Sourjoe opens a full-height bottom drawer.
   - What Sourjoe gives you opens a full-height right drawer.
   - How to use this Preview opens a full-height left drawer.
   Public-only wrapper around the existing shared open_drawer() function.
   ================================================================================================= */
function sjpOpenPublicWelcomeDrawer(which) {
  const isPcScreen = window.matchMedia('(min-width: 1100px)').matches;
  const drawerMap = {
    about: {
      drawerClass: 'drawer-bottom',
      titleId: 'SJP-public-about-title',
      contentId: 'SJP-public-about-content',
      mobileWidth: '100%',
      pcWidth: '50%',
      height: '100%'
    },
    gives: {
      drawerClass: 'drawer-right',
      titleId: 'SJP-public-gives-title',
      contentId: 'SJP-public-gives-content',
      mobileWidth: '92%',
      pcWidth: '50%',
      height: '100%'
    },
    how: {
      drawerClass: 'drawer-left',
      titleId: 'SJP-public-how-title',
      contentId: 'SJP-public-how-content',
      mobileWidth: '92%',
      pcWidth: '50%',
      height: '100%'
    }
  };

  const cfg = drawerMap[which];
  if (!cfg) return;

  const drawer = document.querySelector(`.${cfg.drawerClass}`);
  const title = document.getElementById(cfg.titleId);
  const content = document.getElementById(cfg.contentId);

  if (!drawer || !title || !content || typeof open_drawer !== 'function') {
    console.warn('Sourjoe public drawer could not open:', which);
    return;
  }

  const resolvedWidth = isPcScreen ? cfg.pcWidth : cfg.mobileWidth;

  document.querySelectorAll('.drawer').forEach(candidate => {
    candidate.classList.remove('sjp-public-drawer', 'sjp-public-drawer-about', 'sjp-public-drawer-gives', 'sjp-public-drawer-how');
  });

  drawer.classList.add('sjp-public-drawer', `sjp-public-drawer-${which}`);

  open_drawer(cfg.drawerClass, 'url', title, content, cfg.height);

  // open_drawer() sets drawer width from its built-in type map. This public wrapper deliberately
  // overrides the CSS variables immediately afterward so these three public guide drawers can be
  // wider/full-height without changing the shared drawer engine or private Book behaviour.
  document.documentElement.style.setProperty('--drawerBaseWidth', resolvedWidth);
  document.documentElement.style.setProperty('--drawerBaseHeight', cfg.height);
  document.documentElement.style.setProperty('--drawerShiftWidth', `calc((100% - ${resolvedWidth}) / 2)`);
}

/* =================================================================================================
   ✅ 2026-05-30 🧩 [SJP-PUBLIC-PASS14B-TOC-PREVIEW-GUIDE-JS-01]
   Public TOC Preview Guide button:
   - sjBubbles.js dynamically injects the TOC Helper ON/OFF row after a TOC drawer opens.
   - This public-only hook adds a matching "Preview Guide" button directly below it.
   - The button opens the existing "How to use this preview" drawer without changing shared sjBubbles.js.

   ✅ 2026-05-30 🧩 [SJP-PUBLIC-PASS14C-PREVIEW-GUIDE-RETURN-01]
   Preview Guide return preservation:
   - When Preview Guide is opened from a live-demo Section TOC, carry that Section ownership marker
     forward to the How-to drawer.
   - Closing the How-to drawer now preserves the live-demo section and restores the exact page
     position that was visible when Preview Guide was opened.
   ================================================================================================= */
(function sjpInstallTocPreviewGuideButtons() {
  const BUTTON_CLASS = 'sjp-previewGuideBtn';
  const RETURN_ATTR = 'data-sjp-preview-guide-return';
  const RETURN_Y_ATTR = 'data-sjp-preview-guide-return-y';

  function getVisualScrollY() {
    // When a drawer is already open, sjDrawerScripts pins <body> at top:-Ypx,
    // so window.scrollY can be 0 even though the user visually remains lower on the page.
    const bodyTop = window.getComputedStyle(document.body).position === 'fixed'
      ? parseFloat(document.body.style.top || '0')
      : 0;

    if (bodyTop < 0) return Math.abs(bodyTop);
    return window.scrollY || window.pageYOffset || 0;
  }

  function forceInstantScrollTo(y) {
    const targetY = Math.max(0, Number(y) || 0);
    const prevHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    const prevBodyScrollBehavior = document.body.style.scrollBehavior;

    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    window.scrollTo({ top: targetY, left: 0, behavior: 'auto' });

    window.requestAnimationFrame(function () {
      document.documentElement.style.scrollBehavior = prevHtmlScrollBehavior;
      document.body.style.scrollBehavior = prevBodyScrollBehavior;
    });
  }

  function getOpenLiveDemoId() {
    const openDemo = document.querySelector('#essentialsTools.sjp-live-demo-visible, #processMix.sjp-live-demo-visible, #glossaryAtoZ.sjp-live-demo-visible');
    return openDemo ? openDemo.id : '';
  }

  function getPreviewGuideReturnContext(target) {
    const sourceDrawer = target && target.closest
      ? target.closest('.drawer[data-sjp-opened-from-gated-demo="true"]')
      : null;

    const ownerId = sourceDrawer
      ? (sourceDrawer.getAttribute('data-sjp-live-demo-owner') || getOpenLiveDemoId())
      : '';

    if (!ownerId) return null;

    return {
      ownerId,
      returnY: getVisualScrollY()
    };
  }

  function markPreviewGuideDrawerForReturn(context) {
    if (!context || !context.ownerId) return;

    function applyMark() {
      const drawer = document.querySelector('.drawer-left');
      if (!drawer) return;

      drawer.setAttribute('data-sjp-opened-from-gated-demo', 'true');
      drawer.setAttribute('data-sjp-live-demo-owner', context.ownerId);
      drawer.setAttribute(RETURN_ATTR, 'true');
      drawer.setAttribute(RETURN_Y_ATTR, String(context.returnY));
    }

    // open_drawer() and the live-demo owner wrapper both use short async steps while switching
    // drawers. Apply the marker more than once so it survives that switch without touching the
    // shared drawer engine.
    applyMark();
    window.setTimeout(applyMark, 25);
    window.setTimeout(applyMark, 425);
  }

  function clearPreviewGuideDrawerReturnMarks() {
    document.querySelectorAll(`.drawer[${RETURN_ATTR}="true"]`).forEach(function (drawer) {
      drawer.removeAttribute(RETURN_ATTR);
      drawer.removeAttribute(RETURN_Y_ATTR);
      drawer.removeAttribute('data-sjp-opened-from-gated-demo');
      drawer.removeAttribute('data-sjp-live-demo-owner');
    });
  }

  function restorePreviewGuideReturn(ownerId, returnY) {
    if (ownerId && typeof sjpShowGatedLiveDemoSection === 'function') {
      sjpShowGatedLiveDemoSection(ownerId);
    }

    if (ownerId && typeof clickMoreForId === 'function') {
      clickMoreForId(ownerId);
    }

    // Restore after drawer content is back in the page and after any More... reflow has settled.
    forceInstantScrollTo(returnY);
    window.setTimeout(function () { forceInstantScrollTo(returnY); }, 50);
    window.setTimeout(function () { forceInstantScrollTo(returnY); }, 150);
  }

  function wrapCloseDrawersForPreviewGuideReturn() {
    if (typeof window.close_drawers !== 'function') return false;
    if (window.close_drawers._sjpPreviewGuideReturnWrapped) return true;

    const originalCloseDrawers = window.close_drawers;

    window.close_drawers = function (opts) {
      const closeOpts = opts || {};
      const activeReturnDrawer = document.querySelector(`.drawer.active[${RETURN_ATTR}="true"]`);

      if (!activeReturnDrawer || closeOpts.keepScrollLocked) {
        return originalCloseDrawers.apply(this, arguments);
      }

      const ownerId = activeReturnDrawer.getAttribute('data-sjp-live-demo-owner') || '';
      const returnY = Number(activeReturnDrawer.getAttribute(RETURN_Y_ATTR)) || getVisualScrollY();
      const existingOnClosed = typeof closeOpts.onClosed === 'function' ? closeOpts.onClosed : null;
      const nextOpts = Object.assign({}, closeOpts, {
        onClosed: function () {
          if (existingOnClosed) {
            try { existingOnClosed(); } catch (err) { console.warn('Preview Guide onClosed callback error:', err); }
          }

          restorePreviewGuideReturn(ownerId, returnY);
          clearPreviewGuideDrawerReturnMarks();
        }
      });

      return originalCloseDrawers.call(this, nextOpts);
    };

    window.close_drawers._sjpPreviewGuideReturnWrapped = true;
    return true;
  }

  function installCloseDrawerWrapperWhenReady() {
    if (wrapCloseDrawersForPreviewGuideReturn()) return;

    let attempts = 0;
    const timer = window.setInterval(function () {
      attempts += 1;
      if (wrapCloseDrawersForPreviewGuideReturn() || attempts >= 50) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  function openPreviewGuide(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const returnContext = getPreviewGuideReturnContext(event ? event.target : null);

    if (typeof sjpOpenPublicWelcomeDrawer === 'function') {
      if (!returnContext) {
        clearPreviewGuideDrawerReturnMarks();
      }

      sjpOpenPublicWelcomeDrawer('how');
      markPreviewGuideDrawerForReturn(returnContext);
    }
  }

  function ensurePreviewGuideButton(row) {
    if (!row || !row.querySelector) return;
    if (row.querySelector('.' + BUTTON_CLASS)) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sjb-tocHelpersBtn ' + BUTTON_CLASS;
    button.setAttribute('aria-label', 'Open How to use this preview guide');
    button.textContent = 'Preview Guide';
    button.addEventListener('click', openPreviewGuide);

    const note = row.querySelector('.sjb-tocHelpersNote');
    if (note && note.parentNode === row) {
      row.insertBefore(button, note);
    } else {
      row.appendChild(button);
    }
  }

  function syncPreviewGuideButtons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.sjb-tocHelpersRow').forEach(ensurePreviewGuideButton);
  }

  function bootPreviewGuideButtons() {
    installCloseDrawerWrapperWhenReady();
    syncPreviewGuideButtons(document);

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (!node || node.nodeType !== 1) return;

          if (node.classList && node.classList.contains('sjb-tocHelpersRow')) {
            ensurePreviewGuideButton(node);
          } else {
            syncPreviewGuideButtons(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPreviewGuideButtons, { once: true });
  } else {
    bootPreviewGuideButtons();
  }
})();






/* =================================================================================================
   ✅ 2026-05-08 🧩 [SJP-LIVE-DEMO-GATE-01]
   Public live-demo section gate:
   - Essential Tools, Initial Mix, and Glossary A to Z are real working demos, but they should not
     sit visibly open on the public page by default.
   - Any TOC-link click closes/hides these gated live demos first.
   - A Live demo TOC link then immediately re-shows its own section and opens its More content.
   - Recipe Facts and Calculator are intentionally NOT included in this gated list.
   ================================================================================================= */
const SJP_GATED_LIVE_DEMO_IDS = ['essentialsTools', 'processMix', 'glossaryAtoZ'];

function sjpGetGatedLiveDemoOwnerFromTarget(target) {
  if (!target || !target.closest) return null;
  return target.closest('#essentialsTools, #processMix, #glossaryAtoZ');
}

function sjpIsInsideDrawerOpenedFromGatedDemo(target) {
  return !!(
    target &&
    target.closest &&
    target.closest('.drawer.active[data-sjp-opened-from-gated-demo="true"]')
  );
}

/* ✅ 2026-05-08 🧩 [SJP-LIVE-DEMO-DRAWER-OWNER-01]
   If a drawer is opened from inside a gated live demo, mark that drawer so closing it does NOT
   also hide the live demo. This preserves the Essential Tools drawer/X behaviour while keeping
   system navigation clicks outside the demo as close/hide triggers. */
(function sjpInstallLiveDemoDrawerOwnerTracking() {
  let lastClickTarget = null;

  document.addEventListener('click', function (event) {
    lastClickTarget = event.target;
  }, true);

  function clearDrawerOwnerMarks() {
    document.querySelectorAll('.drawer[data-sjp-opened-from-gated-demo]').forEach(drawer => {
      drawer.removeAttribute('data-sjp-opened-from-gated-demo');
      drawer.removeAttribute('data-sjp-live-demo-owner');
    });
  }

  function markOpenedDrawer(drawerClass, ownerId) {
    window.setTimeout(function () {
      clearDrawerOwnerMarks();
      if (!drawerClass || !ownerId) return;

      const safeClass = String(drawerClass).replace(/^\./, '');
      const drawer = document.querySelector('.' + safeClass + '.active') || document.querySelector('.' + safeClass);
      if (!drawer) return;

      drawer.setAttribute('data-sjp-opened-from-gated-demo', 'true');
      drawer.setAttribute('data-sjp-live-demo-owner', ownerId);
    }, 0);
  }

  function tryWrapOpenDrawer() {
    if (typeof window.open_drawer !== 'function') return false;
    if (window.open_drawer._sjpLiveDemoDrawerTracked) return true;

    const originalOpenDrawer = window.open_drawer;

    window.open_drawer = function (drawerClass) {
      const owner = sjpGetGatedLiveDemoOwnerFromTarget(lastClickTarget);
      const ownerId = owner ? owner.id : '';

      const result = originalOpenDrawer.apply(this, arguments);
      lastClickTarget = null; // avoid a stale live-demo click marking a later programmatic drawer open

      if (ownerId) {
        markOpenedDrawer(drawerClass, ownerId);
      } else {
        window.setTimeout(clearDrawerOwnerMarks, 0);
      }

      return result;
    };

    window.open_drawer._sjpLiveDemoDrawerTracked = true;
    return true;
  }

  function installWhenDrawerScriptIsReady() {
    if (tryWrapOpenDrawer()) return;

    let attempts = 0;
    const timer = window.setInterval(function () {
      attempts += 1;
      if (tryWrapOpenDrawer() || attempts >= 50) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installWhenDrawerScriptIsReady);
  } else {
    installWhenDrawerScriptIsReady();
  }
})();

function sjpIsGatedLiveDemoId(id) {
  return SJP_GATED_LIVE_DEMO_IDS.indexOf(String(id || '')) !== -1;
}

function sjpGetGatedLiveDemoSections() {
  return SJP_GATED_LIVE_DEMO_IDS
    .map(id => document.getElementById(id))
    .filter(Boolean);
}

function sjpShowGatedLiveDemoSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section || !sjpIsGatedLiveDemoId(sectionId)) return;

  section.classList.add('sjp-live-demo-visible');
  section.setAttribute('aria-hidden', 'false');
}

function sjpHideGatedLiveDemoSections(exceptId) {
  sjpGetGatedLiveDemoSections().forEach(section => {
    if (exceptId && section.id === exceptId) return;

    // Close the section's own More content and any rabbit panel before hiding the whole section.
    if (typeof clickLessForId === 'function') {
      clickLessForId(section.id, 'Less...');
    }

    section.classList.remove('sjp-live-demo-visible');
    section.setAttribute('aria-hidden', 'true');
  });
}

(function sjpInstallLiveDemoTocGate() {
  function install() {
    sjpGetGatedLiveDemoSections().forEach(section => {
      section.classList.remove('sjp-live-demo-visible');
      section.setAttribute('aria-hidden', 'true');
    });

    document.addEventListener('click', function (event) {
      const tocLink = event.target && event.target.closest
        ? event.target.closest('[data-group="drawer-content"] p')
        : null;

      if (!tocLink) return;
      sjpHideGatedLiveDemoSections();
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }

})();

/* =================================================================================================
   ✅ 2026-05-08 🧩 [SJP-LIVE-DEMO-SYSTEM-CLOSE-01]
   Public live-demo system-close guard:
   - Reuses sjpHideGatedLiveDemoSections() so the existing close/hide behaviour stays intact.
   - Closes an open gated live demo when the user clicks public navigation or a non-demo control
     outside the live-demo section itself: HOME, Sign In/Sign Up, socials, welcome guide buttons,
     the main header TOC button, or another section's action/control.
   - Intentionally ignores clicks inside the gated live-demo sections so their own Less/More buttons,
     rabbit-hole buttons, glossary terms, and local section TOC behaviour keep working normally.
   ================================================================================================= */
(function sjpInstallLiveDemoSystemCloseGuard() {
  const gatedSelector = '#essentialsTools, #processMix, #glossaryAtoZ';

  function isInsideGatedLiveDemo(target) {
    if (typeof sjpGetGatedLiveDemoOwnerFromTarget === 'function') {
      return !!sjpGetGatedLiveDemoOwnerFromTarget(target);
    }
    return !!(target && target.closest && target.closest(gatedSelector));
  }

  function isExplicitSystemNav(target) {
    if (!target || !target.closest) return false;

    return !!target.closest([
      '.sjp-logo-home-link',              // upper-left Sourjoe logo home link
      '.sjp-top-home-link',               // upper-right HOME link
      '.sjp-top-preview-guide-link',      // top-header preview-eye reset link
      '.sjp-auth-button',                 // lower fixed-header Sign In / Sign Up
      '.sjp-social-link',                 // lower fixed-header email/social links
      '.sjp-welcome-link',                // Welcome-panel guide buttons
      '#openMainTOC .header-icon-top-menu' // main fixed-header TOC button
    ].join(', '));
  }

  function isNonDemoAction(target) {
    if (!target || !target.closest) return false;

    // Keep all interactions inside the open demo section itself intact.
    if (isInsideGatedLiveDemo(target)) return false;

    // Keep drawer controls/content intact when that drawer was opened from a gated live demo
    // (notably Essential Tools detail drawers). Closing the drawer should not close the demo.
    if (typeof sjpIsInsideDrawerOpenedFromGatedDemo === 'function' && sjpIsInsideDrawerOpenedFromGatedDemo(target)) return false;

    const action = target.closest([
      'a[href]',
      'button',
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]',
      '.link-style',
      'img.content-title-menu',
      '.moreButton'
    ].join(', '));

    if (!action) return false;

    // Existing TOC-link logic already handles drawer-content <p> links, including the
    // close-then-reopen case for a live demo's own TOC link. Let that path remain authoritative.
    if (action.closest('[data-group="drawer-content"]')) return false;

    return true;
  }

  document.addEventListener('click', function (event) {
    if (typeof sjpHideGatedLiveDemoSections !== 'function') return;

    const target = event.target;
    if (isExplicitSystemNav(target) || isNonDemoAction(target)) {
      sjpHideGatedLiveDemoSections();
    }
  }, true);
})();

/* =================================================================================================
   ✅ 2026-05-07 🧩 [SJP-LIVE-DEMO-OPEN-02]
   Public live-demo TOC helper:
   - Live-demo TOC items should open their section's More content, not merely land on the header.
   - Safe for sections with no More button: it simply scrolls to the requested target.
   - Rabbit-hole triggers are intentionally skipped by clickMoreForId(), preserving Nerd Mode behaviour.
   ================================================================================================= */
function sjpOpenLiveDemoSection(parentId, targetId, offset = 100) {
  const finalTargetId = targetId || parentId;

  function openAndScrollAfterDrawerClose() {
    const isGatedLiveDemo = (typeof sjpIsGatedLiveDemoId === 'function' && sjpIsGatedLiveDemoId(parentId));

    if (typeof sjpHideGatedLiveDemoSections === 'function') {
      sjpHideGatedLiveDemoSections(isGatedLiveDemo ? parentId : null);
    }

    if (typeof clickAllLess === 'function') {
      clickAllLess('Less...');
    }

    window.setTimeout(function () {
      if (isGatedLiveDemo && typeof sjpShowGatedLiveDemoSection === 'function') {
        sjpShowGatedLiveDemoSection(parentId);
      }

      if (parentId && typeof clickMoreForId === 'function') {
        clickMoreForId(parentId);
      }

      window.setTimeout(function () {
        if (typeof scrollToTarget === 'function') {
          scrollToTarget(finalTargetId, offset);
        } else {
          const target = document.getElementById(finalTargetId);
          if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 80);
    }, 30);
  }

  const activeDrawer = document.querySelector('.drawer.active');

  if (activeDrawer && typeof close_drawers === 'function') {
    close_drawers({
      keepScrollLocked: false,
      onClosed: openAndScrollAfterDrawerClose
    });
  } else {
    openAndScrollAfterDrawerClose();
  }

  return false;
}

/* =================================================================================================
   ✅ 2026-05-07 🧩 [SJP-GLOSSARY-LIVE-DEMO-OPEN-01]
   Public Glossary live-demo TOC helper:
   - Reference TOC > Glossary A to Z now opens the Glossary section instead of merely landing on it.
   - Glossary A to Z TOC > Letters A and B opens the parent section first, then lands on A/B.
   - Result: the Glossary More button is visibly changed to Less for the live-demo path.
   ================================================================================================= */
function sjpOpenGlossaryAtoZLiveDemo(targetId = 'glossaryAtoZ') {
  const parentId = 'glossaryAtoZ';
  const finalTargetId = targetId || parentId;

  if (typeof sjpHideGatedLiveDemoSections === 'function') {
    sjpHideGatedLiveDemoSections(parentId);
  }

  if (typeof clickAllLess === 'function') {
    clickAllLess('Less...');
  }

  window.setTimeout(function () {
    if (typeof sjpShowGatedLiveDemoSection === 'function') {
      sjpShowGatedLiveDemoSection(parentId);
    }

    if (typeof clickMoreForId === 'function') {
      clickMoreForId(parentId);
    }

    window.setTimeout(function () {
      let finalOffset = 100;

      if (finalTargetId !== parentId && typeof sjRefComputeSubsectionOffset === 'function') {
        finalOffset = sjRefComputeSubsectionOffset(parentId, 6) || 140;
      }

      if (typeof resetAndScroll === 'function') {
        resetAndScroll(finalTargetId, finalOffset);
      } else {
        const target = document.getElementById(finalTargetId);
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 60);
  }, 20);
}


/* =================================================================================================
   ✅ 2026-05-08 🧩 [SJP-LOWER-HEADER-WIDTH-SYNC-01]
   Keep the lower fixed-header email/social icon strip the same visual width as the Welcome title.
   CSS uses --sjp-welcome-title-width for the centre grid column; this tiny JS sync reads the actual
   rendered title width so desktop, tablet, smartphone, and font loading all stay aligned.
   ================================================================================================= */
function sjpSyncLowerSocialWidthToWelcomeTitle() {
  const title = document.querySelector('.sjp-public-welcome .lead-title');
  if (!title) return;

  // The .lead-title element is block-level, so its element rect is the Welcome-panel width.
  // Measure the rendered text itself with a Range so the lower social strip matches the words,
  // not the whole Welcome panel.
  let measuredWidth = 0;
  try {
    const range = document.createRange();
    range.selectNodeContents(title);
    const textRect = range.getBoundingClientRect();
    measuredWidth = textRect && Number.isFinite(textRect.width) ? textRect.width : 0;
    range.detach && range.detach();
  } catch (e) {}

  if (!measuredWidth) {
    const fallbackClone = title.cloneNode(true);
    fallbackClone.style.position = 'absolute';
    fallbackClone.style.visibility = 'hidden';
    fallbackClone.style.width = 'max-content';
    fallbackClone.style.left = '-9999px';
    fallbackClone.style.top = '-9999px';
    document.body.appendChild(fallbackClone);
    measuredWidth = fallbackClone.getBoundingClientRect().width;
    fallbackClone.remove();
  }

  if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) return;

  const viewport = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
  const safeWidth = Math.max(168, Math.min(measuredWidth, viewport - 126));
  document.documentElement.style.setProperty('--sjp-welcome-title-width', `${Math.round(safeWidth)}px`);
}

(function sjpInstallLowerHeaderWidthSync() {
  function runSoon() {
    sjpSyncLowerSocialWidthToWelcomeTitle();
    window.setTimeout(sjpSyncLowerSocialWidthToWelcomeTitle, 80);
    window.setTimeout(sjpSyncLowerSocialWidthToWelcomeTitle, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSoon);
  } else {
    runSoon();
  }

  window.addEventListener('resize', runSoon);
  window.addEventListener('orientationchange', runSoon);
  window.addEventListener('pageshow', runSoon);

  if (document.fonts && typeof document.fonts.ready === 'object') {
    document.fonts.ready.then(runSoon).catch(function () {});
  }
})();


/* =================================================================================================
   ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6-AUTH-01]
   Welcome-panel auth visibility controller:
   - Adds/removes body.sjp-welcome-in-view based on the real viewport position of #lead-box.
   - CSS uses that class to swap auth emphasis between the Welcome panel and lower fixed header.
   - The pixel-based fallback keeps behaviour stable even if IntersectionObserver is unavailable.
   ================================================================================================= */
function sjpUpdateWelcomeAuthVisibility() {
  const leadBox = document.getElementById('lead-box');
  if (!leadBox || !document.body) return;

  const rect = leadBox.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const topHeader = document.querySelector('.header-container');
  const headerBottom = topHeader ? topHeader.getBoundingClientRect().bottom : 0;

  // Treat the Welcome panel as "in view" while a meaningful part remains visible below the fixed headers.
  const visibleTop = Math.max(rect.top, headerBottom);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visiblePixels = Math.max(0, visibleBottom - visibleTop);
  const isInView = visiblePixels >= 72;

  document.body.classList.toggle('sjp-welcome-in-view', isInView);
}

(function sjpInstallWelcomeAuthVisibilityController() {
  function runSoon() {
    sjpUpdateWelcomeAuthVisibility();
    window.setTimeout(sjpUpdateWelcomeAuthVisibility, 80);
    window.setTimeout(sjpUpdateWelcomeAuthVisibility, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSoon);
  } else {
    runSoon();
  }

  window.addEventListener('scroll', sjpUpdateWelcomeAuthVisibility, { passive: true });
  window.addEventListener('resize', runSoon);
  window.addEventListener('orientationchange', runSoon);
  window.addEventListener('pageshow', runSoon);

  if ('IntersectionObserver' in window) {
    const leadBox = document.getElementById('lead-box');
    if (leadBox) {
      const observer = new IntersectionObserver(sjpUpdateWelcomeAuthVisibility, {
        root: null,
        threshold: [0, 0.04, 0.12, 0.25, 0.5, 0.75, 1]
      });
      observer.observe(leadBox);
    }
  }
})();

/* =================================================================================================
   ✅ 2026-05-21 🧩 [SJP-PUBLIC-INFO-BUBBLES-01]
   Public info-icon bubble system:
   - Adds reusable circular "?" icons and black helper bubbles to the public site.
   - Bubble text is centralized below. Each entry has a short placement/comment label so the wording
     can be found and edited without hunting through the page markup.
   - Uses event delegation so bubbles continue to work after TOC content is moved into the drawer.
   ================================================================================================= */
const sjpInfoBubbleEntries = [
  // Start Here Chapter Title
  {
  key: 'chapter-title-startHereIntro',
  selector: '#startHereIntro > .content-section-title .center-box',
  position: 'beforeTitle',
  // Start Here Title
  message: `
    <strong>Start Here</strong><br>
    We created the Start Here panel to help novice bakers get up-and-baking quickly.<br><br>
    Reading the four suggested sections will orient a new baker to the world of sourdough.<br><br>
    Once the basic readings have been done, executing the three suggested Recipes should be a cake walk (bread walk?).
  `
  },
  // Essentials Chapter Title
  { key: 'chapter-title-essentialsIntro', selector: '#essentialsIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },
  // Starter and Leaven Chapter Title
  { key: 'chapter-title-leavenIntro', selector: '#leavenIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },
  // Baker's Process Chapter Title
  { key: 'chapter-title-processIntro', selector: '#processIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },
  // Reference Chapter Title
  { key: 'chapter-title-referenceIntro', selector: '#referenceIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },
  // Recipe Factoids Chapter Title
  { key: 'chapter-title-recipesIntro', selector: '#recipesIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },
  // Calculator Tools Chapter Title
  { key: 'chapter-title-calculatorIntro', selector: '#calculatorIntro > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'This is a chapter title for the public Sourjoe preview.' },

  // ✅ 25Jun26a 🧩 [SJP-TOC-HELPERS-REMOVE-01] Chapter-level TOC icon helpers removed — not necessary; TOC icons are self-evident.

  // Essential Tools Live Demo Title
  { key: 'title-essentialsTools', selector: '#essentialsTools > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'Essential Tools is a live public demo section.' },
  // Initial Mix Live Demo Title
  { key: 'title-processMix', selector: '#processMix > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'Initial Mix is a live public demo section.' },
  // Glossary A to Z Live Demo Title
  { key: 'title-glossaryAtoZ', selector: '#glossaryTitle', position: 'beforeTitle', 
  message: 'Glossary A to Z is a live public demo section.' },
  // Unit Convertor Live Demo Title
  { key: 'title-unitConvertor', selector: '#unitConvertor > .content-section-title .center-box', position: 'beforeTitle', 
  message: 'Unit Convertor is a live calculator demo.' },
  // How to Use Preview Panel Info Icon
  { key: 'how-use-info-icon', selector: '.sjp-info-anchor--guide', position: 'existingInfo', 
  message: 'Info icons give short guidance about Sourjoe public-preview controls.' },

  // Start Here body plus icon - Essentials
  {
    key: 'start-here-plus-essentials',
    selector: '#startHereIntro .sjp-start-here-link-list .link-style[onclick*="essentialsIntro"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>This section covers the handful of ingredients and tools you'll need to get started."
      + "<br><br>You likely have most of the essentials in your kitchen already.</p>"
  },
  // Start Here body plus icon - Starter and Leaven
  {
    key: 'start-here-plus-leaven',
    selector: '#startHereIntro .sjp-start-here-link-list .link-style[onclick*="leavenIntro"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>This is one of the most important (and confusing) topics for beginners."
      + "<br>This section explains the difference between a Starter and Leaven, how to maintain your Starter, and what to expect."
      + "<br><br>Read it twice if you need to — most of us did!</p>"
  },
  // Start Here body plus icon - Baker's Process
  {
    key: 'start-here-plus-process',
    selector: '#startHereIntro .sjp-start-here-link-list .link-style[onclick*="processIntro"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>The Bakers Process lays out the full sourdough workflow for a home baker and explains why each step matters."
      + "<br><br>It's not complicated, but understanding the why behind the steps will boost your confidence big time.</p>"
  },
  // Start Here body plus icon - Glossary A to Z
  {
    key: 'start-here-plus-glossary',
    selector: '#startHereIntro .sjp-start-here-link-list .link-style[onclick*="sjpOpenGlossaryAtoZLiveDemo"], #startHereIntro .sjp-start-here-link-list .link-style[onclick*="referenceIntro"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>While reading through the glossary terms, no need to memorize anything - "
      + "just getting familiar with the lingo will help things click faster.</p>"
  },
  // Start Here body plus icon - Create your Starter
  {
    key: 'start-here-plus-starter-recipe',
    selector: '#startHereIntro .sjp-start-here-link-list .sjp-locked-inline[data-sjp-lock-message^="Create your Starter Recipe"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>First and foremost, you will need to create your own Starter."
      + "<br><br>The process is simple - but it spans up to 6 days!</p>"
  },
  // Start Here body plus icon - Prepare Leaven
  {
    key: 'start-here-plus-prepare-levain',
    selector: '#startHereIntro .sjp-start-here-link-list .sjp-locked-inline[data-sjp-lock-message^="Prepare Leaven Recipe"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'>Once your Starter is established, you can create a Leaven for your bake.</p>"
  },
  // Start Here body plus icon - My First Bake
  {
    key: 'start-here-plus-my-first-bake',
    selector: '#startHereIntro .sjp-start-here-link-list .sjp-locked-inline[data-sjp-lock-message^="My First Bake Recipe"]',
    position: 'beforeStartHereLink',
    message: "<p style='text-align: left;'><em>My First Bake</em> recipe is very easy and yields a mildly tangy, tasty sourdough bread."
      + "<br><br>Bake this loaf often to get used to the process, then move on and experiment with the more complex recipes in our lineup.</p>"
  },

  // ✅ 25Jun26a 🧩 [SJP-TOC-HELPERS-REMOVE-02] Live-demo TOC icon helpers and main header TOC icon helper removed — not necessary.

  // Essential Tools and Initial Mix Live Demo Rabbit icons
  { key: 'live-demo-rabbit-icons', selector: '#essentialsTools .sjrhl-trigger.sjrhl-host-rabbit.sjp-live-demo-rabbit, #processMix .sjrhl-trigger.sjrhl-host-rabbit.sjp-live-demo-rabbit', position: 'beforeRabbit', 
  message: 'Open a Sourjoe rabbit-hole note for extra context.' },
  // Unit Convertor Live Demo Rabbit icon
  { key: 'live-demo-rabbit-unitConvertor', selector: '#unitConvertor #RH-unitConv-01-btn.sjRabbitHole-button', position: 'beforeRabbit', 
  message: 'Open a Sourjoe rabbit-hole note for extra context.' },

  // Essential Tools Live Demo More/Less button
  { key: 'more-less-essentialsTools', selector: '#toolsButton', position: 'beforeMore', 
  message: 'Open or close this live public demo section.' },
  // Initial Mix Live Demo More/Less button
  { key: 'more-less-processMix', selector: '#mixButton', position: 'beforeMore', 
  message: 'Open or close this live public demo section.' },
  // Glossary A to Z Live Demo More/Less button
  { key: 'more-less-glossaryAtoZ', selector: '#moreAtoZbutton', position: 'beforeMore', 
  message: 'Open or close this live public demo section.' },
  // Unit Convertor Live Demo More/Less button
  { key: 'more-less-unitConvertor', selector: '#unitConvertorButton', position: 'beforeMore', 
  message: 'Open or close this live public calculator demo.' }
];

/* =================================================================================================
   ✅ 2026-05-24 🧩 [SJP-PASS12-SJB-ADAPTER-01]
   Public info icons now use the shared sjBubbles engine instead of the old Public-only bubble renderer.
   - p.js still owns the Public placement list above.
   - sjBubbles.js / sjBubbles.css now own behaviour, hover/tap handling, positioning, and Helper ON/OFF.
   - Public keeps only the adapter needed to inject the right triggers in the right places.
   ================================================================================================= */
function sjpGetSjbMessageObject(message) {
  return {
    html: true,
    text: message || 'More information about this item.',
    placement: 'auto'
  };
}

function sjpRegisterSjbMessage(key, message) {
  if (!key || !window.SJBubbles || typeof window.SJBubbles.setMessage !== 'function') return;
  window.SJBubbles.setMessage(key, sjpGetSjbMessageObject(message));
}

function sjpRegisterPublicSjbMessages() {
  if (!window.SJBubbles || typeof window.SJBubbles.setMessages !== 'function') return;

  const messages = {};

  sjpInfoBubbleEntries.forEach(function (entry, index) {
    const key = entry.key || `info-${index}`;
    messages[key] = sjpGetSjbMessageObject(entry.message);
  });

  // Static markers can carry their message in markup.  Register them before binding/rebinding.
  document.querySelectorAll('[data-sjb][data-sjb-message]').forEach(function (el) {
    const key = el.getAttribute('data-sjb');
    const message = el.getAttribute('data-sjb-message');
    if (key && message) messages[key] = sjpGetSjbMessageObject(message);
  });

  window.SJBubbles.setMessages(messages);
}

function sjpCreateSjbHelpDot(key, message, glyph, behaviour, extraClass) {
  const icon = document.createElement('span');
  icon.className = `sjb-helpDot ${extraClass || ''}`.trim();
  icon.setAttribute('data-sjb', key || 'info');
  icon.setAttribute('behaviour-sjb', behaviour || 'controlled');
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('aria-label', glyph === '+' ? 'Helper message' : 'More information');
  icon.textContent = glyph || '?';
  sjpRegisterSjbMessage(key, message);
  return icon;
}

function sjpDecorateInfoTarget(target, entry, index) {
  if (!target || !entry) return;

  const message = entry.message || 'More information about this item.';
  const key = entry.key || `info-${index}`;
  sjpRegisterSjbMessage(key, message);

  if (entry.position === 'beforeTitle') {
    if (target.querySelector(':scope > .sjp-sjb-before-title')) return;
    target.prepend(sjpCreateSjbHelpDot(key, message, '?', 'controlled', 'sjp-sjb-before-title'));
    target.dataset.sjpInfoDecorated = key;
    return;
  }

  if (entry.position === 'beforeTocIcon') {
    const visualTarget = target.parentElement && target.parentElement.tagName === 'A'
      ? target.parentElement
      : target;
    const parent = visualTarget.parentElement;
    if (!parent) return;

    // ✅ 2026-05-24 🧩 [SJP-PASS12D-TOC-HELPER-PLACEMENT-01]
    // Keep fixed-header helper placement unchanged, but place content-header
    // TOC helpers to the RIGHT of the blue TOC icon for consistency with sjLearn.
    const keepFixedHeaderPlacement = key === 'main-header-toc-icon' || !!target.closest('.header-container');
    const helperClass = keepFixedHeaderPlacement ? 'sjp-sjb-before-toc-icon' : 'sjp-sjb-after-toc-icon';
    if (parent.querySelector(':scope > .' + helperClass)) return;

    const icon = sjpCreateSjbHelpDot(key, message, '?', 'controlled', helperClass);
    if (keepFixedHeaderPlacement) {
      parent.insertBefore(icon, visualTarget);
    } else {
      visualTarget.insertAdjacentElement('afterend', icon);
    }
    parent.dataset.sjpInfoDecorated = key;
    return;
  }

  if (entry.position === 'beforeStartHereLink') {
    const row = target.closest ? target.closest('li') : target.parentElement;
    if (!row || row.querySelector(':scope > .sjp-sjb-start-plus')) return;
    row.classList.add('sjp-start-here-link-row');
    row.insertBefore(sjpCreateSjbHelpDot(key, message, '+', 'enabled', 'sjp-sjb-start-plus'), target);
    row.dataset.sjpInfoDecorated = key;
    return;
  }

  if (entry.position === 'existingInfo') {
    if (target.dataset && target.dataset.sjpInfoDecorated === key) return;

    // If the static marker has already been converted to an sjBubbles dot, just mark it done.
    if (target.classList && target.classList.contains('sjb-helpDot') && target.getAttribute('data-sjb') === key) {
      target.dataset.sjpInfoDecorated = key;
      return;
    }

    const replacement = sjpCreateSjbHelpDot(key, message, '?', 'enabled', 'sjp-sjb-existing-info ' + Array.from(target.classList || []).filter(function (c) {
      return /^sjp-info-anchor--/.test(c);
    }).join(' '));
    replacement.dataset.sjpInfoDecorated = key;

    if (target.parentNode) {
      target.parentNode.replaceChild(replacement, target);
    } else {
      target.setAttribute('data-sjb', key);
      target.setAttribute('behaviour-sjb', 'enabled');
      target.dataset.sjpInfoDecorated = key;
    }
    return;
  }

  if (entry.position === 'beforeRabbit') {
    if (target.closest('.sjp-info-rabbit-shell')) return;
    const shell = document.createElement(target.classList && target.classList.contains('sjRabbitHole-button') ? 'div' : 'span');
    shell.className = 'sjp-info-rabbit-shell';
    target.parentNode.insertBefore(shell, target);
    shell.appendChild(sjpCreateSjbHelpDot(key, message, '?', 'controlled', 'sjp-sjb-before-rabbit'));
    shell.appendChild(target);
    return;
  }

  if (entry.position === 'beforeMore') {
    // ✅ 2026-05-24 🧩 [SJP-PASS12-SJB-MORE-01]
    // The More/Less button itself is now the shared sjBubbles trigger.
    // The visual ? is drawn inside the button by shared CSS, so sjSetMoreState()/sjSetLessState()
    // can keep using textContent without erasing the helper marker.
    target.classList.add('sjb-moreCombo');
    target.setAttribute('data-sjb', key);
    target.setAttribute('behaviour-sjb', 'controlled');
    target.setAttribute('aria-describedby', key);

    if (target.closest('.sjp-info-more-shell')) return;

    const shell = document.createElement('span');
    shell.className = 'sjp-info-more-shell';
    target.parentNode.insertBefore(shell, target);
    shell.appendChild(target);
    shell.dataset.sjpInfoDecorated = key;
  }
}

/* ================================================================================================= */
/* ✅ 28Jun26p 🧩 [SJP-TOC-LOCK-BUBBLES-01]
   General locked-item popup for ALL TOC drawer items with data-sjp-lock="true".
   Covers: chapter TOC drawers (essentials, leaven, process, reference, calculator)
   as well as the Start Here TOC + inline recipe locks in the welcome panel.
   Hard-locked items (🔒): show the message, no drawer opens.
   Timed items (🕒 sjp-clock-icon): still open their drawer — the onclick fires first,
     the bubble is only wired to the lock icon itself so the row click is unaffected.
================================================================================================= */
function sjpInstallAllTocLockBubbles() {
  // Wire every <p> with data-sjp-lock="true" inside any drawer-content block.
  // Also catches inline locked items in the Start Here panel.
  const selectors = [
    '[data-group="drawer-content"] [data-sjp-lock="true"]',
    '#startHereIntro .sjp-start-here-link-list .sjp-locked-inline'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach(function (item) {
    if (item.dataset.sjpLockBubbleInstalled) { return; }
    item.dataset.sjpLockBubbleInstalled = '1';

    const message = item.getAttribute('data-sjp-lock-message') || 'This item is available in the full Sourjoe app.';
    const icon = item.querySelector('.sjp-inline-lock-icon, .sjp-lock-icon');

    item.setAttribute('data-sjp-lock-bubble', 'true');

    // Determine lock type
    const isHardLocked = icon && !icon.classList.contains('sjp-clock-icon');

    // Build a stable key for the SJBubbles message registry
    const key = item.id
      ? 'toc-lock-' + item.id
      : 'toc-lock-' + (item.textContent || 'item').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40);

    sjpRegisterSjbMessage(key, message);

    // Make the WHOLE ROW a SJBubbles trigger so hover AND click both show the message.
    // This gives hover-device users the tooltip on mouseenter over any part of the row,
    // and touch/click users the message on tap anywhere on the row.
    item.setAttribute('data-sjb', key);
    item.setAttribute('behaviour-sjb', 'enabled');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', message);
    item.classList.add('sjp-lock-bubble-trigger');

    // Hard-locked rows: also suppress the onclick from opening any drawer.
    if (isHardLocked) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // Redundantly also wire the icon (keeps keyboard/focus path for just the icon working)
    if (icon) {
      icon.classList.add('sjp-lock-bubble-trigger');
      icon.setAttribute('data-sjb', key);
      icon.setAttribute('behaviour-sjb', 'enabled');
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      icon.setAttribute('aria-label', message);
    }

    // Bind row (and icon) through SJBubbles engine so hover/click events are fully registered
    try {
      if (window.SJBubbles && typeof window.SJBubbles.bindAll === 'function') {
        window.SJBubbles.bindAll(item);
        if (icon) { window.SJBubbles.bindAll(icon); }
      }
    } catch (ex) {}
  });
}

function sjpInstallPublicInfoBubbles() {
  sjpRegisterPublicSjbMessages();

  sjpInfoBubbleEntries.forEach(function (entry, index) {
    document.querySelectorAll(entry.selector).forEach(function (target) {
      sjpDecorateInfoTarget(target, entry, index);
    });
  });

  sjpInstallAllTocLockBubbles();   // replaces old sjpInstallStartHereLockBubbles

  // Bind any triggers injected after the shared engine's auto-init pass.
  if (window.SJBubbles && typeof window.SJBubbles.bindAll === 'function') {
    window.SJBubbles.bindAll(document);
  }
}

(function sjpInstallSharedBubbleAdapter() {
  function runSoon() {
    sjpInstallPublicInfoBubbles();
    window.setTimeout(sjpInstallPublicInfoBubbles, 120);
    window.setTimeout(sjpInstallPublicInfoBubbles, 420);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSoon);
  } else {
    runSoon();
  }
})();

/* =================================================================================================
   ✅ 27Jun26l 🧩 [SJP-PHASE3-TOC-DRAWER-01]
   Phase 3 — Chapter TOC items open their section in the bottom drawer.

   sjpTocOpenSection(sectionId, drawerTitle)
   - Called from chapter TOC <p> onclick handlers.
   - Closes the right-side TOC drawer first (onClosed callback), then opens
     sjLearn.html?mode=drawer&section=sectionId in the bottom drawer.
   - A fresh iframe is created each call so the section always loads clean.
   - Opacity fade-in on iframe load prevents a white flash.

   sjpOpenLearnSection(sectionId, drawerTitle)
   - Low-level opener kept separate so Phase 4 gate logic can call it directly
     after performing any veil/preview setup.
   ================================================================================================= */
function sjpOpenLearnSection(sectionId, drawerTitle) {
  // Retain the currently displayed public Learn preview so a manual drawer close can
  // cancel a timed iframe cleanly and return to its originating chapter TOC.
  window._sjpActiveLearnPreviewSection = sectionId || '';
  window._sjpDemoActive = true; // ✅ 29Jun26e demo guard flag
  if (typeof sjSetTocIconsBlockedForDemo === 'function') { sjSetTocIconsBlockedForDemo(true); }
  var iframe = document.createElement('iframe');
  iframe.src = './sjLearn.html?mode=drawer&section=' + encodeURIComponent(sectionId);
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;opacity:0;';
  iframe.title = drawerTitle || sectionId;
  iframe.addEventListener('load', function () {
    iframe.style.opacity = '1';
  }, { once: true });
  var titleEl = document.createElement('span');
  titleEl.textContent = drawerTitle || sectionId;
  open_drawer('drawer-bottom', 'url', titleEl, iframe, '100%');
}

function sjpTocOpenSection(sectionId, drawerTitle) {
  var activeDrawer = document.querySelector('.drawer.active');
  if (activeDrawer && typeof close_drawers === 'function') {
    close_drawers({
      keepScrollLocked: false,
      onClosed: function () {
        sjpOpenLearnSection(sectionId, drawerTitle);
      }
    });
  } else {
    sjpOpenLearnSection(sectionId, drawerTitle);
  }
}

/* =================================================================================================
   ✅ 28Jun26q 🧩 [SJP-MAIN-TOC-GO-02]
   Main TOC chapter links — directly close the right drawer, release scroll lock,
   then scroll to the target chapter section.

   Bypasses close_drawers() callback chain entirely (previously unreliable due to
   sjScrollLocked state / counter-scroll timing issues). Instead:
   1. Force-closes just the right drawer (removes .active, hides overlay).
   2. Force-restores any body scroll lock (inline style or sjScrollLocked flag).
   3. Waits 350ms (clears the close CSS transition), then scrolls.
   4. Schedules a second scroll pass at +850ms to beat any reflow drift.
================================================================================================= */
function sjpMainTocGo(targetId) {
  // 1. Close the right drawer directly — must also restore its moved content
  //    so it's available next time the drawer opens (open_drawer uses originalParent map).
  try {
    var rightDrawer = document.querySelector('.drawer-right');
    if (rightDrawer) {
      rightDrawer.classList.remove('active');
      // Restore moved TOC content back to its original parent in the DOM
      if (typeof restore_content === 'function') { restore_content(rightDrawer); }
    }
    var overlay = document.querySelector('.overlay');
    if (overlay) { overlay.classList.remove('visible'); }
    // Clear hamburger active state
    if (typeof sjSetMainTocIconActive === 'function') { sjSetMainTocIconActive(false); }
    // Clear the activeDrawer reference so sjDrawerScripts doesn't get confused
    try { window.activeDrawer = null; } catch (e2) {}
  } catch (e) {}

  // 2. Release scroll lock (both CSS pin and sjDrawerScripts internal flag)
  try {
    var b = document.body;
    var savedY = 0;
    if (b.style.position === 'fixed') {
      savedY = Math.abs(parseFloat(b.style.top || '0'));
    } else if (typeof window.sjScrollLockY === 'number' && window.sjScrollLockY > 0) {
      savedY = window.sjScrollLockY;
    }
    b.style.position = '';
    b.style.top = '';
    b.style.left = '';
    b.style.right = '';
    b.style.width = '';
    document.documentElement.style.overflow = '';
    try { window.sjScrollLocked = false; } catch (e2) {}
    if (savedY > 0) { window.scrollTo(0, savedY); }
  } catch (e) {}

  // 3. Collapse any open More/Less or Rabbit Holes
  try { if (typeof clickAllLess === 'function') { clickAllLess('Less...'); } } catch (e) {}
  try { if (typeof sjCloseRabbitHolesBeforeDrawerClose === 'function') { sjCloseRabbitHolesBeforeDrawerClose({}); } } catch (e) {}

  // 4. Scroll — first pass after close transition clears (~350ms)
  //    second pass after reflow settles (+850ms)
  function doScroll(behavior) {
    try {
      if (typeof scrollToTarget === 'function') {
        scrollToTarget(targetId, 100, behavior);
      } else {
        var el = document.getElementById(targetId);
        if (el) { el.scrollIntoView({ behavior: behavior, block: 'start' }); }
      }
    } catch (e) {}
  }

  setTimeout(function () { doScroll('smooth'); }, 350);
  setTimeout(function () { doScroll('auto');   }, 850);
  // ✅ 29Jun26e 🧩 [SJP-MAIN-TOC-GO-CALC-03] Extra pass for calculatorIntro (bottom of long page)
  if (targetId === 'calculatorIntro') {
    setTimeout(function () { doScroll('auto'); }, 1200);
  }
}

/* =================================================================================================
   ✅ 27Jun26m 🧩 [SJP-PHASE4-SIGNUP-LISTENER-01]
   Phase 4 — postMessage handler for sign-up button inside the sjLearn iframe veil.

   When a visitor clicks Sign Up Free inside the drawer veil, sjLearnScripts.js
   posts {type:'sjp-signup'} to the parent window (p.html).
   This listener:
     1. Sends ack back so the iframe doesn't fire the window.open fallback.
     2. Closes the bottom drawer.
     3. Scrolls p.html to the #plans section (Sign Up / Plans).
   ================================================================================================= */
(function sjpInstallSignupMessageListener() {
  window.addEventListener('message', function (evt) {
    if (!evt.data || evt.data.type !== 'sjp-signup') { return; }

    // 1. Acknowledge so the iframe suppresses its window.open fallback
    try {
      if (evt.source && typeof evt.source.postMessage === 'function') {
        evt.source.postMessage({ type: 'sjp-signup-ack' }, '*');
      }
    } catch (e) {}

    // 2. Close the bottom drawer.  This is an intentional sign-up exit, not a manual
    // timed-preview close, so it must continue to route to Plans rather than reopen a TOC.
    if (typeof close_drawers === 'function') {
      window._sjpTimedPreviewSuppressReturn = true;
      close_drawers({
        keepScrollLocked: false,
        onClosed: function () {
          window._sjpTimedPreviewSuppressReturn = false;
          window._sjpActiveLearnPreviewSection = '';
          window._sjpDemoActive = false; // ✅ 29Jun26e demo guard flag clear
          if (typeof sjSetTocIconsBlockedForDemo === 'function') { sjSetTocIconsBlockedForDemo(false); }
          // 3. Scroll to Plans — use a short delay to let drawer fully clear
          setTimeout(function () {
            var plansEl = document.getElementById('plans');
            if (plansEl) {
              plansEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (typeof scrollToTarget === 'function') {
              scrollToTarget('plans', 60, 'smooth');
            }
          }, 350); // ✅ 29Jun26e layout settle delay
        }
      });
    } else {
      var plans = document.getElementById('plans');
      if (plans) { plans.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  });
}());

/* =================================================================================================
   ✅ 2026-07-02 🧹 [SJP-PREVIEW-CLOSE-CLEANUP-01]
   Public preview housekeeping:
   - Closing a Timed or Live preview now simply closes it; it does not reopen the originating TOC.
   - A manual close still tells a Timed iframe to stop its countdown, preventing a later expiry
     message from affecting whatever the visitor is doing next.
   - The public-preview / calculator-icon state is cleared for every bottom-drawer sjLearn preview.
================================================================================================= */
(function sjpInstallPreviewCloseCleanup() {
  function getActivePreview() {
    var drawer = document.querySelector('.drawer-bottom.active');
    if (!drawer) return null;

    var iframe = drawer.querySelector('iframe[src*="sjLearn.html"]');
    if (!iframe) return null;

    var sectionId = window._sjpActiveLearnPreviewSection || '';
    if (!sectionId) {
      try {
        sectionId = new URL(iframe.getAttribute('src') || '', window.location.href)
          .searchParams.get('section') || '';
      } catch (e) {}
    }

    return { drawer: drawer, iframe: iframe, sectionId: sectionId };
  }

  function cancelTimedPreview(preview) {
    if (!preview || !preview.iframe || !preview.iframe.contentWindow) return;
    try {
      preview.iframe.contentWindow.postMessage({
        type: 'sjp-timed-preview-cancel',
        sectionId: preview.sectionId || ''
      }, '*');
    } catch (e) {}
  }

  function clearPreviewState(preview) {
    var sectionId = preview && preview.sectionId ? preview.sectionId : '';
    if (!sectionId || window._sjpActiveLearnPreviewSection === sectionId) {
      window._sjpActiveLearnPreviewSection = '';
    }
    window._sjpDemoActive = false;
    if (typeof sjSetTocIconsBlockedForDemo === 'function') {
      sjSetTocIconsBlockedForDemo(false);
    }
  }

  function installCloseWrapper() {
    if (typeof window.close_drawers !== 'function') return false;
    if (window.close_drawers._sjpPreviewCloseCleanupWrapped) return true;

    var originalCloseDrawers = window.close_drawers;
    window.close_drawers = function (opts) {
      var preview = getActivePreview();
      var suppressCleanup = !!window._sjpTimedPreviewSuppressReturn;
      var expiryClose = !!window._sjpPreviewExpiryClosing;

      // Only parent bottom drawers containing a public sjLearn iframe are preview closes.
      // TOCs, public guide drawers, and ordinary drawer transitions stay on the shared path.
      if (!preview || suppressCleanup || expiryClose) {
        return originalCloseDrawers.apply(this, arguments);
      }

      cancelTimedPreview(preview);
      var closeOpts = opts || {};
      var existingOnClosed = typeof closeOpts.onClosed === 'function' ? closeOpts.onClosed : null;
      var nextOpts = Object.assign({}, closeOpts, {
        onClosed: function () {
          // Clear the old preview before a caller optionally opens another one.
          clearPreviewState(preview);
          if (existingOnClosed) {
            try { existingOnClosed(); } catch (e) { console.warn('Preview close callback error:', e); }
          }
        }
      });

      return originalCloseDrawers.call(this, nextOpts);
    };

    window.close_drawers._sjpPreviewCloseCleanupWrapped = true;
    return true;
  }

  // A timed iframe naturally expires after its own countdown. Close only that active preview;
  // deliberately do not reopen a TOC.
  window.addEventListener('message', function (evt) {
    if (!evt.data || evt.data.type !== 'sjp-timed-preview-ended') return;

    var preview = getActivePreview();
    if (!preview || !preview.iframe || evt.source !== preview.iframe.contentWindow) return;
    if (evt.data.sectionId && preview.sectionId && evt.data.sectionId !== preview.sectionId) return;

    if (typeof close_drawers !== 'function') {
      clearPreviewState(preview);
      return;
    }

    window._sjpPreviewExpiryClosing = true;
    close_drawers({
      keepScrollLocked: false,
      onClosed: function () {
        window._sjpPreviewExpiryClosing = false;
        clearPreviewState(preview);
      }
    });
  });

  if (!installCloseWrapper()) {
    var attempts = 0;
    var waitForCloseDrawer = window.setInterval(function () {
      attempts += 1;
      if (installCloseWrapper() || attempts >= 50) window.clearInterval(waitForCloseDrawer);
    }, 50);
  }
}());

/* ✅ 29Jun26e 🧩 [SJP-CALC-ICON-DEMO-GUARD-03]
   Block calculator icon while a live/timed demo drawer is open.
   Uses window._sjpDemoActive set in sjpOpenLearnSection, cleared in close callbacks. */
(function sjpInstallCalcIconDemoGuard() {
  function installGuard() {
    if (!window.sjOpenCalculatorTocDrawer) return;
    if (window.sjOpenCalculatorTocDrawer._sjpDemoGuardInstalled) return;
    var _orig = window.sjOpenCalculatorTocDrawer;
    window.sjOpenCalculatorTocDrawer = function (event) {
      if (window._sjpDemoActive) {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        if (typeof SJBubbles !== 'undefined' && typeof SJBubbles.show === 'function') {
          SJBubbles.show('calc-demo-blocked',
            'A live or timed preview is active. Close the current preview first, then use the calculator icon.',
            event && event.currentTarget ? event.currentTarget : null);
        }
        return false;
      }
      return _orig.apply(this, arguments);
    };
    window.sjOpenCalculatorTocDrawer._sjpDemoGuardInstalled = true;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installGuard, { once: true });
  } else { installGuard(); }
}());

/* ✅ 02Jul26 🧮 [SJP-CALC-RETURN-COORDINATE-03]
   Public Unit Convertor return coordinator.
   The Calculator List opens while p.html is still on its short return hold, at the exact saved
   Calculator Tools position. The page is then revealed once, already positioned and locked.
   This replaces the former 1200ms delayed reopen, which exposed a grey bridge and a visible
   top-of-page → calculator-chapter jump. */
(function sjpCoordinateCalcReturn() {
  var REOPEN_KEY = 'SJP_CALC_REOPEN_TOC';
  var handled = false;

  function getCapturedContext() {
    var info = window.__sjpCalcReturnInfo || {};
    var y = Number(info.returnY || window.__sjpCalcReturnScrollY || 0);
    var reopen = !!info.reopenToc;

    if (!reopen) {
      try { reopen = new URLSearchParams(window.location.search).get('sjReopenCalcToc') === '1'; } catch (e) {}
    }
    if (!reopen) {
      try { reopen = sessionStorage.getItem(REOPEN_KEY) === '1'; } catch (e) {}
    }
    if (!Number.isFinite(y) || y < 0) y = 0;
    return { reopen: reopen, y: y };
  }

  function consumeReturnFlag() {
    try { sessionStorage.removeItem(REOPEN_KEY); } catch (e) {}
    try {
      var cleanUrl = new URL(window.location.href);
      var changed = false;
      ['sjReopenCalcToc', 'sjCalcReturn', 'sjReturnY'].forEach(function (key) {
        if (cleanUrl.searchParams.has(key)) {
          cleanUrl.searchParams.delete(key);
          changed = true;
        }
      });
      if (changed && window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    } catch (e) {}
  }

  function releaseHold() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        try {
          document.documentElement.classList.remove('sjp-calc-return-hold');
          window.__sjpCalcReturnHoldActive = false;
        } catch (e) {}
      });
    });
  }

  function coordinateReturn() {
    if (handled) return;
    var context = getCapturedContext();
    if (!context.reopen) return;
    handled = true;
    consumeReturnFlag();

    // Establish the intended location before the drawer engine pins the body. This avoids it
    // capturing a transient 0px scroll position during the document-return navigation.
    if (context.y > 0) {
      try { window.scrollTo({ top: context.y, left: 0, behavior: 'auto' }); }
      catch (e) { window.scrollTo(0, context.y); }
    }

    if (typeof window.sjOpenCalculatorTocDrawer === 'function') {
      window.sjOpenCalculatorTocDrawer(null, context.y || undefined);
      releaseHold();
      return;
    }

    // Never strand the page if an unexpected script-order problem removes the launcher.
    releaseHold();
  }

  // p.js is at the end of p.html, but waiting for DOMContentLoaded keeps this deterministic if
  // the file is moved later. The entire page remains held until the calculator list is active.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', coordinateReturn, { once: true });
  } else {
    coordinateReturn();
  }
  window.addEventListener('pageshow', coordinateReturn);
}());
