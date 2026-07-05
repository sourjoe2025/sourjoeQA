// 🛠 Store original parent nodes so we can move content back later
// This Map will track where each element (title and content) originally belonged
let originalParent = new Map();

// 🛑 Track currently active drawer to prevent content loss
let activeDrawer = null;

// ✅ 2026-04-29 🧩 [SJ-BOOK-TOC-ACTIVE-01]
// Give the Book header hamburger an explicit active/open state while the right-side
// TOC drawer is open. This avoids relying only on CSS :has(), and lets the Book
// icon visually match the app.sourjoe.com engaged shadow/border state.
function sjSetMainTocIconActive(isActive) {
    const button = document.querySelector('#openMainTOC .sj-app-hamburger');
    document.body.classList.toggle('sj-main-toc-open', !!isActive);

    if (button) {
        button.classList.toggle('sj-toc-icon-active', !!isActive);
        button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    }
}

// ✅ 30Jun26k 🧮 [SJP-CALC-TOC-ICON-ACTIVE-01] Phase 5 New-1 fix:
// Give the Calculator Tools icons (the menu icon and the calculator image, both marked
// with .sjp-calc-toc-icon in p.html) the same explicit active/open state that
// sjSetMainTocIconActive gives the main Book TOC hamburger while the Calculator TOC
// drawer (drawer-top, drawerType 'calculator-toc') is open.
function sjSetCalcTocIconActive(isActive) {
    const icons = document.querySelectorAll('.sjp-calc-toc-icon');
    icons.forEach((icon) => {
        icon.classList.toggle('sjp-calc-toc-icon-active', !!isActive);
    });
}

// ✅ 30Jun26q 🧮 [SJP-TOC-ICONS-BLOCKED-DEMO-01] Phase 5 tweak: during a Live/Timed demo,
// clicking the main TOC (its links lead into a 100%-veiled section with no way back to where
// you were) or the calculator icon (previously only click-blocked with a message bubble that
// wasn't reliably showing) both leave the user stranded. Fully disable — not just dim — both
// icon groups while a demo is open: CSS pointer-events blocks mouse/touch, and the JS below
// blocks keyboard activation (Enter/Space on a focused control), which pointer-events alone
// does not cover. More/Less buttons and Rabbit Hole icons are untouched — they stay usable
// during previews, only the two TOC entry points are blocked.
// Supersedes the older sjpInstallCalcIconDemoGuard click-interceptor in p.js (see comment
// there): pointer-events:none prevents the click from ever firing, so that wrapper's own
// checks are now unreachable dead code in practice. Left in place as a harmless fallback.
function sjSetTocIconsBlockedForDemo(isBlocked) {
    document.body.classList.toggle('sjp-demo-toc-blocked', !!isBlocked);

    const mainTocButton = document.querySelector('#openMainTOC .sj-app-hamburger');
    if (mainTocButton) {
        mainTocButton.disabled = !!isBlocked;
    }

    const calcIcons = document.querySelectorAll('.sjp-calc-toc-icon');
    calcIcons.forEach((icon) => {
        if (isBlocked) {
            // Remember whatever tabindex/role the icon already had (only the calculator
            // image icon carries role="button" tabindex="0"; the menu icon carries neither)
            // so it can be restored exactly, rather than assumed, once demos end.
            if (icon.hasAttribute('tabindex')) {
                icon.setAttribute('data-sjp-prev-tabindex', icon.getAttribute('tabindex'));
                icon.setAttribute('tabindex', '-1');
            }
            icon.setAttribute('aria-disabled', 'true');
        } else {
            if (icon.hasAttribute('data-sjp-prev-tabindex')) {
                icon.setAttribute('tabindex', icon.getAttribute('data-sjp-prev-tabindex'));
                icon.removeAttribute('data-sjp-prev-tabindex');
            }
            icon.removeAttribute('aria-disabled');
        }
    });
}

