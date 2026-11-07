/* Landing page: network field, gentle parallax, animated mini dashboard. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('heroCanvas');
    if (canvas && window.CA) CA.networkCanvas(canvas);

    if (window.CA && !CA.reducedMotion) {
      const banner = document.getElementById('empowerBanner');
      const img = banner ? banner.querySelector('.empower-img') : null;
      const chips = document.querySelectorAll('.float-chip');
      let ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          const y = window.scrollY;
          if (img && banner) {
            const rect = banner.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
              img.style.transform = 'scale(1.08) translateY(' + ((progress - 0.5) * 34).toFixed(1) + 'px)';
            }
          }
          if (y < window.innerHeight) {
            chips.forEach(function (chip, i) {
              chip.style.marginTop = (y * (0.03 + i * 0.012)).toFixed(1) + 'px';
            });
          }
          ticking = false;
        });
      }, { passive: true });
    }
  });
})();