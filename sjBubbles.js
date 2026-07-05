/* ===============================================================
   sjBubbles.js
   ✅ 2026-02-25 🧩 [SJ-BUBBLES-JS-01] Centralized helper bubble system
   - Touch devices (phone/tablet): click/tap to open, tap bubble or anywhere to close
   - Hover devices (PC): hover/focus to open, leave to close
   - Central message registry for compact HTML triggers
   ✅ 2026-05-30 🧩 [SJ-BUBBLES-PASS14D-LINE-SAFE-01] Auto-placement avoids covering the helper's own subject line.
   USEAGE EXAMPLE:
   <span class="sjb-helpDot" data-sjb="someKey" behaviour-sjb="enabled" tabindex="0">i</span>
   Any tag can be targetted.
   class="sjb-helpDot" makes the character 'i' encircled.  Character can be anything. It can be <strong>
   data-sjb="NAME OF TEXT FROM MESSAGE_REGISTRY".  This will show up in bubble.
            Note that one could embed HTML into the data like (example only):
            myFancyBubble: {
              html: true,
              text: '<div style="display:flex;gap:10px;align-items:center;">'
                    + '<img src="https://.../iconInfo.png" style="width:22px;height:22px;">'
                    + '<div>Short text with an icon.</div>'
                    + '</div>'
            }
   behaviour-sjb="enabled" or "controlled".  Enabled items stay active even if Helper Messages Switch = OFF
                  Controlled items will disappear when Helper Messages Switch = OFF / Appear when ON.
   clour-sjb="black" (default) or "white".  White will be good for HTML helpers with images, etc. is the idea.
   justify-sjb="left|center|right" (optional). Overrides default alignment (controlled=left, enabled=center).
   =============================================================== */

