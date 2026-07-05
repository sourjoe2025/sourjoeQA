const searchInput = document.getElementById('search'); //search input pane on header
  const elements = document.querySelectorAll('.content-section'); //sections are used for searches
  const noResultsMessage = document.getElementById('no-results'); //no results message, normally hidden
  const hideLeadbox = document.getElementById('lead-box'); //Intro lead box with spinning cube
  const targetCloseButton = document.getElementById('iconClose');  //blue close button
  const targetCloseBinocular = document.getElementById('binocularSearch'); //gray ghost close button
  const targetHighlightButton = document.getElementById('iconClearHighlight'); //yellow negate highlight search
  const targetTopButton = document.getElementById('iconTop'); //go to top blue button
  const targetTopGrayButton = document.getElementById('iconTopGray'); //go to top ghost button
  var   expanded = false;  //for expanding/collapsing hidden elements during a search
  var   isSearching = false;  // Used to supress openDrawer during a search
  var   debugData;
  var   screenWidth = screen.width;
  var   inner_Width = window.innerWidth;

// START process hash in URL onload.
// Calling URL hash is structured as #xyname.  x= 0 to 9 A to Z, y= 0 to 9 A to Z, name = text.            
    // If hashCommand.slice(0,1) is "0"–"9", actionType = 0–9.
    // If it’s "A"–"Z" or "a"–"z", actionType = 10–35
    // If it’s any other character, parseInt returns NaN.
