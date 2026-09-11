/**
 * app.js
 * Main application initialization for AutoBayii adaptive dealer SPA.
 * Binds events, initializes the router, and connects the agent panel.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ──────────────────── Search Toggle ──────────────────── */
    var searchToggle = document.getElementById('search-toggle');
    var agentPanel   = document.getElementById('agent-panel');
    var agentInput   = document.getElementById('agent-input');
    var agentSend    = document.getElementById('agent-send');

    if (searchToggle && agentPanel) {
      searchToggle.addEventListener('click', function () {
        var isHidden = agentPanel.classList.contains('hidden');
        agentPanel.classList.toggle('hidden');
        searchToggle.classList.toggle('active', isHidden);
        if (isHidden && agentInput) {
          agentInput.focus();
        }
      });
    }

    /* ──────────────────── Agent Input ──────────────────── */
    function doSend() {
      if (!agentInput) return;
      var query = agentInput.value.trim();
      if (!query) return;
      if (window.WebCuration) {
        WebCuration.send(query);
      }
      agentInput.value = '';
    }

    if (agentSend) {
      agentSend.addEventListener('click', doSend);
    }

    if (agentInput) {
      agentInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSend();
        }
      });
    }

    /* ──────────────────── Navigation Links ──────────────────── */
    document.querySelectorAll('[data-route]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var route = this.getAttribute('data-route');
        if (window.Router) {
          Router.navigate(route);
        }
      });
    });

    /* ──────────────────── Footer Category Links ──────────────────── */
    document.querySelectorAll('[data-category]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var category = this.getAttribute('data-category');

        // Open agent panel
        if (agentPanel && agentPanel.classList.contains('hidden')) {
          agentPanel.classList.remove('hidden');
          if (searchToggle) searchToggle.classList.add('active');
        }

        // Navigate to home to show results
        if (window.Router) {
          Router.navigate('/');
        }

        // Send the category as a query
        if (window.WebCuration) {
          WebCuration.send(category);
        }
      });
    });

    /* ──────────────────── Hamburger Menu ──────────────────── */
    var hamburger = document.getElementById('hamburger-btn');
    var mainNav   = document.getElementById('main-nav');

    if (hamburger && mainNav) {
      hamburger.addEventListener('click', function () {
        mainNav.classList.toggle('open');
      });

      // Close nav when clicking outside on mobile
      document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
          mainNav.classList.remove('open');
        }
      });
    }

    /* ──────────────────── Initialize Router ──────────────────── */
    if (window.Router) {
      Router.init();
    }

    /* ──────────────────── Console branding ──────────────────── */
    console.log(
      '%c AutoBayii %c Powered by Agentforce ',
      'background:#e63946;color:#fff;font-size:14px;font-weight:700;padding:4px 8px;border-radius:4px 0 0 4px;',
      'background:#1a1a2e;color:#fff;font-size:14px;padding:4px 8px;border-radius:0 4px 4px 0;'
    );

  });

})();