(function (window, document) {
  'use strict';

  if (!window || !document) return;

  var SJBubbles = window.SJBubbles || {};

  /* ---------------------------------------------------------------
     ✅ 2026-02-25 🧩 [SJ-BUBBLES-JS-02] CENTRAL MESSAGE REGISTRY
     Add/edit helper messages here only.
     Each value can be:
       - string
       - object: { text, placement, maxWidth, offset }
     --------------------------------------------------------------- */
  var MESSAGE_REGISTRY = {
    bubbleTemplate: {
      html: true,
      text: "<ul>"
              + "<li>Lorem Ipsum 1.</li>"
              + "<li>Lorem Ipsum 2.</li>"
          + "</ul>",
      placement: 'auto'
    },

    bubbleExplainSwitch: {
      html: true,
      text: "<ul>"
              + "<li><strong>Helper Messages</strong> (red ? icons) can be turned ON/OFF with the switch.</li>"
          + "</ul>",
      placement: 'auto'
    },

    bubbleHeaderRecipes: {
      html: true,
      text: "<ul><li>Click 'Recipes' to go to Main Recipes Page.</li>"
              + "<li>Active Recipes will show as 'In Progress'.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleHeaderTitle: {
      html: true,
      text: "<ul>"
              + "<li>Title space becomes the Search pane when the Search Icon below is clicked. </li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleHeaderTOC: {
      html: true,
      text: "<ul>"
              + "<li>Book of Sourjoe Table of Contents Navigation for the entire site. Black hamburger stack.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleNavBarArrows: {
      html: true,
      text: "<ul>"
              + "<li>Boxed Up Arrow navigates to top-of-page when it is blue.</li>"
              + "<li>Boxed Up Arrow is grey when at top, blue when not.</li>"
              + "<li>If Boxed Up Arrow clicked when it is blue, all expanded sections are collapsed.</li>"
              + "<li>When they are blue, Up/Down center Arrows Navigate to Next/Previous Search results.</li>"
              + "<li>Up/Down center Arrows show which search result is being displayed  (xx of yy).</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleNavBarSearch: {
      html: true,
      text: "<ul>"
              + "<li>Title space above becomes the Search pane when the Search Icon is clicked.</li>"
              + "<li>Search results are highlighted in yellow; current search result is highlighted in orange.</li>"
              + "<li>Search icon becomes a yellow close X which, when clicked, will supress all yellow highlighted search results "
              + "(this makes it easier to read a page full of results!).  Only current search result remains highlighted (in orange).</li>"
              + "<li>Search Icon then changes to plain X close icon to end search.</li>"
              + "<li>Closing search will position book at site of first result.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleCube: {
      html: true,
      text: "<ul>"
              + "Isn't this twirling cube adorable!."
          + "</ul>",
      placement: 'auto'
    },
    bubbleChapterTitle: {
      html: true,
      text: "<ul>"
              + "<li>In the Book of Sourjoe, Chapters are outlined in a heavier border, and title is capitalized.</li>"
              + "<li>The Chapter introduction is one paragraph describing the content of Sections in this Chapter</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleChapterTOC: {
      html: true,
      text: "<ul>"
              + "<li>The Chapter Table of Contents (blue hamburger stack).</li>"
              + "<li>Chapter table of contents list all Sections contained in the Chapter.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleSectionMore: {
      html: true,
      text: "<ul>"
              + "<li>The Section 'More...' button opens the main content for the Section.</li>"
              + "<li>When clicked, the 'More...' button becomes a 'Less...' button so user can close the Section content view.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleSectionTitle: {
      html: true,
      text: "<ul>"
              + "<li>In the Book of Sourjoe, Sections are outlined in a lighter border, and title is mixed case.</li>"
              + "<li>The introductory paragraph gives cursory details for this Section and the 'More...' button reveals more details.</li>"
              + "<li>Most 'More...' sections also have a Rabbit Hole expanded area where a deeper dive into the subject is presented.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleSectionTOC: {
      html: true,
      text: "<ul>"
              + "<li>The Section Table of Contents (blue line stack).</li>"
              + "<li>Section table of contents list all Sub-Sections contained in the Section.</li>"
              + "<li>Most Section table of contents also have a link back to Chapter introduction.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleRabbit: {
      html: true,
      text: "<ul>"
              + "<li>Ah, the beloved Rabbit Hole!  Clicking the furry icon reveals more esoteric information on the subject.</li>"
              + "<li>Rabbit Hole content is reviewed and updated regularly.</li>"
              + "<li>Rabbit Hole is closed by clicking the icon again, or clicking the 'Less...' button.</li>"
          + "</ul>",
      placement: 'auto'
    },
    bubbleStartHereEssentials: {
      html: true,
      text: "<p style='text-align: left;'>This section covers the handful of ingredients and tools you'll need to get started."
          + "<br><br>You likely have most of the essentials in your kitchen already.</p>",
      placement: 'auto'
    },
    bubbleStartHereLeaven: {
      html: true,
      text: "<p style='text-align: left;'>This is one of the most important (and confusing) topics for beginners." 
          + "<br>This section explains the difference between a Starter and Leaven, how to maintain your Starter, and what to expect." 
          + "<br><br>Read it twice if you need to — most of us did!</p>",
      placement: 'auto'
    },
    bubbleStartHereGlossary: {
      html: true,
      text: "<p style='text-align: left;'>While reading through the glossary terms, no need to memorize anything - "
          + "just getting familiar with the lingo will help things click faster.</p>",
      placement: 'auto'
    },
    bubbleStartHereProcess: {
      html: true,
      text: "<p style='text-align: left;'>The Bakers Process lays out the full sourdough workflow for a home baker and explains why each step matters." 
          + "<br><br>It's not complicated, but understanding the why behind the steps will boost your confidence big time.</p>",
      placement: 'auto'
    },
    bubbleStartHereStarter: {
      html: true,
      text: "<p style='text-align: left;'>First and foremost, you will need to create your own Starter." 
          + "<br><br>The process is simple - but it spans up to 6 days!</p>",
      placement: 'auto'
    },
    bubbleStartHereLevain: {
      html: true,
      text: "<p style='text-align: left;'>Once your Starter is established, you can create a Leaven for your bake.</p>",
      placement: 'auto'
    },
    bubbleStartHereMyFirstBake: {
      html: true,
      text: "<p style='text-align: left;'><em>My First Bake</em> recipe is very easy and yields a mildly tangy, tasty sourdough bread."  
          + "<br><br>Bake this loaf often to get used to the process, then move on and experiment with the more complex recipes in our lineup.</p>",
      placement: 'auto'
    },
    unitConvertorChooseIngredient: {
      text: 'Choose an ingredient preset (or CUSTOM) so cup/spoon conversions use the correct grams-per-cup value.</p>',
      placement: 'auto',
      maxWidth: 300
    }
  };

  var DEFAULTS = {
    selector: '[data-sjb]',
    placement: 'auto',
    margin: 10,
    offset: 12,
    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-05] Slightly narrower default bubble width (more "square")
    maxWidth: 300,
    hoverCloseDelay: 120,
    hoverOpenDelay: 40,
    zIndex: 2147483000
  };

  var state = {
    bubbleEl: null,
    contentEl: null,
    open: false,
    key: null,
    trigger: null,
    config: null,
    closeTimer: null,
    openTimer: null,
    hoverTrigger: false,
    hoverBubble: false,
    // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12-01] Timestamp used to ignore the opening/toggle scroll burst, then close tap-open bubbles on real user scroll.
    openedAt: 0,
    initialized: false,
    usingHoverDevice: false,
    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-00] Global helper toggle state (default OFF)
    helpersOn: false,
    lastMode: 'click',
    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-06] Track last input type to avoid "focus then click" double-tap on mobile
    lastInput: 'pointer'
  };

  /* ---------------------------------------------------------------
     ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-01] Helper Messages ON/OFF control
     - Default is ON (helpers show normally)
     - Persists in localStorage
     - When OFF, helpers are blocked unless the trigger includes:
         behaviour-sjb="enabled"  (or behavior-sjb="enabled")
     --------------------------------------------------------------- */
  var SJB_HELPER_TOGGLE_STORAGE_KEY = 'SJB_HELPERS_ON';

  // ✅ 2026-03-13 🧩 [SJ-BUBBLES-JS-07] Default is OFF unless localStorage or a page-level default says otherwise.
  // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-DEFAULT-01] Public can opt into default ON with data-sjb-default="on" without changing sjLearn's default OFF.
  function getHelperTogglePageDefault() {
    try {
      var host = document.body || document.documentElement;
      var v = host ? (host.getAttribute('data-sjb-default') || host.getAttribute('data-sjb-helpers-default') || '') : '';
      v = String(v).toLowerCase().trim();
      return (v === '1' || v === 'true' || v === 'on' || v === 'yes');
    } catch (e) {
      return false;
    }
  }

  function readHelperToggleFromStorage() {
    var defaultValue = getHelperTogglePageDefault();
    try {
      var v = window.localStorage.getItem(SJB_HELPER_TOGGLE_STORAGE_KEY);
      if (v === null || v === undefined || v === '') return defaultValue;
      v = String(v).toLowerCase().trim();
      return (v === '1' || v === 'true' || v === 'on' || v === 'yes');
    } catch (e) {
      return defaultValue;
    }
  }

  function writeHelperToggleToStorage(isOn) {
    try {
      window.localStorage.setItem(SJB_HELPER_TOGGLE_STORAGE_KEY, isOn ? '1' : '0');
    } catch (e) {}
  }

  function getTriggerBehaviour(el) {
    if (!isElement(el)) return 'controlled';
    var v = el.getAttribute('behaviour-sjb') || el.getAttribute('behavior-sjb') || '';
    v = String(v).toLowerCase().trim();
    return v || 'controlled';
  }

  function isTriggerAlwaysEnabled(el) {
    return getTriggerBehaviour(el) === 'enabled';
  }

  function canShowForTrigger(el) {
    // Helpers are ON globally OR this trigger is explicitly forced enabled.
    return !!state.helpersOn || isTriggerAlwaysEnabled(el);
  }

  /* ---------------------------------------------------------------
     ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-THEME-01] Bubble colour theme per trigger
     Usage in HTML:
       colour-sjb="white"  -> white bubble + black text (good for images/GIFs)
       colour-sjb="black"  -> default (black bubble + white text)
     Notes:
       - Supports US spelling too: color-sjb
       - Default is "black" if missing/unknown
     --------------------------------------------------------------- */
  function getTriggerColour(el) {
    if (!isElement(el)) return 'black';
    var v = el.getAttribute('colour-sjb') || el.getAttribute('color-sjb') || '';
    v = String(v).toLowerCase().trim();
    return (v === 'white') ? 'white' : 'black';
  }

  function applyBubbleTheme(bubbleEl, triggerEl) {
    if (!bubbleEl) return;

    // Always reset so themes don't "stick" between different triggers.
    bubbleEl.classList.remove('sjb-theme-white');

    var theme = getTriggerColour(triggerEl);
    if (theme === 'white') bubbleEl.classList.add('sjb-theme-white');
  }

  


  /* ---------------------------------------------------------------
     ✅ 2026-02-28 🧩 [SJ-BUBBLES-JS-JUSTIFY-01] Per-trigger bubble justification
     - Default behaviour:
         enabled   -> centered bubble content
         controlled-> left-justified bubble content
     - Optional override on the trigger element:
         justify-sjb="left" | "center" | "right"
     --------------------------------------------------------------- */
  function normalizeJustify(v) {
    v = String(v || '').toLowerCase().trim();
    if (v === 'left' || v === 'center' || v === 'right') return v;
    return '';
  }

  function getTriggerJustify(el) {
    if (!isElement(el)) return '';
    return normalizeJustify(el.getAttribute('justify-sjb') || '');
  }

  function applyBubbleJustify(bubbleEl, triggerEl) {
    if (!bubbleEl) return;

    // Always reset so justify doesn't "stick" between triggers.
    bubbleEl.classList.remove('sjb-justify-left', 'sjb-justify-center', 'sjb-justify-right');

    var v = getTriggerJustify(triggerEl);
    if (!v) {
      v = isTriggerAlwaysEnabled(triggerEl) ? 'center' : 'left';
    }

    bubbleEl.classList.add('sjb-justify-' + v);
  
  }

  /* ---------------------------------------------------------------
     ✅ 2026-03-03 🧩 [SJ-BUBBLES-JS-ACTIONS-01] Controlled bubble footer actions
     ✅ 2026-03-03 🧩 [SJ-BUBBLES-JS-ACTIONS-03] Bugfix: keep action injector at top scope (prevents bubbles from failing to open)
     - Adds an inline "Turn OFF Helpers" control to all behaviour-sjb="controlled" bubbles.
     - Clicking it turns the global Helper Messages switch OFF, hides all controlled helper icons,
       and closes the current bubble (without scrolling).
     --------------------------------------------------------------- */
  function applyControlledActions(bubbleEl, triggerEl) {
    if (!bubbleEl) return;

    // Remove any prior actions so they don't "stick" between bubbles.
    try {
      var old = bubbleEl.querySelector('.sjb-bubble__actions');
      if (old) old.remove();
    } catch (e) {}

    if (!isElement(triggerEl)) return;
    if (getTriggerBehaviour(triggerEl) !== 'controlled') return;

    var actions = document.createElement('div');
    actions.className = 'sjb-bubble__actions';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sjb-bubble__action sjb-bubble__action--helpersOff';
    btn.setAttribute('aria-label', 'Turn off Helper Messages');
    btn.textContent = 'Turn OFF Helpers';

    btn.addEventListener('click', function (evt) {
      try { evt.preventDefault(); } catch (e) {}
      try { evt.stopPropagation(); } catch (e) {}

      // ✅ Turn global helpers OFF (controlled icons hide). This also closes the current bubble.
      setHelperToggle(false, true);
    });

    actions.appendChild(btn);
    bubbleEl.appendChild(actions);
  }

// ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-02] Reflect helpers state on <html> for CSS-driven UI
// This allows us to hide visible helper icons/dots when the global switch is OFF.
function syncHelperRootClass() {
  try {
    var root = document.documentElement;
    if (!root) return;
    root.classList.toggle('sjb-helpers-on', !!state.helpersOn);
    root.classList.toggle('sjb-helpers-off', !state.helpersOn);
  } catch (e) {}
}

function syncHelperToggleUI() {
    var cb = document.getElementById('sjbHelperToggle');
    var st = document.getElementById('sjbHelperToggleState');

    if (cb) cb.checked = !!state.helpersOn;
    if (st) st.textContent = state.helpersOn ? 'ON' : 'OFF';
  }

  // ✅ 2026-03-07 🧩 [SJ-BUBBLES-TOC-CLOSE-01] If a Helper toggle is changed while a TOC drawer is open,
  // close that TOC drawer immediately so the UI state never looks stale/conflicting.
  function closeActiveTocDrawerForHelperToggle() {
    try {
      var activeTocDrawer = document.querySelector('.drawer.active[data-drawer-type="toc"]');
      if (!activeTocDrawer) return;
      if (typeof window.close_drawers === 'function') {
        window.close_drawers();
      }
    } catch (e) {}
  }

  function setHelperToggle(isOn, persist) {
    var prevHelpersOn = !!state.helpersOn;
    state.helpersOn = !!isOn;
    syncHelperRootClass();


    if (persist) writeHelperToggleToStorage(state.helpersOn);

    // If we just turned helpers OFF, close any open bubble that is NOT forced enabled.
    if (!state.helpersOn && state.open && state.trigger && !isTriggerAlwaysEnabled(state.trigger)) {
      hideBubble();
    }

    syncHelperToggleUI();

    // ✅ 2026-03-07 🧩 [SJ-BUBBLES-TOC-CLOSE-02] A real Helper-state change closes any active TOC drawer.
    if (prevHelpersOn !== state.helpersOn) {
      closeActiveTocDrawerForHelperToggle();
    }

    // ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOC-ON-03] Keep TOC "Turn ON Helpers" controls in sync
    syncTocDrawerHelperControls();
  }

  function initHelperToggleUI() {
    var cb = document.getElementById('sjbHelperToggle');
    if (!cb || cb.__sjbToggleBound) return;

    cb.__sjbToggleBound = true;

    // Initialize from persisted setting (if available).
    setHelperToggle(readHelperToggleFromStorage(), false);

    cb.addEventListener('change', function () {
      setHelperToggle(!!cb.checked, true);
    });

    syncHelperToggleUI();
  }

  /* ---------------------------------------------------------------
     ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-PORTRAIT-00] Legacy portrait-disable section retired.
     Helper Messages now remain usable on phones, tablets, desktop, portrait, and landscape.
     --------------------------------------------------------------- */
  var __sjbPortraitSaved = null;
  var __sjbPhonePortraitMaxWidth = 699;

  function __sjbGetViewportWidth() {
    try {
      if (window.visualViewport && window.visualViewport.width) return Math.round(window.visualViewport.width);
      if (document.documentElement && document.documentElement.clientWidth) return document.documentElement.clientWidth;
      if (window.innerWidth) return window.innerWidth;
    } catch (e) {}
    return 0;
  }

  function __sjbIsSmallPortrait() {
    // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-PORTRAIT-01]
    // Retired the old phone-portrait suppression rule. Helper dots/bubbles must remain available
    // on phones, tablets, desktop, portrait, and landscape. Keep this function as a safe legacy
    // compatibility shim because TOC helper controls still call it.
    return false;
  }

  function syncPortraitDisableUI() {
    // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-PORTRAIT-02]
    // Portrait mode no longer disables helpers. This cleanup also removes any stale class left by
    // cached/older JS and keeps the switch usable in every device orientation.
    try {
      var root = document.documentElement;
      if (root) root.classList.remove('sjb-portrait-disabled');
    } catch (e) {}

    var cb = document.getElementById('sjbHelperToggle');
    if (cb) cb.disabled = false;

    if (__sjbPortraitSaved !== null) {
      setHelperToggle(__sjbPortraitSaved, false);
      __sjbPortraitSaved = null;
    } else {
      syncHelperToggleUI();
    }

    syncTocDrawerHelperControls();
  }

  /* ---------------------------------------------------------------
     ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOC-ON-01] TOC Drawer shortcut: "Turn ON Helpers"
     Problem:
       - When Helpers are OFF, CONTROLLED "?" dots are hidden.
       - Users then have no local way to turn helpers back ON without finding the main switch.
     Solution:
       - Every TOC is opened via: open_drawer(..., 'toc', titleEl, contentEl)
       - We inject a small "Turn ON Helpers" control row into the TOC content panel.
       - Clicking turns Helpers ON (persisted) and keeps the user's scroll position.
       - In small-screen PORTRAIT (where CONTROLLED helpers are disabled), we show the row disabled + a note.
     --------------------------------------------------------------- */

  function syncTocDrawerHelperControls() {
    try {
      var rows = document.querySelectorAll('.sjb-tocHelpersRow');
      if (!rows || !rows.length) return;

      var disabledPortrait = __sjbIsSmallPortrait();

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;

        // ✅ 2026-04-16 🧩 [SJ-BUBBLES-TOC-ON-08] Hide the TOC Helpers row entirely on mobile portrait.
        // Outside mobile portrait, keep it visible so users have a local ON/OFF control.
        row.style.display = disabledPortrait ? 'none' : '';

        var btn = row.querySelector('.sjb-tocHelpersBtn');
        var note = row.querySelector('.sjb-tocHelpersNote');

        // In portrait-disabled mode we intentionally block CONTROLLED helpers.
        // Keep the TOC control visible, but disable the button and show a note.
        if (btn) {
          btn.disabled = !!disabledPortrait;

          if (state.helpersOn) {
            btn.textContent = 'Turn OFF Helpers';
            btn.setAttribute('aria-label', 'Turn OFF Helper Messages');
          } else {
            btn.textContent = 'Turn ON Helpers';
            btn.setAttribute('aria-label', 'Turn ON Helper Messages');
          }

          // State classes for optional styling hooks
          try {
            btn.classList.toggle('sjb-tocHelpersBtn--on', !!state.helpersOn);
            btn.classList.toggle('sjb-tocHelpersBtn--off', !state.helpersOn);
          } catch (e) {}
        }

        // The note is only relevant in portrait-disabled mode
        if (note) note.style.display = disabledPortrait ? '' : 'none';

        // Optional row state classes (useful for future styling tweaks)
        try {
          row.classList.toggle('sjb-tocHelpersRow--helpersOn', !!state.helpersOn);
          row.classList.toggle('sjb-tocHelpersRow--helpersOff', !state.helpersOn);
        } catch (e) {}
      }
    } catch (e) {}
  }

  function ensureTocDrawerHelperControl(contentEl) {
    try {
      // Some call sites may pass an element id string; normalize to an element.
      if (typeof contentEl === 'string') {
        contentEl = document.getElementById(contentEl) || document.querySelector(contentEl);
      }
      if (!isElement(contentEl)) return;
      // Idempotent: do not inject twice
      // ✅ 2026-03-04 🧩 [SJ-BUBBLES-TOC-ON-06] Keep the TOC Helpers control at the BOTTOM of the TOC list (smaller + less intrusive)
      var existingRow = contentEl.querySelector('.sjb-tocHelpersRow');
      if (existingRow) {
        // Move to bottom (appendChild relocates the node if it already exists)
        try { contentEl.appendChild(existingRow); } catch (e) {}
        syncTocDrawerHelperControls();
        return;
      }
      var row = document.createElement('div');
      row.className = 'sjb-tocHelpersRow';
      row.setAttribute('data-sjb-tochelpers', '1');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sjb-tocHelpersBtn';
      btn.setAttribute('aria-label', 'Toggle Helper Messages');
      btn.textContent = 'Turn ON Helpers'; // (JS will update to ON/OFF based on current state)

      var note = document.createElement('span');
      note.className = 'sjb-tocHelpersNote';
      // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-PORTRAIT-03] Portrait-disable helper note retired.
      note.textContent = '';

      btn.addEventListener('click', function (ev) {
        try {
          ev.preventDefault();
          ev.stopPropagation();
        } catch (e) {}

        // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12B-PORTRAIT-04] Portrait mode no longer blocks this control.

        // Toggle Helpers and persist (so the user keeps the preference)
        setHelperToggle(!state.helpersOn, true);

        // Update all injected rows to reflect the new state
        syncTocDrawerHelperControls();
      });

      row.appendChild(btn);
      row.appendChild(note);

      // ✅ 2026-03-04 🧩 [SJ-BUBBLES-TOC-ON-07] Insert at BOTTOM of TOC content (user preference)
      // (appendChild places the control after the TOC items so it doesn't compete with navigation options)
      contentEl.appendChild(row);

      syncTocDrawerHelperControls();
    } catch (e) {}
  }

  // ✅ 2026-03-04 🧩 [SJ-BUBBLES-TOC-ON-05] Make TOC hook resilient to script-order changes
  var __sjbTocHookTries = 0;

  function installTocDrawerHook() {
    try {
      // open_drawer() is defined in sjDrawerScripts.js. Because load order can vary,
      // we retry a few times if it is not yet available.
      if (typeof window.open_drawer !== 'function') {
        if (__sjbTocHookTries < 6) {
          __sjbTocHookTries++;
          window.setTimeout(installTocDrawerHook, 120);
        }
        return;
      }

      if (window.open_drawer.__sjbTocOnWrapped) return;

      var __sjbOrigOpenDrawer = window.open_drawer;

      function __sjbWrappedOpenDrawer() {
        var ret = __sjbOrigOpenDrawer.apply(this, arguments);

        try {
          var type = arguments[1];
          var contentEl = arguments[3];

          if (String(type).toLowerCase() === 'toc') {
            ensureTocDrawerHelperControl(contentEl);
          }
        } catch (e) {}

        return ret;
      }

      __sjbWrappedOpenDrawer.__sjbTocOnWrapped = true;
      __sjbWrappedOpenDrawer.__sjbOrig = __sjbOrigOpenDrawer;

      window.open_drawer = __sjbWrappedOpenDrawer;
    } catch (e) {}
  }




  function hasHoverPrecision() {
    try {
      return !!window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) {
      return false;
    }
  }

  function isElement(node) {
    return !!(node && node.nodeType === 1);
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeMessageEntry(keyOrEntry) {
    var entry = typeof keyOrEntry === 'string' && Object.prototype.hasOwnProperty.call(MESSAGE_REGISTRY, keyOrEntry)
      ? MESSAGE_REGISTRY[keyOrEntry]
      : keyOrEntry;

    if (typeof entry === 'string') {
      return {
        key: typeof keyOrEntry === 'string' ? keyOrEntry : null,
        text: entry,
        placement: DEFAULTS.placement,
        maxWidth: DEFAULTS.maxWidth,
        offset: DEFAULTS.offset
      };
    }

    if (entry && typeof entry === 'object') {
      return {
        key: typeof keyOrEntry === 'string' ? keyOrEntry : (entry.key || null),
        text: String(entry.text || entry.html || ''),
        html: !!entry.html,
        placement: entry.placement || DEFAULTS.placement,
        maxWidth: toNumber(entry.maxWidth, DEFAULTS.maxWidth),
        offset: toNumber(entry.offset, DEFAULTS.offset)
      };
    }

    return null;
  }

  function setHTMLOrText(contentEl, cfg) {
    if (!contentEl) return;
    if (!cfg || !cfg.text) {
      contentEl.textContent = '';
      return;
    }

    if (cfg.html) {
      contentEl.innerHTML = cfg.text;
      return;
    }

    // Preserve line breaks in strings without requiring HTML.
    contentEl.textContent = cfg.text;
    var html = contentEl.innerHTML.replace(/\n/g, '<br>');
    contentEl.innerHTML = html;
  }

  function ensureBubbleEl() {
    if (state.bubbleEl && state.contentEl) return state.bubbleEl;

    var bubble = document.createElement('div');
    bubble.className = 'sjb-bubble';
    bubble.setAttribute('role', 'tooltip');
    bubble.setAttribute('aria-hidden', 'true');
    bubble.style.zIndex = String(DEFAULTS.zIndex);

    var content = document.createElement('div');
    content.className = 'sjb-bubble__content';
    bubble.appendChild(content);

    // Tap/click bubble itself to close (phone/tablet requirement)
    bubble.addEventListener('click', function (evt) {
      evt.stopPropagation();
      hideBubble();
    });

    // Hover handling so desktop users can move cursor from trigger to bubble.
    bubble.addEventListener('mouseenter', function () {
      state.hoverBubble = true;
      clearCloseTimer();
    });

    bubble.addEventListener('mouseleave', function () {
      state.hoverBubble = false;
      if (state.lastMode === 'hover') scheduleHoverClose();
    });

    document.body.appendChild(bubble);

    state.bubbleEl = bubble;
    state.contentEl = content;
    return bubble;
  }

  function clearCloseTimer() {
    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
    }
  }

  function clearOpenTimer() {
    if (state.openTimer) {
      clearTimeout(state.openTimer);
      state.openTimer = null;
    }
  }

  function scheduleHoverClose() {
    clearCloseTimer();
    state.closeTimer = window.setTimeout(function () {
      if (!state.hoverTrigger && !state.hoverBubble) hideBubble();
    }, DEFAULTS.hoverCloseDelay);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /* ---------------------------------------------------------------
     ✅ 2026-05-30 🧩 [SJ-BUBBLES-PASS14D-LINE-SAFE-02]
     Helper icons usually sit inline with their subject text/icon.  Side-placement
     can cover that same subject line on wider screens, so create a lightweight
     "do not cover this line" rectangle from the nearest sensible inline row.
     --------------------------------------------------------------- */
  function rectFromElement(el) {
    if (!isElement(el) || typeof el.getBoundingClientRect !== 'function') return null;
    var r = el.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return null;
    return {
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      width: r.width,
      height: r.height
    };
  }

  function inflateRect(rect, x, y) {
    if (!rect) return null;
    return {
      left: rect.left - x,
      right: rect.right + x,
      top: rect.top - y,
      bottom: rect.bottom + y,
      width: rect.width + (x * 2),
      height: rect.height + (y * 2)
    };
  }

  function getProtectedLineRect(triggerEl, triggerRect) {
    var viewport = getViewport();
    var selectors = [
      '.sjp-start-here-link-row',
      'li',
      'a',
      'button',
      '.sjp-info-more-shell',
      '.sjp-info-rabbit-shell',
      '.center-box',
      '.left-box',
      '.right-box',
      '.toc-item',
      '.toc-subitem'
    ];

    var lineEl = null;
    for (var i = 0; i < selectors.length; i++) {
      if (triggerEl.closest) {
        lineEl = triggerEl.closest(selectors[i]);
      }
      if (lineEl && lineEl !== document.body && lineEl !== document.documentElement) break;
      lineEl = null;
    }

    var base = rectFromElement(lineEl) || triggerRect;

    // Avoid accidentally protecting an entire broad page container; this should
    // describe a single visual line/row, not a large content block.
    if (base && (base.height > Math.max(90, triggerRect.height * 4))) {
      base = triggerRect;
    }
    if (base && base.width > viewport.w * 0.96 && triggerRect.width < 80) {
      base = {
        left: Math.max(0, triggerRect.left - 16),
        right: Math.min(viewport.w, triggerRect.right + 220),
        top: base.top,
        bottom: base.bottom,
        width: Math.min(viewport.w, triggerRect.width + 236),
        height: base.height
      };
    }

    return inflateRect(base, 8, 6);
  }

  function overlapArea(a, b) {
    if (!a || !b) return 0;
    var w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    var h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return w * h;
  }

  function getViewport() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 1024,
      h: window.innerHeight || document.documentElement.clientHeight || 768
    };
  }

  function positionBubble(triggerEl, cfg) {
    if (!isElement(triggerEl)) return;
    var bubble = ensureBubbleEl();
    var viewport = getViewport();
    var margin = DEFAULTS.margin;
    var offset = toNumber(cfg && cfg.offset, DEFAULTS.offset);

    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-07] Treat click-mode devices as "touch" for placement bias
    var isClickish = (state.lastMode === 'click') || !state.usingHoverDevice;

    // Sizing pass
    bubble.classList.remove('sjb-pos-top', 'sjb-pos-bottom', 'sjb-pos-left', 'sjb-pos-right');
    bubble.style.visibility = 'hidden';
    bubble.style.left = '-9999px';
    bubble.style.top = '-9999px';
    bubble.style.maxWidth = Math.max(180, Math.min(toNumber(cfg && cfg.maxWidth, DEFAULTS.maxWidth), viewport.w - (margin * 2))) + 'px';

    var triggerRect = triggerEl.getBoundingClientRect();
    var bw = bubble.offsetWidth;
    var bh = bubble.offsetHeight;
    var protectedLineRect = getProtectedLineRect(triggerEl, triggerRect);

    var prefers = (cfg && cfg.placement) || 'auto';
    var order;
    if (prefers && prefers !== 'auto') {
      order = [prefers, 'top', 'bottom', 'right', 'left'].filter(function (v, idx, arr) {
        return arr.indexOf(v) === idx;
      });
    } else {
      // ✅ 2026-05-30 🧩 [SJ-BUBBLES-PASS14D-LINE-SAFE-03]
      // Auto-placement now prefers top/bottom on all screens so an inline helper
      // bubble does not cover the text/icon on the same visual line.
      order = ['top', 'bottom', 'right', 'left'];
    }

    function calcCandidate(pos) {
      var top = 0;
      var left = 0;
      var anchorX = 0;
      var anchorY = 0;

      if (pos === 'top') {
        top = triggerRect.top - bh - offset;
        left = triggerRect.left + (triggerRect.width / 2) - (bw / 2);
        anchorX = (triggerRect.left + (triggerRect.width / 2)) - left;
        anchorY = bh;
      } else if (pos === 'bottom') {
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width / 2) - (bw / 2);
        anchorX = (triggerRect.left + (triggerRect.width / 2)) - left;
        anchorY = 0;
      } else if (pos === 'left') {
        top = triggerRect.top + (triggerRect.height / 2) - (bh / 2);
        left = triggerRect.left - bw - offset;
        anchorX = bw;
        anchorY = (triggerRect.top + (triggerRect.height / 2)) - top;
      } else {
        // right
        top = triggerRect.top + (triggerRect.height / 2) - (bh / 2);
        left = triggerRect.right + offset;
        anchorX = 0;
        anchorY = (triggerRect.top + (triggerRect.height / 2)) - top;
        pos = 'right';
      }

      // Score overflow BEFORE clamping so we choose the best natural fit.
      var overflowLeft = Math.max(0, margin - left);
      var overflowRight = Math.max(0, (left + bw + margin) - viewport.w);
      var overflowTop = Math.max(0, margin - top);
      var overflowBottom = Math.max(0, (top + bh + margin) - viewport.h);
      var overflow = overflowLeft + overflowRight + overflowTop + overflowBottom;

      // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-09] Bias away from side placement on touch/click devices
      // (prevents "arrow points sideways" weirdness in tight portrait layouts)
      if (isClickish && (pos === 'left' || pos === 'right')) overflow += 1000;

      // Clamp inside viewport.
      var clampedLeft = clamp(left, margin, Math.max(margin, viewport.w - bw - margin));
      var clampedTop = clamp(top, margin, Math.max(margin, viewport.h - bh - margin));

      // ✅ 2026-05-30 🧩 [SJ-BUBBLES-PASS14D-LINE-SAFE-04]
      // Penalize any candidate that would cover the trigger's current subject line.
      // This preserves the old fallback logic while strongly avoiding obfuscation.
      var bubbleRect = {
        left: clampedLeft,
        right: clampedLeft + bw,
        top: clampedTop,
        bottom: clampedTop + bh,
        width: bw,
        height: bh
      };
      var lineOverlap = overlapArea(bubbleRect, protectedLineRect);
      if (lineOverlap > 0) {
        overflow += lineOverlap * 25;
      }

      // Recompute arrow anchors after clamping.
      var finalAnchorX = (triggerRect.left + (triggerRect.width / 2)) - clampedLeft;
      var finalAnchorY = (triggerRect.top + (triggerRect.height / 2)) - clampedTop;

      // Keep arrow away from rounded corners.
      finalAnchorX = clamp(finalAnchorX, 12, bw - 12); // ✅ 25Feb26 🧩 [SJ-BUBBLES-JS-03] match tighter radius
      finalAnchorY = clamp(finalAnchorY, 12, bh - 12); // ✅ 25Feb26 🧩 [SJ-BUBBLES-JS-03] match tighter radius

      return {
        pos: pos,
        top: clampedTop,
        left: clampedLeft,
        anchorX: finalAnchorX,
        anchorY: finalAnchorY,
        overflow: overflow
      };
    }

    var best = null;
    for (var i = 0; i < order.length; i++) {
      var c = calcCandidate(order[i]);
      if (!best || c.overflow < best.overflow) best = c;
      if (c.overflow === 0) {
        best = c;
        break;
      }
    }

    bubble.classList.remove('sjb-pos-top', 'sjb-pos-bottom', 'sjb-pos-left', 'sjb-pos-right');
    bubble.classList.add('sjb-pos-' + best.pos);
    bubble.style.left = Math.round(best.left) + 'px';
    bubble.style.top = Math.round(best.top) + 'px';
    bubble.style.setProperty('--sjb-arrow-x', Math.round(best.anchorX) + 'px');
    bubble.style.setProperty('--sjb-arrow-y', Math.round(best.anchorY) + 'px');
    bubble.style.visibility = '';
  }

  function showBubbleInternal(keyOrEntry, triggerEl, mode, perCallOverrides) {
    if (!isElement(triggerEl)) return false;

    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-04] Global OFF blocks controlled helpers
    if (!canShowForTrigger(triggerEl)) return false;

    var baseCfg = normalizeMessageEntry(keyOrEntry);
    if (!baseCfg || !baseCfg.text) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SJBubbles] Missing bubble message for key:', keyOrEntry);
      }
      return false;
    }

    var cfg = Object.assign({}, baseCfg, perCallOverrides || {});
    var bubble = ensureBubbleEl();

    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-THEME-02] Apply per-trigger colour theme BEFORE content/positioning.
    applyBubbleTheme(bubble, triggerEl);

    // ✅ 2026-02-28 🧩 [SJ-BUBBLES-JS-JUSTIFY-02] Auto-set bubble text alignment (controlled=left, enabled=center)
    applyBubbleJustify(bubble, triggerEl);

    setHTMLOrText(state.contentEl, cfg);

    // ✅ 2026-03-03 🧩 [SJ-BUBBLES-JS-ACTIONS-02] Inject a quick 'Turn OFF Helpers' control for controlled bubbles
    applyControlledActions(bubble, triggerEl);

    state.key = baseCfg.key || (typeof keyOrEntry === 'string' ? keyOrEntry : null);
    state.trigger = triggerEl;
    state.config = cfg;
    state.open = true;
    state.lastMode = mode || 'click';
    state.openedAt = Date.now();

    bubble.setAttribute('aria-hidden', 'false');
    bubble.classList.add('is-open');

    positionBubble(triggerEl, cfg);

    return true;
  }

  function hideBubble() {
    clearCloseTimer();
    clearOpenTimer();

    if (!state.bubbleEl) return;
    state.bubbleEl.classList.remove('is-open', 'sjb-pos-top', 'sjb-pos-bottom', 'sjb-pos-left', 'sjb-pos-right', 'sjb-theme-white',
      'sjb-justify-left', 'sjb-justify-center', 'sjb-justify-right');
    state.bubbleEl.setAttribute('aria-hidden', 'true');

    state.open = false;
    state.key = null;
    state.trigger = null;
    state.config = null;
    state.hoverTrigger = false;
    state.hoverBubble = false;
    state.openedAt = 0;
  }

  function toggleBubble(keyOrEntry, triggerEl, mode, perCallOverrides) {
    var key = (typeof keyOrEntry === 'string') ? keyOrEntry : null;
    if (state.open && state.trigger === triggerEl && (!key || key === state.key)) {
      hideBubble();
      return false;
    }
    return showBubbleInternal(keyOrEntry, triggerEl, mode, perCallOverrides);
  }

  function repositionOpenBubble() {
    if (!state.open || !state.trigger || !state.config) return;
    if (!document.body.contains(state.trigger)) {
      hideBubble();
      return;
    }
    positionBubble(state.trigger, state.config);
  }

  function readTriggerOptions(el) {
    if (!isElement(el)) return {};
    var ds = el.dataset || {};
    return {
      placement: ds.sjbPlacement || undefined,
      maxWidth: ds.sjbMaxw ? toNumber(ds.sjbMaxw, undefined) : undefined,
      offset: ds.sjbOffset ? toNumber(ds.sjbOffset, undefined) : undefined,
      mode: ds.sjbMode || 'auto'
    };
  }

  function resolveMode(el) {
    var opts = readTriggerOptions(el);
    if (opts.mode === 'click' || opts.mode === 'hover') return opts.mode;
    return state.usingHoverDevice ? 'hover' : 'click';
  }

  function getTriggerKey(el) {
    return (el && el.dataset && el.dataset.sjb) ? el.dataset.sjb : null;
  }

  function bindOne(el) {
    if (!isElement(el) || el.__sjbBound) return;
    el.__sjbBound = true;

    if (!el.hasAttribute('tabindex')) {
      // Keyboard accessibility for spans/divs.
      if (!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/i.test(el.tagName)) {
        el.setAttribute('tabindex', '0');
      }
    }

    if (!el.getAttribute('aria-label') && !el.getAttribute('title')) {
      el.setAttribute('aria-label', 'Help');
    }

    // Click/tap support (always available; hover devices will also get hover behaviour)
    el.addEventListener('click', function (evt) {
      var key = getTriggerKey(el);
      if (!key) return;

      var mode = resolveMode(el);
      var opts = readTriggerOptions(el);

      // ✅ 25Feb26 🧩 [SJ-BUBBLES-JS-04] <a> tags on touch devices:
      // - First tap shows bubble (prevents navigation)
      // - Second tap (within a short window) follows the link normally
      //
      // Override per-link if needed:
      //   data-sjb-link="normal"   -> behave like any other element (no two-tap)
      //   data-sjb-link="twoTap"   -> force two-tap even on hover devices (rare)
      //   data-sjb-linkms="2500"   -> change the 2nd-tap window (ms)
      var isAnchor = /^(A)$/i.test(el.tagName) && (el.getAttribute('href') || el.href);
      var linkMode = (el.dataset && el.dataset.sjbLink) ? String(el.dataset.sjbLink) : 'auto';
      var linkMs = (el.dataset && el.dataset.sjbLinkms) ? toNumber(el.dataset.sjbLinkms, 2500) : 2500;

      // Auto policy: on click-mode devices (phone/tablet), anchors default to two-tap.
      var useTwoTap = isAnchor && (
        (linkMode === 'twoTap') ||
        (linkMode === 'auto' && mode === 'click')
      );

      if (useTwoTap) {
        // ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-05]
        // If helpers are globally OFF *and* this trigger isn't forced enabled,
        // DO NOT hijack the link click (allow normal navigation).
        if (!canShowForTrigger(el)) {
          el.__sjbLinkArmedAt = 0;
          return;
        }

        var now = Date.now();
        var armed = !!el.__sjbLinkArmedAt && ((now - el.__sjbLinkArmedAt) < linkMs);
        var sameOpen = state.open && state.trigger === el && state.key === key;

        if (!armed || !sameOpen) {
          // First tap -> show bubble, block link action.
          el.__sjbLinkArmedAt = now;

          var didShow = showBubbleInternal(key, el, 'click', {
            placement: opts.placement,
            maxWidth: opts.maxWidth,
            offset: opts.offset
          });

          // If bubble couldn't show (missing key, etc.), don't block navigation.
          if (didShow) {
            if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            return;
          }

          el.__sjbLinkArmedAt = 0;
          return;
        }

        // Second tap -> allow link to work normally.
        el.__sjbLinkArmedAt = 0;
        hideBubble();
        return;
      }

      // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12-02]
      // More/Less combo buttons are hover-driven on PC, but click-driven on touch devices.
      // On a hover device, clicking the combo should still run the page's legacy More/Less onclick
      // without immediately toggling the bubble closed.
      if (state.usingHoverDevice && el.classList && el.classList.contains('sjb-moreCombo')) {
        return;
      }

      // On hover devices, a click can still toggle if user clicks a standalone help icon (nice fallback)
      toggleBubble(key, el, mode, {
        placement: opts.placement,
        maxWidth: opts.maxWidth,
        offset: opts.offset
      });
    });

    // Desktop/hover behaviour
    el.addEventListener('mouseenter', function () {
      if (!state.usingHoverDevice) return;
      clearCloseTimer();
      clearOpenTimer();
      state.hoverTrigger = true;

      state.openTimer = window.setTimeout(function () {
        var key = getTriggerKey(el);
        if (!key) return;
        var opts = readTriggerOptions(el);
        showBubbleInternal(key, el, 'hover', {
          placement: opts.placement,
          maxWidth: opts.maxWidth,
          offset: opts.offset
        });
      }, DEFAULTS.hoverOpenDelay);
    });

    el.addEventListener('mouseleave', function () {
      if (!state.usingHoverDevice) return;
      clearOpenTimer();
      state.hoverTrigger = false;
      scheduleHoverClose();
    });

    // Keyboard focus acts like hover/click hybrid.
    el.addEventListener('focus', function () {
      // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-12]
      // On touch devices, the first tap often triggers focus *and* click.
      // If focus opens the bubble and click immediately toggles it closed, users experience a "double-tap" requirement.
      // Fix: only auto-open on focus when we're in keyboard navigation mode (or on true hover devices).
      if (!state.usingHoverDevice && state.lastInput !== 'keyboard') return;
      var key = getTriggerKey(el);
      if (!key) return;
      var opts = readTriggerOptions(el);
      showBubbleInternal(key, el, state.usingHoverDevice ? 'hover' : 'click', {
        placement: opts.placement,
        maxWidth: opts.maxWidth,
        offset: opts.offset
      });
    });

    el.addEventListener('blur', function () {
      // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-13] Ignore touch-driven blur noise; handle blur mainly for keyboard/hover flows.
      if (!state.usingHoverDevice && state.lastInput !== 'keyboard') return;
      if (state.lastMode === 'hover') {
        state.hoverTrigger = false;
        scheduleHoverClose();
      } else {
        hideBubble();
      }
    });

    el.addEventListener('keydown', function (evt) {
      state.lastInput = 'keyboard';
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        var key = getTriggerKey(el);
        if (!key) return;
        var opts = readTriggerOptions(el);
        toggleBubble(key, el, resolveMode(el), {
          placement: opts.placement,
          maxWidth: opts.maxWidth,
          offset: opts.offset
        });
      }
    });
  }

  function bindAll(root) {
    var scope = isElement(root) ? root : document;
    var nodes = scope.querySelectorAll(DEFAULTS.selector);
    for (var i = 0; i < nodes.length; i++) bindOne(nodes[i]);
    return nodes.length;
  }

  function inlineHelperBubble(key, evt, el, overrides) {
    // Supports compact inline usage:
    // onclick="return helperBubble('moreButton', event, this)"
    var trigger = isElement(el) ? el : ((evt && evt.currentTarget) ? evt.currentTarget : null);
    if (!trigger && this && isElement(this)) trigger = this;
    if (!trigger) return false;

    if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
    if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();

    toggleBubble(key, trigger, state.usingHoverDevice ? 'hover' : 'click', overrides || {});
    return false;
  }

  function installGlobalListeners() {
    // Close on tap/click anywhere outside trigger/bubble
    document.addEventListener('pointerdown', function (evt) {
      // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-10] Any pointer interaction means we're not in keyboard-nav mode
      state.lastInput = 'pointer';
      if (!state.open || !state.bubbleEl) return;
      var t = evt.target;
      if (!t) return;
      if (state.bubbleEl.contains(t)) return;        // bubble click handler will close it
      if (state.trigger && state.trigger.contains && state.trigger.contains(t)) return;
      hideBubble();
    }, true);

    document.addEventListener('keydown', function (evt) {
      // ✅ 2026-02-27 🧩 [SJ-BUBBLES-JS-11] Track keyboard mode (prevents mobile "focus then click" double-tap)
      state.lastInput = 'keyboard';
      if (evt.key === 'Escape') hideBubble();
    });

    window.addEventListener('resize', function () {
      state.usingHoverDevice = hasHoverPrecision();
      repositionOpenBubble();
      syncPortraitDisableUI(); // ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOGGLE-JS-05] Portrait-disable rule can change on resize
    });

    window.addEventListener('orientationchange', function () {
      syncPortraitDisableUI(); // ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOGGLE-JS-06] Portrait-disable rule can change on rotate
      repositionOpenBubble();
    });

    // ✅ 2026-05-24 🧩 [SJ-BUBBLES-PASS12-03]
    // Touch/click-open helpers close on a real scroll, matching the tuned sjLearn portable-device behaviour.
    // A short grace period avoids instantly closing a More/Less helper while the button's own legacy
    // toggle handler is still doing its smooth-scroll positioning.
    window.addEventListener('scroll', function () {
      if (!state.open) return;

      var clickish = (state.lastMode === 'click') || !state.usingHoverDevice;
      if (clickish) {
        var elapsed = Date.now() - (state.openedAt || 0);
        if (elapsed > 450) {
          hideBubble();
          return;
        }
      }

      repositionOpenBubble();
    }, true);
  }

  function init(options) {
    if (options && typeof options === 'object') {
      if (options.selector) DEFAULTS.selector = options.selector;
      if (options.maxWidth) DEFAULTS.maxWidth = toNumber(options.maxWidth, DEFAULTS.maxWidth);
      if (options.offset) DEFAULTS.offset = toNumber(options.offset, DEFAULTS.offset);
    }

    state.usingHoverDevice = hasHoverPrecision();

    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-02] Read persisted helper-toggle state (applies even on pages without the UI switch)
    state.helpersOn = readHelperToggleFromStorage();

    
    // ✅ 2026-03-07 🧩 [SJ-BUBBLES-TOGGLE-JS-08] Ensure root ON/OFF classes match persisted toggle
    // This matters after DOM rewrites (e.g., Search highlight cleanup) that can recreate controls.
    syncHelperRootClass();
