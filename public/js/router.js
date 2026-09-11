/**
 * router.js
 * Hash-based SPA router for the AutoBayii adaptive dealer site.
 * Handles navigation between pages without full page reload.
 */
(function () {
  'use strict';

  /* ──────────────────── Route Table ──────────────────── */
  const routes = {
    '/':           'home',
    '/araclar':    'vehicles',
    '/hakkimizda': 'about',
    '/iletisim':   'contact'
  };

  let currentRoute = '/';

  /* ──────────────────── Navigate ──────────────────── */

  function navigate(path) {
    path = path || '/';
    if (!routes[path]) path = '/';

    currentRoute = path;

    // Update hash
    window.location.hash = '#' + path;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === path);
    });

    // Close mobile nav
    var nav = document.getElementById('main-nav');
    if (nav) nav.classList.remove('open');

    // Render the view
    var viewName = routes[path];
    var appRoot = document.getElementById('app-root');
    var curationZone = document.getElementById('curation-zone');

    if (appRoot && window.Views && window.Views[viewName]) {
      appRoot.innerHTML = window.Views[viewName]();
    }

    // Show/hide curation zone based on route
    if (curationZone) {
      // Curation zone visible on home and vehicles page
      curationZone.classList.toggle('hidden', path !== '/' && path !== '/araclar');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ──────────────────── Init from Hash ──────────────────── */

  function initFromHash() {
    var hash = window.location.hash;
    var path = hash ? hash.replace('#', '') : '/';
    navigate(path);
  }

  /* ──────────────────── Event Listeners ──────────────────── */

  // Hash change
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash;
    var path = hash ? hash.replace('#', '') : '/';
    navigate(path);
  });

  /* ──────────────────── Expose ──────────────────── */

  window.Router = {
    navigate:     navigate,
    init:         initFromHash,
    getCurrentRoute: function () { return currentRoute; }
  };

})();
