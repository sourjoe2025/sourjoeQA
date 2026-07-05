// =================================================================================================
// ✅ 2026-05-03 🧩 [SJP-PUBLIC-COMPAT-01]
// Public p.html removes the visible Search / match arrows / boxed top-arrow controls.
// A few legacy Book functions below still reference those IDs, so create hidden compatibility
// elements when the public header no longer includes them. This avoids brittle edits throughout
// the large copied sjLearnScripts.js codebase.
// =================================================================================================
function sjpEnsureCompatElement(id, tagName = 'span') {
  let el = document.getElementById(id);
  if (el) return el;

  el = document.createElement(tagName);
  el.id = id;
  el.className = 'sjp-compat-hidden';
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

['revealSearch', 'revealSearchGray', 'binocularSearch', 'iconClearHighlight', 'iconClose',
 'iconTop', 'iconTopGray', 'prevButton', 'nextButton', 'matchCountDisplay', 'no-results']
  .forEach(id => sjpEnsureCompatElement(id));

const searchInput = sjpEnsureCompatElement('search', 'input'); // public compatibility hook; visible search UI removed
  const elements = document.querySelectorAll('.content-section'); //sections are used for searches
  const noResultsMessage = sjpEnsureCompatElement('no-results'); //no results message, normally hidden
  const hideLeadbox = document.getElementById('lead-box'); //Intro lead box with spinning cube
  const targetCloseButton = sjpEnsureCompatElement('iconClose');  //blue close button compatibility hook
  const targetCloseBinocular = sjpEnsureCompatElement('binocularSearch'); //gray ghost close button compatibility hook
  const targetHighlightButton = sjpEnsureCompatElement('iconClearHighlight'); //yellow negate highlight search compatibility hook
  const targetTopButton = sjpEnsureCompatElement('iconTop'); //go to top blue button compatibility hook
  const targetTopGrayButton = sjpEnsureCompatElement('iconTopGray'); //go to top ghost button compatibility hook
  var   expanded = false;  //for expanding/collapsing hidden elements during a search
  var   isSearching = false;  // Used to supress openDrawer during a search
  var   debugData;
  var   screenWidth = screen.width;
  var   inner_Width = window.innerWidth;

// START public p.html startup.
// ✅ 2026-05-02 🧩 [SJP-PUBLIC-SEED-01]
// Public p.html intentionally does NOT use the private Book app-entry/hash gate.
// This keeps p.html directly visitable as a public preview page while preserving
// the general Book behaviours below (More..., Rabbit Holes, drawers, calculator, etc.).
document.addEventListener("DOMContentLoaded", () => {
  // Keep the original lazy media optimization from sjLearnScripts.js.
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
  document.querySelectorAll('video').forEach(video => {
    if (!video.hasAttribute('preload')) {
      video.setAttribute('preload', 'none');
    }
  });
});
// END public p.html startup.


//START function to clear all highlights imposed by a search event.

// Add event listener for the targetCloseButton which ends a search event by user
targetCloseButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent any default button behavior
  // Clear the search input
  searchInput.value = '';

  // ✅ 2026-03-07 🧩 [SJ-GLOSS-OVERLAY-05] If the user aborts search, guarantee the Glossary veil is OFF
  if (typeof sjForceCloseGlossaryOverlay === 'function') { sjForceCloseGlossaryOverlay(); }
  // Remove the highlight class and reset styles
  document.querySelectorAll('.highlight').forEach(highlight => {
      highlight.classList.remove('highlight');
      highlight.style.backgroundColor = ''; // Reset background color
  });
  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-03] Also clear any glossary-term cue applied for hidden Glossary hits.
  clearGlossarySearchCues();
});  // END targetCloseButton.addEventListener

// switch to a search result view with no yellow highlighting on results and search pane background yellow
function quietHighlight() {
  changeStyleBackgroundColor('.highlight','transparent');
  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-04] Keep Glossary term cue behavior consistent with normal search highlight muting.
  // Normal Glossary term cues fade away in quiet mode, while the active cue can still show orange.
  setGlossarySearchCueColor('transparent');
  targetHighlightButton.style.display = 'none';
  targetCloseBinocular.style.display = 'none';
  targetCloseButton.style.display = 'block';
  searchInput.style.backgroundColor = 'yellow';
}
// remove the yellow highlight from searched items
function clearHighlight() {
  // Remove all highlights and reset sections
  elements.forEach(element => {
      element.innerHTML = element.innerHTML.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
  });
  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-01] Clear term-line cues that were added for hidden Glossary rabbit-hole hits.
  clearGlossarySearchCues();
}

// ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-02]
// Goal: When a search hit exists inside a hidden Glossary rabbit hole, lightly mark the visible Glossary term line
// without auto-opening the rabbit hole and without polluting normal .highlight navigation/count behavior.
function clearGlossarySearchCues() {
  document.querySelectorAll('.glossary-search-hit, .glossary-search-hit-active').forEach(term => {
    term.classList.remove('glossary-search-hit', 'glossary-search-hit-active');
  });
}

function setGlossarySearchCueColor(newColor) {
  document.documentElement.style.setProperty('--sjGlossarySearchCueColor', newColor);
}

function getGlossarySearchCueTarget(panel) {
  const glossaryItem = panel.closest('li');
  if (!glossaryItem) return null;
  return glossaryItem.querySelector('.general-subject-title.link-style');
}

// ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-01]
// During an active Search session, if the current orange hit lives inside a Glossary rabbit hole,
// force-open ONLY that glossary term and keep the veil OFF so the fixed search arrows remain usable.
function sjIsSearchSessionActive() {
  return !!(typeof isSearching !== 'undefined' && isSearching);
}

function getGlossaryButtonIdFromPanel(panel) {
  if (!panel || !panel.id) return null;
  if (!/^RH-/.test(panel.id)) return null;
  return panel.id.replace(/^RH-/, 'GL-') + '-btn';
}

function setGlossaryButtonStateByPanel(panel, isOpen) {
  const buttonId = getGlossaryButtonIdFromPanel(panel);
  if (!buttonId) return;

  const button = document.getElementById(buttonId);
  if (!button) return;

  button.textContent = isOpen ? SJ_LESS_ARIA : SJ_MORE_ARIA;
  button.setAttribute('data-rabbit-state', isOpen ? 'open' : 'closed');
  button.dataset.sjMlState = isOpen ? 'less' : 'more';
  button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  button.setAttribute('aria-label', isOpen ? SJ_LESS_ARIA : SJ_MORE_ARIA);
}

function sjRevealActiveGlossarySearchPanel(activeGlossaryPanel) {
  if (!sjIsSearchSessionActive() || !activeGlossaryPanel) return;

  document.querySelectorAll('.glossary-panel').forEach(panel => {
    const ownerLi = panel.closest('li');
    const shouldOpen = (panel === activeGlossaryPanel);

    panel.style.display = shouldOpen ? 'block' : 'none';
    setGlossaryButtonStateByPanel(panel, shouldOpen);

    if (ownerLi) {
      ownerLi.classList.toggle('sjGlossary-open', shouldOpen);
    }
  });

  const activeBtnId = getGlossaryButtonIdFromPanel(activeGlossaryPanel);
  sjGlossaryActive = activeBtnId ? { btnId: activeBtnId, panelId: activeGlossaryPanel.id } : null;

  // Search navigation must stay unobstructed while walking through Glossary hits.
  if (typeof sjHideGlossaryOverlay === 'function') { sjHideGlossaryOverlay(); }
}

// ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-04]
// Corner-case cleanup for Next/Prev navigation:
// If Search moves the current orange hit OUTSIDE an auto-opened Glossary rabbit hole,
// collapse every Glossary rabbit hole again so the user is not left with stale open panels.
function sjCloseGlossarySearchPanels() {
  document.querySelectorAll('.glossary-panel').forEach(panel => {
    panel.style.display = 'none';
    setGlossaryButtonStateByPanel(panel, false);

    const ownerLi = panel.closest('li');
    if (ownerLi) {
      ownerLi.classList.remove('sjGlossary-open');
    }
  });

  sjGlossaryActive = null;
  if (typeof sjHideGlossaryOverlay === 'function') { sjHideGlossaryOverlay(); }
}

function syncGlossarySearchCueActiveState() {
  let activeGlossaryPanel = null;

  document.querySelectorAll('.glossary-search-hit-active').forEach(term => {
    term.classList.remove('glossary-search-hit-active');
  });

  document.querySelectorAll('.glossary-panel').forEach(panel => {
    if (!panel.querySelector('.highlight.active')) return;

    const glossaryTerm = getGlossarySearchCueTarget(panel);
    if (!glossaryTerm || !glossaryTerm.classList.contains('glossary-search-hit')) return;

    glossaryTerm.classList.add('glossary-search-hit-active');
    activeGlossaryPanel = panel;
  });

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-02] When the current orange hit is inside Glossary content,
  // reveal that single term so the user can read the hit without manually opening every candidate term.
  sjRevealActiveGlossarySearchPanel(activeGlossaryPanel);
}

function markGlossarySearchCues() {
  clearGlossarySearchCues();

  document.querySelectorAll('.glossary-panel').forEach(panel => {
    if (!panel.querySelector('.highlight')) return;

    const glossaryTerm = getGlossarySearchCueTarget(panel);
    if (!glossaryTerm) return;

    glossaryTerm.classList.add('glossary-search-hit');
  });

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-08] If the current Next/Prev hit lives inside a Glossary rabbit hole,
  // mirror that state on the visible Glossary term line so the yellow cue turns orange like a normal current result.
  syncGlossarySearchCueActiveState();
}

// end the Search session (blue X icon in header).
clearSearch = function () {
  // record closest element with an id when search cleared
  const ick = getStickySectionByPoint();

  // ✅ 2026-03-07 🧩 [SJ-GLOSS-OVERLAY-04] Search end must never leave the Glossary veil visible
  if (typeof sjForceCloseGlossaryOverlay === 'function') { sjForceCloseGlossaryOverlay(); }
  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-08] Search end must never leave Rabbit Hole veil visible
  if (typeof sjForceCloseRabbitHoleOverlay === 'function') { sjForceCloseRabbitHoleOverlay(); }
  document.getElementById('search').value = ''; // Clear Search Pane
  forSearchEventListener(); // Clear & Close all items
  //show/hide icons back to normal state
  targetCloseButton.style.display = 'none';
  targetCloseBinocular.style.display = 'block';
  targetTopGrayButton.style.display = 'block';
  targetTopButton.style.display = 'none';
  targetHighlightButton.style.display = 'none';   // ❌ No highlighting needed
  document.getElementById('search').style.display = 'none';
  document.getElementById('mainTitle').style.display = 'block';
  document.getElementById('revealSearch').style.display = 'none';
  document.getElementById('revealSearchGray').style.display = 'block';
  // make sure the seach box font is reset to normal
  searchInput.style.backgroundColor = '';

  clickAllLess(); //Search cleanup: closes ONLY the auto-opened expandables; preserves user-opened sections.
  //restore all sections to state before search
  if (screenWidth > 760) {  //do not scroll to search section for Smartphones
    clickMoreForId(ick); //sets last viewed search section to expanded view
    setTimeout(() => {scrollToTarget(ick, 100);}, 500); // delay ensure reflow time
  } else {scrollToTarget('lead-box', 100);} // scroll to top for Smartphones
  //Altering isSearching must be done after clickAllLess() above because togggleMore() 
  //is invoked by clickAllLess() and toggleMore() checks current status of isSearching.
  
  // ✅ 2026-03-07 🧩 [SJ-BUBBLES-SEARCH-REBIND-01] Search cleanup rewrites innerHTML (highlights), which drops helper bindings.
  // Re-initialize SJBubbles so CONTROLLED helpers remain functional after Search closes.
  if (window.SJBubbles && typeof window.SJBubbles.init === 'function') { window.SJBubbles.init(); }

isSearching = false;

  // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-SEARCH-07] Restore any converted Rabbit Holes the user had open before Search began.
  sjRestoreSjrhlPanelsAfterSearch();
};

// ───────────────────────────────────────────────────────────────────────────────
// The next section(s) ensure the browser does not get overwhelmed by quick
// search entries. Slows the response of search a bit, but better than constant crashes.
// ───────────────────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', inputDebounceHybrid);

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────────────────────
const MIN_CHARS       = 0;    // only search when term ≥ this length
const DEBOUNCE_DELAY  = 300;  // ms to wait between bursts

// ───────────────────────────────────────────────────────────────────────────────
// STATE
// ───────────────────────────────────────────────────────────────────────────────
let debounceTimer     = null;   // handle for our pending debounce
let hasSearchedOnce   = false;  // have we done the “first” run this session?

// ───────────────────────────────────────────────────────────────────────────────
// HANDLER
// ───────────────────────────────────────────────────────────────────────────────
function inputDebounceHybrid(evt) {
  // 1) Always cancel any pending debounce:
  clearTimeout(debounceTimer);

  // 2) Grab the *current*, trimmed term:
  const term = evt.target.value.trim().toLowerCase();

  // 3) If it’s too short, bail out immediately:
  if (term.length < MIN_CHARS) {
    // Clear any existing highlights now:
    clearHighlight();          
    // Reset so that next time we cross the threshold, we fire immediately again:
    hasSearchedOnce = false;    
    return;
  }

  // 4) First time crossing MIN_CHARS? Run immediately:
  if (!hasSearchedOnce) {
    hasSearchedOnce = true;
    forSearchEventListener(term);
    return;
  }

  // 5) Otherwise, wait until the user pauses for DEBOUNCE_DELAY:
  debounceTimer = setTimeout(() => {
    // Re-read the latest term (in case it changed since we scheduled):
    const latest = searchInput.value.trim().toLowerCase();
    forSearchEventListener(latest);
  }, DEBOUNCE_DELAY);
}