// 🧩 [SJ-DRW-JS-LOCK-01] 2026-02-07 - Prevent page scrolling while the grey veil (overlay) is visible
// Why this is needed:
// - Z-index only controls *what you can click*, not what the mouse wheel / trackpad scroll affects.
// - Without an explicit scroll-lock, wheel/touch scroll can "chain" to <body>/<html> even when a full-screen overlay is on top.
// ✅ 30Jun26f 🧮 [SJP-CALC-LOCK-WINDOW-SCOPE-01]
// Must be assigned directly on window, not declared with let/const: this script
// loads as a classic (non-module) <script>, and top-level let/const create a
// script-private global binding, NOT a window property. sjCalculatorLaunch.js
// needs to read these values as window.sjScrollLockY / window.sjScrollLocked
// from a different file, so they have to live on window explicitly.
window.sjScrollLockY = 0;
window.sjScrollLocked = false;

function sjLockPageScroll(forcedY) {
    if (window.sjScrollLocked) return;
    window.sjScrollLocked = true;

    // ✅ 30Jun26c 🧮 [SJP-CALC-LOCK-FORCED-Y-01]
    // Accept an optional forcedY so callers that already know the correct restore position
    // (e.g. sjOpenCalculatorTocDrawer) can pass it through instead of this function reading
    // window.scrollY independently — which can be stale/0 mid-restore on some code paths.
    if (typeof forcedY === 'number' && forcedY >= 0) {
        window.sjScrollLockY = forcedY;
    } else {
        // Capture the current scroll position so we can restore it on unlock.
        window.sjScrollLockY = window.scrollY || window.pageYOffset || 0;
    }

    // ✅ Most robust cross-browser lock (incl. iOS Safari): pin the body.
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.sjScrollLockY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    // Extra belt-and-suspenders.
    document.documentElement.style.overflow = 'hidden';
}

function sjUnlockPageScroll() {
    if (!window.sjScrollLocked) return;
    window.sjScrollLocked = false;

    // =========================================================================================
    // 🧩 [SJ-DRW-JS-SCROLL-04] 14Feb26 - Prevent "smooth re-scroll" on drawer close
    // Problem:
    //   - The site uses `scroll-behavior: smooth` (sjLearnStyles.css), which can cause
    //     programmatic `window.scrollTo()` calls to animate.
    //   - Our body-pin scroll lock requires a scroll restoration step on unlock.
    //   - If that restoration animates, it looks like the page "re-scrolls" to the opener.
    //
    // Fix:
    //   - Temporarily force instant scrolling (override scroll-behavior) ONLY for the restore call.
    //   - Restore the original inline scroll-behavior immediately afterward.
    // =========================================================================================
    const prevHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    const prevBodyScrollBehavior = document.body.style.scrollBehavior;

    // Force instant scroll for the restoration step (overrides CSS smooth scrolling)
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    // Un-pin the body.
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';

    // Restore the scroll position (instant)
    window.scrollTo({ top: window.sjScrollLockY, left: 0, behavior: 'auto' });

    // Restore prior inline settings on the next frame.
    requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = prevHtmlScrollBehavior;
        document.body.style.scrollBehavior = prevBodyScrollBehavior;
    });
}

// Block wheel/touchmove on the overlay itself (prevents "scroll chaining" on some browsers)
(function sjInitOverlayScrollBlockers() {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;

    const stopScroll = (e) => {
        if (overlay.classList.contains('visible')) {
            e.preventDefault();
        }
    };

    // NOTE: passive:false is required for preventDefault() to actually work.
    overlay.addEventListener('wheel', stopScroll, { passive: false });
    overlay.addEventListener('touchmove', stopScroll, { passive: false });
})();

/** /
 * 🏗️ Function to open a drawer
 * Moves the given title and content into the specified drawer and makes it visible.
 *
 * @param {string} whichDrawer - The class name of the drawer to open (e.g., "drawer-bottom").
 * @param {HTMLElement} titleElement - The title element to move into the drawer.
 * @param {drawerType} =  Need this to control width and height of drawer depending content in drawer:
 *                       'info' (general text), 'toc' (show a table of contents), 
 *                       'url' (open a webpage in drawer), 'utility' (open a calculator or similar).
 * @param {HTMLElement} contentElement - The content element (e.g., calculator) to move into the drawer.
 */
