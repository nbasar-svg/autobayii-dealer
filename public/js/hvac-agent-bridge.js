(function () {
  'use strict';

  function queryFromForm(form) {
    var texts = [];
    form.querySelectorAll('select').forEach(function (s) {
      var opt = s.options[s.selectedIndex];
      var t = (opt && opt.text || '').trim();
      if (t && t.indexOf('Select') !== 0) texts.push(t);
    });
    return texts.join(' ') || 'SUV';
  }

  function send(query) {
    if (!window.WebCuration) return;
    var zone = document.getElementById('curation-zone');
    if (zone) zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
    WebCuration.send(query);
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.closest || !form.closest('.hero__tab__form')) return;
    e.preventDefault();
    send(queryFromForm(form));
  });

  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var q = searchInput.value.trim();
      if (!q) return;
      var closer = document.querySelector('.search-close-switch');
      if (closer) closer.click();
      send(q);
    });
  }
})();