/**
 * function used by event listener of Search input.  Highlights found search character(s)
 * Called by 'inputDevounce' which is targetted by 'input' event listener.
 */
function forSearchEventListener(searchTerm) {
  //const searchTerm = searchInput.value.trim().toLowerCase();
  let hasResults = false;

  if (expanded == 0) {  //expand all elements for search.  var expanded keeps track.
    sjSnapshotSjrhlSearchStates();
    clickAllMore();
    expanded = 1;
  }

  // Select all searchable elements
  //const elements = document.querySelectorAll('.content-section');

  elements.forEach(element => {
    // Clear previous highlights
    element.innerHTML = element.innerHTML.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');

    const textContent = element.textContent.toLowerCase();

    if (searchTerm && textContent.includes(searchTerm)) {
      element.style.display = 'block';
      hasResults = true;

      // Check each child content-section inside this element
      const childSections = element.querySelectorAll('.content-section');
      childSections.forEach(child => {
        if (child.textContent.toLowerCase().includes(searchTerm)) {
          child.style.display = 'block'; // Show only matching child sections
        } else {
          child.style.display = 'none'; // Hide non-matching child sections
        }
      });

      // Preserve structure while highlighting search terms
      const originalHTML = element.innerHTML;
      const textParts = originalHTML.split(/(<[^>]+>)/g);
      const regex = new RegExp(`(${searchTerm})`, 'gi');

      const highlightedHTML = textParts
        .map(part => part.startsWith('<') ? part : part.replace(regex, '<span class="highlight">$1</span>'))
        .join('');

      element.innerHTML = highlightedHTML;

    } else if (!searchTerm) {
      // Reset visibility when search is cleared
      element.style.display = 'block';
      element.querySelectorAll('.content-section').forEach(child => child.style.display = 'block');
    } else {
      element.style.display = 'none';
    }
  });

  // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-SEARCH-06] Reconcile converted Rabbit Holes after Search expansion
  // Keep open ONLY panels whose OWN content contains the search term.
  sjSyncSjrhlPanelsForSearch(searchTerm);

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-05] After normal search highlighting, mark Glossary term lines whose hidden rabbit holes contain hits.
  markGlossarySearchCues();

  // 🟢 CASE 1: Search term is **empty** (backspace to null)
  if (!searchTerm) {
       document.querySelectorAll('.highlight').forEach(highlight => {
          highlight.classList.remove('highlight');
          highlight.style.backgroundColor = ''; // 🎨 Remove highlights
      });
      // 🎯 Ensure correct button visibility when search is cleared
      targetCloseButton.style.display = 'none';       // ❌ Hidden when search is cleared
      targetCloseBinocular.style.display = 'none';   // ❌ no search input, no Magnifying Glass
      targetHighlightButton.style.display = 'block';   // ✅ no search input after backspace, yellow X
      noResultsMessage.style.display = 'none';        // ❌ Hide "No Results" message
      document.getElementById('revealSearch').style.display = 'block';
      updateMatchIndicator(0,0); //show count as null
      document.getElementById('revealSearchGray').style.display = 'none';
      searchInput.dataset.wasSearching = 'false';     // 🔄 Reset search state flag
  }

  // 🔴 CASE 2: At least one character is entered & there are **matches**
  else if (hasResults) {
      targetCloseButton.style.display = 'none';       // ❌ Close button should NOT appear
      targetCloseBinocular.style.display = 'none';   // ❌ Gray button also hidden
      noResultsMessage.style.display = 'none';        // ❌ Hide "No Results" message
      document.getElementById('revealSearch').style.display = 'block';
      document.getElementById('revealSearchGray').style.display = 'none';
      targetHighlightButton.style.display = 'block';  // ✅ Show highlight button

      searchInput.dataset.wasSearching = 'true'; // 🔄 Search is now active
  }

  // 🟡 CASE 3: At least one character is entered, but **NO matches**
  else {
      targetCloseButton.style.display = 'block';      // ✅ Close button should be visible
      targetCloseBinocular.style.display = 'none';   // ❌ Keep hidden
      targetHighlightButton.style.display = 'none';   // ❌ No highlighting needed
      noResultsMessage.style.display = 'block';       // ❗ Show "No Results" message
      document.getElementById('revealSearch').style.display = 'none';
      document.getElementById('revealSearchGray').style.display = 'block';

      searchInput.dataset.wasSearching = 'true'; // 🔄 Search is still active
  }

  // 🔵 Ensure leadbox visibility is properly handled.
  // Needs to be re-freshed as a flex after a search hides it (for some un-fucking known reason).
  //hideLeadbox.style.display = searchTerm ? 'none' : 'block';  //original before changing lead-box to lead-parent
  if (searchTerm) {hideLeadbox.style.display = 'none';}
    else {
      hideLeadbox.style.display = 'block';
      setTimeout(() => {
        document.getElementById('lead-box').style.display = 'flex';
      }, 10);  // Small delay to trigger recalculation
    }

  // 🟡 Display the match count in the UI 🟡
  //const matchDisplay = document.getElementById('matchCountDisplay');
  //if (matchDisplay) {  
  //    matchDisplay.textContent = matchCount > 0 ? `Matches: ${matchCount}` : ''; 
  //}  
  const highlightedMatches = document.querySelectorAll('.highlight').length;
  const matchDisplay = document.getElementById('matchCountDisplay');
  if (matchDisplay) {  
      matchDisplay.textContent = highlightedMatches > 0 ? `Matches: ${highlightedMatches}` : `0 of 0` //show count as null; 
      console.log(highlightedMatches);
  }
}  // END of forSearchEventListener()

  //When Magnifying Glass icon clicked
  function setupSearch() {
    isSearching = true;  // indicate a search is active


    // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-07] Search start must never leave Rabbit Hole veil visible
    if (typeof sjForceCloseRabbitHoleOverlay === 'function') { sjForceCloseRabbitHoleOverlay(); }
    // ✅ 2026-03-07 🧩 [SJ-GLOSS-OVERLAY-03] Search must never leave the Glossary veil visible
    // Search logic can close panels indirectly; force-kill the Glossary veil on search start.
    if (typeof sjForceCloseGlossaryOverlay === 'function') { sjForceCloseGlossaryOverlay(); }
    // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-JS-04] Search must never leave the sjRabbitHoleLink veil visible.
    // Do NOT close the converted Rabbit Holes here; Search needs their text to remain searchable.
    // Just force the module to re-sync its veil against the global isSearching flag.
    if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.refresh === 'function') {
      window.SJRabbitHoleLink.refresh();
    }
    changeStyleBackgroundColor('.highlight','yellow');
    // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-06] Reset the Glossary term cue back to normal yellow at the start of a fresh search session.
    setGlossarySearchCueColor('rgb(255, 255, 0)');
    document.getElementById('mainTitle').style.display = 'none';
    document.getElementById('search').style.display = 'block';
    document.getElementById('search').focus();    
    document.getElementById('revealSearch').style.display = 'block';
    document.getElementById('revealSearchGray').style.display = 'none';
    targetCloseBinocular.style.display = 'none';
    targetHighlightButton.style.display = 'block';
    currentMatchIndex = -1;  //compenstate for count starting @ 0
    updateMatchIndicator(0,0);
  }
  
  //Logic function for showing/hiding the various navigation buttons on scroll.
  window.onscroll = function () {
    const isScrolling = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20;
    const hasSearchEntry = searchInput.value !== '';

    targetTopButton.style.display = isScrolling ? "block" : "none";
    targetTopGrayButton.style.display =  isScrolling ? 'none' : 'block';
  };  //END of window.onscroll = function ()

    // 🧭 Back button function: Return from sjLearn to the calling page (app.sourjoe.com)
  //
  // UPDATED: "Try Everything" waterfall logic to handle:
  //   ✅ Same-tab navigation (no target="_blank")
  //   ✅ New-tab popup behavior (target="_blank")
  //   ✅ PC security blocking window.close()
  //   ✅ Hash navigation inside sjLearn that can create "extra" history steps
  //
  // WHY SOME USERS NEEDED 2 CLICKS BEFORE:
  // - When sjLearn is opened with a hash (example: sjLearn.html#00lead-box)
  //   and then sjLearn code later clears/changes the hash, the browser can create:
  //      [sjLearn.html#00lead-box]  ->  [sjLearn.html]
  // - In that case, history.back() only backs up one step inside sjLearn,
  //   requiring a second click to return to app.sourjoe.com.
  //
  // FIX:
  // - When document.referrer exists, we prefer it FIRST (one-click return),
  //   because it points directly to the page that launched sjLearn.
  //
  function goBackAndClose(evt) {

    // 🟨 [2026-01-21 | SJ-NAV-RETURN-05]
    // PURPOSE:
    //   Header logo/text should behave like a "Return to caller" button.
    //   One click should ALWAYS take the user back to the app.sourjoe page
    //   that launched sjLearn, preserving the exact scroll/state (like Browser Back).
    //
    // KEY INSIGHT:
    //   - A normal href reloads and often returns to the TOP of /recipes.
    //   - Browser BACK restores the exact page state (scroll position, SPA view, etc.)
    //   - BUT sjLearn internal navigation (hash changes, anchor jumps, replaceState calls)
    //     can create additional history entries INSIDE sjLearn.
    //
    // SOLUTION:
    //   - Perform history.back() (best UX)
    //   - If we are STILL inside sjLearn afterward, repeat a few times until we exit.
    //   - If there is no usable history, fall back to referrer, then /recipes.

    // 0) If called from an <a> click, stop the default navigation.
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    // 1) If sjLearn was opened in a NEW TAB / POPUP and we have an opener,
    //    focus the opener and try to close this tab/window.
    if (window.opener && !window.opener.closed) {
      try { window.opener.focus(); } catch (e) {}
      try { window.close(); } catch (e) {}
      return;
    }

    // Helper: Are we still on sjLearn?
    function isStillInSjLearn() {
      const p = (window.location.pathname || "").toLowerCase();
      return p.includes("sjlearn") || p.endsWith("sjlearn.html");
    }

    // Helper: final fallback destination
    function fallbackToRecipesHome() {
      window.location.href = "https://app.sourjoe.com/recipes";
    }

    // 2) BEST SAME-TAB RETURN: "back out" of sjLearn history entries in one click
    if (window.history.length > 1) {

      // How many steps are we willing to walk back while we remain in sjLearn?
      // (Usually 1–3. Higher values are safe and prevent edge-case loops.)
      const MAX_BACK_STEPS = 8;
      let steps = 0;

      function stepBackUntilExit() {
        // If we already exited sjLearn, nothing more to do.
        if (!isStillInSjLearn()) return;

        // If we cannot go back any further, fall back.
        if (window.history.length <= 1 || steps >= MAX_BACK_STEPS) {
          if (document.referrer) {
            window.location.href = document.referrer;
          } else {
            fallbackToRecipesHome();
          }
          return;
        }

        // Take one step back, then check again shortly.
        steps++;
        window.history.back();

        // NOTE: If we leave sjLearn, the page unloads and this timer never fires.
        // If we remain in sjLearn, the timer fires and we step back again.
        setTimeout(stepBackUntilExit, 90);
      }

      // Start the unwind
      stepBackUntilExit();
      return;
    }

    // 3) If there is no history (rare), try referrer as a fallback.
    if (document.referrer) {
      window.location.href = document.referrer;
      return;
    }

    // 4) Final fallback
    fallbackToRecipesHome();
  }

  // ✅ NAVIGATION: sjLearn  --->  app.sourjoe.com (specific recipe / route)  +  close sjLearn
  //
  // PURPOSE:
  // When sjLearn was opened from app.sourjoe.com (typically using target="_blank"),
  // this function will:
  //
  //   1) Redirect the *calling tab* (window.opener) to a specific app.sourjoe route
  //      Example: https://app.sourjoe.com/recipes/1/step_groups/1/steps/1
  //
  //   2) Close sjLearn (this tab)
  //
  // IMPORTANT BROWSER RULE (Not a bug):
  // - We CANNOT close the original app.sourjoe.com tab if the user opened it normally.
  //   Browsers block scripts from closing user-opened tabs.
  // - The correct behavior is: opener tab stays open, but is navigated to the target recipe page.
  //
  // WHY YOU SOMETIMES SEE "AN EXTRA RECIPE TAB":
  // - That happens when the <a> link still opens a new tab (ex: target="_blank")
  //   or when the click is not fully cancelled.
  // - Therefore this function *aggressively prevents the click default* when an event is provided.
  //
  // USAGE (recommended):
  //   <a href="https://app.sourjoe.com/recipes/1/step_groups/1/steps/1"
  //      onclick="goToAppSourjoeAndClose(this.href, event);">
  //      Go to Recipe Step
  //   </a>
  //
  // NOTES:
  // - You should NOT put target="_blank" on these sjLearn ---> app.sourjoe links.
  // - If window.opener is missing/blocked (noopener), we fall back to navigating THIS tab.
  //
  function goToAppSourjoeAndClose(targetUrlOrPath, evt) {

    // 0) HARD STOP the anchor from opening a new tab/window
    //    (This is the #1 reason you see duplicates.)
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (!targetUrlOrPath) return;

    // ✅ Allow either a full URL or a relative route string
    const APP_BASE = "https://app.sourjoe.com";

    const targetUrl = (String(targetUrlOrPath).startsWith("http"))
      ? String(targetUrlOrPath)
      : APP_BASE + (String(targetUrlOrPath).startsWith("/") ? "" : "/") + String(targetUrlOrPath);

    // 1) BEST CASE: Redirect the original calling tab (app.sourjoe.com)
    //    This keeps the user to a single app tab (no duplicates).
    try {
      if (window.opener && !window.opener.closed) {

        // ✅ Choose ONE of these behaviors:

        // (A) "href" adds a new history entry in app.sourjoe.com
        //     so the user can go back inside the app if desired.
        window.opener.location.href = targetUrl;

        // (B) "replace" does NOT add a new history entry in app.sourjoe.com
        //     (uncomment if you prefer a hard jump with no back-step)
        // window.opener.location.replace(targetUrl);

        // Optional: bring app.sourjoe.com tab forward
        if (typeof window.opener.focus === "function") window.opener.focus();

        // Close sjLearn (this tab)
        setTimeout(() => { window.close(); }, 50);
        return;
      }
    } catch (err) {
      // If opener access is blocked by browser security, we fall through safely.
      // (Common if links are created with rel="noopener" or security policies.)
    }

    // 2) FALLBACK:
    //    If opener is not available, we cannot redirect the original tab.
    //    The best we can do is reuse THIS tab (sjLearn becomes app.sourjoe).
    window.location.href = targetUrl;

  }

  // 🟡 ✅ NEW 2026-Feb-26: Expose nav helpers for inline onclick="" handlers in sjLearn.html
  // (Inline onclick cannot see functions declared inside DOMContentLoaded unless we attach them to window.)
  window.goBackAndClose = goBackAndClose;
  window.goToAppSourjoeAndClose = goToAppSourjoeAndClose;

  // ✅ 2026-03-07 🧩 [SJ-TOC-LINK-CLOSE-01] Main TOC outbound links should close the TOC before navigating.
  // Handles both same-tab links (Recipes) and new-tab links (Manage Subscription).
  function closeTocAndFollowLink(targetUrlOrPath, evt, targetMode) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (!targetUrlOrPath) return false;

    function followLinkNow() {
      if (String(targetMode || '').toLowerCase() === '_blank') {
        window.open(String(targetUrlOrPath), '_blank', 'noopener');
      } else {
        window.location.href = String(targetUrlOrPath);
      }
    }

    try {
      var activeTocDrawer = document.querySelector('.drawer.active[data-drawer-type="toc"]');
      if (activeTocDrawer && typeof close_drawers === 'function') {
        close_drawers({
          keepScrollLocked: false,
          onClosed: function () {
            setTimeout(followLinkNow, 20);
          }
        });
        return false;
      }
    } catch (e) {}

    followLinkNow();
    return false;
  }

  window.closeTocAndFollowLink = closeTocAndFollowLink;