// x indicates the type of action to take place. Stored as "actionType".
// y indicates a dataset for the action to take place.  Stored as "actionValue".
// text is stored for scroll-to target. Stored as "actionTarget".
// Data Sets below are for each type of action.

  const openDrawerDataSet = [  //order of entries =which drawer, title , content
    ['drawer-right','TOC-main-title','TOC-main-content'],  //10
    ['drawer-bottom','leftNutritionWhiteTitle','leftNutritionWhiteContent'],  //11
    ['drawer-bottom','leftNutritionWhiteTitle','leftNutritionWhiteContent'],  //12
    ['drawer-bottom','INTRO-drawer-title','BakersMathCalc']  //13
  ]

  // NEW: Dataset for macro commands (Action Type 2)
  // Each record contains a list of actions to perform after scrolling.
  // Structure: [ ["setDropdown", "targetID/Data", "Value"], ... ] sets the value of a SELECT item with ID = targetID
  // Structure: [ ["setButton", "targetID/Data", "Value"], ... ] sets the value of a BUTTON item with ID = targetID
  const macroCommandDataSet = [
    // Record 0: Select "My First Bake" recipe and switch to "Nutrition" tab
    [
      ["setDropdown", "recipeSelect", "My First Bake"], 
      ["setButton", "nutrition"]
    ],
    // Record 1: Select "Country White" recipe and switch to "Formula" tab
    [
      ["setDropdown", "recipeSelect", "Country White"], 
      ["setButton", "nutrition"]
    ],
    // Record 2: Select "High Hydration White" recipe and switch to "Statistics" tab
    [
      ["setDropdown", "recipeSelect", "High-Hydration White"], 
      ["setButton", "nutrition"]
    ],
    // Record 3: Select "50-50 Bread" recipe and switch to "steps" tab
    [
      ["setDropdown", "recipeSelect", "50-50 Bread"], 
      ["setButton", "nutrition"]
    ],
    // Record 4: Select "100% Whole Wheat" recipe and switch to "steps" tab
      [
      ["setDropdown", "recipeSelect", "100% Whole Wheat"], 
      ["setButton", "nutrition"]
    ],
    // Record 5: Select "White Seed Sourdough" recipe and switch to "steps" tab
      [
      ["setDropdown", "recipeSelect", "White Seed Sourdough"], 
      ["setButton", "nutrition"]
    ]
  ];

  // --- Helper Functions for Macro Commands ---

  /**
   * Sets a dropdown (select) value and triggers the change event.
   * @param {string} elementId - The ID of the select element.
   * @param {string} value - The value (or text) to select.
   */
  function setDropdownValue(elementId, value) {
    const select = document.getElementById(elementId);
    if (select) {
      select.value = value;
      // Dispatch change event so listeners (like in sjRecipes.js) pick up the new value
      // 🧩 CRITICAL FIX: { bubbles: true } ensures the 'change' event reaches the document-level listener.
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Clicks a view-tab button based on its data-view attribute.
   * @param {string} viewName - The data-view value (e.g., 'formula', 'nutrition').
   */
  function setTabButton(viewName) {
    // Target the specific button within the tabs wrapper
    const btn = document.querySelector(`.view-tab[data-view="${viewName}"]`);
    if (btn) {
      btn.click();
    }
  }

//CRITICAL:  This event listener is the reason the app responds quickly when invoked
//by app.sourjoe TOC.  Otherwise, 15 second delay before all content is loaded.
  document.addEventListener("DOMContentLoaded", () => {

  //Make all img element 'lazy' to prevent long delays in loading
    document.querySelectorAll('img').forEach(img => {
      // Only add if not already set
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  //Make all video element 'lazy' to prevent long delays in loading
    document.querySelectorAll('video').forEach(video => {
      // Only add if not already set
      if (!video.hasAttribute('preload')) {
        video.setAttribute('preload', 'none');
      }
    });
//Now navigate to passed hash command.  A bit wonky, but it works.
//app.sourjoe.com 'calls' this companion app (the Book of Sourjoe) using the hash address.
//Example: if app.sourjoe.com needs to get to book of sourjoe essentials: 
//"https://sourjoe.w3spaces.com/sjLearn.html#00essentialsIntro".  See comments below for details.

// 🟡 ✅ UPDATED 2026-03-23: App-only entry gate for sjLearn with URL-driven DEV bypass support
// Rule:
//  1) ONLY launches coming from app.sourjoe.com may view sjLearn on protected hosts:
//     - book.sourjoe.com
//     - sourjoe.w3spaces.com
//     - sjqa.w3spaces.com
//  2) Any manual / non-app entry redirects to ./sjPleaseSignIn.html
//
// Note: This is not "hacker-proof" (referrer-based), but matches the intended everyday-user gating.

const SJ_APP_ORIGIN_HTTPS = (window.SJ_ENV && window.SJ_ENV.appOrigin) || "https://app.sourjoe.com";
const SJ_APP_ORIGIN_HTTP  = "http://app.sourjoe.com";
const SJ_PROTECTED_HOSTS  = ["book.sourjoe.com", "bookqa.sourjoe.com", "sourjoe.w3spaces.com", "sjqa.w3spaces.com"];
const SJ_ALLOWED_LAUNCH_REFERRER_ORIGINS =
  (window.SJ_ENV && window.SJ_ENV.origins && window.SJ_ENV.origins.approvedBookLaunch) || [
    SJ_APP_ORIGIN_HTTPS,
    SJ_APP_ORIGIN_HTTP,
    "https://stage.sourjoe.com",
    "http://stage.sourjoe.com",
    "https://book.sourjoe.com",
    "http://book.sourjoe.com",
    "https://bookqa.sourjoe.com",
    "http://bookqa.sourjoe.com",
    "https://sourjoe.w3spaces.com",
    "http://sourjoe.w3spaces.com",
    "https://sjqa.w3spaces.com",
    "http://sjqa.w3spaces.com"
  ];
const SJ_AUTH_SESSION_KEY = "SJ_BOOK_AUTHED_FROM_APP";
const SJ_CITATIONS_RETURN_SESSION_KEY = "SJ_CITATIONS_RETURN_OK";
const SJ_HASHLESS_RETURN_SESSION_KEY = "SJ_HASHLESS_RETURN_OK";
const SJ_PLEASE_SIGN_IN_URL = "./sjPleaseSignIn.html";

// ✅ 2026-03-23 🧩 [SJ-ENTRY-GATE-DEV-02]
// DEV bypass is controlled by the URL so it can also work when the page is served through book.sourjoe.com.
// Use:
//   ?sjmode=dev  => bypass redirects on this tab/session
//   ?sjmode=prod => clear bypass and restore normal redirect behavior
const SJ_DEV_BYPASS_SESSION_KEY = "SJ_LEARN_DEV_BYPASS";
const SJ_MODE_PARAM_NAME = "sjmode";
const SJ_RETURN_PARAM_NAME = "sjreturn";

function sjGetEntryModeParam() {
  try {
    return (new URLSearchParams(window.location.search || "").get(SJ_MODE_PARAM_NAME) || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

function sjGetEntryReturnParam() {
  try {
    return (new URLSearchParams(window.location.search || "").get(SJ_RETURN_PARAM_NAME) || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

function sjStripEntryReturnParamFromUrl() {
  try {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has(SJ_RETURN_PARAM_NAME)) return;
    currentUrl.searchParams.delete(SJ_RETURN_PARAM_NAME);
    const cleanUrl = currentUrl.pathname + (currentUrl.search || "") + (currentUrl.hash || "");
    history.replaceState(null, "", cleanUrl);
  } catch (e) {}
}

function sjIsApprovedSameSiteReturn() {
  if (sjGetEntryReturnParam() !== "citations") return false;
  try {
    return sessionStorage.getItem(SJ_CITATIONS_RETURN_SESSION_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function sjIsApprovedHashlessReturn() {
  try {
    return sessionStorage.getItem(SJ_HASHLESS_RETURN_SESSION_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function sjConsumeApprovedHashlessReturn() {
  // Public Mode must not convert an incidental Citations-return marker into Book auth.
  if (sjIsPublicMode()) { return; }

  try {
    sessionStorage.removeItem(SJ_HASHLESS_RETURN_SESSION_KEY);
    sessionStorage.removeItem(SJ_CITATIONS_RETURN_SESSION_KEY);
    sessionStorage.setItem(SJ_AUTH_SESSION_KEY, "1");
  } catch (e) {}
}

function sjRefreshDevBypassFlagFromUrl() {
  const sjMode = sjGetEntryModeParam();

  try {
    if (sjMode === "dev") {
      sessionStorage.setItem(SJ_DEV_BYPASS_SESSION_KEY, "1");
    } else if (sjMode === "prod") {
      sessionStorage.removeItem(SJ_DEV_BYPASS_SESSION_KEY);
    }
  } catch (e) {}

  return sjMode;
}

function sjIsDevBypassEnabled() {
  sjRefreshDevBypassFlagFromUrl();

  try {
    return sessionStorage.getItem(SJ_DEV_BYPASS_SESSION_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function sjIsProtectedHost() {
  return SJ_PROTECTED_HOSTS.includes((window.location.hostname || "").toLowerCase());
}

function sjWasLaunchedFromAllowedReferrer() {
  const ref = document.referrer || "";
  if (!ref) return false;

  try {
    const refOrigin = new URL(ref).origin.toLowerCase();
    return SJ_ALLOWED_LAUNCH_REFERRER_ORIGINS.includes(refOrigin);
  } catch (e) {
    return false;
  }
}

// Backward-compatible name for older comments/callers: this now includes approved Sourjoe book/reference returns.
function sjWasLaunchedFromApp() {
  return sjWasLaunchedFromAllowedReferrer();
}

// ✅ 2026-06-27 🪟 [SJ-DRAWER-MODE-AUTH-01] Phase 2 — drawer-mode auth helper.
// Returns true when sjLearn.html was loaded with ?mode=drawer (public-preview iframe context).
// Used by sjIsAuthorizedLaunch() and sjRedirectToPleaseSignIn() to bypass the app-auth gate.
function sjIsDrawerMode() {
  try {
    return (new URLSearchParams(window.location.search || "").get("mode") || "").toLowerCase() === "drawer";
  } catch (e) {
    return false;
  }
}

// ✅ 2026-07-03 🧭 [SJ-PUBLIC-MODE-AUTH-01] Pass 2A.
// Explicit Public Mode is a route-level presentation state. It is permitted to view
// the Book shell without app authentication, but it must never create or consume
// SJ_BOOK_AUTHED_FROM_APP as part of that permission.
function sjIsPublicMode() {
  try {
    return (new URLSearchParams(window.location.search || "").get("mode") || "").toLowerCase() === "public";
  } catch (e) {
    return false;
  }
}

function sjIsAuthorizedLaunch() {
  // ✅ 2026-07-03 🧭 [SJ-PUBLIC-MODE-AUTH-02] Pass 2A.
  // Public route permission is explicit and has no auth-storage side effect.
  if (sjIsPublicMode()) { return true; }

  // ✅ 2026-06-27 🪟 [SJ-DRAWER-MODE-AUTH-02] Drawer mode is public-preview access — allow without app auth.
  if (sjIsDrawerMode()) { return true; }

  // ✅ 2026-03-23 🧩 [SJ-ENTRY-GATE-DEV-03]
  // DEV bypass takes priority so manual refresh/debug on protected hosts does not bounce to sign-in.
  // ✅ 2026-06-15 🧭 [SJ-ENTRY-GATE-RETURN-CLEAN-02]
  // Still clean the temporary Citations return marker if DEV bypass is active.
  if (sjIsDevBypassEnabled()) {
    if (sjGetEntryReturnParam() === "citations") sjStripEntryReturnParamFromUrl();
    return true;
  }

  // Allow if already authorized in this tab/session
  try {
    if (sessionStorage.getItem(SJ_AUTH_SESSION_KEY) === "1") {
      if (sjIsApprovedSameSiteReturn()) {
        sessionStorage.setItem(SJ_HASHLESS_RETURN_SESSION_KEY, "1");
        sjStripEntryReturnParamFromUrl();
      }
      return true;
    }
  } catch (e) {}

  // Allow one explicit same-site return from the Citations page only if sjCitations.html marked it.
  if (sjIsApprovedSameSiteReturn()) {
    try {
      sessionStorage.removeItem(SJ_CITATIONS_RETURN_SESSION_KEY);
      sessionStorage.setItem(SJ_AUTH_SESSION_KEY, "1");
      sessionStorage.setItem(SJ_HASHLESS_RETURN_SESSION_KEY, "1");
    } catch (e) {}
    sjStripEntryReturnParamFromUrl();
    return true;
  }

  // Do not allow sjLearn.html?sjreturn=citations to fall through to generic referrer approval.
  if (sjGetEntryReturnParam() === "citations") return false;

  // Allow if launched from app.sourjoe.com OR returned from an approved Sourjoe book/reference host.
  if (sjWasLaunchedFromAllowedReferrer()) {
    try { sessionStorage.setItem(SJ_AUTH_SESSION_KEY, "1"); } catch (e) {}
    return true;
  }

  return false;
}

function sjRedirectToPleaseSignIn(reason) {
  // ✅ 2026-07-03 🧭 [SJ-PUBLIC-MODE-AUTH-03] Pass 2A.
  // Public Mode is deliberately unauthenticated; do not redirect or mutate Book-auth state.
  if (sjIsPublicMode()) {
    console.warn("SJ Learn Public Mode active. Redirect suppressed:", reason);
    return;
  }

  // ✅ 2026-06-27 🪟 [SJ-DRAWER-MODE-AUTH-03] Never redirect when in drawer mode.
  if (sjIsDrawerMode()) {
    console.warn("SJ Learn drawer mode active. Redirect suppressed:", reason);
    return;
  }

  // ✅ 2026-03-23 🧩 [SJ-ENTRY-GATE-DEV-04]
  // In DEV bypass mode, never bounce to sjPleaseSignIn.html.
  if (sjIsDevBypassEnabled()) {
    console.warn("SJ Learn DEV bypass active. Redirect suppressed:", reason);
    return;
  }

  console.warn("SJ Learn launch blocked (not launched from app.sourjoe.com or an approved Sourjoe book/reference host). Redirecting:", reason);
  try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}
  try { sessionStorage.setItem("SJ_LEARN_LAUNCHED_WITH_HASH", "0"); } catch (e) {}
  window.location.replace(SJ_PLEASE_SIGN_IN_URL); // same-host sign-in page
}

// ✅ Gate immediately (before any hash actions)
if (sjIsProtectedHost() && !sjIsAuthorizedLaunch()) {
  sjRedirectToPleaseSignIn("Referrer was not app.sourjoe.com or an approved Sourjoe book/reference host");
}

// ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-06] BFCache re-gate.
// When the browser restores sjLearn from the Back/Forward Cache (event.persisted === true),
// DOMContentLoaded does NOT re-fire, so the gate above does not re-run.
// This listener catches every BFCache restore on a protected host and forces a fresh gate check.
// Because goBackAndClose / goToAppSourJoeAndClose cleared SJ_BOOK_AUTHED_FROM_APP before
// navigating away, the session key is gone and sjIsAuthorizedLaunch() will return false,
// redirecting the user to sjPleaseSignIn.html instead of showing the Book.
(function () {
  'use strict';
  window.addEventListener('pageshow', function (evt) {
    try {
      // Only act on BFCache restores (persisted = true means page was served from cache).
      // A normal page load is handled by the inline gate above.
      if (!evt.persisted) return;

      // Only enforce on protected hosts.
      if (!sjIsProtectedHost()) return;

      // DEV bypass: respect it here too so developers are not blocked.
      if (sjIsDevBypassEnabled()) return;

      // Re-run the full auth check.  If the session key was cleared on the way out, this fails.
      if (!sjIsAuthorizedLaunch()) {
        // Hide content instantly before the redirect fires to prevent a flash of the Book.
        try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
        sjRedirectToPleaseSignIn('BFCache restore on protected host without valid auth session');
      }
    } catch (e) {}
  });
}());

if (window.location.hash && window.location.hash.length > 1) {

  sessionStorage.setItem("SJ_LEARN_LAUNCHED_WITH_HASH", "1"); // ✅ NEW 2026 - Jan - 21

  console.log('entered')
  // ✂️ Remove the '#' symbol from the hash
  const hashCommand = window.location.hash.substring(1);

  // Remove the hash portion from the URL completely
  // 🔴 CHANGE 2026-Feb-26: keep querystring (so ?v=... and other params are NOT stripped)
  history.replaceState(null, null, window.location.pathname + window.location.search);

  let actionType, actionValue, actionTarget;

  // Extract the actionType (first digit) and actionValue (second digit)
  actionType  = parseInt(hashCommand.slice(0, 1), 36);
  actionValue = parseInt(hashCommand.slice(1, 2), 36);
  actionTarget = hashCommand.slice(2);

  console.log('actionType: ',actionType,'  actionValue: ',actionValue, '  actionTarget:  ',actionTarget);

  // Validate that both actionType and actionValue are numbers and that actionType is non-negative
  if (!isNaN(actionType) && !isNaN(actionValue) && actionType >= 0) {

    setTimeout(() => {
      // Determine the action to take based on actionType
      switch (actionType) {

        // actionType 0 is used to scroll to a section (use id of section) and ensure visibility is correct
        // actionTarget is ID of TOC entry used to perform the scroll to.
        case 0:
          // 🟡 NEW: invalid/unknown target => sign-in page
          if (!actionTarget || !document.getElementById(actionTarget)) {
            sjRedirectToPleaseSignIn("Invalid target id for actionType 0: " + actionTarget);
            break;
          }
          setTimeout(() => {
            resetAndScroll(actionTarget, 100);
          }, 300);
        break;

        // actionType 1 targets drawer openings upon load
        // Detail for the function 'open_drawer()' are held in 'openDrawerDataSet' array
        case 1:
          // 🟡 NEW: out of bounds => sign-in page
          if (actionValue < openDrawerDataSet.length) {
            open_drawer(
              openDrawerDataSet[actionValue][0],
              'toc',
              document.getElementById(openDrawerDataSet[actionValue][1]),
              document.getElementById(openDrawerDataSet[actionValue][2])
            );
          } else {
            sjRedirectToPleaseSignIn("Drawer index out of range: " + actionValue);
          }
        break;

        // actionType 2 executes a sequence of macro commands defined in macroCommandDataSet
        case 2:
          // 🟡 NEW: invalid/unknown target => sign-in page
          if (!actionTarget || !document.getElementById(actionTarget)) {
            sjRedirectToPleaseSignIn("Invalid target id for actionType 2: " + actionTarget);
            break;
          }

          // 1. Scroll INSTANTLY ('auto') to avoid timing conflicts with the smooth scroll animation
          setTimeout(() => {
            resetAndScroll(actionTarget, 100, 'auto');
          }, 300);

          // 2. Execute commands with a short delay to ensure initial DOM painting is done
          setTimeout(() => {
            // 🟡 NEW: out of bounds => sign-in page
            if (actionValue < macroCommandDataSet.length) {
              const commands = macroCommandDataSet[actionValue];

              commands.forEach(cmd => {
                const commandName = cmd[0];

                if (commandName === "setDropdown") {
                  setDropdownValue(cmd[1], cmd[2]);
                } else if (commandName === "setButton") {
                  setTimeout(() => {
                    setTabButton(cmd[1]);
                  }, 500);
                }
              });

            } else {
              sjRedirectToPleaseSignIn("Macro index out of range: " + actionValue);
            }
          }, 2000);
        break;

        default:
          // 🟡 NEW: unknown actionType => sign-in page
          sjRedirectToPleaseSignIn("Unknown actionType: " + actionType);
        break;
      }
    }, 300);

  } else {
    // 🟡 NEW: hash exists but does not meet expected format => sign-in page
    sjRedirectToPleaseSignIn("Invalid hash format: " + hashCommand);
  }

} else {
  // ✅ 2026-07-03 🧭 [SJ-PUBLIC-MODE-HASH-01] Pass 2A.
  // A direct Public Mode route intentionally has no Book-launch hash. Do not
  // consume a Book-return marker or create authenticated session state here.
  if (sjIsPublicMode()) {
    console.log("SJ Learn Public Mode loaded without a Book-launch hash.");
  } else if (sjIsApprovedHashlessReturn()) {
    // ✅ 2026-06-15 🧭 [SJ-CITATIONS-PROD-RETURN-01]
    // Citations returns intentionally come back to sjLearn.html without a hash.
    // The early gate / sjCitations.html set SJ_HASHLESS_RETURN_OK for this one safe case.
    sjConsumeApprovedHashlessReturn();
    try { sessionStorage.setItem("SJ_LEARN_LAUNCHED_WITH_HASH", "1"); } catch (e) {}
    console.log("SJ Learn allowed hashless return from Citations.");
  } else {
    // 🟡 NEW: no hash on incoming URL => sign-in page
    sjRedirectToPleaseSignIn("Missing hash");
  }
}

}); // ✅ Properly closes the function
// END process hash in URL onload.


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
  // Remove all highlights and reset sections.
  // ✅ 2026-06-09 🧭 [SJ-SEARCH-FORM-CONTROL-01]
  // Use the DOM un-wrapper instead of innerHTML replacement so form controls
  // such as Unit Converter <select>/<option> menus are not accidentally
  // searched, highlighted, or rebuilt as invalid markup.
  elements.forEach(element => {
      sjClearSearchHighlights(element);
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
  // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-REVEAL-03]
  // Put any calculator-only hidden wrappers back after Search cleanup.
  if (window.sjRestoreCalculatorSearchContent && typeof window.sjRestoreCalculatorSearchContent === 'function') {
    window.sjRestoreCalculatorSearchContent();
  }
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
  // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-UI-CLEARANCE-03]
  // Remove the Search layout/stacking override once the Search session fully ends.
  document.documentElement.classList.remove('sj-search-active');

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


// ✅ 2026-06-09 🧭 [SJ-SEARCH-FORM-CONTROL-02]
// Search should only count text the user can actually see as highlighted text.
// Native form controls are a special problem: a <select> can contain option text
// such as "LEAVEN", but browsers cannot reliably show our <span class="highlight">
// inside that closed menu. Counting those terms produces "xx of yy" navigation
// entries with no visible orange/yellow hit. Exclude form-control text from the
// normal Search index unless we later build a dedicated visible cue for controls.
function sjShouldSkipSearchTextNode(textNode) {
  if (!textNode || !textNode.parentElement) return true;

  const parent = textNode.parentElement;

  // ✅ 2026-06-09 🧭 [SJ-SEARCH-IGNORE-HELPERS-01]
  // Helper bubbles and helper controls are guidance UI, not book/app content.
  // They can contain real words such as "glossary", but they are not stable
  // reading targets and should not create Next/Previous search stops.
  if (parent.closest('.sjb-bubble, .sjb-bubble__content, .sjb-helpDot, .sjb-tocHelpersRow')) return true;

  if (parent.closest('select, option, input, textarea, script, style, noscript, template')) return true;
  if (parent.closest('[data-sj-search-ignore="true"], .sj-search-ignore')) return true;

  // ✅ 2026-06-09 🧭 [SJ-SEARCH-HIDDEN-MOREMSG-01]
  // Some legacy/placeholder content uses the normal hidden More-message class
  // without a real More/Less controller. Search could count that text, update
  // "xx of yy", and then have no visible target to scroll to. During Search,
  // legitimate More blocks have already been opened by clickAllMore(); if a
  // content-section-moreMsg block is still display:none here, treat it as
  // unreachable and do not index it.
  const hiddenMoreMsg = parent.closest('.content-section-moreMsg');
  if (hiddenMoreMsg) {
    try {
      const moreStyle = window.getComputedStyle(hiddenMoreMsg);
      if (hiddenMoreMsg.hidden || !moreStyle || moreStyle.display === 'none' || moreStyle.visibility === 'hidden') return true;
    } catch (e) {
      // If style inspection fails, leave the node searchable rather than over-filtering.
    }
  }

  return false;
}

function sjEscapeSearchRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sjGetSearchableTextContent(root) {
  if (!root) return '';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (sjShouldSkipSearchTextNode(node)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  let text = '';
  let node;
  while ((node = walker.nextNode())) {
    text += ' ' + node.nodeValue;
  }

  return text;
}

function sjClearSearchHighlights(root) {
  if (!root || !root.querySelectorAll) return;

  root.querySelectorAll('span.highlight').forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent || ''));
  });

  if (typeof root.normalize === 'function') {
    root.normalize();
  }
}

function sjHighlightSearchableTextNodes(root, searchTerm) {
  if (!root || !searchTerm) return 0;

  const safeTerm = sjEscapeSearchRegExp(searchTerm);
  if (!safeTerm) return 0;

  const regex = new RegExp(safeTerm, 'gi');
  const textNodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (sjShouldSkipSearchTextNode(node)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !regex.test(node.nodeValue)) {
        regex.lastIndex = 0;
        return NodeFilter.FILTER_REJECT;
      }
      regex.lastIndex = 0;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  let count = 0;

  textNodes.forEach(textNode => {
    const text = textNode.nodeValue;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;

    regex.lastIndex = 0;
    text.replace(regex, (match, offset) => {
      if (offset > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
      }

      const span = document.createElement('span');
      span.className = 'highlight';
      span.textContent = match;
      frag.appendChild(span);
      count += 1;
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(frag);
  });

  return count;
}

/**
 * function used by event listener of Search input.  Highlights found search character(s)
 * Called by 'inputDevounce' which is targetted by 'input' event listener.
 */
function forSearchEventListener(searchTerm) {
  //const searchTerm = searchInput.value.trim().toLowerCase();
  // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-UI-CLEARANCE-01]
  // While Search is active, calculator drawers may be opened automatically to reveal hits.
  // This class lets CSS keep the Search controls above the drawer/veil and reserve header space.
  document.documentElement.classList.add('sj-search-active');
  let hasResults = false;

  if (expanded == 0) {  //expand all elements for search.  var expanded keeps track.
    sjSnapshotSjrhlSearchStates();
    clickAllMore();
    // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-REVEAL-02]
    // Calculator Rabbit Hole wrappers may carry hidden gates outside the drawer.
    // Search must lift those gates so calculator hits are counted AND revealable.
    if (window.sjPrepareCalculatorSearchContent && typeof window.sjPrepareCalculatorSearchContent === 'function') {
      window.sjPrepareCalculatorSearchContent();
    }
    expanded = 1;
  }

  // Select all searchable elements
  //const elements = document.querySelectorAll('.content-section');

  elements.forEach(element => {
    // Clear previous highlights without rebuilding native controls.
    sjClearSearchHighlights(element);

    const textContent = sjGetSearchableTextContent(element).toLowerCase();
    const isManagedSection = !!(
      window.SJSectionController &&
      typeof window.SJSectionController.isManagedElement === 'function' &&
      window.SJSectionController.isManagedElement(element)
    );

    if (searchTerm && textContent.includes(searchTerm)) {
      // The controller owns display for converted Sections. Search counts/highlights them now,
      // then sjRevealSearchMatchContainers() opens only the selected match's Section.
      if (!isManagedSection) {
        element.style.display = 'block';
      }
      hasResults = true;

      // Check each child content-section inside this element
      const childSections = element.querySelectorAll('.content-section');
      childSections.forEach(child => {
        if (sjGetSearchableTextContent(child).toLowerCase().includes(searchTerm)) {
          child.style.display = 'block'; // Show only matching child sections
        } else {
          child.style.display = 'none'; // Hide non-matching child sections
        }
      });

      // Preserve structure while highlighting search terms.
      // ✅ 2026-06-09 🧭 [SJ-SEARCH-FORM-CONTROL-03]
      // Highlight text nodes only. This avoids false, unreachable hits inside
      // closed native menus such as Unit Converter's Ingredient dropdown.
      sjHighlightSearchableTextNodes(element, searchTerm);

    } else if (!searchTerm) {
      // Reset legacy visibility when search is cleared. Converted Sections retain controller state.
      if (!isManagedSection) {
        element.style.display = 'block';
        element.querySelectorAll('.content-section').forEach(child => child.style.display = 'block');
      }
    } else {
      if (!isManagedSection) {
        element.style.display = 'none';
      }
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
      if (window.sjRestoreCalculatorSearchContent && typeof window.sjRestoreCalculatorSearchContent === 'function') {
        window.sjRestoreCalculatorSearchContent();
      }
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

  // ✅ 2026-06-09 🧭 [SJ-SEARCH-PREV-SCROLL-05]
  // A new/changed search term rebuilds the highlight spans, so reset navigation
  // to a clean starting point. This prevents stale indexes from crossing terms.
  if (typeof currentMatchIndex !== 'undefined') { currentMatchIndex = -1; }

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
    // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-UI-CLEARANCE-02]
    // Search mode must remain reachable even when a calculator drawer is auto-opened for a hit.
    document.documentElement.classList.add('sj-search-active');


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
      // ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-01] Clear auth before leaving so Back into sjLearn is blocked.
      try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}
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
      window.location.href = (window.sjAppUrl ? window.sjAppUrl("recipes") : "https://app.sourjoe.com/recipes");
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

      // ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-02] Clear auth before walking back so a subsequent
      // Back press into sjLearn (e.g. after logout) cannot re-enter via the session key.
      try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}

      // Start the unwind
      stepBackUntilExit();
      return;
    }

    // 3) If there is no history (rare), try referrer as a fallback.
    // ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-03] Clear auth on all remaining exit paths too.
    try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}
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
  //      onclick="goToAppSourJoeAndClose(this.href, event);">
  //      Go to Recipe Step
  //   </a>
  //
  // NOTES:
  // - You should NOT put target="_blank" on these sjLearn ---> app.sourjoe links.
  // - If window.opener is missing/blocked (noopener), we fall back to navigating THIS tab.
  //
  function goToAppSourJoeAndClose(targetUrlOrPath, evt) {

    // 0) HARD STOP the anchor from opening a new tab/window
    //    (This is the #1 reason you see duplicates.)
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (!targetUrlOrPath) return;

    // ✅ Allow either a full URL or a relative route string
    const APP_BASE = (window.SJ_ENV && window.SJ_ENV.appOrigin) || "https://app.sourjoe.com";

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

        // ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-04] Clear auth before closing so Back (if close fails)
        // cannot re-enter sjLearn via the session key.
        try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}

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
    // ✅ 25Jun26b 🔒 [SJ-LOGOUT-GATE-05] Clear auth before navigating away same-tab.
    try { sessionStorage.removeItem(SJ_AUTH_SESSION_KEY); } catch (e) {}
    window.location.href = targetUrl;

  }

  // 🟡 ✅ NEW 2026-Feb-26: Expose nav helpers for inline onclick="" handlers in sjLearn.html
  // (Inline onclick cannot see functions declared inside DOMContentLoaded unless we attach them to window.)
  window.goBackAndClose = goBackAndClose;
  window.goToAppSourJoeAndClose = goToAppSourJoeAndClose;

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
// ✅ 2026-07-04 🧭 [SJ-LOWER-UP-ARROW-RESET-01]
// The lower fixed-header Up Arrow is a true reading reset in both Book and Public personalities:
// close open managed Sections, legacy More panels, Rabbit Holes and drawers, then return to page top.
// This intentionally does not clear Search state; it only resets opened content/navigation surfaces.
function sjCloseAllAndScrollTop(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  try {
    if (typeof clickAllLess === 'function') {
      clickAllLess('Less...');
    }
  } catch (e) {}

  try {
    if (window.SJSectionController && typeof window.SJSectionController.closeAll === 'function') {
      window.SJSectionController.closeAll({ resetInterior: true, reason: 'lower-up-arrow' });
    }
  } catch (e) {}

  try {
    if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.closeAll === 'function') {
      window.SJRabbitHoleLink.closeAll({ restoreTrigger: false });
    }
  } catch (e) {}

  try {
    if (typeof closeAllRabbitHoles === 'function') {
      closeAllRabbitHoles();
    }
  } catch (e) {}

  const scrollToBookTop = function () {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  try {
    if (typeof close_drawers === 'function') {
      close_drawers({
        keepScrollLocked: false,
        onClosed: function () {
          window.requestAnimationFrame(scrollToBookTop);
        }
      });
    } else {
      scrollToBookTop();
    }
  } catch (e) {
    scrollToBookTop();
  }

  return false;
}

function scrollToTarget(hash, offset, behavior = 'smooth') {
    if (!hash) return; // Ensure hash is valid before proceeding

    // Remove the '#' if it exists; if it's already an ID, this does nothing
    const targetId = hash.startsWith("#") ? hash.slice(1) : hash;

    // ✅ 2026-07-03 🧭 [SJ-SECTION-CONTROLLER-NAV-01]
    // A registered hidden Section must be revealed before any legacy navigation scrolls to it.
    // This keeps App hashes, inline links, and old TOC calls valid during staged conversion.
    let managedReveal = false;
    try {
      if (window.SJSectionController && typeof window.SJSectionController.beforeNavigate === 'function') {
        managedReveal = !!window.SJSectionController.beforeNavigate(targetId, {
          preserveInteriorState: document.documentElement.classList.contains('sj-search-active')
        });
      }
    } catch (e) {}

    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const scrollNow = function () {
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: behavior, // Use the passed parameter (defaults to 'smooth')
        });
      };

      // Let hidden-to-visible layout settle before measuring a newly managed Section.
      if (managedReveal) {
        window.requestAnimationFrame(scrollNow);
      } else {
        scrollNow();
      }
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

      // Use a short delay to ensure the browser processes the reset
      setTimeout(() => {
        // Pass the behavior argument to the scroller
        scrollToTarget(targetId, offset, behavior);
      }, 10);
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
  // ✅ 2026-07-03 🧭 [SJ-SECTION-CONTROLLER-NAV-02]
  // Converted Chapters use the neutral Section Controller. The More/Less engines stay untouched
  // for every non-converted Section and for the converted Section's own internal detail.
  try {
    if (window.SJSectionController && typeof window.SJSectionController.isManagedId === 'function') {
      const managedId = window.SJSectionController.isManagedId(targetId) ? targetId :
        (window.SJSectionController.isManagedId(parentId) ? parentId : null);
      if (managedId) {
        window.SJSectionController.open(managedId, {
          offset: offset || 100,
          scroll: true,
          closeDrawers: true,
          preserveInteriorState: document.documentElement.classList.contains('sj-search-active')
        });
        return;
      }
    }
  } catch (e) {}

  clickAllLess('Less...'); // Close previously expanded elements
  setTimeout(() => {
    // Only expand if a valid `parentId` is provided
    if (parentId) {
      clickMoreForId(parentId); // Expand only within the given parent ID
    }
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
  clickAllLess('Less...');
  resetAndScroll(targetId, offset);
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

// ✅ 2026-06-14 🧮 [SJ-GLOSS-CALC-CALLER-PRESERVE-01]
// A Glossary term may launch a calculator drawer. The Glossary panel itself should remain
// the caller context, but its full-screen veil/envelope z-index sits above drawers.
// These helpers temporarily lower/suspend the Glossary modal layer while the calculator
// drawer is open, then restore the same active term when the calculator closes.
var sjGlossaryDrawerSuspend = null;

window.sjHasSuspendedGlossaryForDrawer = function sjHasSuspendedGlossaryForDrawer() {
  return !!sjGlossaryDrawerSuspend;
};

window.sjSuspendActiveGlossaryForDrawer = function sjSuspendActiveGlossaryForDrawer(originNode) {
  try {
    // ✅ 2026-06-14 🧮 [SJ-GLOSS-CALC-CALLER-PRESERVE-03]
    // Do not rely only on sjGlossaryActive.  In the real click path, the calculator link lives
    // inside the open Glossary panel, so derive the caller panel from event.target first. This
    // makes the suspend deterministic even if the active-state variable has drifted.
    var panel = null;

    if (originNode && originNode.closest) {
      panel = originNode.closest('.glossary-panel');
    }

    if (!panel && sjGlossaryActive && sjGlossaryActive.panelId) {
      panel = document.getElementById(sjGlossaryActive.panelId);
    }

    if (!panel || !panel.id) return false;
    if (window.getComputedStyle(panel).display === 'none') return false;

    var ownerLi = panel.closest('li');
    var btnId = (sjGlossaryActive && sjGlossaryActive.panelId === panel.id) ? sjGlossaryActive.btnId : '';

    // Fallback: Glossary terms store a hidden GL-xxxx span in the same <li>.
    if (!btnId && ownerLi && ownerLi.querySelector) {
      var btnNode = ownerLi.querySelector('[id^="GL-"]');
      if (btnNode && btnNode.id) btnId = btnNode.id;
    }

    if (!btnId) return false;

    sjGlossaryDrawerSuspend = {
      btnId: btnId,
      panelId: panel.id,
      priorPanelInlineDisplay: panel.style.display || '',
      priorOwnerHadOpenClass: ownerLi ? ownerLi.classList.contains('sjGlossary-open') : false,
      priorOwnerInlineZIndex: ownerLi ? ownerLi.style.zIndex : '',
      priorOwnerInlineVisibility: ownerLi ? ownerLi.style.visibility : '',
      priorOwnerInlinePointerEvents: ownerLi ? ownerLi.style.pointerEvents : '',
      priorOwnerAriaHidden: ownerLi ? ownerLi.getAttribute('aria-hidden') : null
    };

    // Hide the Glossary modal surface while the calculator drawer is active.  This is more
    // reliable than trying to lower z-index because the open Glossary <li> is explicitly lifted
    // above all normal drawers by CSS.  The open context is restored when the calculator closes.
    panel.style.display = 'none';
    if (ownerLi) {
      ownerLi.classList.remove('sjGlossary-open');
      ownerLi.style.zIndex = '1';
      ownerLi.style.visibility = '';
      ownerLi.style.pointerEvents = '';
      ownerLi.removeAttribute('aria-hidden');
    }

    sjHideGlossaryOverlay();

    // sjHideGlossaryOverlay() may ask the general Rabbit-Hole veil to resync. Be explicit:
    // no non-calculator Rabbit-Hole veil should remain while the calculator drawer is opening.
    try {
      if (typeof sjHideRabbitHoleOverlay === 'function') { sjHideRabbitHoleOverlay(); }
    } catch (e2) {}

    return true;
  } catch (e) {
    console.warn('Glossary suspend for calculator drawer failed:', e);
    return false;
  }
};

window.sjResumeActiveGlossaryAfterDrawer = function sjResumeActiveGlossaryAfterDrawer() {
  try {
    var ctx = sjGlossaryDrawerSuspend;
    sjGlossaryDrawerSuspend = null;

    if (!ctx || !ctx.btnId || !ctx.panelId) return false;

    var panel = document.getElementById(ctx.panelId);
    if (!panel) return false;

    var ownerLi = panel.closest('li');

    // Restore the same open Glossary context that invoked the calculator.  This puts the
    // user back into the normal Glossary state, so the existing term/overlay close path still
    // performs the polished scroll/reposition behavior.
    panel.style.display = ctx.priorPanelInlineDisplay || 'block';

    if (ownerLi) {
      ownerLi.style.zIndex = ctx.priorOwnerInlineZIndex || '';
      ownerLi.style.visibility = ctx.priorOwnerInlineVisibility || '';
      ownerLi.style.pointerEvents = ctx.priorOwnerInlinePointerEvents || '';
      if (ctx.priorOwnerAriaHidden === null) ownerLi.removeAttribute('aria-hidden');
      else ownerLi.setAttribute('aria-hidden', ctx.priorOwnerAriaHidden);
      ownerLi.classList.add('sjGlossary-open');
    }

    sjGlossaryActive = { btnId: ctx.btnId, panelId: ctx.panelId };

    if (ownerLi && typeof sjPositionGlossaryEnvelopeForModal === 'function') {
      sjPositionGlossaryEnvelopeForModal(ownerLi);
    }

    sjShowGlossaryOverlay();
    return true;
  } catch (e) {
    console.warn('Glossary resume after calculator drawer close failed:', e);
    return false;
  }
};

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
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');

// ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-REVEAL-04]
// Search navigation must honor a simple contract:
//   1) If a hit is counted, the user must be able to navigate to it.
//   2) If the hit lives inside a Calculator or Calculator Rabbit Hole, open that UI first.
//   3) If the hit lives inside a drawer, scroll the drawer content, not the page.
function sjNormalizeSearchIndex(index, length) {
  if (!length) return -1;
  return ((index % length) + length) % length;
}

function sjSearchElementHasBox(el) {
  if (!el || !el.isConnected) return false;

  try {
    let walker = el;
    while (walker && walker.nodeType === 1 && walker !== document.documentElement) {
      const cs = window.getComputedStyle(walker);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return false;
      walker = walker.parentElement;
    }

    return !!el.getClientRects().length;
  } catch (e) {
    return false;
  }
}

function sjRevealSearchMatchContainers(matchElement) {
  let didReveal = false;

  // ✅ 2026-07-03 🧭 [SJ-SECTION-CONTROLLER-SEARCH-01]
  // Book Search can still index hidden converted Sections, but it reveals only the active hit's
  // owning Section. This prevents Search from bypassing the one-active-section model.
  try {
    if (window.SJSectionController && typeof window.SJSectionController.revealForElement === 'function') {
      didReveal = !!window.SJSectionController.revealForElement(matchElement) || didReveal;
    }
  } catch (e) {}

  // Calculator reveal lives in sjMathScripts.js because it knows the calculator drawer map,
  // the forced-open More/Less regions, and the calculator Rabbit Hole wrappers.
  try {
    if (window.sjRevealCalculatorSearchMatch && typeof window.sjRevealCalculatorSearchMatch === 'function') {
      didReveal = !!window.sjRevealCalculatorSearchMatch(matchElement) || didReveal;
    }
  } catch (e) {
    console.warn('Calculator Search reveal failed:', e);
  }

  return didReveal;
}

function sjResolveSearchScrollTarget(matchElement) {
  if (!matchElement) return null;

  // Prefer the actual orange hit when it is visible. This is the normal path.
  if (sjSearchElementHasBox(matchElement)) return matchElement;

  // Glossary hits can begin hidden inside a term Rabbit Hole. If the active term
  // was revealed, the orange span may become visible; otherwise scroll to the
  // visible orange Glossary cue rather than pretending the hidden span is usable.
  const activeGlossaryCue = document.querySelector('.glossary-search-hit-active');
  if (activeGlossaryCue && sjSearchElementHasBox(activeGlossaryCue)) {
    return activeGlossaryCue;
  }

  // Last-resort fallback for unusual inline/boxless spans: use a visible ancestor.
  let walker = matchElement.parentElement;
  while (walker && walker !== document.body) {
    if (sjSearchElementHasBox(walker)) return walker;
    walker = walker.parentElement;
  }

  return null;
}

function sjFindSearchScrollContainer(scrollTarget) {
  if (!scrollTarget || !scrollTarget.closest) return null;

  const drawerContent = scrollTarget.closest('.drawer-content');
  if (drawerContent && drawerContent.closest('.drawer.active')) {
    return drawerContent;
  }

  return null;
}

function sjRunWithInstantSearchScroll(scrollOwner, scrollFn) {
  const html = document.documentElement;
  const body = document.body;
  const owner = scrollOwner || null;
  const prevHtmlScrollBehavior = html ? html.style.scrollBehavior : '';
  const prevBodyScrollBehavior = body ? body.style.scrollBehavior : '';
  const prevOwnerScrollBehavior = owner ? owner.style.scrollBehavior : '';

  try {
    if (html) html.style.scrollBehavior = 'auto';
    if (body) body.style.scrollBehavior = 'auto';
    if (owner) owner.style.scrollBehavior = 'auto';
    return scrollFn();
  } finally {
    requestAnimationFrame(() => {
      if (html) html.style.scrollBehavior = prevHtmlScrollBehavior;
      if (body) body.style.scrollBehavior = prevBodyScrollBehavior;
      if (owner) owner.style.scrollBehavior = prevOwnerScrollBehavior;
    });
  }
}

function sjScrollSearchTargetInsideContainer(scrollTarget, container) {
  if (!scrollTarget || !container) return false;

  try {
    const targetRect = scrollTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (!targetRect || !containerRect || targetRect.height <= 0) return false;

    const topGap = 18;
    const usableHeight = Math.max(120, container.clientHeight - topGap - 24);
    const desiredContainerTop = topGap + Math.max(8, (usableHeight - targetRect.height) / 2);
    const targetOffsetTop = container.scrollTop + targetRect.top - containerRect.top;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const nextTop = Math.max(0, Math.min(targetOffsetTop - desiredContainerTop, maxScrollTop));

    sjRunWithInstantSearchScroll(container, () => {
      container.scrollTo({ top: nextTop, behavior: 'auto' });
    });
    return true;
  } catch (e) {
    return false;
  }
}

function sjScrollToSearchTarget(scrollTarget) {
  if (!scrollTarget) return false;

  const drawerScrollContainer = sjFindSearchScrollContainer(scrollTarget);
  if (drawerScrollContainer) {
    return sjScrollSearchTargetInsideContainer(scrollTarget, drawerScrollContainer);
  }

  try {
    const rect = scrollTarget.getBoundingClientRect();
    if (!rect || rect.height <= 0) return false;

    const scroller = document.scrollingElement || document.documentElement;
    const maxScrollTop = Math.max(0, scroller.scrollHeight - window.innerHeight);
    const fixedTop = (typeof sjComputeFixedHeaderBottom === 'function')
      ? sjComputeFixedHeaderBottom()
      : 100;

    const topGap = Math.max(12, fixedTop + 14);
    const usableHeight = Math.max(120, window.innerHeight - topGap - 24);
    const desiredViewportTop = topGap + Math.max(12, (usableHeight - rect.height) / 2);
    const targetTop = Math.max(0, Math.min(window.scrollY + rect.top - desiredViewportTop, maxScrollTop));

    // Use immediate scrolling here. Smooth scrolling was brittle when users tapped
    // Previous/Next repeatedly, especially after wrapping or crossing calculator hits.
    // CSS scroll-behavior:smooth can still affect behavior:'auto', so temporarily
    // force inline auto behavior for the search-owned scroll itself.
    sjRunWithInstantSearchScroll(null, () => {
      window.scrollTo({ top: targetTop, behavior: 'auto' });
    });

    requestAnimationFrame(() => {
      const settledRect = scrollTarget.getBoundingClientRect();
      const safeTop = (typeof sjComputeFixedHeaderBottom === 'function')
        ? sjComputeFixedHeaderBottom() + 12
        : 112;
      const safeBottom = window.innerHeight - 24;

      if (settledRect.top < safeTop) {
        sjRunWithInstantSearchScroll(null, () => {
          window.scrollBy({ top: settledRect.top - safeTop, behavior: 'auto' });
        });
      } else if (settledRect.bottom > safeBottom) {
        sjRunWithInstantSearchScroll(null, () => {
          window.scrollBy({ top: settledRect.bottom - safeBottom, behavior: 'auto' });
        });
      }
    });

    return true;
  } catch (e) {
    return false;
  }
}

let sjSearchScrollRequestSeq = 0;
let sjSearchScrollTimers = [];

function sjCancelPendingSearchScrolls() {
  sjSearchScrollRequestSeq += 1;
  sjSearchScrollTimers.forEach(timerId => window.clearTimeout(timerId));
  sjSearchScrollTimers = [];
}

function sjScheduleSearchTargetScroll(matchElement, didRevealContainers) {
  sjCancelPendingSearchScrolls();

  const requestSeq = sjSearchScrollRequestSeq;
  const delays = didRevealContainers ? [0, 80, 180, 360, 620] : [0, 60];

  delays.forEach(delay => {
    const timerId = window.setTimeout(() => {
      if (requestSeq !== sjSearchScrollRequestSeq) return;
      if (!matchElement || !matchElement.isConnected || !matchElement.classList.contains('active')) return;

      window.requestAnimationFrame(() => {
        if (requestSeq !== sjSearchScrollRequestSeq) return;
        if (!matchElement || !matchElement.isConnected || !matchElement.classList.contains('active')) return;

        const scrollTarget = sjResolveSearchScrollTarget(matchElement);
        if (scrollTarget) {
          sjScrollToSearchTarget(scrollTarget);
        }
      });
    }, delay);

    sjSearchScrollTimers.push(timerId);
  });
}


function sjActivateSearchMatch(matches, index) {
  if (!matches || !matches.length) return false;

  matches.forEach(match => match.classList.remove('active'));
  const match = matches[index];
  if (!match) return false;

  match.classList.add('active');

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-CUE-09] If the active hit is hidden inside a Glossary rabbit hole,
  // mirror the orange current-hit state on the visible Glossary term border.
  syncGlossarySearchCueActiveState();

  // ✅ 2026-03-13 🧩 [SJ-GLOSS-SEARCH-REVEAL-05]
  // When Next/Prev leaves Glossary rabbit-hole content, close any search-opened Glossary term
  // so the user does not keep a stale panel on screen while navigating elsewhere.
  if (typeof sjIsSearchSessionActive === 'function' && sjIsSearchSessionActive()) {
    const activeGlossaryPanel = match.closest('.glossary-panel');
    if (!activeGlossaryPanel && typeof sjCloseGlossarySearchPanels === 'function') {
      sjCloseGlossarySearchPanels();
    }
  }

  const didRevealContainers = sjRevealSearchMatchContainers(match);
  sjScheduleSearchTargetScroll(match, didRevealContainers);
  return true;
}

function showMatch(index, direction) {
  // Get all the highlighted elements. Convert to an array so repeated wrap logic
  // cannot be affected by a live DOM collection or browser quirks.
  const matches = Array.from(document.querySelectorAll('.highlight'));
  if (!matches.length) {
    currentMatchIndex = -1;
    updateMatchIndicator(0, 0);
    return;
  }

  // Do NOT skip hidden hits here. The correct fix is to reveal the UI that owns
  // the hit, not to silently skip it. This preserves normal backward wrap:
  // 1 of N → N of N → N-1 of N.
  currentMatchIndex = sjNormalizeSearchIndex(index, matches.length);
  sjActivateSearchMatch(matches, currentMatchIndex);
  updateMatchIndicator(currentMatchIndex + 1, matches.length);
}
function updateMatchIndicator(index,length) {
 // Update the match indicator (display as "xx of yyyy")
  const matchIndicator = document.getElementById('matchCountDisplay');
  if (matchIndicator) {
      // Adding 1 to the index for user-friendly numbering (1-based instead of 0-based)
      matchIndicator.textContent = `${index} of ${length}`;
  }
}

if (nextButton) {
  nextButton.addEventListener('click', (event) => {
    event.preventDefault();
    showMatch(currentMatchIndex + 1, 1);
  });
}

if (prevButton) {
  prevButton.addEventListener('click', (event) => {
    event.preventDefault();
    const matches = document.querySelectorAll('.highlight');
    if (currentMatchIndex < 0 && matches.length) {
      showMatch(matches.length - 1, -1);
    } else {
      showMatch(currentMatchIndex - 1, -1);
    }
  });
}
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
      targetTitleElement.innerText = t || defaultTitleText;
    } else {
      targetTitleElement.innerText = defaultTitleText;
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
/* =================================================================================================
   ✅ 02Jul26 🧱 [SJP-DRAWER-SCROLL-BOUNDS-01]
   Phase 5 — Replaces the veil-wash system (SJ-DRAWER-VEIL-03) entirely.

   WHY: the old system used two fixed grey "wash" panels that chased the target section's
   getBoundingClientRect() on every scroll event, visually covering everything except the
   section being previewed. This was cosmetic only — the underlying document could still
   scroll anywhere. Unanimous QA feedback: this caused real problems — Rabbit Hole panels
   opening near the top edge of the section could visually poke out from under the veil, and
   links that opened another drawer could render it at a scroll position the veil wasn't
   currently covering, making the new drawer appear offscreen.

   NEW APPROACH: hard-clamp window.scrollY so the document physically cannot scroll above the
   point where the section's sticky title header engages, or below the point where the bottom
   of its content sits just above the sign-up banner. Nothing outside the target section is
   ever reachable, so no veil is needed at all — the target content IS the entire scrollable
   world for the duration of the preview.

   ALSO (Request 2): disable any link inside the document that would navigate the main scroll
   position to a DIFFERENT part of the book/app, or leave the preview entirely. Links that open
   a supplementary drawer on top of the current content (tool detail cards, Wikipedia embeds,
   Rabbit Holes, Glossary terms), or that jump to a point still within the currently active
   section, remain live — per the explicit requirement that More/Less and Rabbit Hole controls
   must stay usable during previews.
   ================================================================================================= */
(function sjDrawerScrollBounds() {

  /* ── 1. Guard: only in drawer mode ──────────────────────────────────────*/
  if (!window.SJ_DRAWER_MODE_ACTIVE) { return; }
  var activeSectionId = window.SJ_DRAWER_SECTION_ID || '';
  if (!activeSectionId) { return; }

  /* Glossary A & B is deliberately a nested preview subsection.  Keep it as the
     logical active section for Live-tier/link decisions, but contain its top-level
     Glossary chapter as the physical scroll host. */
  var previewHostSectionId = (activeSectionId === 'glossAandB') ? 'glossaryAtoZ' : activeSectionId;
  var isGlossaryABPreview = (activeSectionId === 'glossAandB');

  /* ── 2. Section registry (unchanged from the veil system) ─────────────────*/
  var REGISTRY = {
    startHereIntro:       'timed',
    essentialsIntro:      'timed',
    essentialsIngredients:'timed',
    essentialsTools:      'live',
    leavenIntro:          'timed',
    leavenCulture:        'timed',
    leavenStarter:        'timed',
    leavenLevain:         'timed',
    processIntro:         'timed',
    processPrep:          'timed',
    processMix:           'live',
    processStretch:       'timed',
    processShape:         'timed',
    processProof:         'timed',
    processBake:          'timed',
    processPostBake:      'timed',
    referenceIntro:       'timed',
    glossaryAtoZ:         'live',
    glossAandB:           'live',   // public preview: A & B only
    toolsAtoZ:             'hard',
    grainsAtoZ:            'hard',
    breadsIntro:           'timed',
    recipeFactoids:        'timed',
    unitConvertor:         'live'
  };

  // ✅ 30Jun26n [SJP-TIMED-PREVIEW-DURATION-01] Recipe Facts & Nutrition: 30s (unchanged).
  var TIMED_MS   = activeSectionId === 'recipeFactoids' ? 30000 : 15000;
  var tier       = REGISTRY[activeSectionId] || 'hard';
  var BANNER_H   = 52;  // px reserved for sign-up banner at bottom

  /* ── 3. CSS: banner (unchanged) + disabled-link treatment (new) ───────────*/
  var css = document.createElement('style');
  css.textContent =
    '.sjdv-banner{position:fixed;bottom:0;left:0;right:0;z-index:8200;' +
    'background:rgba(20,137,84,.96);color:#fff;' +
    'display:flex;align-items:center;justify-content:center;' +
    'flex-wrap:wrap;gap:10px 14px;padding:9px 16px 11px;' +
    'font-size:.9rem;pointer-events:all}' +
    '.sjdv-banner p{margin:0;font-weight:500}' +
    '.sjdv-timer{font-size:.78rem;opacity:.85;white-space:nowrap;flex-shrink:0}' +
    '.sjdv-btn{background:#fff;color:rgb(20,137,84);border:none;border-radius:16px;' +
    'padding:5px 18px;font-weight:700;font-size:.88rem;cursor:pointer;' +
    'white-space:nowrap;flex-shrink:0}' +
    '.sjdv-btn:hover{background:#eee}' +
    '.sjdv-hardcover{position:fixed;inset:0;bottom:' + BANNER_H + 'px;background:rgba(80,80,80,.85);z-index:8000}' +
    /* ✅ [SJP-DRAWER-LINK-BLOCK-01] Disabled outbound/navigation links (Request 2) */
    '.sjp-drawer-link-disabled{opacity:.5!important;cursor:not-allowed!important;' +
    'pointer-events:none!important;filter:grayscale(.4)}';
  document.head.appendChild(css);

  /* ✅ 02Jul26 🧱 [SJP-DRAWER-PREVIEW-CONTAIN-01]
     Keep the public-preview experience inside the active section rather than letting the
     full Book document scroll past its limits and snapping it back afterward.

     Two deliberate constraints keep this low-churn:
       1. Only direct children of <main> are hidden.  Nested .content-section records — such
          as the Tool A–Z detail cards moved into a utility drawer from Essential Tools — stay
          available and visible after open_drawer() moves them.
       2. The active preview becomes its own, naturally scrolling viewport below the Book
          header.  This removes the visible body-scroll recovery/bounce while preserving the
          existing sticky title, More/Less controls, Rabbit Holes, and drawer architecture. */
  var containCss = document.createElement('style');
  containCss.textContent =
    'html.sjp-preview-contained,html.sjp-preview-contained body{' +
      'height:100%!important;overflow:hidden!important;overscroll-behavior:none!important}' +
    'html.sjp-preview-contained main{' +
      'height:100%!important;overflow:hidden!important;padding-bottom:0!important}' +
    'html.sjp-preview-contained main > .content-section{display:none!important}' +
    'html.sjp-preview-contained main > #' + previewHostSectionId + '{' +
      'display:block!important;position:fixed!important;' +
      /* The drawer iframe begins immediately below p.html’s blue drawer header.  Drawer mode
         hides sjLearn’s own 100px header, so adding that legacy header allowance here created
         the observed 100px blank band above every Live/Timed preview. */
      'top:0!important;bottom:' + BANNER_H + 'px!important;' +
      'left:0!important;right:0!important;margin:0 auto!important;' +
      /* IMPORTANT: do NOT apply transform/contain here.  The portable Rabbit Hole module
         intentionally pins its modal panels with position:fixed and viewport-calculated
         left/top geometry.  A transformed preview host becomes the containing block for
         those fixed panels, which is what previously shoved them to the extreme right. */
      'overflow-y:auto!important;overscroll-behavior:none!important;' +
      '-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important}' +
    'html.sjp-preview-contained main > #' + previewHostSectionId + ' > .content-section-title{' +
      'top:0!important}' +
    /* Glossary A & B is nested within #glossaryAtoZ.  Its parent is the fixed preview host,
       but only the A/B block is shown in the public Live preview. */
    (isGlossaryABPreview ?
      'html.sjp-preview-contained main > #glossaryAtoZ #glossaryIntroWrap{' +
        'display:none!important}' +
      'html.sjp-preview-contained main > #glossaryAtoZ #moreAtoZbutton{' +
        'display:none!important}' +
      'html.sjp-preview-contained main > #glossaryAtoZ #moreAtoZmsg{' +
        'display:block!important}' +
      /* The normal A–Z page keeps five sibling letter groups in this one expanded block.
         The public Live preview must expose only its A/B sibling, not the C–Z groups. */
      'html.sjp-preview-contained main > #glossaryAtoZ #moreAtoZmsg > [data-group="startOfSubSection"]:not(#glossAandB){' +
        'display:none!important}' +
      'html.sjp-preview-contained main > #glossaryAtoZ #moreAtoZmsg > #glossAandB{' +
        'display:block!important}'
      : '') +
    /* Existing site-wide Rabbit/Glossary veils cover the full iframe.  Suppress those
       global layers only in a contained preview; a local preview veil is installed below. */
    'html.sjp-preview-contained .sjRabbitHole-overlay,' +
    'html.sjp-preview-contained .sjrhl-overlay,' +
    'html.sjp-preview-contained .sjGlossary-overlay{' +
      'visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    /* Preview-local veil: fixed to the iframe viewport.  The blue p.html drawer header
       is outside this iframe, so it remains clear.  Keeping this fixed also means the veil
       cannot drift while the contained preview section scrolls. */
    /* Do not bind this rule to a particular host selector.  Some previews use a nested
       active section (notably Glossary A/B); a generic class ensures the local veil is styled
       consistently whenever the preview host changes. */
    '.sjp-preview-rabbit-overlay{' +
      'position:fixed!important;inset:0!important;box-sizing:border-box!important;' +
      'z-index:8300!important;background:rgba(169,169,169,.64)!important;' +
      'visibility:hidden;opacity:0;pointer-events:none;' +
      'transition:opacity .18s ease,visibility 0s .18s}' +
    '.sjp-preview-rabbit-overlay.visible{' +
      'display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;transition:opacity .18s ease}' +
    /* Legacy panels and Glossary envelopes are inline surfaces; lift their owner above the veil. */
    'html.sjp-preview-contained .sjRabbitHole-panel.sjRabbitHole-open,' +
    'html.sjp-preview-contained #glossaryAtoZ li.sjGlossary-open,' +
    'html.sjp-preview-contained .sjrhl-item.sjrhl-open{' +
      'position:relative!important;z-index:8301!important}' +
    /* Do NOT override position/top/left/width here. Portable Rabbit Holes deliberately pin
       themselves with inline fixed-position geometry.  The preview host is deliberately
       untransformed, so those values remain viewport-based and correctly centred. */
    'html.sjp-preview-contained .sjrhl-panel.sjrhl-open,' +
    'html.sjp-preview-contained .sjrhl-panel.sjrhl-panel--pinned{' +
      'z-index:8301!important}' +
    /* The portable module preserves the pre-pin item height to prevent a normal page jump.
       That spacer is unnecessary—and visually wrong—inside a contained preview. */
    'html.sjp-preview-contained .sjrhl-item[data-sjrhl-pinned-min-height]{min-height:0!important}' +
    'html.sjp-preview-contained .sjRabbitHole-panel.sjRabbitHole-open{' +
      'background-color:rgba(255,255,255,.98)!important}';
  document.head.appendChild(containCss);

  /* ✅ 02Jul26 🐇 [SJP-PREVIEW-LOCAL-RABBIT-VEIL-01]
     Restore the useful modal cue for Rabbit Holes, but scope it to the iframe preview.
     The original shared veils are full-viewport layers whose z-index/scroll-lock assumptions
     predate contained previews; this light-weight layer avoids obscuring p.html’s blue drawer
     header while leaving the opened panel fully readable above the veil. */
  var previewRabbitOverlay = document.createElement('div');
  previewRabbitOverlay.className = 'sjp-preview-rabbit-overlay';
  previewRabbitOverlay.setAttribute('aria-hidden', 'true');

  /* Keep the veil in the same stacking context as the section it dims.  Appending it to
     document.body was the regression: its z-index beat the entire fixed preview host, so a
     Rabbit Hole correctly opened but was physically hidden below the veil. */
  var previewHostEl = document.getElementById(previewHostSectionId);
  (previewHostEl || document.body).appendChild(previewRabbitOverlay);

  /* The established Rabbit Hole engines already know the authoritative open/close moment.
     Reuse those callbacks rather than infer open state only from a later DOM mutation.
     This avoids a race where the local veil appears in capture phase and is immediately
     hidden before an inline/fixed panel has finished its own pinning pass. */
  var sjpPreviewRabbitEngineOpen = false;
  /* The Rabbit Hole engines can finish their fixed-position open pass a few frames after
     the trigger click. Keep the local veil alive briefly during that hand-off, but never
     let this transient signal keep it alive after the panel has been closed. */
  var sjpPreviewRabbitOpenGraceUntil = 0;
  var sjpOriginalShowRabbitHoleOverlay = (typeof sjShowRabbitHoleOverlay === 'function') ? sjShowRabbitHoleOverlay : null;
  var sjpOriginalHideRabbitHoleOverlay = (typeof sjHideRabbitHoleOverlay === 'function') ? sjHideRabbitHoleOverlay : null;
  var sjpOriginalShowGlossaryOverlay = (typeof sjShowGlossaryOverlay === 'function') ? sjShowGlossaryOverlay : null;
  var sjpOriginalHideGlossaryOverlay = (typeof sjHideGlossaryOverlay === 'function') ? sjHideGlossaryOverlay : null;

  function sjpShowPreviewRabbitOverlay() {
    sjpPreviewRabbitEngineOpen = true;
    sjpPreviewRabbitOpenGraceUntil = Date.now() + 900;
    previewRabbitOverlay.classList.add('visible');
  }

  function sjpHidePreviewRabbitOverlay() {
    sjpPreviewRabbitEngineOpen = false;
    sjpPreviewRabbitOpenGraceUntil = 0;
    previewRabbitOverlay.classList.remove('visible');
  }

  /* Global veils remain deliberately suppressed in preview mode.  These wrappers redirect
     the normal engine state into the preview-local veil instead. */
  if (typeof sjShowRabbitHoleOverlay === 'function') {
    sjShowRabbitHoleOverlay = function () { sjpShowPreviewRabbitOverlay(); };
  }
  if (typeof sjHideRabbitHoleOverlay === 'function') {
    sjHideRabbitHoleOverlay = function () { sjpHidePreviewRabbitOverlay(); };
  }
  if (typeof sjShowGlossaryOverlay === 'function') {
    sjShowGlossaryOverlay = function () { sjpShowPreviewRabbitOverlay(); };
  }
  if (typeof sjHideGlossaryOverlay === 'function') {
    sjHideGlossaryOverlay = function () { sjpHidePreviewRabbitOverlay(); };
  }

  /* In contained preview mode, window.scrollBy cannot move the active fixed section.  Redirect
     the mature Rabbit Hole settle helper to its actual scrollport, leaving its normal behaviour
     untouched outside previews.  A 12px clearance keeps the modal top border visibly below the
     sticky section-title bottom border. */
  var sjpOriginalScrollElementBelowFixedHeaders = (typeof sjScrollElementBelowFixedHeaders === 'function') ? sjScrollElementBelowFixedHeaders : null;
  if (sjpOriginalScrollElementBelowFixedHeaders) {
    sjScrollElementBelowFixedHeaders = function (targetEl, gapPx) {
      if (!previewHostEl || !targetEl || !previewHostEl.contains(targetEl)) {
        return sjpOriginalScrollElementBelowFixedHeaders.apply(this, arguments);
      }
      var requestedGap = Number(gapPx);
      if (!isFinite(requestedGap)) requestedGap = 8;
      var safeGap = Math.max(12, requestedGap);
      window.setTimeout(function () {
        try {
          var panelRect = targetEl.getBoundingClientRect();
          var stickyTitle = previewHostEl.querySelector('.content-section-title');
          var stickyBottom = stickyTitle ? stickyTitle.getBoundingClientRect().bottom : 0;
          var desiredTop = Math.max(0, stickyBottom) + safeGap;
          var delta = panelRect.top - desiredTop;
          if (Math.abs(delta) < 3) return;
          previewHostEl.scrollBy({ top: delta, behavior: 'auto' });
        } catch (e) {}
      }, 25);
    };
  }

  function isRenderedOpenPanel(panel) {
    if (!panel || !panel.isConnected) return false;
    try {
      var cs = window.getComputedStyle(panel);
      /* getClientRects() rules out panels that retain display:block in computed style but
         sit inside one of the hidden Book sections. */
      return !!cs && cs.display !== 'none' && cs.visibility !== 'hidden' &&
        panel.hidden !== true && panel.getClientRects().length > 0;
    } catch (e) {
      return false;
    }
  }

  function isPreviewRabbitOpen() {
    /* Keep the veil through the engine's short deferred-opening pass, then defer to the
       actual visible panel state. Without this expiry, a close routed through a legacy
       Rabbit Hole can leave the preview veil permanently visible. */
    if (sjpPreviewRabbitEngineOpen && Date.now() < sjpPreviewRabbitOpenGraceUntil) return true;
    sjpPreviewRabbitEngineOpen = false;

    /* Only a Rabbit Hole that belongs to THIS preview may activate its local veil.  Utility
       drawers or retained panels elsewhere in the Book must not accidentally dim the preview. */
    var host = previewHostEl || document.getElementById(previewHostSectionId);
    if (!host) return false;

    /* Legacy Rabbit Holes, including Glossary terms. */
    var legacyPanels = host.querySelectorAll('.sjRabbitHole-panel');
    for (var i = 0; i < legacyPanels.length; i++) {
      if (isRenderedOpenPanel(legacyPanels[i])) return true;
    }

    /* Portable sjRabbitHoleLink panels use class/hidden state rather than inline display. */
    var portablePanels = host.querySelectorAll('.sjrhl-panel.sjrhl-open, [data-sjrhl-panel].sjrhl-open');
    for (var j = 0; j < portablePanels.length; j++) {
      if (isRenderedOpenPanel(portablePanels[j])) return true;
    }

    return false;
  }

  function positionPreviewRabbitOverlay() {
    /* The local veil is fixed to the iframe viewport, so it requires no scroll compensation.
       Clear any legacy transform left by an earlier preview patch. */
    if (!previewRabbitOverlay) return;
    previewRabbitOverlay.style.transform = 'none';
  }

  function syncPreviewRabbitOverlay() {
    if (!previewRabbitOverlay) return;
    positionPreviewRabbitOverlay();
    previewRabbitOverlay.classList.toggle('visible', isPreviewRabbitOpen());
  }

  function schedulePreviewRabbitOverlaySync() {
    /* sjRabbitHoleLink has several deferred pin passes. Re-sync after each settling pass
       so the local veil appears reliably without modifying the mature Rabbit Hole module. */
    [0, 30, 140, 300, 520, 820].forEach(function (delay) {
      window.setTimeout(syncPreviewRabbitOverlay, delay);
    });
  }

  function closePreviewRabbitPanels() {
    sjpPreviewRabbitEngineOpen = false;
    /* Glossary needs its own toggle so envelope state and internal scroll cleanup remain correct. */
    try {
      if (window.sjGlossaryActive && sjGlossaryActive.btnId && sjGlossaryActive.panelId) {
        openGlossaryTerm(sjGlossaryActive.btnId, sjGlossaryActive.panelId);
      }
    } catch (e) {}

    try {
      if (typeof closeAllRabbitHoles === 'function') closeAllRabbitHoles();
    } catch (e) {}

    try {
      if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.closeAll === 'function') {
        window.SJRabbitHoleLink.closeAll({ restoreTrigger: false });
      }
    } catch (e) {}

    window.setTimeout(syncPreviewRabbitOverlay, 0);
  }

  previewRabbitOverlay.addEventListener('click', closePreviewRabbitPanels);

  if (previewHostEl) {
    previewHostEl.addEventListener('scroll', positionPreviewRabbitOverlay, { passive: true });
  }
  window.addEventListener('resize', positionPreviewRabbitOverlay, { passive: true });

  /* Use the click capture path as a reliable trigger for the local veil, then let the existing
     Rabbit Hole engines perform their normal open/close work. */
  document.addEventListener('click', function (event) {
    var source = event && event.target;
    if (!source || !source.closest || !previewHostEl) return;
    var trigger = source.closest(
      '.sjRabbitHole-button,[data-sjrhl-trigger],.general-subject-title.link-style,[data-sj-rh-close]'
    );
    if (trigger && previewHostEl.contains(trigger)) {
      /* Show the preview-local veil immediately for an opening action.  The mature Rabbit
         modules complete their own open/pin passes asynchronously, so waiting only for a
         later mutation can leave the user briefly (or, on some browsers, permanently) without
         the modal cue.  A scheduled state-sync still removes it on close. */
      var isCloseAction = !!(trigger.hasAttribute && trigger.hasAttribute('data-sj-rh-close'));
      var isAlreadyOpen = (trigger.getAttribute('aria-expanded') === 'true') ||
        (trigger.getAttribute('data-rabbit-state') === 'open');
      if (!isCloseAction && !isAlreadyOpen) {
        sjpShowPreviewRabbitOverlay();
      }

      /* A normal Rabbit Hole toggle closes by changing the trigger state; some of the older
         panel variants do not call the shared overlay-hide callback on that route. Observe the
         completed toggle and dismiss this preview-local veil directly when its trigger is closed. */
      if (isCloseAction || isAlreadyOpen) {
        [0, 40, 140].forEach(function (delay) {
          window.setTimeout(function () {
            var triggerStillOpen =
              trigger.getAttribute('aria-expanded') === 'true' ||
              trigger.getAttribute('data-rabbit-state') === 'open';
            if (!triggerStillOpen) {
              sjpHidePreviewRabbitOverlay();
              syncPreviewRabbitOverlay();
            }
          }, delay);
        });
      }
      schedulePreviewRabbitOverlaySync();
    }
  }, true);

  /* Both legacy and portable Rabbit Hole engines mutate inline display, hidden, aria, and open
     classes.  Observe those state changes rather than wrapping their mature click handlers. */
  if (typeof MutationObserver === 'function') {
    var previewRabbitObserver = new MutationObserver(function () {
      window.requestAnimationFrame(syncPreviewRabbitOverlay);
    });
    previewRabbitObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'aria-expanded']
    });
  }
  window.setTimeout(function () {
    positionPreviewRabbitOverlay();
    syncPreviewRabbitOverlay();
  }, 0);

  function containPreviewSection() {
    var target = getEl();
    if (!target) { return false; }

    document.documentElement.classList.add('sjp-preview-contained');
    clampEnabled = false; // The preview now owns its own scrollport; do not fight it with body clamps.

    // The section itself is fixed, so reset the hidden document scroll once without a visible snap.
    requestAnimationFrame(function () { window.scrollTo(0, 0); });
    return true;
  }

  /* ── 4. Banner DOM (unchanged) ─────────────────────────────────────────────*/
  var banner = document.createElement('div');
  banner.className = 'sjdv-banner';
  banner.innerHTML =
    '<p>Sign up for full access to the Sourjoe Book &amp; Recipes.</p>' +
    '<span class="sjdv-timer" id="sjdvTimer"></span>' +
    '<button class="sjdv-btn" id="sjdvBtn" type="button">Sign Up Free</button>';
  document.body.appendChild(banner);

  var timerEl = document.getElementById('sjdvTimer');
  var btn     = document.getElementById('sjdvBtn');

  // The parent public page sends this when a Timed preview drawer is closed manually.
  // It is deliberately harmless for Live previews, where there is no countdown to cancel.
  var sjpPreviewTimerId = null;
  var sjpTimedPreviewCancelled = false;
  window.addEventListener('message', function (event) {
    var data = event && event.data ? event.data : null;
    if (!data || data.type !== 'sjp-timed-preview-cancel') return;
    if (data.sectionId && data.sectionId !== activeSectionId) return;
    if (tier !== 'timed') return;

    sjpTimedPreviewCancelled = true;
    if (sjpPreviewTimerId) {
      clearInterval(sjpPreviewTimerId);
      sjpPreviewTimerId = null;
    }
    if (timerEl) { timerEl.textContent = '0s preview'; }
    releaseClamp();
  });

  /* ── 5. Sign-up postMessage (unchanged) ──────────────────────────────────*/
  var ackReceived = false;
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'sjp-signup-ack') { ackReceived = true; }
  });
  btn.addEventListener('click', function () {
    ackReceived = false;
    try { window.parent.postMessage({ type: 'sjp-signup' }, '*'); } catch (e) {}
    setTimeout(function () {
      if (!ackReceived) { window.open('https://app.sourjoe.com/register', '_blank'); }
    }, 400);
  });

  /* ── 6. Target section lookup ────────────────────────────────────────────*/
  var el = null;
  function getEl() {
    if (!el) { el = document.getElementById(activeSectionId); }
    return el;
  }

  /* ── 7. Hard scroll-boundary clamp (Request 1) ───────────────────────────*/
  var clampEnabled = true;

  function computeBounds() {
    var target = getEl();
    if (!target) { return null; }
    var top    = target.offsetTop;
    var bottom = top + target.offsetHeight;
    var vh     = window.innerHeight;
    var minY   = Math.max(0, top);
    var maxY   = Math.max(minY, bottom - (vh - BANNER_H));
    return { minY: minY, maxY: maxY };
  }

  function clampScroll() {
    if (!clampEnabled) { return; }
    var b = computeBounds();
    if (!b) { return; }
    var y = window.scrollY;
    if (y < b.minY) { window.scrollTo(0, b.minY); }
    else if (y > b.maxY) { window.scrollTo(0, b.maxY); }
  }

  window.addEventListener('scroll', clampScroll, { passive: true });
  window.addEventListener('resize', clampScroll, { passive: true });

  // Re-clamp whenever the target section's own rendered size changes — Rabbit Hole or
  // More/Less expansion inside it shifts where the valid scroll range ends. This is the
  // dynamic-height gap the old veil's plain scroll/resize listeners didn't fully cover.
  if (typeof ResizeObserver === 'function') {
    var ro = new ResizeObserver(function () { clampScroll(); });
    (function tryObserve() {
      var target = getEl();
      if (target) { ro.observe(target); } else { setTimeout(tryObserve, 100); }
    }());
  }

  // Prevent touch/trackpad rubber-band overscroll from visually escaping the clamp before
  // the corrective scrollTo() lands.
  try { document.documentElement.style.overscrollBehavior = 'contain'; } catch (e) {}

  function releaseClamp() {
    clampEnabled = false;
  }

  /* ── 8. Disable every app-exit / external-navigation link ────────────────
     Timed and Live previews are deliberately self-contained.  Keep interactions that stay
     within the preview (More/Less, Rabbit Holes, Glossary panels, Unit Converter controls,
     and Essential Tool detail drawers), but block every route to another Book section, a
     chapter TOC, a calculator, an external site, or an embedded external page.
     The Recipe Stats nutrition print/screenshot action remains available. */
  function disableLink(elm) {
    if (!elm || elm.getAttribute('data-sjp-drawer-link-disabled') === 'true') return;
    elm.onclick = null;
    elm.removeAttribute('onclick');
    elm.classList.add('sjp-drawer-link-disabled');
    elm.setAttribute('data-sjp-drawer-link-disabled', 'true');
    elm.setAttribute('aria-disabled', 'true');
    elm.setAttribute('tabindex', '-1');
  }

  function isWithinActiveSection(targetId, activeEl) {
    if (!targetId) return false;
    var t = document.getElementById(targetId);
    return !!(t && (t === activeEl || activeEl.contains(t)));
  }

  function isTocDrawerAction(attr) {
    return /\bopen_drawer\s*\([\s\S]*?['"]toc['"]/i.test(attr || '');
  }

  function isUtilityDrawerAction(attr) {
    return /\bopen_drawer\s*\([\s\S]*?['"]utility['"]/i.test(attr || '');
  }

  var ALWAYS_BLOCK = [
    'goToAppSourJoeAndClose(',
    'closeTocAndFollowLink(',
    'sjOpenSpecificCalculator(',
    'sjOpenCalculatorDrawer(',
    'sjOpenCalculatorTocDrawer(',
    'openWiki(',
    // Recipe Stats print/screenshot is intentionally retained in public previews.
    'window.open(',
    'window.location',
    'location.href'
  ];
  var WITHIN_SECTION_CHECK = ['scrollToTarget(', 'expandAndScroll(', 'collapseAndScroll('];

  function shouldDisableInlineAction(attr, activeEl) {
    if (!attr) return false;

    for (var i = 0; i < ALWAYS_BLOCK.length; i++) {
      if (attr.indexOf(ALWAYS_BLOCK[i]) !== -1) return true;
    }

    // A chapter/section TOC would allow the preview to leave its isolated content.
    if (isTocDrawerAction(attr)) return true;

    for (var j = 0; j < WITHIN_SECTION_CHECK.length; j++) {
      if (attr.indexOf(WITHIN_SECTION_CHECK[j]) !== -1) {
        var ids = attr.match(/'([^']+)'/g);
        var lastId = ids && ids.length ? ids[ids.length - 1].replace(/'/g, '') : null;
        return !isWithinActiveSection(lastId, activeEl);
      }
    }

    // Utility drawers (for example Essential Tool cards) remain part of the current preview.
    if (isUtilityDrawerAction(attr)) return false;

    // These controls remain wholly inside the active preview.
    if (/\b(toggleMore|toggleRabbitHole|openGlossaryTerm|sjInitValues|RefreshDisplay)\s*\(/.test(attr)) {
      return false;
    }

    return false;
  }

  function isExternalOrOutsideHash(href, activeEl) {
    if (!href || href === '#') return false;
    if (/^(javascript:|data:)/i.test(href)) return false;
    if (href.charAt(0) === '#') {
      return !isWithinActiveSection(href.slice(1), activeEl);
    }
    return true;
  }

  function sjpDisableOutboundLinks() {
    var activeEl = getEl();
    if (!activeEl) return;

    // Use the entire iframe document so links inside utility detail cards—moved into a drawer
    // after this pass—are also safe. Hidden Book sections are irrelevant while preview mode holds.
    document.querySelectorAll('[onclick]').forEach(function (elm) {
      var attr = elm.getAttribute('onclick') || '';
      if (shouldDisableInlineAction(attr, activeEl)) disableLink(elm);
    });

    // Block absolute, protocol, mailto/tel, and cross-section hash anchors. This catches the
    // direct app/external links the prior inline-handler-only audit missed.
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').trim();
      if (isExternalOrOutsideHash(href, activeEl)) disableLink(a);
    });

    // Defensive capture for anchors injected later by a supplementary utility drawer or module.
    document.addEventListener('click', function (event) {
      var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!a || !isExternalOrOutsideHash((a.getAttribute('href') || '').trim(), activeEl)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  /* ── 9. Tier logic ───────────────────────────────────────────────────────*/
  function install() {
    clampScroll();
    sjpDisableOutboundLinks();

    if (tier === 'live') {
      if (timerEl) { timerEl.style.display = 'none'; }
      return;
    }

    if (tier === 'hard') {
      // Preserves the original veil's exact behaviour for this tier: show nothing, do NOT
      // message the parent to auto-close (unlike timed). Not reachable from any current
      // public-preview trigger (toolsAtoZ / grainsAtoZ aren't in the Live/Timed click list),
      // kept as a conservative fallback rather than a fully-designed state.
      releaseClamp();
      var cover = document.createElement('div');
      cover.className = 'sjdv-hardcover';
      document.body.appendChild(cover);
      if (timerEl) { timerEl.style.display = 'none'; }
      return;
    }

    // timed
    if (sjpTimedPreviewCancelled) {
      if (timerEl) { timerEl.textContent = '0s preview'; }
      releaseClamp();
      return;
    }

    var rem = Math.ceil(TIMED_MS / 1000);
    if (timerEl) { timerEl.textContent = rem + 's preview'; }

    sjpPreviewTimerId = setInterval(function () {
      rem -= 1;
      if (rem > 0) {
        if (timerEl) { timerEl.textContent = rem + 's preview'; }
      } else {
        clearInterval(sjpPreviewTimerId);
        sjpPreviewTimerId = null;
        if (timerEl) { timerEl.textContent = 'Preview ended'; }
        releaseClamp();
        // Tell parent (p.html) to close the bottom drawer and reopen the chapter TOC
        // so the visitor can keep browsing the TOC list.
        setTimeout(function () {
          try {
            window.parent.postMessage({ type: 'sjp-timed-preview-ended', sectionId: activeSectionId }, '*');
          } catch (e) {}
        }, 300);
      }
    }, 1000);
  }

  /* ── 10. Boot: wait for window.load + 350ms so the shim's expandAndScroll
     has already fired (shim fires at load + 120ms) and the section is in view. */
  function boot() {
    setTimeout(function () {
      if (!containPreviewSection()) {
        clampScroll();            // conservative fallback only if the active section is unavailable
      }
      setTimeout(install, 150);   // then start tier logic + link disabling
    }, 350);
  }

  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot, { once: true });
  }

}());
