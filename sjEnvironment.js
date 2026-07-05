/* =========================================================================================
   sjEnvironment.js

   Central Sourjoe environment/link helper.

   Purpose:
   - Keep the same Book/Public files valid on QA and PROD.
   - Avoid hard-coded book.sourjoe.com vs bookqa.sourjoe.com links scattered across files.
   - Let sjqa.w3spaces.com/bookqa.sourjoe.com be the development surface and
     sourjoe.w3spaces.com/book.sourjoe.com be the production surface.
   ========================================================================================= */
(function (window, document) {
  'use strict';

  if (!window || !document) return;

  var host = String(window.location.hostname || '').toLowerCase();
  var protocol = String(window.location.protocol || 'https:').toLowerCase();
  var currentOrigin = window.location.origin || (protocol + '//' + host);

  var QA_BOOK_HOSTS = ['bookqa.sourjoe.com', 'sjqa.w3spaces.com'];
  var PROD_BOOK_HOSTS = ['book.sourjoe.com', 'sourjoe.w3spaces.com'];
  var PUBLIC_HOSTS = ['sourjoe.com', 'www.sourjoe.com'];
  var APP_HOSTS = ['app.sourjoe.com'];
  var STAGE_HOSTS = ['stage.sourjoe.com'];

  function includes(list, value) {
    return list.indexOf(String(value || '').toLowerCase()) !== -1;
  }

  function normalizedPath(path) {
    path = String(path || '');
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '?' || path.charAt(0) === '#') return path;
    if (path.charAt(0) !== '/') path = '/' + path;
    return path;
  }

  function appendPath(originOrBase, path) {
    path = String(path || '');
    if (!path) return originOrBase;
    if (/^https?:\/\//i.test(path)) return path;

    // Query/hash-only paths append directly to the supplied base.
    if (path.charAt(0) === '?' || path.charAt(0) === '#') return originOrBase + path;

    if (path.charAt(0) !== '/') path = '/' + path;
    return String(originOrBase || '').replace(/\/$/, '') + path;
  }

  function currentEnvName() {
    if (includes(QA_BOOK_HOSTS, host) || includes(STAGE_HOSTS, host)) return 'qa';
    if (includes(PROD_BOOK_HOSTS, host) || includes(PUBLIC_HOSTS, host) || includes(APP_HOSTS, host)) return 'prod';
    return 'local';
  }

  var envName = currentEnvName();
  var isQaBookHost = includes(QA_BOOK_HOSTS, host);
  var isProdBookHost = includes(PROD_BOOK_HOSTS, host);
  var isBookHost = isQaBookHost || isProdBookHost;
  var isPublicHost = includes(PUBLIC_HOSTS, host);
  var isAppHost = includes(APP_HOSTS, host);
  var isStageHost = includes(STAGE_HOSTS, host);

  var bookOrigin = 'https://book.sourjoe.com';
  if (envName === 'qa') bookOrigin = 'https://bookqa.sourjoe.com';
  if (envName === 'local' && host) bookOrigin = currentOrigin;

  var publicHomeUrl = 'https://sourjoe.com/';
  if (envName === 'qa') publicHomeUrl = bookOrigin + '/p.html';
  if (envName === 'local' && host) publicHomeUrl = currentOrigin + '/p.html';

  var appOrigin = 'https://app.sourjoe.com';
  var stageOrigin = 'https://stage.sourjoe.com';

  function originForHost(hostname, scheme) {
    hostname = String(hostname || '').toLowerCase();
    scheme = String(scheme || 'https').replace(/:$/, '');
    return scheme + '://' + hostname;
  }

  function originsForHosts(hosts) {
    var out = [];
    hosts.forEach(function (h) {
      out.push(originForHost(h, 'https'));
      out.push(originForHost(h, 'http'));
    });
    return out;
  }

  var protectedBookHosts = QA_BOOK_HOSTS.concat(PROD_BOOK_HOSTS);
  var approvedBookLaunchOrigins = originsForHosts(APP_HOSTS.concat(STAGE_HOSTS, QA_BOOK_HOSTS, PROD_BOOK_HOSTS));
  var approvedCalculatorHosts = APP_HOSTS.concat(STAGE_HOSTS, PUBLIC_HOSTS, QA_BOOK_HOSTS, PROD_BOOK_HOSTS);
  var approvedCalculatorOrigins = originsForHosts(approvedCalculatorHosts);

  function originFromUrl(urlText) {
    if (!urlText) return '';
    try { return new URL(urlText, window.location.href).origin.toLowerCase(); }
    catch (e) { return ''; }
  }

  function hostFromUrl(urlText) {
    if (!urlText) return '';
    try { return new URL(urlText, window.location.href).hostname.toLowerCase(); }
    catch (e) { return ''; }
  }

  function isApprovedBookLaunchOrigin(originOrUrl) {
    var origin = String(originOrUrl || '').toLowerCase();
    if (origin.indexOf('://') !== -1 && origin.split('/').length > 3) origin = originFromUrl(origin);
    return approvedBookLaunchOrigins.indexOf(origin) !== -1;
  }

  function isApprovedCalculatorHost(hostname) {
    return approvedCalculatorHosts.indexOf(String(hostname || '').toLowerCase()) !== -1;
  }

  function isApprovedCalculatorOrigin(originOrUrl) {
    var origin = String(originOrUrl || '').toLowerCase();
    if (origin.indexOf('://') !== -1 && origin.split('/').length > 3) origin = originFromUrl(origin);
    return approvedCalculatorOrigins.indexOf(origin) !== -1;
  }

  function bookUrl(path) {
    return appendPath(bookOrigin, path);
  }

  function appUrl(path) {
    return appendPath(appOrigin, path);
  }

  function stageUrl(path) {
    return appendPath(stageOrigin, path);
  }

  function publicUrl(path) {
    path = String(path || '');
    if (!path) return publicHomeUrl;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '?' || path.charAt(0) === '#') return publicHomeUrl + path;
    if (path.charAt(0) !== '/') path = '/' + path;

    // In QA, the public preview lives as p.html on the Book QA surface.
    if (envName === 'qa' || envName === 'local') {
      if (path === '/' || path === '/p.html' || path === '/p0.html') return publicHomeUrl;
      return appendPath(bookOrigin, path);
    }

    return appendPath('https://sourjoe.com', path);
  }

  function calculatorUrl() {
    return bookUrl('sjCalculators.html');
  }

  function applyEnvLinks(root) {
    root = root || document;
    if (!root.querySelectorAll) return;

    root.querySelectorAll('[data-sj-book-path]').forEach(function (el) {
      el.setAttribute('href', bookUrl(el.getAttribute('data-sj-book-path') || ''));
    });

    root.querySelectorAll('[data-sj-app-path]').forEach(function (el) {
      el.setAttribute('href', appUrl(el.getAttribute('data-sj-app-path') || ''));
    });

    root.querySelectorAll('[data-sj-stage-path]').forEach(function (el) {
      el.setAttribute('href', stageUrl(el.getAttribute('data-sj-stage-path') || ''));
    });

    root.querySelectorAll('[data-sj-public-path]').forEach(function (el) {
      el.setAttribute('href', publicUrl(el.getAttribute('data-sj-public-path') || ''));
    });
  }

  window.SJ_ENV = {
    version: '20260615_env2',
    envName: envName,
    host: host,
    currentOrigin: currentOrigin,
    bookOrigin: bookOrigin,
    appOrigin: appOrigin,
    stageOrigin: stageOrigin,
    publicHomeUrl: publicHomeUrl,
    isQaBookHost: isQaBookHost,
    isProdBookHost: isProdBookHost,
    isBookHost: isBookHost,
    isPublicHost: isPublicHost,
    isAppHost: isAppHost,
    isStageHost: isStageHost,
    hosts: {
      qaBook: QA_BOOK_HOSTS.slice(),
      prodBook: PROD_BOOK_HOSTS.slice(),
      protectedBook: protectedBookHosts.slice(),
      public: PUBLIC_HOSTS.slice(),
      app: APP_HOSTS.slice(),
      stage: STAGE_HOSTS.slice(),
      calculatorApproved: approvedCalculatorHosts.slice()
    },
    origins: {
      approvedBookLaunch: approvedBookLaunchOrigins.slice(),
      approvedCalculator: approvedCalculatorOrigins.slice()
    },
    normalizePath: normalizedPath,
    originFromUrl: originFromUrl,
    hostFromUrl: hostFromUrl,
    isApprovedBookLaunchOrigin: isApprovedBookLaunchOrigin,
    isApprovedCalculatorHost: isApprovedCalculatorHost,
    isApprovedCalculatorOrigin: isApprovedCalculatorOrigin,
    bookUrl: bookUrl,
    appUrl: appUrl,
    stageUrl: stageUrl,
    publicUrl: publicUrl,
    calculatorUrl: calculatorUrl,
    applyEnvLinks: applyEnvLinks
  };

  // Friendly globals for older Sourjoe scripts / inline handlers.
  window.sjBookUrl = bookUrl;
  window.sjAppUrl = appUrl;
  window.sjPublicUrl = publicUrl;
  window.sjApplyEnvLinks = applyEnvLinks;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyEnvLinks(document); }, { once: true });
  } else {
    applyEnvLinks(document);
  }
})(window, document);