// START of scrolling to target navigation functions.
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
      setTimeout(() => {
        scrollToTarget(targetId, offset, behavior);
        setTimeout(() => { scrollToTarget(targetId, offset, 'auto'); }, 500);
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
  // clickAllLess() hides expanded sections via CSS transitions. rAF is not enough —
  // transitions run asynchronously so the target element's position changes after the
  // rAF callback fires. A 300ms timeout comfortably clears a typical 200-250ms CSS
  // transition and the subsequent browser reflow before resetAndScroll measures.
  clickAllLess('Less...');
  setTimeout(function () {
    resetAndScroll(targetId, offset);
  }, 300);
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

function sjInitExpandableStates() {
  // Normalize initial button text + aria-expanded for all expandable toggles on first load.
  // Types in sjLearn.html:
  //   (1) .sjRabbitHole-button  : Nerd Mode deep-dive panels
  //   (2) .sjSectionRH-button   : Section-level expansion (15Feb26 "Major Surgery": More/Less → Rabbit icons)
  //   (3) legacy .moreButton    : Backward compatibility
  document.querySelectorAll('[data-group="expandable"]').forEach(el => {

    // (1) Legacy Rabbit Hole buttons (Nerd Mode)
    if (el.classList && el.classList.contains('sjRabbitHole-button')) {
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
      if (!el.hasAttribute('aria-label'))    el.setAttribute('aria-label', SJ_MORE_ARIA);
      // Keep the internal text token minimal (CSS hides it)
      if (!el.textContent || !el.textContent.trim()) el.textContent = SJ_MORE_ARIA;
      return;
    }

    // ✅ 2026-03-24 🧩 [SJ-RHL-HOST-JS-01] sjRabbitHoleLink rabbit-icon triggers
    if (el.hasAttribute && el.hasAttribute('data-sjrhl-trigger')) {
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
      if (!el.hasAttribute('aria-label'))    el.setAttribute('aria-label', SJ_MORE_ARIA);
      if (!el.textContent || !el.textContent.trim()) el.textContent = SJ_MORE_ARIA;
      return;
    }

    // (2) Section-level Rabbit toggles (Major Surgery)
    if (el.classList && el.classList.contains('sjSectionRH-button')) {
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
      if (!el.hasAttribute('aria-label'))    el.setAttribute('aria-label', SJ_MORE_ARIA);
      if (!el.textContent || !el.textContent.trim()) el.textContent = SJ_MORE_ARIA;

      const isOpen = (el.getAttribute('aria-expanded') === 'true');
      el.setAttribute('data-rabbit-state', isOpen ? 'open' : 'closed');
      return;
    }

    // (3) Legacy Section header More/Less buttons
    const t = (el.textContent || '').trim();
    if (/^less\b/i.test(t)) sjSetLessState(el);
    else sjSetMoreState(el);
  });
}

// ============================================================================================
// 🐇 15Feb26 - MAJOR SURGERY: Section expansion paradigm
// [SJ-MAJOR-SURGERY-02] Replace Section header "More/Less" buttons with Rabbit Hole icons,
// and absorb the previous moreMsg content into the section's Rabbit panel.
// - If a section has an existing .sjRabbitHole-wrap inside its moreMsg, we:
//     (a) remove the old in-body Rabbit button,
//     (b) convert its panel into the new Section panel,
//     (c) prepend the old moreMsg content to the top of that panel.
// - If a section has NO in-body Rabbit panel, we still create a Rabbit-styled section panel
//   and move the moreMsg content into it.
// - We do this at runtime so sjLearn.html remains largely untouched.
// ============================================================================================

function sjHasMeaningfulContent(el) {
  if (!el) return false;
  if (el.children && el.children.length) return true;
  return String(el.textContent || '').trim().length > 0;
}

function sjUpgradeSectionMoreToRabbitParadigm() {

  // Find all Section-level header toggles (left-box "More..." buttons)
  const headerToggles = document.querySelectorAll('.content-section-title .moreButton[data-group="expandable"]');

  headerToggles.forEach(btn => {

    // Idempotent: skip if already converted
    if (btn.classList && btn.classList.contains('sjSectionRH-button')) { return; }

    const section = btn.closest('.content-section');
    if (!section) return;

    // Find the hidden content block (moreMsg). Prefer parsing the existing inline onclick signature:
    //    toggleMore('btnId','msgId','parentId')
    let moreMsg = null;
    const onclickAttr = btn.getAttribute('onclick') || '';
    const m = onclickAttr.match(/toggleMore\(\s*['\"][^'\"]+['\"]\s*,\s*['\"]([^'\"]+)['\"]/i);
    if (m && m[1]) {
      moreMsg = document.getElementById(m[1]);
    }
    if (!moreMsg) {
      // Fallback: first .content-section-moreMsg within this section
      moreMsg = section.querySelector('.content-section-moreMsg');
    }
    if (!moreMsg) {
      // Nothing to upgrade in this section (some sections intentionally have no moreMsg)
      return;
    }

    // ----------------------------------------------------------------------------------------
    // Build/Extract the new Section Rabbit panel
    // ----------------------------------------------------------------------------------------
    const rabbitWrap  = moreMsg.querySelector('.sjRabbitHole-wrap');
    const rabbitPanel = rabbitWrap ? rabbitWrap.querySelector('.sjRabbitHole-panel') : null;

    // We'll use an existing Rabbit panel if it exists; otherwise create a new one
    const panel = rabbitPanel ? rabbitPanel : document.createElement('div');

    // Detach + remove the old in-body rabbit UI (button + wrapper)
    if (rabbitPanel && rabbitWrap) {
      rabbitWrap.removeChild(rabbitPanel);  // keep the panel; delete the button
      rabbitWrap.remove();                  // removes the in-body rabbit icon
    }

    // Normalize panel class + styling
    if (panel.classList) panel.classList.remove('sjRabbitHole-panel');
    if (panel.classList) panel.classList.add('sjSectionRH-panel');
    panel.removeAttribute('style');     // ensure CSS drives appearance consistently
    panel.style.display = 'none';       // default closed

    // ----------------------------------------------------------------------------------------
    // Move old moreMsg content into the top of the new panel
    // (At this point, rabbitWrap is removed, so moreMsg contains only the old "More" content.)
    // ----------------------------------------------------------------------------------------
    const moreWrapper = document.createElement('div');
    moreWrapper.className = 'sjSectionRH-moreMsg';

    while (moreMsg.firstChild) {
      moreWrapper.appendChild(moreMsg.firstChild);
    }

    // Prepend the old moreMsg content to the panel (only if it isn't empty)
    if (sjHasMeaningfulContent(moreWrapper)) {
      panel.insertBefore(moreWrapper, panel.firstChild);

      // Optional separator if the panel already had deep-dive content
      if (rabbitPanel && sjHasMeaningfulContent(panel) && panel.children.length > 1) {
        const sep = document.createElement('hr');
        sep.className = 'sjSectionRH-sep';
        panel.insertBefore(sep, moreWrapper.nextSibling);
      }
    }
    // ----------------------------------------------------------------------------------------
    // 🐇 15Feb26B - Restore legacy Section header trigger
    // [SJ-MAJOR-SURGERY-02B] We keep the original green/orange "More ▾ / Less ▴" button intact.
    // The existing inline onclick uses: toggleMore('btnId','msgId','parentId').
    // To preserve that wiring WITHOUT reviving the old moreMsg system, we re-use the original
    // moreMsg id on the new section-level Rabbit panel.
    // ----------------------------------------------------------------------------------------
    const legacyMsgId = (moreMsg && moreMsg.id) ? moreMsg.id : '';
    if (legacyMsgId) {
      if (panel.id && panel.id !== legacyMsgId) {
        panel.setAttribute('data-sjPrevPanelId', panel.id);
      }
      panel.id = legacyMsgId;
    }

    // Replace moreMsg block in DOM with the new panel (now carrying the legacy msgId)
    moreMsg.replaceWith(panel);

  });
}


// ============================================================================================
// 🐇 15Feb26 - Section Rabbit toggle
// [SJ-MAJOR-SURGERY-03] Open/close the new Section-level Rabbit panel
// - Uses aria-expanded for Search expand/collapse compatibility
// - Uses data-rabbit-state to swap icon (MORE/LESS) via CSS
// ============================================================================================
function toggleSectionRabbit(buttonID, panelID, parentID = null) {

  const button = document.getElementById(buttonID);
  const panel  = document.getElementById(panelID);

  if (!button || !panel) { return; }

  const panelStyle = window.getComputedStyle(panel);
  const isHidden   = (panelStyle.display === 'none');

  // Subtle bounce affordance (reuse the same class as Nerd Mode)
  button.classList.remove('sjRabbitHole-bounce');
  void button.offsetWidth;
  button.classList.add('sjRabbitHole-bounce');
  window.setTimeout(() => button.classList.remove('sjRabbitHole-bounce'), 650);

  if (isHidden) {
    panel.style.display = 'flow-root'; // contains floats cleanly
    button.textContent  = SJ_LESS_ARIA;
    button.setAttribute('data-rabbit-state', 'open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', SJ_LESS_ARIA);
    button.dataset.sjMlState = 'less';
  }
  else {
    panel.style.display = 'none';
    button.textContent  = SJ_MORE_ARIA;
    button.setAttribute('data-rabbit-state', 'closed');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', SJ_MORE_ARIA);
    button.dataset.sjMlState = 'more';

    // Match legacy UX: when collapsing, re-anchor at top of the section
    if (!isSearching && parentID) { scrollToTarget(parentID, 100); }
  }
}



//6Feb26 addition for Glossary Rabbit Hole pane.
/**
 * Opens a specific glossary term rabbit hole while closing all others.
 * Requires: toggleRabbitHole() to be defined in the app.
 * @param {string} btnId - The ID of the button/trigger (not used for logic, passed to toggle)
 * @param {string} panelId - The ID of the panel to open
 */

// ============================================================================================
// ✅ 2026-03-04 🧩 [SJ-GLOSS-OVERLAY-01] Glossary term veil (accentuate open term)
//
// Request:
// - When a Glossary A-Z term opens its Rabbit Hole, dim (veil) the rest of the UI with a grey overlay.
// - Clicking the overlay OR clicking the term again closes the Rabbit Hole and removes the veil.
//
// Design notes:
// - We DO NOT reuse the Drawer overlay (.overlay) because that one is tightly coupled to drawer logic
//   (scroll-lock, close_drawers(), etc.). A dedicated veil avoids cross-feature interference.
// - ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-01] Manual Glossary opens now behave like a modal:
//   the veil covers the full viewport, background scrolling is locked, and only the detailed
//   .sjGlossary-rhContent area scrolls when the term is long.
// - Search-driven opens still suppress the veil so Search navigation remains usable.
// ============================================================================================

var sjGlossaryOverlayEl = null;
var sjGlossaryActive = null; // { btnId: 'GL-xxx-btn', panelId: 'RH-xxx' }

function sjEnsureGlossaryOverlay() {
  if (sjGlossaryOverlayEl) return sjGlossaryOverlayEl;

  var el = document.getElementById('sjGlossaryOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sjGlossaryOverlay';
    el.className = 'sjGlossary-overlay';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  // Click-to-close behavior: close the currently open term (if any)
  el.addEventListener('click', function () {
    if (sjGlossaryActive && sjGlossaryActive.btnId && sjGlossaryActive.panelId) {
      // Calling openGlossaryTerm() again toggles the panel closed and will hide the veil.
      openGlossaryTerm(sjGlossaryActive.btnId, sjGlossaryActive.panelId);
    } else {
      sjHideGlossaryOverlay();
    }
  });

  // ESC closes (nice-to-have; non-invasive)
  document.addEventListener('keydown', function (e) {
    if (e && e.key === 'Escape' && sjIsGlossaryOverlayVisible()) {
      if (sjGlossaryActive && sjGlossaryActive.btnId && sjGlossaryActive.panelId) {
        openGlossaryTerm(sjGlossaryActive.btnId, sjGlossaryActive.panelId);
      } else {
        sjHideGlossaryOverlay();
      }
    }
  });

  sjGlossaryOverlayEl = el;
  return sjGlossaryOverlayEl;
}

function sjShowGlossaryOverlay() {
  var el = sjEnsureGlossaryOverlay();
  if (!el) return;
  el.classList.add('visible');

  // ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-03] Full-screen Glossary veil locks the page behind it.
  sjLockGlossaryBackgroundScroll();
  sjRefreshActiveGlossaryModalLayout();

  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-11] Changing Glossary veil can affect general RH veil.
  // Resync so we never get double-veils, and we restore RH veil when Glossary closes.
  if (typeof sjUpdateRabbitHoleOverlay === 'function') { sjUpdateRabbitHoleOverlay(); }
}

function sjHideGlossaryOverlay() {
  var el = sjEnsureGlossaryOverlay();
  if (!el) return;
  el.classList.remove('visible');

  // ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-04] Restore background scroll when the manual Glossary veil closes.
  sjUnlockGlossaryBackgroundScroll();

  // ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-11] Changing Glossary veil can affect general RH veil.
  // Resync so we never get double-veils, and we restore RH veil when Glossary closes.
  if (typeof sjUpdateRabbitHoleOverlay === 'function') { sjUpdateRabbitHoleOverlay(); }
}

function sjIsGlossaryOverlayVisible() {
  return !!(sjGlossaryOverlayEl && sjGlossaryOverlayEl.classList.contains('visible'));
}

// ============================================================================================
// ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-02] Glossary modal scroll-lock + internal scroll sizing
//
// Goal:
// - A manually opened Glossary rabbit hole should be the only active/scrollable surface.
// - The full-screen veil covers the header and page behind it.
// - The term + one-line definition stay in their normal <li> envelope.
// - The existing .sjGlossary-rhContent wrapper becomes the scrollable detail container.
//
// Search guard:
// - Search-driven Glossary openings keep using the older no-veil/no-lock path so Search arrows
//   and highlight navigation remain accessible.
// ============================================================================================
var sjGlossaryScrollLockY = 0;
var sjGlossaryScrollLockIsOn = false;

// ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-07]
// IMPORTANT FIX:
// - The first modal pass used body { position: fixed; top: -Ypx } to freeze the page.
// - That broke the old UX where the opened Glossary envelope scrolls up under the Glossary header.
// - We now lock user-driven background scrolling with CSS overflow + event guards, but we do NOT
//   convert the body to fixed positioning. This preserves the original page-scroll positioning model.
var sjGlossaryScrollBlockOptions = { passive: false, capture: true };

function sjEventIsInsideActiveGlossaryScrollBox(e) {
  try {
    if (!e || !e.target || !sjGlossaryActive || !sjGlossaryActive.panelId) return false;

    var panel = document.getElementById(sjGlossaryActive.panelId);
    var ownerLi = panel ? panel.closest('li') : null;
    if (!ownerLi) return false;

    var scrollBox = e.target.closest ? e.target.closest('.sjGlossary-rhContent') : null;
    return !!(scrollBox && ownerLi.contains(scrollBox));
  } catch (err) {
    return false;
  }
}

function sjBlockGlossaryBackgroundScrollEvent(e) {
  if (!sjGlossaryScrollLockIsOn) return;

  // Allow only the detail container inside the open Glossary rabbit hole to scroll.
  if (sjEventIsInsideActiveGlossaryScrollBox(e)) return;

  try {
    e.preventDefault();
    e.stopPropagation();
  } catch (err) {}
}

function sjBlockGlossaryBackgroundScrollKeys(e) {
  if (!sjGlossaryScrollLockIsOn || !e) return;

  // ESC is handled by the existing close listener above, so do not block it here.
  if (e.key === 'Escape') return;

  var scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
  if (scrollKeys.indexOf(e.key) === -1) return;

  if (sjEventIsInsideActiveGlossaryScrollBox(e)) return;

  try {
    e.preventDefault();
    e.stopPropagation();
  } catch (err) {}
}

function sjLockGlossaryBackgroundScroll() {
  if (sjGlossaryScrollLockIsOn) return;

  try {
    sjGlossaryScrollLockY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    document.documentElement.classList.add('sjGlossary-scrollLock');
    document.body.classList.add('sjGlossary-scrollLockBody');

    document.addEventListener('wheel', sjBlockGlossaryBackgroundScrollEvent, sjGlossaryScrollBlockOptions);
    document.addEventListener('touchmove', sjBlockGlossaryBackgroundScrollEvent, sjGlossaryScrollBlockOptions);
    document.addEventListener('keydown', sjBlockGlossaryBackgroundScrollKeys, true);

    sjGlossaryScrollLockIsOn = true;
  } catch (e) {}
}

function sjUnlockGlossaryBackgroundScroll() {
  if (!sjGlossaryScrollLockIsOn) return;

  try {
    document.documentElement.classList.remove('sjGlossary-scrollLock');
    document.body.classList.remove('sjGlossary-scrollLockBody');

    document.removeEventListener('wheel', sjBlockGlossaryBackgroundScrollEvent, sjGlossaryScrollBlockOptions);
    document.removeEventListener('touchmove', sjBlockGlossaryBackgroundScrollEvent, sjGlossaryScrollBlockOptions);
    document.removeEventListener('keydown', sjBlockGlossaryBackgroundScrollKeys, true);
  } catch (e) {}

  sjGlossaryScrollLockIsOn = false;
}

function sjClearGlossaryScrollableDetail(panelOrScope) {
  try {
    var scope = panelOrScope || document;
    if (!scope.querySelectorAll) return;

    scope.querySelectorAll('.sjGlossary-rhContent').forEach(function (box) {
      box.style.maxHeight = '';
    });
  } catch (e) {}
}

function sjGetViewportHeightForGlossary() {
  try {
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
  } catch (e) {}

  return window.innerHeight || document.documentElement.clientHeight || 600;
}

function sjRefreshGlossaryScrollableDetail(ownerLi) {
  if (!ownerLi || !ownerLi.querySelector) return;

  try {
    var detailBox = ownerLi.querySelector('.sjGlossary-rhContent');
    if (!detailBox) return;

    // Clear first so the browser can recalculate the natural top position.
    detailBox.style.maxHeight = '';

    var rect = detailBox.getBoundingClientRect();
    var viewportH = sjGetViewportHeightForGlossary();
    var bottomGap = 18;
    var available = Math.floor(viewportH - rect.top - bottomGap);

    // Keep the scroll area useful on small screens, but never let it exceed the viewport.
    available = Math.max(150, available);
    available = Math.min(available, Math.max(150, viewportH - 90));

    detailBox.style.maxHeight = available + 'px';
  } catch (e) {}
}

function sjPositionGlossaryEnvelopeForModal(ownerLi) {
  if (!ownerLi) return;

  try {
    // ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-08]
    // Restore the exact old Glossary positioning model: after the panel opens, scroll the
    // real page so the opened <li> lands just below the Book header / sticky Glossary header.
    // Do the first move synchronously BEFORE the modal scroll-lock is applied.
    var rect = ownerLi.getBoundingClientRect();
    var desiredTop = sjComputeFixedHeaderBottom() + 8;
    var delta = rect.top - desiredTop;

    if (Math.abs(delta) >= 4) {
      var currentY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      window.scrollTo(0, currentY + delta);
    }

    // Run the old helper shortly after, too. This catches any sticky-header/layout recalculation
    // after the Glossary envelope grows into its open state.
    window.setTimeout(function () {
      sjScrollElementBelowFixedHeaders(ownerLi, 8);
    }, 30);

    // Refresh the internal detail-scroll height before and after positioning settles.
    sjRefreshGlossaryScrollableDetail(ownerLi);

    window.setTimeout(function () {
      sjRefreshGlossaryScrollableDetail(ownerLi);
    }, 120);

    window.setTimeout(function () {
      sjRefreshGlossaryScrollableDetail(ownerLi);
    }, 500);
  } catch (e) {}
}

function sjRefreshActiveGlossaryModalLayout() {
  try {
    if (!sjGlossaryActive || !sjGlossaryActive.panelId) return;
    if (!sjIsGlossaryOverlayVisible()) return;

    var panel = document.getElementById(sjGlossaryActive.panelId);
    var ownerLi = panel ? panel.closest('li') : null;
    if (ownerLi) {
      sjRefreshGlossaryScrollableDetail(ownerLi);
    }
  } catch (e) {}
}

window.addEventListener('resize', function () {
  window.requestAnimationFrame(sjRefreshActiveGlossaryModalLayout);
});

window.addEventListener('orientationchange', function () {
  window.setTimeout(sjRefreshActiveGlossaryModalLayout, 80);
});

function sjForceCloseGlossaryOverlay() {
  // Used when sections collapse or global resets close panels outside openGlossaryTerm().
  sjGlossaryActive = null;
  sjHideGlossaryOverlay();
}


// 🟨🟨🟨 ADDITION START 🟨🟨🟨
// ============================================================================================
// ✅ 2026-03-07 🧩 [SJ-RH-OVERLAY-01] General Rabbit Hole veil (NON-GLOSSARY)
//
// Request:
// - When ANY (non-glossary) Rabbit Hole panel opens, dim the rest of the UI with a grey overlay.
// - The Rabbit Hole panel itself must remain ABOVE the veil (accentuated).
// - Clicking the veil closes ALL Rabbit Holes and removes the veil.
//
// Critical guards (prevents the bugs you saw earlier):
// - If Search is active, the veil must be OFF.
// - Glossary panels are excluded because Glossary has its own veil + envelope behavior.
// ============================================================================================

var sjRabbitHoleOverlayEl = null;

function sjEnsureRabbitHoleOverlay() {
  if (sjRabbitHoleOverlayEl) return sjRabbitHoleOverlayEl;

  var el = document.getElementById('sjRabbitHoleOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sjRabbitHoleOverlay';
    el.className = 'sjRabbitHole-overlay';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  // Click-to-close: close all Rabbit Holes (predictable)
  el.addEventListener('click', function () {
    try {
      if (typeof closeAllRabbitHoles === 'function') { closeAllRabbitHoles(); }
    } catch (e) {}
    sjHideRabbitHoleOverlay();
  });

  // ESC closes (nice-to-have)
  document.addEventListener('keydown', function (e) {
    if (e && e.key === 'Escape' && sjIsRabbitHoleOverlayVisible()) {
      try {
        if (typeof closeAllRabbitHoles === 'function') { closeAllRabbitHoles(); }
      } catch (e2) {}
      sjHideRabbitHoleOverlay();
    }
  });

  sjRabbitHoleOverlayEl = el;
  return sjRabbitHoleOverlayEl;
}

function sjShowRabbitHoleOverlay() {
  var el = sjEnsureRabbitHoleOverlay();
  if (!el) return;
  el.classList.add('visible');
}

function sjHideRabbitHoleOverlay() {
  var el = sjEnsureRabbitHoleOverlay();
  if (!el) return;
  el.classList.remove('visible');
}

function sjIsRabbitHoleOverlayVisible() {
  return !!(sjRabbitHoleOverlayEl && sjRabbitHoleOverlayEl.classList.contains('visible'));
}

function sjForceCloseRabbitHoleOverlay() {
  // Used when Search/section-collapses close panels outside toggleRabbitHole().
  sjHideRabbitHoleOverlay();

  // Also strip "lift" class so no card remains above the veil when it is gone.
  try {
    document.querySelectorAll('.sjRabbitHole-panel.sjRabbitHole-open').forEach(panel => {
      panel.classList.remove('sjRabbitHole-open');
    });
  } catch (e) {}
}

function sjUpdateRabbitHoleOverlay() {
  // ✅ Hard guard: never show Rabbit Hole veil during Search
  try {
    if (typeof isSearching !== 'undefined' && isSearching) {
      sjForceCloseRabbitHoleOverlay();
      return;
    }
  } catch (e) {}

  var anyOpen = false;

  try {
    document.querySelectorAll('.sjRabbitHole-panel').forEach(panel => {

      // Glossary has its own veil + envelope rules
      if (panel.classList && panel.classList.contains('glossary-panel')) { return; }

      var isVisible = (window.getComputedStyle(panel).display !== 'none');

      if (isVisible) {
        anyOpen = true;
        panel.classList.add('sjRabbitHole-open'); // ✅ lift above veil
      } else {
        panel.classList.remove('sjRabbitHole-open');
      }
    });
  } catch (e) {}

  if (anyOpen) {

    // ✅ Avoid "double veils": if Glossary veil is active, do not also show general Rabbit Hole veil.
    if (typeof sjIsGlossaryOverlayVisible === 'function' && sjIsGlossaryOverlayVisible()) {
      sjHideRabbitHoleOverlay();
      return;
    }

    sjShowRabbitHoleOverlay();
  } else {
    sjHideRabbitHoleOverlay();
  }
}

// 🟨🟨🟨 ADDITION END 🟨🟨🟨


// ✅ 2026-03-07 🧩 [SJ-PANEL-SCROLL-01] Keep opened Glossary / Rabbit Hole panes tucked just below fixed headers.
function sjComputeFixedHeaderBottom() {
  var maxBottom = 0;

  try {
    document.querySelectorAll('.header-container, .content-section-title').forEach(function (el) {
      if (!el) return;

      var cs = window.getComputedStyle(el);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return;

      var rect = el.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;
      if (rect.bottom <= 0) return;

      // Only count sticky/fixed elements currently occupying the upper viewport band.
      if (rect.top > 220) return;

      if (rect.bottom > maxBottom) {
        maxBottom = rect.bottom;
      }
    });
  } catch (e) {}

  return Math.max(0, Math.ceil(maxBottom));
}

function sjScrollElementBelowFixedHeaders(targetEl, gapPx) {
  if (!targetEl) return;

  var gap = Number(gapPx);
  if (!isFinite(gap)) gap = 8;

  window.setTimeout(function () {
    try {
      var rect = targetEl.getBoundingClientRect();
      if (!rect) return;

      var desiredTop = sjComputeFixedHeaderBottom() + gap;
      var delta = rect.top - desiredTop;

      // Avoid micro-jitters on tiny differences.
      if (Math.abs(delta) < 4) return;

      window.scrollBy({ top: delta, behavior: 'smooth' });
    } catch (e) {}
  }, 25);
}

function openGlossaryTerm(btnId, panelId) {
  // ------------------------------------------------------------------------------------------
  // 🐇 13Feb26 - Glossary Rabbit Hole "ENVELOPE" box
  // [SJ-GLOSS-RH-ENVELOPE-01]
  // Goal: When a glossary term is opened, the Rabbit Hole border should enclose the glossary term
  //       line as well (not just the panel content below it).
  //
  // How:
  //   1) Close all other glossary panels (existing behavior).
  //   2) Remove the "open" envelope class from their owning <li>.
  //   3) Toggle the target panel (via your existing toggleRabbitHole()).
  //   4) Add/remove the "sjGlossary-open" class on the owning <li> based on FINAL display state.
  //
  // NOTE: Each glossary panel is embedded inside its owning <li> like this:
  //   <li> ... <div class="sjRabbitHole-panel glossary-panel" id="RH-xxx">...</div> </li>
  // ------------------------------------------------------------------------------------------

  // 1) Find all panels that belong to the glossary (identified by the 'glossary-panel' class)
  var allPanels = document.querySelectorAll('.glossary-panel');

  // 2) Close all other glossary panels + remove their envelope styling
  allPanels.forEach(function(panel) {
    if (!panel || !panel.id) return;
    if (panel.id !== panelId) {
      panel.style.display = 'none';
      sjClearGlossaryScrollableDetail(panel);
      var li = panel.closest('li');
      if (li) li.classList.remove('sjGlossary-open');
    }
  });

  // 3) Toggle the requested panel (keep your existing Rabbit Hole engine so aria/state stays consistent)
  var targetPanel = document.getElementById(panelId);
  if (!targetPanel) return;

  var button = document.getElementById(btnId);

  if (typeof toggleRabbitHole === "function" && button) {
    toggleRabbitHole(btnId, panelId);
  } else {
    // Fallback if the main function or the hidden "button" node is missing
    var isHidden = (window.getComputedStyle(targetPanel).display === "none");
    targetPanel.style.display = isHidden ? "block" : "none";
  }

  // 4) Sync envelope class to the FINAL display state
  var isNowHidden = (window.getComputedStyle(targetPanel).display === 'none');
  var ownerLi = targetPanel.closest('li');
  if (ownerLi) {
    if (isNowHidden) ownerLi.classList.remove('sjGlossary-open');
    else ownerLi.classList.add('sjGlossary-open');
  }

  // 5) Veil overlay: show only while a glossary panel is truly open
  //    - Clicking the veil (or hitting ESC) will re-call openGlossaryTerm() to close it.
  if (isNowHidden) {
    sjGlossaryActive = null;
    sjClearGlossaryScrollableDetail(targetPanel);
    sjHideGlossaryOverlay();

    // ✅ 2026-03-25 🧩 [SJ-GLOSS-CLOSE-SCROLL-01] After a Glossary term collapses,
    // settle the term line back just below the fixed headers so the user lands on the initiating term.
    if (ownerLi) {
      sjScrollElementBelowFixedHeaders(ownerLi, 8);
    }
  } else {
    sjGlossaryActive = { btnId: btnId, panelId: panelId };

    // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-03]
    // While Search is active, keep Glossary rabbit holes overlay-free so the fixed search arrows remain visible.
    if (typeof sjIsSearchSessionActive === 'function' && sjIsSearchSessionActive()) {
      sjHideGlossaryOverlay();

      // Preserve the previous Search behaviour: Search-owned opens stay under the header/search UI.
      if (ownerLi) {
        sjScrollElementBelowFixedHeaders(ownerLi, 8);
      }
    } else {
      // ✅ 2026-04-28 🧩 [SJ-GLOSS-MODAL-09]
      // Manual Glossary opens keep the old positioning behavior, then layer the full-screen
      // modal veil over everything except the active Glossary envelope.
      if (ownerLi) {
        sjPositionGlossaryEnvelopeForModal(ownerLi);
      }

      sjShowGlossaryOverlay();
    }
  }
}

// [SJ-ML-CHV-01A] Run once on load to eliminate any visible "More.../Less..." remnants
document.addEventListener('DOMContentLoaded', () => {
  // ✅ 15Feb26 [SJ-MAJOR-SURGERY-01] Section expansion paradigm upgrade: More/Less → Rabbit icons
  // ✅ 16Feb26 🧩 [SJ-STRUCT-01] Disable runtime 'Major Surgery' upgrade (we're back to 3-division Sections)

  // sjUpgradeSectionMoreToRabbitParadigm();
  sjInitExpandableStates();
});

//START of expand all "More..."
//Toggle 'More' button verbiage and display extended message in content sections.
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

// [SJ-RH-JS-04A] Convenience: reset every Rabbit Hole on the page
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

//START of openWiki
//open a wikipedia page in bottom drawer as passed to function
function openWiki(targetWiki, subjectWiki) {
  // Create the iframe element
  const iframeElement = document.createElement('iframe');
  iframeElement.src = targetWiki;
  iframeElement.width = '100%';
  iframeElement.height = '100%';
  iframeElement.style.border = 'none';

  // Optionally create a title element (or use an existing one)
  const titleElement = document.createElement('h2');
  titleElement.textContent = subjectWiki;

  // Now pass the iframe as the contentElement to your open_drawer function
  //parameters are which drawer, title verbiage, URL, drawer width, drawer height
  open_drawer('drawer-bottom', 'url', titleElement, iframeElement, '100%');
}
//END of openWiki

//START Next/Prev Match result
let currentMatchIndex = -1;
const nextButton = sjpEnsureCompatElement('nextButton');
const prevButton = sjpEnsureCompatElement('prevButton');

function showMatch(index) {
  // Get all the highlighted elements
  const matches = document.querySelectorAll('.highlight');
  if (!matches.length) return;

  // Cycle through the matches if the index is out of bounds
  if (index < 0) {
    index = matches.length - 1;
  } else if (index >= matches.length) {
    index = 0;
  }

  // Remove any existing "active" class from all highlights
  matches.forEach(match => match.classList.remove('active'));

  // Add "active" class to the new active match
  matches[index].classList.add('active');
  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-09] If the active hit is hidden inside a Glossary rabbit hole,
  // mirror the orange current-hit state on the visible Glossary term border.
  syncGlossarySearchCueActiveState();

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-05]
  // When Next/Prev leaves Glossary rabbit-hole content, close any search-opened Glossary term
  // so the user does not keep a stale panel on screen while navigating elsewhere.
  if (typeof sjIsSearchSessionActive === 'function' && sjIsSearchSessionActive()) {
    const activeGlossaryPanel = matches[index].closest('.glossary-panel');
    if (!activeGlossaryPanel && typeof sjCloseGlossarySearchPanels === 'function') {
      sjCloseGlossarySearchPanels();
    }
  }

  matches[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  currentMatchIndex = index;
  updateMatchIndicator(index + 1,matches.length);
}
function updateMatchIndicator(index,length) {
 // Update the match indicator (display as "xx of yyyy")
  const matchIndicator = document.getElementById('matchCountDisplay');
  if (matchIndicator) {
      // Adding 1 to the index for user-friendly numbering (1-based instead of 0-based)
      matchIndicator.textContent = `${index} of ${length}`;
  }
}

nextButton.addEventListener('click', () => {
  showMatch(currentMatchIndex + 1);
});

prevButton.addEventListener('click', () => {
  showMatch(currentMatchIndex - 1);
});
//END Next/Prev Match result

//function to change .highlight class from yellow to transparent
// Get all the style sheets
function changeStyleBackgroundColor(whichStyle, newColor) {
  const stylesheets = document.styleSheets;

  // Loop through the stylesheets to find the .highlight rule
  for (let sheet of stylesheets) {
    // Check if the sheet is accessible and has rules
    if (sheet.cssRules) {
      for (let rule of sheet.cssRules) {
        if (rule.selectorText === whichStyle) {
          // Change the background color to transparent (remove the highlight)
          rule.style.backgroundColor = newColor;
        }
      }
    }
  }
}

// Utility: safely get element from id or element
function asElement(maybeIdOrEl) {
  if (!maybeIdOrEl) return null;
  if (maybeIdOrEl instanceof Element) return maybeIdOrEl;
  // assume string id
  return document.getElementById(String(maybeIdOrEl));
}

// 12/13Dec25 Gemini
// NOTE: I am keeping the logic where you manually set defaultTitle/targetTitle
// inside the switch block, as this is how your original code was structured.

/**
 * ✅ 2026-05-21 🧩 [SJP-PUBLIC-INFO-BUBBLES-04]
 * Preserve any public info icon already injected into a dynamic title node.
 * Some sticky titles, especially Glossary A to Z, are rewritten while scrolling.
 * Using innerText alone would erase the injected info icon.
 */
function sjpSetDynamicTitleText(targetTitleElement, nextTitleText) {
  if (!targetTitleElement) return;

  const existingInfoIcon = targetTitleElement.querySelector(':scope > .sjp-sjb-before-title');

  if (!existingInfoIcon) {
    targetTitleElement.innerText = nextTitleText;
    return;
  }

  let titleTextSpan = targetTitleElement.querySelector(':scope > .sjp-dynamic-title-text');
  if (!titleTextSpan) {
    titleTextSpan = document.createElement('span');
    titleTextSpan.className = 'sjp-dynamic-title-text';
  }

  titleTextSpan.textContent = nextTitleText;

  Array.from(targetTitleElement.childNodes).forEach(function (node) {
    if (node !== existingInfoIcon && node !== titleTextSpan) node.remove();
  });

  if (targetTitleElement.firstChild !== existingInfoIcon) {
    targetTitleElement.insertBefore(existingInfoIcon, targetTitleElement.firstChild);
  }

  if (existingInfoIcon.nextSibling !== titleTextSpan) {
    targetTitleElement.insertBefore(titleTextSpan, existingInfoIcon.nextSibling);
  }
}

/**
 * Finds the currently active section (parent and sub) and updates the sticky title text.
 * The core logic is to find the LAST section whose top edge is ABOVE the detection point.
 */
function dynamicTitle() {
  const dbg = document.getElementById('debug');
  const offsets = getHeaderOffsets();

  // ✅ Sensor point placed just BELOW the sticky title band.
  // This is far more reliable than comparing boundingClientRect() values,
  // especially with sticky headers and expandable (More...) blocks.
  const sensorX = Math.round(window.innerWidth / 2);
  const sensorY = Math.round(offsets.fixedOffset + offsets.stickyBandHeight + 8);

  let activeParentSectionId = null;
  let activeSubSectionId = null;

  // --- PASS 1: active PARENT section ---
  const parentEl = document
    .elementFromPoint(sensorX, sensorY)
    ?.closest('[data-group="startOfsection"]');

  if (parentEl) activeParentSectionId = parentEl.id;

  // --- Configure title target based on parent ---
  let targetTitleElement = null;
  let defaultTitleText = '';

  if (activeParentSectionId) {
    switch (activeParentSectionId) {
      case 'glossaryAtoZ':
        targetTitleElement = document.getElementById('glossaryTitle');
        defaultTitleText = 'Glossary A to Z';
        break;
      case 'toolsAtoZ':
        targetTitleElement = document.getElementById('toolsAtoZtitle');
        defaultTitleText = 'Tools A to Z';
        break;
      case 'grainsAtoZ':
        targetTitleElement = document.getElementById('grainsAtoZtitle');
        defaultTitleText = 'Grains A to Z';
        break;
      case 'breadsIntro':
        targetTitleElement = document.getElementById('breadsTitle');
        defaultTitleText = 'Bread Types';
        break;
    }
  }

  // --- PASS 2: active SUBSECTION (within the active parent) ---
  if (targetTitleElement && parentEl) {

    // Try the sensor method first
    const subEl = document
      .elementFromPoint(sensorX, sensorY)
      ?.closest('[data-group="startOfSubSection"]');

    if (subEl && parentEl.contains(subEl)) {
      activeSubSectionId = subEl.id;
    } else {
      // Fallback: boundingRect scan (kept as backup)
      const allSubSections = parentEl.querySelectorAll('[data-group="startOfSubSection"]');
      let closestTop = -Infinity;

      allSubSections.forEach(s => {
        // ignore hidden sections (display:none)
        if (s.offsetParent === null) return;
        const top = s.getBoundingClientRect().top;
        if (top <= sensorY && top > closestTop) {
          closestTop = top;
          activeSubSectionId = s.id;
        }
      });
    }

    // Apply title text
    if (activeSubSectionId) {
      const sub = document.getElementById(activeSubSectionId);
      const t = sub ? sub.title : '';
      sjpSetDynamicTitleText(targetTitleElement, t || defaultTitleText);
    } else {
      sjpSetDynamicTitleText(targetTitleElement, defaultTitleText);
    }
  }

  // Debug readout (optional)
  if (dbg) {
    dbg.textContent = `debug: ${debugData}, Sec: ${activeParentSectionId}, Sub: ${activeSubSectionId}
` +
                      `sensorY: ${sensorY}, screen: ${screenWidth}, inner: ${inner_Width}`;
  }
}

// 12Dec25 Gemeni
/**
 * Dynamically calculates the vertical offset to look for the currently
 * sticky section title, compensating for the fixed header height.
 * @returns {{fixedOffset: number, stickyBandHeight: number}}
 */
function getHeaderOffsets() {
    // 1. Get the height of the main fixed header (header-container)
    const fixedHeader = document.querySelector('.header-container');
    const fixedHeight = fixedHeader ? fixedHeader.offsetHeight : 100; // Default to 100px if element not found.

    // 2. Get the height of the sticky title element (content-section-title)
    // We sample a title element to get its expected height when stuck.
    const sampleTitle = document.querySelector('.content-section-title');
    // Use min-height (40px) as a failsafe if height cannot be determined accurately, 
    // or estimate based on a standard padding, or let it stick to 50 as a default.
    const stickyHeight = sampleTitle ? sampleTitle.offsetHeight : 50; 
    
    // The fixedOffset is where the content *starts* below the fixed header.
    // The stickyBandHeight is the vertical zone to search within (i.e., the sticky title's height).

    return {
        // The point below the fixed header (where content begins)
        fixedOffset: fixedHeight, 
        // A safe band height to search within (e.g., the sticky title height + a buffer)
        stickyBandHeight: stickyHeight + 10 // +10 for buffer
    };
}
// 12Dec25 Gemini
window.onscroll = function () {
    // 1. ORIGINAL LOGIC (Back to Top Button Visibility)
    const isScrolling = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20;
    const hasSearchEntry = searchInput.value !== '';

    targetTopButton.style.display = isScrolling ? "block" : "none";
    targetTopGrayButton.style.display =  isScrolling ? 'none' : 'block';

    // 2. NEW LOGIC (Dynamic Title Update)
    screenWidth = screen.width;
    inner_Width = window.innerWidth;
    dynamicTitle(); 
};

/* ==========================================================
   [CHROME MOBILE ROTATION FIX]
   Keeps header below Chrome UI by setting --vvTop using VisualViewport
   ========================================================== */
(function () {
  const root = document.documentElement;

  // ✅ 11Apr26 🧩 [SJ-VV-JS-04]
  // iOS browsers (Safari + Chrome iOS) do NOT overlay the page with the URL bar
  // the same way Android Chrome does. On iOS Chrome (CriOS), VisualViewport.offsetTop
  // can still report a non-zero value in portrait, which pushes our header DOWN and
  // creates the "insidious" gap where content is visible above the header.
  //
  // So: ignore VisualViewport.offsetTop on iOS and let --safeTop (if any) handle notches.
  function isIOS() {
    const ua = navigator.userAgent;
    const iOSDevice = /iPad|iPhone|iPod/i.test(ua);
    const iPadOS13Plus = /Macintosh/i.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
    return iOSDevice || iPadOS13Plus;
  }

  function updateVvTop() {
    const vv = window.visualViewport;

    // VisualViewport gives the best "what is covering the top" signal in Chrome mobile
    const rawTop = (vv && !isIOS()) ? vv.offsetTop : 0;

    // ✅ 23Jan26 [SJ-VV-JS-01] Clamp to a sane range (prevents rare Chrome spikes on tab-switch)
    const top = Math.max(0, Math.min(rawTop, 80));

    root.style.setProperty("--vvTop", `${top}px`);
  }

  function settleUpdate() {
    // Chrome may update viewport values slightly AFTER rotation/resize
    updateVvTop();
    setTimeout(updateVvTop, 60);
    setTimeout(updateVvTop, 160);
    setTimeout(updateVvTop, 350);
  }

  window.addEventListener("orientationchange", settleUpdate);
  window.addEventListener("resize", settleUpdate);

  // ✅ 23Jan26 [SJ-VV-JS-02] Re-sync after tab-switch / app resume (Chrome mobile portrait)
  window.addEventListener("pageshow", settleUpdate);
  window.addEventListener("focus", settleUpdate);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) settleUpdate();
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", settleUpdate);
    window.visualViewport.addEventListener("scroll", settleUpdate);
  }

  // run immediately on load
  settleUpdate();
})();

/* ==========================================================
   [CHROME-ONLY MOBILE FALLBACK TOP]
   Adds a small safety inset ONLY for Chrome on small phones
   in portrait mode (prevents header hiding after rotation)
   ========================================================== */
(function () {
  const root = document.documentElement;

  function isChromeMobile() {
    const ua = navigator.userAgent;

    // Android Chrome: "Chrome" but NOT Edge/Opera/Samsung Internet
    const isAndroidChrome =
      /Chrome/i.test(ua) &&
      !/Edg/i.test(ua) &&
      !/OPR/i.test(ua) &&
      !/SamsungBrowser/i.test(ua);

    // ✅ 11Apr26 🧩 [SJ-VV-JS-05]
    // Do NOT treat iOS Chrome as needing the "fallbackTop" hack.
    // On iOS Chrome portrait it creates a visible gap above the header.
    return isAndroidChrome;
  }

  function applyChromePortraitFallback() {
    const smallPhone = window.innerWidth <= 430;
    const portrait = window.matchMedia("(orientation: portrait)").matches;

    if (isChromeMobile() && smallPhone && portrait) {
      root.style.setProperty("--fallbackTop", "20px"); // ✅ your compromise
    } else {
      root.style.setProperty("--fallbackTop", "0px");  // ✅ Safari stays clean
    }
  }

  // Run now + on rotate/resize
  applyChromePortraitFallback();
  window.addEventListener("resize", applyChromePortraitFallback);

  // ✅ 23Jan26 [SJ-VV-JS-03] Re-apply after tab-switch / app resume (Chrome mobile portrait)
  window.addEventListener("pageshow", applyChromePortraitFallback);
  window.addEventListener("focus", applyChromePortraitFallback);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) applyChromePortraitFallback();
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(applyChromePortraitFallback, 120);
    setTimeout(applyChromePortraitFallback, 350);
  });
})();


