/* =================================================================================================
   ✅ 2026-07-03 🧭 [SJ-SECTION-CONTROLLER-01]
   Neutral Book-section controller — Public-Mode Pivot Pass 1A / 1A2

   Purpose
   - Own the show/hide state for Chapter-owned sections without adding scattered mode exceptions.
   - Keep this controller neutral: no public timers, veils, conversion prompts, or calculator logic.
   - Pass 1B registers the eligible Book Chapters. Future Chapters opt in by adding
     data-sj-section-parent="<chapterIntroId>" to their section wrapper.

   Contract
   - Each managed section begins with hidden in sjLearn.html.
   - Opening one managed section closes the other managed section(s).
   - Manual close returns the reader to the parent Chapter Intro.
   - More/Less and Rabbit Hole engines remain their existing engines; they are only reset when a normal
     manual navigation closes a managed section, never while Search owns temporary expansion state.
   ================================================================================================= */
(function sjSectionControllerBootstrap() {
  'use strict';

  const MANAGED_SELECTOR = '[data-sj-section-parent]';
  const MANAGED_CHAPTER_SELECTOR = '[data-sj-chapter-managed]';
  let activeSectionId = null;

  function getSection(sectionId) {
    const section = document.getElementById(String(sectionId || ''));
    return section && section.matches && section.matches(MANAGED_SELECTOR) ? section : null;
  }

  function isManagedElement(element) {
    return !!(element && element.closest && element.closest(MANAGED_SELECTOR));
  }

  function isManagedId(sectionId) {
    return !!getSection(sectionId);
  }

  function isManagedChapterIntroId(targetId) {
    const target = document.getElementById(String(targetId || ''));
    return !!(target && target.matches && target.matches(MANAGED_CHAPTER_SELECTOR));
  }

  function getSectionLabel(section) {
    if (!section) return 'this section';
    const explicit = (section.getAttribute('data-sj-section-label') || '').trim();
    if (explicit) return explicit;

    const title = section.querySelector('.content-section-title .center-box');
    const derived = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
    return derived || 'this section';
  }

  function createCloseButton(section) {
    const label = getSectionLabel(section);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sjsc-close-button';
    button.title = 'Close ' + label;
    button.setAttribute('aria-label', 'Close ' + label + ' and return to its Chapter');
    button.innerHTML = '&times;';
    button.addEventListener('click', function () {
      window.sjCloseSection(section.id);
    });
    return button;
  }

  function prepareManagedSectionHeader(section) {
    if (!section || section.dataset.sjscHeaderPrepared === '1') return;

    // Recipe Facts is a self-contained specialty panel without the Book's standard three-part title bar.
    // Keep its panel formatting intact and add a small sticky close control instead.
    if (section.getAttribute('data-sj-section-special') === 'recipe-facts') {
      const closeRow = document.createElement('div');
      closeRow.className = 'sjsc-special-close-row';
      closeRow.setAttribute('aria-label', 'Close Recipe Facts');
      closeRow.appendChild(createCloseButton(section));
      section.insertBefore(closeRow, section.firstChild);
      section.dataset.sjscHeaderPrepared = '1';
      return;
    }

    const titleBar = section.querySelector(':scope > .content-section-title');
    const titleContainer = titleBar && titleBar.querySelector('.center-title-container');
    if (!titleContainer) return;

    let rightBox = Array.prototype.find.call(titleContainer.children, function (child) {
      return child.classList && child.classList.contains('right-box');
    });

    if (!rightBox) {
      rightBox = document.createElement('div');
      rightBox.className = 'right-box type-content-title-right';
      titleContainer.appendChild(rightBox);
    }

    rightBox.classList.add('sjsc-section-close-box');
    rightBox.innerHTML = '';
    rightBox.appendChild(createCloseButton(section));
    section.dataset.sjscHeaderPrepared = '1';
  }

  function isSearchOwnedNavigation() {
    return !!(document.documentElement && document.documentElement.classList.contains('sj-search-active'));
  }

  function hasOpenDrawer() {
    return !!document.querySelector('.drawer.active');
  }

  function runAfterDrawersClose(callback) {
    if (typeof callback !== 'function') return;

    if (hasOpenDrawer() && typeof window.close_drawers === 'function') {
      window.close_drawers({
        keepScrollLocked: false,
        onClosed: function () {
          window.setTimeout(callback, 12);
        }
      });
      return;
    }

    callback();
  }

  function scrollElementToOffset(element, offset, behavior) {
    if (!element) return;

    const numericOffset = Number.isFinite(Number(offset)) ? Number(offset) : 100;
    const top = element.getBoundingClientRect().top + window.scrollY - numericOffset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: behavior || 'smooth'
    });
  }

  function dispatchSectionLifecycle(type, section, detail) {
    if (!section || !type) return;

    try {
      window.dispatchEvent(new CustomEvent(type, {
        detail: Object.assign({ sectionId: section.id, section: section }, detail || {})
      }));
    } catch (e) {}
  }

  function resetManagedSectionInterior(section) {
    if (!section || isSearchOwnedNavigation()) return;

    // Retain the mature More/Less code; reset only the section being closed so a re-open is clean.
    try {
      if (typeof window.clickLessForId === 'function') {
        window.clickLessForId(section.id, 'Less...');
      }
    } catch (e) {}

    // The active managed section is the only section that should have an in-flow Rabbit Hole open.
    // Use existing engines rather than duplicating their close logic.
    try {
      if (window.SJRabbitHoleLink && typeof window.SJRabbitHoleLink.closeAll === 'function') {
        window.SJRabbitHoleLink.closeAll({ restoreTrigger: false });
      }
    } catch (e) {}

    try {
      if (typeof window.closeAllRabbitHoles === 'function') {
        window.closeAllRabbitHoles();
      }
    } catch (e) {}

    try {
      if (typeof window.sjForceCloseRabbitHoleOverlay === 'function') {
        window.sjForceCloseRabbitHoleOverlay();
      }
    } catch (e) {}
  }

  function close(sectionId, options) {
    const section = getSection(sectionId);
    if (!section) return false;

    const opts = Object.assign({ resetInterior: true, reason: 'controller-close' }, options || {});
    const wasVisible = !section.hidden && section.getAttribute('aria-hidden') !== 'true';

    if (opts.resetInterior) {
      resetManagedSectionInterior(section);
    }

    section.hidden = true;
    section.setAttribute('aria-hidden', 'true');
    section.classList.remove('sjsc-section-is-active');

    if (activeSectionId === section.id) {
      activeSectionId = null;
    }

    if (wasVisible) {
      dispatchSectionLifecycle('sj:section-closed', section, {
        reason: opts.reason || 'controller-close'
      });
    }

    return true;
  }

  function closeOthers(exceptId, options) {
    document.querySelectorAll(MANAGED_SELECTOR).forEach(function (candidate) {
      if (candidate.id !== exceptId) {
        close(candidate.id, options);
      }
    });
  }

  function open(sectionId, options) {
    const section = getSection(sectionId);
    if (!section) return false;

    const opts = Object.assign({
      scroll: true,
      offset: 100,
      behavior: 'smooth',
      closeDrawers: true,
      preserveInteriorState: isSearchOwnedNavigation()
    }, options || {});

    function reveal() {
      // Normal chapter navigation follows the established Book convention: close open More/Rabbit
      // state before moving. Search is the deliberate exception because it temporarily owns it.
      if (!opts.preserveInteriorState) {
        try {
          if (typeof window.clickAllLess === 'function') {
            window.clickAllLess('Less...');
          }
        } catch (e) {}
      }

      closeOthers(section.id, {
        resetInterior: !opts.preserveInteriorState,
        reason: 'section-switch'
      });

      section.hidden = false;
      section.setAttribute('aria-hidden', 'false');
      section.classList.add('sjsc-section-is-active');
      activeSectionId = section.id;

      // ✅ 2026-07-04 🧭 [SJ-SECTION-CONTROLLER-OPEN-MORE-01]
      // A selected Section should arrive as a real reading panel, not as a thin introduction.
      // Reuse the mature More/Less engine so its normal layout and Rabbit Hole reveal remain intact.
      // Search is the deliberate exception: Search already owns temporary expansion state.
      if (!opts.preserveInteriorState) {
        try {
          if (typeof window.clickMoreForId === 'function') {
            window.clickMoreForId(section.id, 'Less...');
          }
        } catch (e) {}
      }

      dispatchSectionLifecycle('sj:section-opened', section, {
        reason: opts.reason || 'normal-open'
      });

      if (opts.scroll) {
        window.requestAnimationFrame(function () {
          scrollElementToOffset(section, opts.offset, opts.behavior);
        });
      }
    }

    if (opts.closeDrawers) {
      runAfterDrawersClose(reveal);
    } else {
      reveal();
    }

    return true;
  }

  // Close every managed Section without choosing a new parent/scroll target. This is the
  // lower fixed-header Up Arrow reset primitive; legacy More/Less/rabbit resets remain owned by
  // their established engines.
  function closeAll(options) {
    closeOthers('', Object.assign({
      resetInterior: true,
      reason: 'global-close'
    }, options || {}));
    activeSectionId = null;
    return true;
  }

  function closeAndReturn(sectionId, options) {
    const section = getSection(sectionId);
    if (!section) return false;

    const parentId = section.getAttribute('data-sj-section-parent') || '';
    const parent = document.getElementById(parentId);

    close(section.id, { resetInterior: true, reason: 'manual-close' });

    if (parent) {
      window.requestAnimationFrame(function () {
        scrollElementToOffset(parent, (options && options.offset) || 100, (options && options.behavior) || 'smooth');
      });
    }

    return false;
  }

  function beforeNavigate(targetId, options) {
    const section = getSection(targetId);

    // A direct move to a converted Chapter Intro returns the Book to its Chapter-only state.
    if (!section && isManagedChapterIntroId(targetId)) {
      closeOthers('', { resetInterior: true, reason: 'chapter-return' });
      return false;
    }

    if (!section) return false;

    // ✅ 2026-07-03 🧭 [SJ-SECTION-CONTROLLER-NAV-03]
    // Pass 1A2 QA correction:
    // toggleMore() scrolls back to its parent section after opening More. If that parent is
    // already visible, do not re-open it through the destructive navigation path; otherwise
    // the just-opened More panel is immediately closed by clickAllLess().
    if (!section.hidden && section.getAttribute('aria-hidden') !== 'true') {
      return false;
    }

    return open(targetId, Object.assign({
      scroll: false,
      closeDrawers: false,
      preserveInteriorState: isSearchOwnedNavigation(),
      reason: 'navigation-reveal'
    }, options || {}));
  }

  function revealForElement(element) {
    const owner = element && element.closest ? element.closest(MANAGED_SELECTOR) : null;
    if (!owner) return false;

    return open(owner.id, {
      scroll: false,
      closeDrawers: false,
      preserveInteriorState: true,
      reason: 'search-reveal'
    });
  }

  function init() {
    document.querySelectorAll(MANAGED_SELECTOR).forEach(function (section) {
      prepareManagedSectionHeader(section);
      section.hidden = true;
      section.setAttribute('aria-hidden', 'true');
      section.classList.remove('sjsc-section-is-active');
    });

    document.documentElement.classList.add('sjsc-ready');
  }

  window.SJSectionController = {
    init: init,
    isManagedElement: isManagedElement,
    isManagedId: isManagedId,
    isManagedChapterIntroId: isManagedChapterIntroId,
    open: open,
    close: close,
    closeAll: closeAll,
    dispatchSectionLifecycle: dispatchSectionLifecycle,
    closeAndReturn: closeAndReturn,
    beforeNavigate: beforeNavigate,
    revealForElement: revealForElement,
    getActiveSectionId: function () { return activeSectionId; }
  };

  // Inline calls remain deliberately thin. They avoid teaching Chapter markup controller details.
  window.sjOpenSection = function (sectionId, offset) {
    return open(sectionId, { offset: offset || 100, scroll: true, closeDrawers: true });
  };

  window.sjCloseSection = function (sectionId, offset) {
    return closeAndReturn(sectionId, { offset: offset || 100 });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