ensureBubbleEl();
    bindAll(document);

    // ✅ 2026-02-27 🧩 [SJ-BUBBLES-TOGGLE-JS-03] Hook up the UI switch (if present)
    initHelperToggleUI();
    syncHelperToggleUI();

    // ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOGGLE-JS-07] Apply portrait-disable rules on first load
    syncPortraitDisableUI();

    // ✅ 2026-03-03 🧩 [SJ-BUBBLES-TOC-ON-02] Inject \"Turn ON Helpers\" into any TOC drawer when opened
    installTocDrawerHook();
    syncTocDrawerHelperControls();

    if (!state.initialized) {
      installGlobalListeners();
      state.initialized = true;
    }

    return SJBubbles;
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  // Public API
  SJBubbles.messages = MESSAGE_REGISTRY;
  SJBubbles.defaults = DEFAULTS;
  SJBubbles.state = state;
  SJBubbles.init = init;
  SJBubbles.bindAll = bindAll;
  SJBubbles.bindOne = bindOne;
  SJBubbles.show = function (key, el, overrides) {
    return showBubbleInternal(key, el, resolveMode(el), overrides || {});
  };
  SJBubbles.hide = hideBubble;
  SJBubbles.toggle = function (key, el, overrides) {
    return toggleBubble(key, el, resolveMode(el), overrides || {});
  };
  SJBubbles.reposition = repositionOpenBubble;
  SJBubbles.setMessage = function (key, value) {
    MESSAGE_REGISTRY[key] = value;
    return SJBubbles;
  };
  SJBubbles.setMessages = function (obj) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(function (k) {
        MESSAGE_REGISTRY[k] = obj[k];
      });
    }
    return SJBubbles;
  };
  SJBubbles.removeMessage = function (key) {
    delete MESSAGE_REGISTRY[key];
    return SJBubbles;
  };
  SJBubbles.helperBubble = inlineHelperBubble;

  window.SJBubbles = SJBubbles;
  window.helperBubble = inlineHelperBubble;

  // Auto-init (safe for simple drop-in use)
  onReady(function () {
    SJBubbles.init();
  });

})(window, document);
