// scripts/scrollReveal.js
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const overlay = document.getElementById('bg-overlay');
    if (overlay) {
      // ensure overlay has no transition during live scroll updates
      overlay.style.transition = 'none';
    }
    // Header shrink/fade: smooth, slightly delayed via CSS transition
    const heroHeader = document.querySelector('.hero-header');
    const heroInner = heroHeader ? heroHeader.querySelector('.hero-inner') : null;
    const maxScroll = Math.min(window.innerHeight * 0.45, 360);

    // build a pages list: hero first (if present) then each .slide
    const pages = [];
    if (heroHeader) pages.push(heroHeader);
    document.querySelectorAll('.slide').forEach((s) => pages.push(s));
    let latestScroll = 0;
    let ticking = false;

    function updateHero() {
      ticking = false;
      if (!heroInner) return;
      const s = Math.max(0, Math.min(1, latestScroll / maxScroll));
      const scale = 1 - s * 0.22; // shrink up to ~22%
      const opacity = 1 - s * 0.75; // fade to 25%
      heroInner.style.transform = `scale(${scale})`;
      heroInner.style.opacity = `${opacity}`;
    }

    function onScroll() {
      latestScroll = window.scrollY || window.pageYOffset;
      // toggle body scrolled class when user scrolls beyond a small threshold
      if ((window.scrollY || window.pageYOffset) > 10) document.body.classList.add('scrolled');
      else document.body.classList.remove('scrolled');

      // show fixed thumb2 when we're past the hero (page index >= 1)
      try {
        const idxNow = getCurrentPageIndex();
        if (idxNow >= 1) document.body.classList.add('show-thumb2');
        else document.body.classList.remove('show-thumb2');
      } catch (e) { /* ignore if pages not ready */ }

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHero);
      }
      // update gradient mix live
      updateBackgroundMix();
      // schedule snap check after user stops scrolling
      scheduleSnap();
    }

    // --- gradient transition and auto-snap behavior ---
    let snapTimer = null;
    function getCurrentPageIndex() {
      const y = window.scrollY || window.pageYOffset;
      for (let i = 0; i < pages.length; i++) {
        const top = pages[i].offsetTop;
        const nextTop = i + 1 < pages.length ? pages[i + 1].offsetTop : Infinity;
        if (y >= top && y < nextTop) return i;
      }
      return 0;
    }

    function updateBackgroundMix() {
      if (!overlay || pages.length === 0) return;
      const idx = getCurrentPageIndex();
      const page = pages[idx];
      const pageTop = page ? page.offsetTop : 0;
      const pageH = page ? page.offsetHeight || window.innerHeight : window.innerHeight;
      const progress = Math.max(0, Math.min(1, (latestScroll - pageTop) / pageH));
      overlay.style.transition = 'none';
      overlay.style.opacity = String(progress);
    }

    function scheduleSnap() {
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const y = window.scrollY || window.pageYOffset;
        const idx = getCurrentPageIndex();
        const page = pages[idx];
        const pageTop = page ? page.offsetTop : 0;
        const pageH = page ? page.offsetHeight || window.innerHeight : window.innerHeight;
        const progress = Math.max(0, Math.min(1, (y - pageTop) / pageH));

        let targetIndex = idx;
        if (progress >= 0.5 && idx + 1 < pages.length) targetIndex = idx + 1;
        // prepare overlay transition and body classes
        if (overlay) {
          overlay.style.transition = 'opacity 1200ms linear';
          // if target is beyond first page, darken; else transparent
          if (targetIndex >= 1) overlay.style.opacity = '1';
          else overlay.style.opacity = '0';

          const onEnd = (ev) => {
            if (ev.propertyName !== 'opacity') return;
            overlay.removeEventListener('transitionend', onEnd);
            if (targetIndex >= 1) {
              document.body.classList.add('bg-dark');
              document.body.classList.add('bg-dark-complete');
            } else {
              document.body.classList.remove('bg-dark');
              document.body.classList.remove('bg-dark-complete');
            }
          };
          overlay.addEventListener('transitionend', onEnd);
        } else {
          if (targetIndex >= 1) {
            document.body.classList.add('bg-dark');
            document.body.classList.add('bg-dark-complete');
          } else {
            document.body.classList.remove('bg-dark');
            document.body.classList.remove('bg-dark-complete');
          }
        }

        const targetTop = pages[targetIndex] ? pages[targetIndex].offsetTop : 0;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }, 220);
    }


    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      // recalc maxScroll on resize
      // (a slight delay so innerHeight is stable)
      setTimeout(() => {
        // no need to cancel scroll handler; just update value
      }, 120);
    });

    // ensure background mix is initialized and updated on resize
    updateBackgroundMix();
    window.addEventListener('resize', () => {
      updateBackgroundMix();
    });

    // initialize hero state
    updateHero();
    // initialize thumb2 visibility
    try {
      const idxNow = getCurrentPageIndex();
      if (idxNow >= 1) document.body.classList.add('show-thumb2');
      else document.body.classList.remove('show-thumb2');
    } catch (e) {}

    // transitionend listener: when background-color transition finishes,
    // add/remove a marker class so we can 'change color' after fade completes.
    (function() {
      const body = document.body;
      body.addEventListener('transitionend', (ev) => {
        if (ev.propertyName !== 'background-color') return;
        if (body.classList.contains('bg-dark')) body.classList.add('bg-dark-complete');
        else body.classList.remove('bg-dark-complete');
      });
    })();

    // IntersectionObserver to reveal images on scroll
    const slots = Array.from(document.querySelectorAll('.img-slot'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slot = entry.target;
            slot.classList.add('visible');
            // ensure the img is loaded before layout calc
            const img = slot.querySelector('img');
            if (img) {
              if (img.complete && img.naturalWidth) {
                if (window.__adjustRowHeights) window.__adjustRowHeights();
              } else {
                img.addEventListener('load', function onLoad() {
                  img.removeEventListener('load', onLoad);
                  if (window.__adjustRowHeights) window.__adjustRowHeights();
                });
              }
            }
            observer.unobserve(slot);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12,
      }
    );

    // mark all slots for lazy reveal and observe
    slots.forEach((s) => {
      observer.observe(s);
      // also ensure images are set to lazy if not already
      const img = s.querySelector('img');
      if (img && !img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    });
  });
})();
