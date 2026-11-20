// Stylesheets that need not hold the first paint (the web fonts): applied the moment they arrive.
// The size-matched fallback face in site.css keeps the layout still meanwhile. (NIRMATA, mission R3, 20 Nov 2026)
(function () {
  function run() {
    document.querySelectorAll('link[data-async]').forEach(function (l) {
      if (l.sheet) l.media = 'all'; else l.addEventListener('load', function () { l.media = 'all'; });
    });
  }
  run(); document.addEventListener('DOMContentLoaded', run);
})();
