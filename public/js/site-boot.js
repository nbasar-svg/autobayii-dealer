/* Hide HVAC preloader even if fonts, CDN scripts, or images never finish loading. */
(function () {
  function hidePreloder() {
    var p = document.getElementById('preloder');
    if (!p) return;
    p.style.display = 'none';
    p.style.opacity = '0';
    p.style.visibility = 'hidden';
    p.style.pointerEvents = 'none';
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hidePreloder();
  } else {
    document.addEventListener('DOMContentLoaded', hidePreloder);
  }
  window.addEventListener('load', hidePreloder);
  setTimeout(hidePreloder, 1500);
})();