function open_drawer(whichDrawer, drawerType, titleElement, contentElement, drawerHeight = '90%', drawerOptions = {}) {

        // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-REVEAL-01]
        // Normal user clicks should not open drawers during Search. Search navigation is the
        // exception: if the current hit lives inside a calculator, Search must be allowed to
        // open the calculator drawer so the counted hit is also reachable/readable.
        if (typeof isSearching !== 'undefined' && isSearching && !window.sjAllowDrawerDuringSearch) {return}

        const drawer = document.querySelector(`.${whichDrawer}`);
        const overlay = document.querySelector('.overlay');
            // ❌ Handle errors if the drawer or overlay is not found
        if (!drawer) {
            console.error("Drawer not found:", whichDrawer);
            return;
        }
        if (!overlay) {
            console.error("Overlay not found");
            return;
        }

        // Determine screen size category based on window.innerWidth
        let screenSizeCategory;
        const width = window.innerWidth;
        if (width <= 430) {
            screenSizeCategory = 'xsmall';
        }
            else if (width < 575) {
                screenSizeCategory = 'small';
                    }   else if (width < 1025) {
                            screenSizeCategory = 'medium';
                        }   else {
                                screenSizeCategory = 'large';
                            }

        // Define width mapping for each drawer type and screen size category
        // 🧩 [SJ-DRW-JS-SIZE-01] 13Mar26 - Include xsmall widths for every drawer type so sub-430px screens never receive an undefined width.
        const widthMapping = {
            info:    { xsmall: '90%', small: '90%',  medium: '75%', large: '50%' },  //helper message drawer
            toc:     { xsmall: '70%', small: '50%',  medium: '33%', large: '25%' },  //Table of Contents drawers
            url:        { xsmall: '90%', small: '90%', medium: '90%', large: '90%' },  //iframe drawer
            utility:    { xsmall: '90%', small: '90%', medium: '75%', large: '50%' },  //general utility/media drawers
            calculator: { xsmall: 'min(940px, 94vw)', small: 'min(940px, 94vw)', medium: 'min(940px, 94vw)', large: 'min(940px, 94vw)' },   //🧮 08Jun26d: calculator bottom drawer matches the 940px calculator width, capped for small screens
            'calculator-toc': { xsmall: 'min(940px, 94vw)', small: 'min(940px, 94vw)', medium: 'min(940px, 94vw)', large: 'min(940px, 94vw)' } //🧮 09Jun26a: wide top drawer for the Calculator List so labels do not crowd or wrap unnecessarily
        };

        // Validate drawerType parameter
        if (!widthMapping.hasOwnProperty(drawerType)) {
            console.error("Invalid drawerType:", drawerType);
            return;
        }

        // Get the appropriate drawer width based on type and screen size
        const drawerWidth = widthMapping[drawerType][screenSizeCategory];

        // 🔍 Locate the drawer and the overlay    const drawer = document.querySelector(`.${whichDrawer}`);

        // =========================================================================================
        // ✅ 2026-06-08 🧮 [SJ-CALC-PASS3D-DRAWER-SWITCH-01]
        // Open the next drawer ONLY after the current drawer has fully closed and restored its
        // moved TOC/content nodes. The previous fixed 350ms delay could race the close transition:
        // if the new Calculator TOC was inserted before the old TOC was restored, the later restore
        // pass could move/hide the newly-opened Calculator TOC or permanently discard the old TOC.
        // =========================================================================================
        const openAfterClose = () => {
            // ✅ 2026-06-09 🧮 [SJ-CALC-PASS4-DRAWER-SIZE-TIMING-01]
            // Apply the next drawer's dimensions only after the current drawer has closed.
            // This avoids a visible width jump when switching from a narrow side TOC to the wide Calculator List top drawer.
            document.documentElement.style.setProperty('--drawerBaseWidth', drawerWidth);
            // ✅ 02Jul26 🧩 [SJP-DRAWER-CENTER-01]
            // Keep top/bottom drawer centering deterministic on first load.
            // Public wrapper drawers can leave --drawerShiftWidth as a literal value
            // such as calc((100% - 50%) / 2). If a later timed/live preview opens
            // at 90% width while that stale shift remains, the bottom drawer appears
            // right-shifted. Always refresh the companion shift value whenever the
            // engine sets a new base width.
            document.documentElement.style.setProperty('--drawerShiftWidth', 'calc((100% - ' + drawerWidth + ') / 2)');
            document.documentElement.style.setProperty('--drawerBaseHeight', drawerHeight);

            activeDrawer = drawer;

            // 🏷️ Update the title in the drawer
            const titleContainer = drawer.querySelector('.drawer-title');
            titleContainer.innerHTML = ''; // Clear any existing title

            if (titleElement) {
                // 🔖 Save the title’s original location if it's not already saved
                if (!originalParent.has(titleElement)) {
                    originalParent.set(titleElement, titleElement.parentNode);
                }

                // 📦 Move the title into the drawer
                titleContainer.appendChild(titleElement);
                titleElement.style.display = 'block'; // Ensure the title is visible
            } else {
                console.warn("Title element is missing or undefined");
            }

            // 📦 Move the content into the drawer
            const contentContainer = drawer.querySelector('.drawer-content');
            contentContainer.innerHTML = ''; // Clear any existing content

            if (contentElement) {
                // 🔖 Save the original parent only once
                if (!originalParent.has(contentElement)) {
                    originalParent.set(contentElement, contentElement.parentNode);
                }

                // 🚚 Move the content into the drawer
                contentContainer.appendChild(contentElement);
                contentElement.style.display = 'block'; // Ensure the content is visible
            } else {
                console.warn("Content element is missing or undefined");
            }

            // =========================================================================================
            // 🧩 [SJ-DRW-TYPE-01] 14Feb26 - Tag the active drawer with its type (info/toc/url/utility)
            //     Why: CSS can special-case layouts per drawerType.
            //          - Keeps desktop bottom-drawer "taller + dead space" for utility drawers
            //          - Lets openWiki() (drawerType="url") stay full-height on desktop
            // =========================================================================================
            drawer.setAttribute('data-drawer-type', drawerType);
            Array.from(drawer.classList)
                .filter(c => c.startsWith('drawer-type-'))
                .forEach(c => drawer.classList.remove(c));
            drawer.classList.add(`drawer-type-${drawerType}`);

            // 🎬 Animate the drawer open
            if (whichDrawer === 'drawer-right' && drawerType === 'toc') {
                sjSetMainTocIconActive(true);
            }
            if (whichDrawer === 'drawer-top' && drawerType === 'calculator-toc') {
                sjSetCalcTocIconActive(true);
            }

            drawer.classList.add('active');
            overlay.classList.add('visible');
            // ✅ 30Jun26c 🧮 [SJP-CALC-LOCK-FORCED-Y-02] Pass through forcedScrollY (when the
            // caller already knows the correct restore position) so the lock doesn't capture
            // a stale/zero window.scrollY mid-restore.
            sjLockPageScroll(drawerOptions && typeof drawerOptions.forcedScrollY === 'number'
                ? drawerOptions.forcedScrollY
                : undefined);
        };

        // 🔄 Close any currently open drawers before opening a new one.
        // Use onClosed instead of a guessed timeout so switching from one TOC to Calculator TOC
        // cannot clear or orphan the drawer content.
        close_drawers({
            keepScrollLocked: true,
            onClosed: openAfterClose,
            preserveCallerContext: !!(drawerOptions && drawerOptions.preserveCallerContext)
        }); // 🧩 [SJ-DRW-JS-SCROLL-03] 14Feb26 - keep lock while switching drawers
}



