/* Updated 1Mar26 to fix embedded Step Video issues (no controls, bad responsiveness) */
/* ✅ 2026-03-01 🧩 [SJ2-TOGGLE-01] Generic Step toggle engine (Details / Explore) */
(function () {
  function onClick(e) {
    const btn = e.target.closest('[data-sj2-toggle]');
    if (!btn) return;

    const step = btn.closest('[data-sj2-step]');
    if (!step) return;

    const target = btn.getAttribute('data-sj2-toggle'); // "details" | "explore"
    const panel = step.querySelector(`[data-sj2-panel="${target}"]`);
    if (!panel) return;

    // Cache original labels once
    step.querySelectorAll('[data-sj2-toggle]').forEach((b) => {
      if (!b.dataset.sj2Label) b.dataset.sj2Label = (b.textContent || '').trim();
    });

    const open = step.getAttribute('data-open') || '';

    // If clicking the already-open tab => close it
    if (open === target) {
      panel.hidden = true;
      btn.textContent = btn.dataset.sj2Label || btn.textContent;
      step.removeAttribute('data-open');
      return;
    }

    // Close the currently open tab (if any)
    if (open) {
      const openPanel = step.querySelector(`[data-sj2-panel="${open}"]`);
      if (openPanel) openPanel.hidden = true;

      const openBtn = step.querySelector(`[data-sj2-toggle="${open}"]`);
      if (openBtn) openBtn.textContent = openBtn.dataset.sj2Label || openBtn.textContent;
    }

    // Open the clicked tab
    panel.hidden = false;
    btn.textContent = 'Close';
    step.setAttribute('data-open', target);
  }

  function init() {
    document.addEventListener('click', onClick, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ✅ 2026-03-01 🧩 [SJ2-VIDEO-NORM-02] Jodit-proof video normalization (Cloudflare Stream)
   Why:
   - Your editor layer injects <jodit data-jodit_iframe_wrapper ... style="width:600px;height:338px"> around iframes.
   - That wrapper can:
       (a) corrupt responsive sizing (cropped / “magnified” on phones)
       (b) steal hover/tap events so player controls never appear
   What this does:
   - For EACH .sj2-video inside EACH [data-sj2-step]:
       1) Ensure a .sj2-embed wrapper exists
       2) Move ALL iframes to be direct children of .sj2-embed
       3) REMOVE ALL jodit[data-jodit_iframe_wrapper] wrappers (even if they appear later)
       4) For Cloudflare Stream iframes, enforce:
            allowfullscreen + allow tokens + controls=true
   Safety:
   - Does NOT touch your panel/button UX.
   - Debounced + MutationObserver so it survives late Jodit injections.
*/
(function () {
  function isCloudflareStreamIframe(src) {
    if (!src) return false;
    return (
      src.indexOf('videodelivery.net') !== -1 ||
      src.indexOf('cloudflarestream.com') !== -1 ||
      src.indexOf('iframe.cloudflarestream.com') !== -1
    );
  }

  function mergeAllowTokens(existingAllow, neededTokens) {
    const set = {};
    (existingAllow || '')
      .split(';')
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .forEach((t) => (set[t] = true));

    neededTokens.forEach((t) => (set[t] = true));
    return Object.keys(set).join('; ');
  }

  function ensureEmbedWrapper(videoBox) {
    // Only accept a direct-child .sj2-embed (prevents accidentally grabbing nested ones)
    let embed = videoBox.querySelector(':scope > .sj2-embed');
    if (embed) return embed;

    embed = document.createElement('div');
    embed.className = 'sj2-embed';

    while (videoBox.firstChild) {
      embed.appendChild(videoBox.firstChild);
    }
    videoBox.appendChild(embed);

    return embed;
  }

  function stripJoditWrappers(container) {
    // Remove any injected Jodit iframe wrappers anywhere inside the container.
    // (We do this AFTER pulling iframes out so we never “lose” a player.)
    container.querySelectorAll('jodit[data-jodit_iframe_wrapper]').forEach((w) => {
      // Safety: rescue any iframes that might still be nested
      w.querySelectorAll('iframe').forEach((f) => {
        const embed = container.querySelector(':scope > .sj2-embed') || container;
        if (f.parentElement !== embed) embed.appendChild(f);
      });
      w.remove();
    });
  }

  function moveIframesToTop(embed) {
    const iframes = Array.from(embed.querySelectorAll('iframe'));
    iframes.forEach((iframe) => {
      if (iframe.parentElement !== embed) embed.appendChild(iframe);
    });
    return iframes;
  }

  function forceStreamIframeFeatures(iframe) {
    iframe.setAttribute('allowfullscreen', 'true');

    const needed = [
      'accelerometer',
      'gyroscope',
      'autoplay',
      'encrypted-media',
      'picture-in-picture',
      'fullscreen',
    ];
    iframe.setAttribute('allow', mergeAllowTokens(iframe.getAttribute('allow') || '', needed));

    // Remove fixed sizing attrs if present
    iframe.removeAttribute('width');
    iframe.removeAttribute('height');

    // Ensure controls are ON unless explicitly opted out
    if (iframe.getAttribute('data-sj2-controls') !== 'off') {
      const src = iframe.getAttribute('src') || '';
      try {
        const url = new URL(src, window.location.href);
        url.searchParams.set('controls', 'true');
        iframe.setAttribute('src', url.toString());
      } catch (e) {
        // ignore
      }
    }

    if (!iframe.hasAttribute('loading')) iframe.setAttribute('loading', 'lazy');
  }

  function normalizeVideoBox(videoBox) {
    if (!videoBox) return;

    // 1) Ensure wrapper exists
    const embed = ensureEmbedWrapper(videoBox);

    // 2) Pull all iframes up (Jodit can nest them)
    const iframes = moveIframesToTop(embed);

    // 3) Strip Jodit wrappers (in the WHOLE videoBox, not just embed)
    stripJoditWrappers(videoBox);

    // 4) Enforce Cloudflare player features
    iframes.forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (isCloudflareStreamIframe(src)) forceStreamIframeFeatures(iframe);
    });
  }

  function normalizeAll() {
    document.querySelectorAll('[data-sj2-step] .sj2-video').forEach(normalizeVideoBox);
  }

  // Debounce so MutationObserver doesn’t cause thrash
  let scheduled = false;
  function scheduleNormalize() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      normalizeAll();
    });
  }

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeAll);
  } else {
    normalizeAll();
  }

  // Watch for late Jodit injections / DOM changes
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      // Fast exits: only react if something relevant was added/changed
      if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          const el = /** @type {Element} */ (n);

          if (
            (el.matches && (el.matches('.sj2-video') || el.matches('iframe') || el.matches('jodit[data-jodit_iframe_wrapper]'))) ||
            (el.closest && el.closest('[data-sj2-step] .sj2-video'))
          ) {
            scheduleNormalize();
            return;
          }
        }
      }
    }
  });

  // Guard in case body isn't ready yet
  function startObserver() {
    if (!document.body) return setTimeout(startObserver, 10);
    mo.observe(document.body, { childList: true, subtree: true });
  }
  startObserver();
})();


