/* Kurzer Übergang in die echten Kundenbereiche. Links bleiben ohne JavaScript nutzbar. */
(function () {
  'use strict';
  var veil = document.getElementById('veil');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var navigating = false;

  document.querySelectorAll('[data-destination]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (reduced.matches || !veil || !veil.animate) return;
      event.preventDefault();
      if (navigating) return;
      navigating = true;
      var target = link.href;
      var fallback = window.setTimeout(function () { window.location.assign(target); }, 420);
      veil.animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: 240, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
      ).finished.then(function () {
        window.clearTimeout(fallback);
        window.location.assign(target);
      }).catch(function () {
        window.clearTimeout(fallback);
        window.location.assign(target);
      });
    });
  });

  window.addEventListener('pageshow', function (event) {
    navigating = false;
    if (veil && veil.getAnimations) veil.getAnimations().forEach(function (animation) { animation.cancel(); });
    if (event.persisted) document.documentElement.classList.remove('intro-enabled');
  });
})();