// ✅ 2026-06-08 🧮 [SJ-CALC-PASS3-CALC-TOC-LAUNCHER-01]
// Shared launcher for every calculator-icon shortcut that opens the Calculator List.
// It deliberately does NOT scroll to the Calculator Chapter; it preserves the user's
// current page position and lets open_drawer() close any already-open TOC/drawer first.
// ✅ 2026-06-09 🧮 [SJ-CALC-PASS4-TOP-LIST-01] Calculator List now opens from the top in a wide drawer.
// ✅ 30Jun26a 🧮 [SJP-CALC-TOC-FORCED-Y-01]
// Accept optional forcedY to override window.scrollY when called from
// sjpInstallCalcReopenTocOnReturn — avoids jump-to-top when scroll restore
// hasn't fully settled yet.
window.sjOpenCalculatorTocDrawer = function sjOpenCalculatorTocDrawer(event, forcedY) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const title = document.getElementById('TOC-calculator-title');
    const content = document.getElementById('TOC-calculator-content');

    if (!title || !content) {
        console.warn('Calculator TOC drawer content is missing.');
        return false;
    }

    // Capture the visual page position at click time. This is mostly defensive:
    // open_drawer() already preserves position, but this guards against browser
    // scroll anchoring during drawer-content restore/switch operations.
    // forcedY (from SJ_CALC_SAVED_Y) takes priority when provided — ensures
    // the TOC reopens at the correct position even if the scroll restore
    // hasn't fully settled when this function is called.
    const targetY = (typeof forcedY === 'number' && forcedY > 0)
        ? forcedY
        : (window.sjScrollLocked ? window.sjScrollLockY : (window.scrollY || window.pageYOffset || 0));

    // ✅ 30Jun26c: pass forcedScrollY through so open_drawer's internal sjLockPageScroll()
    // call captures targetY instead of whatever window.scrollY happens to be at that
    // synchronous moment — this is what actually prevents the visual jump-to-top.
    open_drawer('drawer-top', 'calculator-toc', title, content, 'auto', { forcedScrollY: targetY });

    if (!window.sjScrollLocked) {
        requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, left: 0, behavior: 'auto' });
        });
    }

    return false;
};