/* ✅ 2026-03-01 🧩 [SJ-LEGACY-VIDEO-NORM-01] Legacy (radio-button) Step video normalization
   Goal:
   - You have dozens of older Steps using .sj-wrapper / .sj-video-box.
   - Your editor layer (Jodit) can wrap those iframes too, causing:
       • missing controls (hover/tap blocked)
       • mobile crop/magnify (fixed-size wrapper corrupts sizing)
   Fix:
   - For EACH .sj-video-box:
       1) Move iframes to be direct children of .sj-video-box
       2) Strip jodit[data-jodit_iframe_wrapper]
       3) For Cloudflare Stream iframes: ensure controls=true + fullscreen tokens
   Note:
   - Does NOT change the legacy radio/label UX at all.
*/
(function () {
  function isCloudflareStreamIframe(src) {
    if (!src) return false;
    return (
      src.indexOf('videodelivery.net') !== -1 ||
      src.indexOf('cloudflarestream.com') !== -1 ||
      src.indexOf('iframe.cloudflarestream.com') !== -1
    );
  }

  function mergeAllowTokens(existingAllow, neededTokens) {
    const set = {};
    (existingAllow || '')
      .split(';')
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .forEach((t) => (set[t] = true));

    neededTokens.forEach((t) => (set[t] = true));
    return Object.keys(set).join('; ');
  }

  function stripJoditWrappers(container) {
    container.querySelectorAll('jodit[data-jodit_iframe_wrapper]').forEach((w) => {
      // Rescue nested iframes (just in case)
      w.querySelectorAll('iframe').forEach((f) => {
        if (f.parentElement !== container) container.appendChild(f);
      });
      w.remove();
    });
  }

  function forceStreamIframeFeatures(iframe) {
    iframe.setAttribute('allowfullscreen', 'true');

    const needed = [
      'accelerometer',
      'gyroscope',
      'autoplay',
      'encrypted-media',
      'picture-in-picture',
      'fullscreen',
    ];
    iframe.setAttribute('allow', mergeAllowTokens(iframe.getAttribute('allow') || '', needed));

    iframe.removeAttribute('width');
    iframe.removeAttribute('height');

    // Ensure controls are ON unless explicitly opted out
    if (iframe.getAttribute('data-sj-controls') !== 'off') {
      const src = iframe.getAttribute('src') || '';
      try {
        const url = new URL(src, window.location.href);
        url.searchParams.set('controls', 'true'); // Cloudflare controls default true, but we force for safety
        iframe.setAttribute('src', url.toString());
      } catch (e) {
        // ignore
      }
    }

    if (!iframe.hasAttribute('loading')) iframe.setAttribute('loading', 'lazy');
  }

  function normalizeLegacyBox(box) {
    if (!box) return;

    // Pull any nested iframes up so legacy CSS can size them reliably
    const iframes = Array.from(box.querySelectorAll('iframe'));
    iframes.forEach((iframe) => {
      if (iframe.parentElement !== box) box.appendChild(iframe);
    });

    // Remove Jodit wrappers that can steal pointer events and inject fixed sizing
    stripJoditWrappers(box);

    // Enforce Cloudflare player features (controls + fullscreen)
    iframes.forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (isCloudflareStreamIframe(src)) forceStreamIframeFeatures(iframe);
    });
  }

  function normalizeAllLegacy() {
    document.querySelectorAll('.sj-video-box').forEach(normalizeLegacyBox);
  }

  // Debounce (shared pattern)
  let scheduled = false;
  function scheduleNormalize() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      normalizeAllLegacy();
    });
  }

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeAllLegacy);
  } else {
    normalizeAllLegacy();
  }

  // MutationObserver — Jodit can inject wrappers AFTER load
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type !== 'childList') continue;
      for (const n of m.addedNodes) {
        if (!n || n.nodeType !== 1) continue;
        const el = /** @type {Element} */ (n);

        if (
          (el.matches && (el.matches('.sj-video-box') || el.matches('iframe') || el.matches('jodit[data-jodit_iframe_wrapper]'))) ||
          (el.closest && el.closest('.sj-video-box'))
        ) {
          scheduleNormalize();
          return;
        }
      }
    }
  });

  function startObserver() {
    if (!document.body) return setTimeout(startObserver, 10);
    mo.observe(document.body, { childList: true, subtree: true });
  }
  startObserver();
})();