// =================================================================================================
// ✅ 2026-05-03 🧩 [SJP-PUBLIC-PREVIEW-01]
// Locked public-preview behaviour.
// - Inline locked items show the unified yellow notice.
// - Locked TOC items with data-sjp-preview-target briefly reveal the hidden private Book section
//   behind the drawer overlay, show a countdown, then hide the section and reopen the same TOC.
// =================================================================================================
(function () {
  const PREVIEW_DURATION_MS = 12000; // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6D-PREVIEW-TIMER-01] Veiled previews now stay open for 12 seconds
  let activePreview = null;
  let lastTouchY = null;
  let activeNoticeFinish = null;
  let compactReminderUntil = 0; // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-VEIL-REMINDER-01] Holds compact notice open briefly after veil taps.

  function ensureLockNotice() {
    let notice = document.getElementById('sjpLockNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'sjpLockNotice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      document.body.appendChild(notice);
    }
    return notice;
  }

  function setNotice(message, secondsLeft, canClose = true, countdownPrefix = 'Preview closes in') {
    const notice = ensureLockNotice();
    // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6D-PREVIEW-TIMER-02]
    // Each fresh notice starts expanded; the live-preview countdown may compact it after 4 seconds.
    compactReminderUntil = 0;
    clearTimeout(showCompactVeilReminder._timeout);
    notice.classList.remove('sjp-lock-notice--compact');
    notice.innerHTML = '';

    const topLine = document.createElement('div');
    topLine.className = 'sjp-lock-notice__topline';

    const msg = document.createElement('div');
    msg.className = 'sjp-lock-notice__message';
    msg.textContent = message || 'This item is available in the full Sourjoe Book.';
    topLine.appendChild(msg);

    if (canClose) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'sjp-lock-notice__close';
      closeBtn.textContent = 'Close';
      closeBtn.setAttribute('aria-label', 'Close this preview now');
      // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6B-NOTICE-CLOSE-01]
      // Use pointerdown as well as click so the timed yellow CLOSE control responds immediately on touch screens.
      const closeNoticeNow = function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof activeNoticeFinish === 'function') {
          activeNoticeFinish('manual');
        }
      };
      closeBtn.addEventListener('pointerdown', closeNoticeNow);
      closeBtn.addEventListener('click', closeNoticeNow);
      topLine.appendChild(closeBtn);
    }

    const countdown = document.createElement('div');
    countdown.className = 'sjp-lock-notice__countdown';
    countdown.textContent = `${countdownPrefix} ${secondsLeft} seconds`;

    notice.appendChild(topLine);
    notice.appendChild(countdown);
    notice.classList.add('sjp-lock-notice--visible');
  }

  function hideNotice() {
    const notice = ensureLockNotice();
    notice.classList.remove('sjp-lock-notice--visible', 'sjp-lock-notice--compact');
  }

  // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-VEIL-REMINDER-02]
  // While a veiled private preview is in compact countdown mode, a click/tap on the veil should
  // reuse the same yellow notice for a short sign-in/sign-up reminder, then collapse again.
  function showCompactVeilReminder() {
    if (!activePreview || !document.body.classList.contains('sjp-private-preview-active')) return;

    const notice = ensureLockNotice();
    if (!notice.classList.contains('sjp-lock-notice--visible')) return;
    if (!notice.classList.contains('sjp-lock-notice--compact')) return;

    const msg = notice.querySelector('.sjp-lock-notice__message');
    if (msg) {
      msg.textContent = 'Sign In or Sign Up to view full content';
    }

    compactReminderUntil = Date.now() + 3000;
    notice.classList.remove('sjp-lock-notice--compact');

    clearTimeout(showCompactVeilReminder._timeout);
    showCompactVeilReminder._timeout = setTimeout(() => {
      if (!activePreview || !document.body.classList.contains('sjp-private-preview-active')) return;
      if (Date.now() >= compactReminderUntil) {
        ensureLockNotice().classList.add('sjp-lock-notice--compact');
      }
    }, 3000);
  }

  // ✅ 2026-05-03 🧩 [SJP-PUBLIC-PREVIEW-CLOSE-01]
  // The timed notice can now be closed manually.  Manual close and timeout share the same
  // cleanup path so the hidden preview section is closed and the launching TOC is restored.
  function showTimedNotice(message, durationMs = PREVIEW_DURATION_MS, onDone = null, countdownPrefix = 'Preview closes in') {
    const startedAt = Date.now();
    const totalSeconds = Math.ceil(durationMs / 1000);
    let finished = false;

    clearInterval(showTimedNotice._interval);
    clearTimeout(showTimedNotice._timeout);

    const finish = function (reason = 'timeout') {
      if (finished) return;
      finished = true;
      clearInterval(showTimedNotice._interval);
      clearTimeout(showTimedNotice._timeout);
      clearTimeout(showCompactVeilReminder._timeout);
      compactReminderUntil = 0;
      activeNoticeFinish = null;
      hideNotice();
      if (typeof onDone === 'function') onDone(reason);
    };

    activeNoticeFinish = finish;
    setNotice(message, totalSeconds, true, countdownPrefix);

    showTimedNotice._interval = setInterval(() => {
      if (finished) return;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

      // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6B-NOTICE-CLOSE-02]
      // Do not rebuild the notice every 250ms: replacing the CLOSE button during a click/tap can make
      // the first one or two attempts feel ignored.  Update only the countdown text instead.
      const notice = ensureLockNotice();
      const countdown = notice.querySelector('.sjp-lock-notice__countdown');
      if (countdown) {
        countdown.textContent = `${countdownPrefix} ${remaining} seconds`;
      }

      // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS6D-PREVIEW-TIMER-03]
      // For actual veiled live previews only: after 4 seconds, hide the explanatory verbiage
      // so small/medium screens show only CLOSE + the remaining preview countdown.
      if (countdownPrefix === 'Preview closes in' && elapsed >= 4000) {
        // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-VEIL-REMINDER-03]
        // A veil tap temporarily re-expands the same notice; do not immediately re-compact it
        // until the 3-second reminder window has expired.
        if (Date.now() < compactReminderUntil) {
          notice.classList.remove('sjp-lock-notice--compact');
        } else {
          notice.classList.add('sjp-lock-notice--compact');
        }
      }
    }, 250);

    showTimedNotice._timeout = setTimeout(() => finish('timeout'), durationMs);
  }

  function snapshotExpandables(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-group="expandable"]')).map(el => {
      if (!el.hasAttribute('aria-expanded')) {
        const t = (el.textContent || '').trim();
        el.setAttribute('aria-expanded', /^less\b/i.test(t) ? 'true' : 'false');
      }
      return { el, expanded: el.getAttribute('aria-expanded') === 'true' };
    });
  }

  function restoreExpandables(snapshot) {
    (snapshot || []).forEach(item => {
      const el = item.el;
      if (!el || !document.documentElement.contains(el)) return;
      const nowExpanded = el.getAttribute('aria-expanded') === 'true';
      if (nowExpanded !== item.expanded) {
        try { el.click(); } catch (e) {}
      }
    });
  }

  function findPreviewOwner(target) {
    if (!target) return null;
    return target.closest('[data-group="startOfsection"]') || target;
  }

  function showPreviewTarget(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return null;

    const owner = findPreviewOwner(target);
    const snapshot = snapshotExpandables(owner);
    const gatedOwnerWasVisible = !!(owner && owner.classList && owner.classList.contains('sjp-live-demo-visible'));

    // ✅ 2026-05-08 🧩 [SJP-GLOSSARY-PREVIEW-GATE-01]
    // Gated live-demo sections are normally hidden until their Live demo TOC item is clicked.
    // A timed private preview launched from the Glossary A to Z TOC can target content inside that
    // gated parent, so temporarily reveal the parent for the preview window, then restore it below.
    if (owner && owner.classList && owner.classList.contains('sjp-live-demo-gated')) {
      owner.classList.add('sjp-live-demo-visible');
      owner.setAttribute('aria-hidden', 'false');
    }

    if (owner && owner.classList.contains('sjp-private-section')) {
      owner.classList.add('sjp-preview-visible');
    }

    if (target.classList.contains('sjp-private-subsection')) {
      target.classList.add('sjp-preview-visible');
    }

    // Expand the owning section's More... content so the preview shows a useful glimpse.
    if (owner && owner.id && typeof clickMoreForId === 'function') {
      try { clickMoreForId(owner.id); } catch (e) {}
    }

    // If the target itself is a hidden section, mark it visible too.
    if (target.classList.contains('sjp-private-section')) {
      target.classList.add('sjp-preview-visible');
    }

    setTimeout(() => {
      const scrollTarget = target.id || (owner && owner.id);
      if (scrollTarget && typeof scrollToTarget === 'function') {
        scrollToTarget(scrollTarget, 100, 'smooth');
      }
    }, 80);

    return { target, owner, snapshot, gatedOwnerWasVisible };
  }

  function hidePreviewTarget(previewState) {
    if (!previewState) return;
    restoreExpandables(previewState.snapshot);

    [previewState.target, previewState.owner].forEach(el => {
      if (!el) return;
      el.classList.remove('sjp-preview-visible');
    });

    if (
      previewState.owner &&
      previewState.owner.classList &&
      previewState.owner.classList.contains('sjp-live-demo-gated') &&
      !previewState.gatedOwnerWasVisible
    ) {
      previewState.owner.classList.remove('sjp-live-demo-visible');
      previewState.owner.setAttribute('aria-hidden', 'true');
    }
  }

  // ✅ 2026-05-03 🧩 [SJP-PUBLIC-RETURN-03]
  // Return rule after a private preview:
  // do not guess from the page's raw scroll position.  Instead, use the FIRST real link
  // in the TOC that launched the preview.  This makes the return deterministic for every
  // chapter/section TOC: scroll to that TOC's first item, then reopen that same TOC.
  function getFirstReturnTargetFromToc(item) {
    if (!item) return null;

    const contentId = item.getAttribute('data-sjp-return-content-id');
    const contentEl = contentId ? document.getElementById(contentId) : null;
    if (!contentEl) return null;

    const firstLink = contentEl.querySelector('p[onclick]');
    if (!firstLink) return null;

    const onclickText = firstLink.getAttribute('onclick') || '';

    // Handles collapseAndScroll('id'), resetAndScroll('id'), scrollToTarget('id'), etc.
    const quotedTarget = onclickText.match(/(?:collapseAndScroll|resetAndScroll|scrollToTarget)\s*\(\s*['"]([^'"]+)['"]/);
    if (quotedTarget && quotedTarget[1]) return quotedTarget[1].replace(/^#/, '');

    // Handles rarer unquoted patterns: collapseAndScroll(id)
    const bareTarget = onclickText.match(/(?:collapseAndScroll|resetAndScroll|scrollToTarget)\s*\(\s*([A-Za-z][\w:-]*)/);
    if (bareTarget && bareTarget[1]) return bareTarget[1].replace(/^#/, '');

    return null;
  }

  // ✅ 2026-05-03 🧩 [SJP-PUBLIC-RETURN-05]
  // Return positioning after a veiled private preview must not depend on the user's later
  // preview-scroll position.  We therefore calculate and store the return Y coordinate at the
  // instant the locked TOC link is clicked, BEFORE the private section is revealed and before the
  // user can scroll inside it.
  function getEffectivePageY(fallbackY = 0) {
    const bodyStyle = window.getComputedStyle(document.body);
    const inlineTop = document.body.style.top || bodyStyle.top || '';

    if (bodyStyle.position === 'fixed' && inlineTop) {
      const parsedTop = parseFloat(inlineTop);
      if (Number.isFinite(parsedTop)) {
        return Math.max(0, Math.abs(parsedTop));
      }
    }

    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || fallbackY || 0;
  }

  function computeReturnY(targetId, fallbackY = 0) {
    const offset = 100;
    const target = targetId ? document.getElementById(targetId) : null;
    const effectiveY = getEffectivePageY(fallbackY);

    if (target && target.getClientRects().length) {
      return Math.max(0, target.getBoundingClientRect().top + effectiveY - offset);
    }

    return Math.max(0, fallbackY || 0);
  }

  function setInstantScrollMode(isOn) {
    const html = document.documentElement;
    if (!html || !document.body) return;

    if (isOn) {
      // Idempotent: repeated stabilization calls during one close cycle must not overwrite
      // the real pre-existing inline values with our temporary "auto/none" values.
      if (!document.body.classList.contains('sjp-returning-from-preview')) {
        html.dataset.sjpPrevScrollBehavior = html.style.scrollBehavior || '';
        document.body.dataset.sjpPrevScrollBehavior = document.body.style.scrollBehavior || '';
        html.dataset.sjpPrevOverflowAnchor = html.style.overflowAnchor || '';
        document.body.dataset.sjpPrevOverflowAnchor = document.body.style.overflowAnchor || '';
      }

      html.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      html.style.overflowAnchor = 'none';
      document.body.style.overflowAnchor = 'none';
      document.body.classList.add('sjp-returning-from-preview');
    } else {
      html.style.scrollBehavior = html.dataset.sjpPrevScrollBehavior || '';
      document.body.style.scrollBehavior = document.body.dataset.sjpPrevScrollBehavior || '';
      html.style.overflowAnchor = html.dataset.sjpPrevOverflowAnchor || '';
      document.body.style.overflowAnchor = document.body.dataset.sjpPrevOverflowAnchor || '';
      delete html.dataset.sjpPrevScrollBehavior;
      delete document.body.dataset.sjpPrevScrollBehavior;
      delete html.dataset.sjpPrevOverflowAnchor;
      delete document.body.dataset.sjpPrevOverflowAnchor;
      document.body.classList.remove('sjp-returning-from-preview');
    }
  }

  function scrollDirectlyToY(y) {
    window.scrollTo({ top: Math.max(0, y || 0), left: 0, behavior: 'auto' });
  }

  // ✅ 2026-05-03 🧩 [SJP-PUBLIC-RETURN-06]
  // User scrolling inside the veiled private preview can otherwise make the browser clamp/anchor
  // to the preview scroll position when the private section is hidden.  This version uses the
  // precomputed returnY from launch time, disables scroll anchoring briefly, and repeats the same
  // exact numeric scroll before reopening the original TOC.
  function reopenReturnToc(item, storedY, forcedReturnTargetId = null, forcedReturnY = null) {
    const titleId = item.getAttribute('data-sjp-return-title-id');
    const contentId = item.getAttribute('data-sjp-return-content-id');
    const returnTargetId = forcedReturnTargetId || getFirstReturnTargetFromToc(item);
    const returnY = Number.isFinite(forcedReturnY) ? forcedReturnY : computeReturnY(returnTargetId, storedY);

    const reopen = () => {
      if (titleId && contentId && typeof open_drawer === 'function') {
        const titleEl = document.getElementById(titleId);
        const contentEl = document.getElementById(contentId);
        if (titleEl && contentEl) {
          open_drawer('drawer-right', 'toc', titleEl, contentEl);
        }
      }
    };

    setInstantScrollMode(true);

    const doReturnScroll = () => scrollDirectlyToY(returnY);

    // Multiple passes are intentional: hiding a long private section can trigger late scroll
    // anchoring/layout correction on desktop and mobile browsers.  We keep forcing the same saved
    // launch-time coordinate until layout has settled, then reopen the TOC.
    requestAnimationFrame(() => {
      doReturnScroll();
      requestAnimationFrame(() => {
        doReturnScroll();
        setTimeout(doReturnScroll, 60);
        setTimeout(doReturnScroll, 160);
        setTimeout(() => {
          doReturnScroll();
          reopen();
          setTimeout(() => setInstantScrollMode(false), 500);
        }, 280);
      });
    });
  }

  function activatePreviewVeil() {
    const overlay = document.querySelector('.overlay');
    document.body.classList.add('sjp-private-preview-active');
    if (overlay) {
      overlay.classList.add('visible', 'sjp-private-preview-veil');
    }
  }

  function deactivatePreviewVeil() {
    const overlay = document.querySelector('.overlay');
    document.body.classList.remove('sjp-private-preview-active');
    if (overlay) {
      overlay.classList.remove('sjp-private-preview-veil', 'visible');
    }
  }


  // ✅ 2026-05-03 🧩 [SJP-PUBLIC-RETURN-02]
  // When a TOC drawer is open, sjDrawerScripts pins <body> with position:fixed and top:-Ypx.
  // Reading window.scrollY at that moment can return 0, which caused private previews to return
  // to the top of the page instead of the chapter/section where the TOC was opened.
  function getReturnScrollYBeforeDrawerClose() {
    const bodyStyle = window.getComputedStyle(document.body);
    const inlineTop = document.body.style.top || bodyStyle.top || '';

    if (bodyStyle.position === 'fixed' && inlineTop) {
      const parsedTop = parseFloat(inlineTop);
      if (Number.isFinite(parsedTop)) {
        return Math.max(0, Math.abs(parsedTop));
      }
    }

    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function startLockedSectionPreview(item) {
    if (activePreview) return;

    const targetId = item.getAttribute('data-sjp-preview-target');
    const message = item.getAttribute('data-sjp-lock-message') || 'This section is part of the full Sourjoe Book.';

    if (!targetId || !document.getElementById(targetId)) {
      showTimedNotice(message, PREVIEW_DURATION_MS, null, 'Message closes in');
      return;
    }

    const storedY = getReturnScrollYBeforeDrawerClose();
    const returnTargetId = getFirstReturnTargetFromToc(item);
    const returnY = computeReturnY(returnTargetId, storedY);

    const begin = () => {
      activatePreviewVeil();
      const previewState = showPreviewTarget(targetId);
      activePreview = { item, storedY, previewState, returnTargetId, returnY };

      showTimedNotice(message, PREVIEW_DURATION_MS, () => {
        // Activate return stabilization BEFORE hiding the preview, because display:none on a
        // long private section is exactly what was causing post-scroll return drift.
        setInstantScrollMode(true);
        hidePreviewTarget(previewState);
        deactivatePreviewVeil();
        activePreview = null;
        reopenReturnToc(item, storedY, returnTargetId, returnY);
      });
    };

    const activeTocDrawer = document.querySelector('.drawer.active[data-drawer-type="toc"]');
    if (activeTocDrawer && typeof close_drawers === 'function') {
      close_drawers({
        keepScrollLocked: false,
        onClosed: function () {
          setTimeout(begin, 30);
        }
      });
    } else {
      begin();
    }
  }

  // ✅ 2026-05-21 🧩 [SJP-START-HERE-LOCK-BUBBLES-01]
  // START HERE recipe locks now use the black info-bubble pattern instead of the yellow timed notice.
  // Scope this tightly to the START HERE body recipe rows and START HERE TOC recipe rows only;
  // other locked TOC items still run the existing timed/veiled preview behaviour.
  function isStartHereLockBubbleItem(item) {
    if (!item) return false;
    if (item.getAttribute('data-sjp-lock-bubble') === 'true') return true;
    if (item.closest && item.closest('#startHereIntro') && item.classList && item.classList.contains('sjp-locked-inline')) return true;
    if (item.closest && item.closest('#TOC-starthere-content') && /^(start5|start6|start7)$/.test(item.id || '')) return true;
    return false;
  }

  function showStartHereLockBubble(item, event) {
    const message = item.getAttribute('data-sjp-lock-message') || 'This item is available in the full Sourjoe app.';
    const clickedIcon = event && event.target && event.target.closest
      ? event.target.closest('.sjp-lock-bubble-trigger')
      : null;
    const bubbleAnchor = clickedIcon
      || item.querySelector('.sjp-lock-bubble-trigger, .sjp-inline-lock-icon, .sjp-lock-icon')
      || item;

    const key = item.id
      ? `start-here-lock-${item.id}`
      : `start-here-lock-${(item.textContent || 'recipe').trim().replace(/\s+/g, '-').toLowerCase()}`;

    // ✅ 2026-05-24 🧩 [SJP-PASS12-SJB-LOCK-01]
    // Locked Start Here recipe icons now route through the shared sjBubbles engine.
    if (typeof sjpRegisterSjbMessage === 'function') {
      sjpRegisterSjbMessage(key, message);
    }
    bubbleAnchor.setAttribute('data-sjb', key);
    bubbleAnchor.setAttribute('behaviour-sjb', 'enabled');
    bubbleAnchor.classList.add('sjp-lock-bubble-trigger');

    if (window.SJBubbles && typeof window.SJBubbles.bindOne === 'function') {
      window.SJBubbles.bindOne(bubbleAnchor);
    }
    if (window.SJBubbles && typeof window.SJBubbles.toggle === 'function') {
      window.SJBubbles.toggle(key, bubbleAnchor);
      return;
    }

    showTimedNotice(message, PREVIEW_DURATION_MS, null, 'Message closes in');
  }

  // ✅ 2026-05-11 🧩 [SJP-PUBLIC-PASS5-LOCK-CLICK-FIX-01]
  // Locked public-preview links must win the click race.  Some drawer/body handlers can intercept
  // or stop bubbling before the older delegated handler sees the click, especially after content is
  // moved into a live drawer.  Capture these clicks early, cancel the native/default path, and use
  // stopImmediatePropagation() so the old link cannot also trigger a normal navigation/scroll action.
  function handleLockedClick(item, event) {
    if (!item) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }

    if (isStartHereLockBubbleItem(item)) {
      showStartHereLockBubble(item, event);
      return;
    }

    if (item.getAttribute('data-sjp-preview-target')) {
      startLockedSectionPreview(item);
    } else {
      showTimedNotice(item.getAttribute('data-sjp-lock-message'), PREVIEW_DURATION_MS, null, 'Message closes in');
    }
  }

  // Delegate in capture phase so both START HERE body locks and TOC-drawer locks remain reliable
  // even if another handler later stops propagation while managing drawer/link behaviour.
  document.addEventListener('click', function (event) {
    const item = event.target && event.target.closest ? event.target.closest('[data-sjp-lock="true"]') : null;
    if (!item) return;
    handleLockedClick(item, event);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target && event.target.closest ? event.target.closest('[data-sjp-lock="true"]') : null;
    if (!item) return;
    handleLockedClick(item, event);
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-sjp-lock="true"]').forEach(item => {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
    });
  });

  // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-VEIL-REMINDER-04]
  // During the veiled preview, the overlay blocks page clicks and, once the yellow notice is compact,
  // a veil click/tap temporarily re-expands that same notice with the sign-in/sign-up reminder.
  document.addEventListener('click', function (event) {
    if (!document.body.classList.contains('sjp-private-preview-active')) return;

    const notice = document.getElementById('sjpLockNotice');
    if (notice && notice.contains(event.target)) return;

    const overlay = event.target && event.target.closest ? event.target.closest('.overlay.sjp-private-preview-veil') : null;
    if (!overlay) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showCompactVeilReminder();
  }, true);

  // ✅ 2026-05-12 🧩 [SJP-PUBLIC-PASS7-SCROLL-ONLY-02]
  // Scroll fix only:
  // - Normal drawer overlays deliberately block wheel/touch scrolling in sjDrawerScripts.js.
  // - The timed private-preview veil is different: it should block clicks, but still allow the page
  //   to scroll naturally so visitors can browse the revealed private content.
  // - Therefore these handlers stop the shared drawer overlay blocker from receiving scroll gestures,
  //   but they do NOT call preventDefault() and do NOT do manual scrollBy() translation.
  function isPrivatePreviewVeilEvent(event) {
    if (!document.body.classList.contains('sjp-private-preview-active')) return false;
    const target = event.target && event.target.closest ? event.target.closest('.overlay.sjp-private-preview-veil') : null;
    return !!target;
  }

  document.addEventListener('wheel', function (event) {
    if (!isPrivatePreviewVeilEvent(event)) return;
    event.stopImmediatePropagation();
  }, { capture: true, passive: true });

  document.addEventListener('touchmove', function (event) {
    if (!isPrivatePreviewVeilEvent(event)) return;
    event.stopImmediatePropagation();
  }, { capture: true, passive: true });

  // ✅ 2026-05-04 🧩 [SJP-RECIPE-PUBLIC-LOCKS-01]
  // Public recipe-demo guardrails:
  // - Only MY FIRST BAKE is selectable in the Recipe Stats module.
  // - Only Preparation and Initial Mix are clickable in Steps Review.
  // - Locked choices show the same yellow timed information popup, but do NOT reveal a veiled preview.
  const SJP_ALLOWED_PUBLIC_RECIPE = 'My First Bake';
  const SJP_ALLOWED_STEP_CHAPTERS = new Set(['prep', 'initialMix']);

  function getCleanRecipeName(rawName) {
    return String(rawName || '').replace(/^\s*🔒\s*/, '').trim();
  }

  function showRecipeChoiceLock(recipeName) {
    const cleanName = getCleanRecipeName(recipeName) || 'That recipe';
    showTimedNotice(
      `${cleanName} is part of the full Sourjoe app. MY FIRST BAKE remains live in this public preview.`,
      PREVIEW_DURATION_MS,
      null,
      'Message closes in'
    );
  }

  function showStepChoiceLock(chapterName) {
    const readable = String(chapterName || 'That step').trim();
    showTimedNotice(
      `${readable} steps are part of the full Sourjoe app. Preparation and Initial Mix remain live in this public preview.`,
      PREVIEW_DURATION_MS,
      null,
      'Message closes in'
    );
  }

  function initializePublicRecipeLocks() {
    const recipeSelect = document.getElementById('recipeSelect');
    if (recipeSelect) {
      Array.from(recipeSelect.options || []).forEach(option => {
        if (option.value === SJP_ALLOWED_PUBLIC_RECIPE) return;
        option.dataset.sjpRecipeLock = 'true';
        if (!/^\s*🔒/.test(option.textContent || '')) {
          option.textContent = `🔒 ${option.textContent || option.value}`;
        }
      });
    }

    document.querySelectorAll('#bakerProcess .baker-btn[data-chapter]').forEach(btn => {
      const chapter = btn.dataset.chapter;
      if (SJP_ALLOWED_STEP_CHAPTERS.has(chapter)) return;

      btn.dataset.sjpStepLock = 'true';
      btn.classList.add('sjp-step-locked');
      if (!btn.dataset.sjpLockMessage) {
        btn.dataset.sjpLockMessage = `${(btn.querySelector('.baker-label')?.textContent || 'That step').replace('🔒','').trim()} steps are part of the full Sourjoe app.`;
      }

      const label = btn.querySelector('.baker-label');
      if (label && !label.querySelector('.sjp-inline-lock-icon')) {
        const lock = document.createElement('span');
        lock.className = 'sjp-inline-lock-icon';
        lock.setAttribute('aria-hidden', 'true');
        lock.textContent = '🔒';
        label.appendChild(document.createTextNode(' '));
        label.appendChild(lock);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initializePublicRecipeLocks);
  window.addEventListener('load', initializePublicRecipeLocks);

  // Capture phase beats sjRecipes.js bubbling listeners, so locked recipe choices never swap the data model.
  document.addEventListener('change', function (event) {
    const recipeSelect = event.target && event.target.id === 'recipeSelect' ? event.target : null;
    if (!recipeSelect) return;

    if (recipeSelect.value === SJP_ALLOWED_PUBLIC_RECIPE) return;

    const chosenOption = recipeSelect.options[recipeSelect.selectedIndex];
    const chosenName = chosenOption ? getCleanRecipeName(chosenOption.textContent || chosenOption.value) : recipeSelect.value;

    event.preventDefault();
    event.stopImmediatePropagation();
    showRecipeChoiceLock(chosenName);

    recipeSelect.value = SJP_ALLOWED_PUBLIC_RECIPE;
    // Let sjRecipes.js refresh from the still-live public recipe after we revert.
    setTimeout(() => {
      recipeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }, 0);
  }, true);

  function getActiveStepChapter() {
    const activeBtn = document.querySelector('#bakerProcess .baker-btn.active[data-chapter]');
    return activeBtn ? activeBtn.dataset.chapter : '';
  }

  function isAtLastStepOfCurrentChapter() {
    const pos = document.getElementById('stepsChapterPosition');
    const text = pos ? (pos.textContent || '') : '';
    const match = text.match(/Step\s+(\d+)\s+of\s+(\d+)/i);
    if (!match) return false;
    return Number(match[1]) >= Number(match[2]);
  }

  document.addEventListener('click', function (event) {
    const lockedStepBtn = event.target.closest && event.target.closest('#bakerProcess .baker-btn[data-sjp-step-lock="true"]');
    if (lockedStepBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const readable = (lockedStepBtn.querySelector('.baker-label')?.textContent || 'That step').replace('🔒', '').trim();
      showStepChoiceLock(readable);
      return;
    }

    const nextBtn = event.target.closest && event.target.closest('#stepsNext');
    if (nextBtn) {
      const activeChapter = getActiveStepChapter();
      if (activeChapter === 'initialMix' && isAtLastStepOfCurrentChapter()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showStepChoiceLock('Bulk Ferment');
      }
    }
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const lockedStepBtn = event.target.closest && event.target.closest('#bakerProcess .baker-btn[data-sjp-step-lock="true"]');
    if (!lockedStepBtn) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const readable = (lockedStepBtn.querySelector('.baker-label')?.textContent || 'That step').replace('🔒', '').trim();
    showStepChoiceLock(readable);
  }, true);

})();

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
  sjpScrollHeaderTarget(event, 'appRecipeStepPreview');
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

  if (typeof window.SJBubbles !== 'undefined' && window.SJBubbles && typeof window.SJBubbles.hide === 'function') {
    try { window.SJBubbles.hide(); } catch (e) {}
  }

  if (typeof clickAllLess === 'function') {
    clickAllLess('Less...');
  }

  if (typeof sjpHideGatedLiveDemoSections === 'function') {
    try { sjpHideGatedLiveDemoSections(); } catch (e) {}
  }

  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (e) {}

  const html = document.documentElement;
  const body = document.body;

  function doScrollTop() {
    if (html) html.style.scrollBehavior = 'auto';
    if (body) body.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.requestAnimationFrame(function () {
      if (html) html.style.scrollBehavior = '';
      if (body) body.style.scrollBehavior = '';
    });
  }

  if (typeof close_drawers === 'function') {
    close_drawers({
      keepScrollLocked: false,
      onClosed: function () {
        doScrollTop();
      }
    });
  } else {
    doScrollTop();
  }
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

// =================================================================================================
// ✅ 26Jun26c 🧩 [SJP-UP-ARROW-POSITION-CSS-01] / ✅ 26Jun26d 🧩 [SJP-UP-ARROW-FLEX-01]
// Up Arrow is a flex child inside .back-to-recipes-box (after the Recipes link).
// margin-left:auto pushes it to the right end of the left-box — no JS or percentage math needed.
// =================================================================================================

// =================================================================================================
// ✅ 2026-05-11 🧩 [SJP-PUBLIC-PASS5-ENTRY-CLOUD-01]
// Public Pass5 first-entry welcome overlay:
// - Replaces the old floating HOME/guide notice with a one-time-per-page-entry cloud-style welcome.
// - The Explore button removes the overlay for the current page visit only; a fresh site entry/load shows it again.
// - Glowing exploration cues remain active permanently, but the TOC guidance copy now lives in the permanent
//   yellow Welcome-panel TOC box instead of a separate HOME popup.
// =================================================================================================
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
      var isCalcReturn = false;
      try {
        isCalcReturn = new URLSearchParams(window.location.search).get('sjCalcReturn') === '1'
          || sessionStorage.getItem('SJ_CALC_RETURN_Y') !== null;
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
(function sjpEnableRecipeStepAutoplayLoop() {
  const SJP_STEP_VIDEO_OPTIONS = {
    autoplay: 'true',
    muted: 'true',
    loop: 'true'
  };

  function sjpAddStepVideoOptions(rawSrc) {
    if (!rawSrc || typeof rawSrc !== 'string') return rawSrc;

    try {
      const url = new URL(rawSrc, window.location.href);
      let changed = false;

      Object.entries(SJP_STEP_VIDEO_OPTIONS).forEach(([key, value]) => {
        if (url.searchParams.get(key) !== value) {
          url.searchParams.set(key, value);
          changed = true;
        }
      });

      return changed ? url.toString() : rawSrc;
    } catch (err) {
      // If an unexpected non-URL ever appears, leave it alone rather than breaking Recipe Steps.
      return rawSrc;
    }
  }

  function sjpSyncStepVideoIframe() {
    const iframe = document.getElementById('stepsVideo');
    if (!iframe) return;

    const currentSrc = iframe.getAttribute('src');
    const nextSrc = sjpAddStepVideoOptions(currentSrc);

    if (nextSrc && nextSrc !== currentSrc) {
      iframe.setAttribute('src', nextSrc);
    }

    // Reinforce iframe permissions in case the source markup changes later.
    const allow = iframe.getAttribute('allow') || '';
    if (!/autoplay/i.test(allow)) {
      iframe.setAttribute('allow', `${allow}; autoplay;`.replace(/;;+/g, ';'));
    }
  }

  function sjpBootStepVideoObserver() {
    const iframe = document.getElementById('stepsVideo');
    if (!iframe) return;

    sjpSyncStepVideoIframe();

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(mutation => mutation.type === 'attributes' && mutation.attributeName === 'src')) {
        sjpSyncStepVideoIframe();
      }
    });

    observer.observe(iframe, { attributes: true, attributeFilter: ['src'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sjpBootStepVideoObserver, { once: true });
  } else {
    sjpBootStepVideoObserver();
  }
})();

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
    selector: '#startHereIntro .sjp-start-here-link-list .link-style[onclick*="sjpOpenGlossaryAtoZLiveDemo"]',
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

function sjpInstallStartHereLockBubbles() {
  const selectors = [
    '#startHereIntro .sjp-start-here-link-list .sjp-locked-inline',
    '#TOC-starthere-content #start5',
    '#TOC-starthere-content #start6',
    '#TOC-starthere-content #start7'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach(function (item) {
    const message = item.getAttribute('data-sjp-lock-message') || 'This item is available in the full Sourjoe app.';
    const icon = item.querySelector('.sjp-inline-lock-icon, .sjp-lock-icon');

    item.setAttribute('data-sjp-lock-bubble', 'true');
    item.classList.add(item.closest('#TOC-starthere-content') ? 'sjp-start-here-locked-toc' : 'sjp-start-here-locked-inline');

    if (!icon) return;
    const key = item.id
      ? `start-here-lock-${item.id}`
      : `start-here-lock-${(item.textContent || 'recipe').trim().replace(/\s+/g, '-').toLowerCase()}`;

    sjpRegisterSjbMessage(key, message);
    icon.classList.add('sjp-lock-bubble-trigger');
    icon.setAttribute('data-sjb', key);
    icon.setAttribute('behaviour-sjb', 'enabled');
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', message);
  });
}

function sjpInstallPublicInfoBubbles() {
  sjpRegisterPublicSjbMessages();

  sjpInfoBubbleEntries.forEach(function (entry, index) {
    document.querySelectorAll(entry.selector).forEach(function (target) {
      sjpDecorateInfoTarget(target, entry, index);
    });
  });

  sjpInstallStartHereLockBubbles();

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