// ✅ 2026-06-08 🧮 [SJ-CALC-PASS2D-DRAWER-RH-CLOSE-01]
// When a drawer closes while a Rabbit Hole is open, close the Rabbit Hole layer first.
// This prevents the Rabbit Hole veil from being stranded above the page after the drawer X is clicked.
function sjCloseRabbitHolesBeforeDrawerClose(opts = {}) {
    const preserveCallerContext = !!(opts && opts.preserveCallerContext);

    // ✅ 2026-06-14 🧮 [SJ-DRW-CALLER-PRESERVE-01]
    // Calculator drawers can be launched from ordinary page copy or a Rabbit Hole. In those cases,
    // closing/switching the drawer should not collapse the caller context. TOC launches keep the
    // older behaviour because the TOC is only a launcher, not user-reading context.
    if (!preserveCallerContext) {
        try {
            if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.closeAll === 'function') {
                window.SJRabbitHoleLink.closeAll({ restoreTrigger: false });
            }
        } catch (e) { console.warn('Portable Rabbit Hole close during drawer close failed:', e); }
    }

    try {
        if (typeof window.sjCloseCalculatorRabbitHoles === 'function') {
            window.sjCloseCalculatorRabbitHoles();
        }
    } catch (e) { console.warn('Calculator Rabbit Hole close during drawer close failed:', e); }

    if (!preserveCallerContext) {
        try {
            if (typeof sjForceCloseRabbitHoleOverlay === 'function') {
                sjForceCloseRabbitHoleOverlay();
            }
        } catch (e) { console.warn('Legacy Rabbit Hole veil cleanup during drawer close failed:', e); }
    }
}

/**
 * 🚪 Function to close all drawers
 * Moves the title and content back to their original locations and hides the drawers.
 */
function close_drawers(opts = {}) {
  // ✅ 29Jun26f: clear demo active flag on any drawer close
  try { if (typeof window._sjpDemoActive !== 'undefined') window._sjpDemoActive = false; } catch(_) {}
  // ✅ 30Jun26o 🧮 [SJP-CALC-TOC-ICON-DISABLED-01] Catch-all clear of the calculator icon's
  // visual disabled state, mirroring the flag clear above.
  try { if (typeof sjSetTocIconsBlockedForDemo === 'function') { sjSetTocIconsBlockedForDemo(false); } } catch(_) {}
    // =========================================================================================
    // 🧩 [SJ-DRW-JS-SCROLL-02] 14Feb26 - Fix "re-scroll on close" by delaying scroll-unlock
    //     Problem:
    //       - We were unlocking + restoring scroll *before* the drawer finished closing AND before
    //         the moved content was restored to the page.
    //       - When the content gets re-inserted (restore_content), browsers can shift scroll
    //         (scroll anchoring / reflow), which looks like the page "re-scrolls" to the opener.
    //
    //     Fix:
    //       - Close drawer(s)
    //       - Wait for the close transition to finish (or a fallback timeout)
    //       - Restore moved content back to its original parent(s)
    //       - THEN unlock page scroll (so the visual position stays stable)
    //
    //     Also:
    //       - Allow callers (like open_drawer) to keep the scroll locked while switching drawers.
    //       - Allow callers (like resetAndScroll) to run code after the close completes.
    // =========================================================================================
    const {
        keepScrollLocked = false,       // ✅ true when switching drawers (no unlock in between)
        onClosed = null,                // ✅ optional callback after close+restore (+unlock if enabled)
        preserveCallerContext = false   // ✅ calculator: keep non-TOC caller panels alive while switching/closing
    } = (opts || {});

    const overlay = document.querySelector('.overlay');
    const drawers = Array.from(document.querySelectorAll('.drawer'));
    const activeDrawersAtStart = drawers.filter(d => d.classList.contains('active'));
    const activeDrawerTypesAtStart = activeDrawersAtStart.map(d => (d.getAttribute('data-drawer-type') || '').trim());
    const closingCalculatorDrawer = activeDrawerTypesAtStart.indexOf('calculator') !== -1;
    const shouldPreserveCallerContext = !!(preserveCallerContext || (closingCalculatorDrawer && window.sjCalculatorPreserveCallerContext));
    const closedDrawerTypes = [];

    // ✅ 2026-06-08 🧮 [SJ-CALC-PASS2D-DRAWER-RH-CLOSE-02]
    // Close any open Rabbit Hole panels before drawer restore/unlock begins unless a calculator
    // was intentionally launched from a non-TOC caller context that should remain open.
    sjCloseRabbitHolesBeforeDrawerClose({ preserveCallerContext: shouldPreserveCallerContext });

    let pending = 0;
    let finished = false;

    const finishClose = () => {
        if (finished) return;
        finished = true;

        // ❌ Hide the overlay since no drawers are active
        if (overlay) overlay.classList.remove('visible');

        // ✅ 2026-04-29 🧩 [SJ-BOOK-TOC-ACTIVE-02]
        // Clear the Book hamburger engaged state once the TOC drawer has fully closed.
        sjSetMainTocIconActive(false);

        // ✅ 30Jun26k 🧮 [SJP-CALC-TOC-ICON-ACTIVE-01] Clear the Calculator icon engaged state
        // the same way. Unconditional + idempotent, matching the main TOC icon clear above.
        sjSetCalcTocIconActive(false);

        // ✅ Re-enable page scroll *after* DOM is restored (unless caller wants to keep it locked)
        if (!keepScrollLocked) {
            sjUnlockPageScroll();
        }

        // ✅ 2026-06-14 🧮 [SJ-DRW-CALC-RETURN-CONTEXT-01]
        // When a calculator was opened from a preserved non-TOC context, restore any suspended
        // Glossary modal state after the drawer is gone and page scroll has been restored.
        if (!keepScrollLocked && closedDrawerTypes.indexOf('calculator') !== -1) {
            try {
                if (typeof window.sjResumeActiveGlossaryAfterDrawer === 'function') {
                    window.sjResumeActiveGlossaryAfterDrawer();
                }
            } catch (e) { console.warn('Glossary context resume after calculator drawer close failed:', e); }

            try { window.sjCalculatorPreserveCallerContext = false; } catch (e) {}
        }

        if (typeof onClosed === "function") {
            try { onClosed(); } catch (e) { console.warn("onClosed() error:", e); }
        }
    };

    const closeOneDrawer = (drawer) => {
        if (!drawer.classList.contains('active')) return;

        const drawerTypeBeforeClose = (drawer.getAttribute('data-drawer-type') || '').trim();
        if (drawerTypeBeforeClose) closedDrawerTypes.push(drawerTypeBeforeClose);

        pending++;

        // Wait for the drawer slide-close animation to finish, then restore the moved content.
        const safeRestore = () => {
            // =========================================================================================
            // 🧩 [SJ-DRW-JS-RESTORE-01] 14Feb26 - Never let restore errors strand the overlay
            // Problem:
            //   - If restore_content() throws (e.g., a moved node has no parent anymore), our
            //     pending counter would never decrement, so finishClose() would never run.
            //   - Result: the grey veil (overlay) can remain "stuck" until the user clicks it.
            // Fix:
            //   - Wrap restore_content() in try/catch and ALWAYS decrement pending afterward.
            // =========================================================================================
            try {
                if (activeDrawer === drawer) {
                    restore_content(drawer);
                }
            } catch (e) {
                console.error("restore_content() error (overlay would have stuck):", e);
            }
        };

        const onEnd = (event) => {
            if (event.propertyName !== 'transform') return;

            safeRestore();

            pending--;
            if (pending <= 0) finishClose();
        };

        drawer.addEventListener('transitionend', onEnd, { once: true });

        // ⚠️ Fallback: if transitionend doesn't fire (reduced-motion, interrupted transition, etc.)
        setTimeout(() => {
            if (finished) return;

            safeRestore();

            pending = Math.max(0, pending - 1);
            if (pending <= 0) finishClose();
        }, 500);

        // Start the close animation
        drawer.classList.remove('active');
    };

    // Close any active drawers
    drawers.forEach(closeOneDrawer);

    // If no drawers were active, we still need to remove overlay + unlock immediately.
    if (pending === 0) {
        // Remove active class from any drawers anyway (defensive)
        drawers.forEach(d => d.classList.remove('active'));
        finishClose();
    }
}

/**
 * 🔄 Function to restore content after drawer fully closes
 * @param {HTMLElement} drawer - The drawer that has finished closing
 */
function restore_content(drawer) {
    
drawer.querySelectorAll('.drawer-content, .drawer-title').forEach(container => {
    while (container.firstChild) {
        let element = container.firstChild;
        if (element && originalParent.has(element)) {
            let originalParentNode = originalParent.get(element);
            originalParentNode.appendChild(element);
            // Reset any inline styling if needed
            element.style.display = 'block';
        } else {
            // In case the element isn’t in our map, remove it to keep things clean.
            container.removeChild(element);
        }
    }
});

    // 🔥 Force-hide any remaining `data-group="drawer-content"` elements
    document.querySelectorAll('[data-group="drawer-content"]').forEach(el => {
        el.style.display = 'none';
    });

    activeDrawer = null; // Reset active drawer
}

//Check if any drawer is active
function isAnyDrawerActive() {
    return document.querySelector('.drawer.active') !== null;
}
//Use 'isAnyDrawerActive()' to wait for drawer to be inactive. Used in open_drawer
function waitForDrawerToClear(callback, failsafe = 500) {
    const startTime = Date.now();
    function check() {
        if (!isAnyDrawerActive()) {
            // No active drawer found, proceed.
            callback();
        } else if (Date.now() - startTime > failsafe) {
            // Failsafe triggers; proceed even if an active drawer is still detected.
            console.warn("Failsafe: proceeding even though a drawer is still active.");
            callback();
        } else {
            // Check again after a short interval.
            setTimeout(check, 10); // Poll every 10ms.
        }
    }
    check();
}

