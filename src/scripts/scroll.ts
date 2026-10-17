/**
 * Scroll layer: sticky nav state, reading progress, scrollspy, hero/contact
 * parallax and the scroll-velocity marquee. Ported 1:1 from the original
 * inline script, including the `ticking` rAF guard.
 */

/** Matches the original `reduce` guard. */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Query all matching elements as a real array. */
function all<T extends Element>(selector: string): T[] {
  return Array.prototype.slice.call(document.querySelectorAll(selector)) as T[];
}

/** Initialises every scroll-driven effect. */
export function initScroll(): void {
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const reduce = prefersReducedMotion();

  const heroBg = document.querySelector<HTMLElement>('.hero-bg');
  const heroInner = document.querySelector<HTMLElement>('.hero-inner');
  const cue = document.querySelector<HTMLElement>('.scroll-cue');
  const contactGlow = document.querySelector<HTMLElement>('.contact-glow');
  const contactSection = document.getElementById('contact');
  const marqueeTrack = document.querySelector<HTMLElement>('.marquee-track');

  const navLinks = all<HTMLAnchorElement>('.nav-links a');
  const sectionEls = all<HTMLElement>('main section[id]');

  let marqueeDur = 38;
  let marqueeApplied = 38;
  let lastScrollY = window.scrollY || 0;

  const onScroll = (): void => {
    const y = window.scrollY || document.documentElement.scrollTop;

    if (nav) nav.classList.toggle('scrolled', y > 24);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }

    const spyY = y + window.innerHeight * 0.38;
    let current = sectionEls.length > 0 ? sectionEls[0].id : '';
    for (let i = 0; i < sectionEls.length; i += 1) {
      if (sectionEls[i].offsetTop <= spyY) current = sectionEls[i].id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });

    if (reduce) return;

    if (cue) {
      const cueOpacity = Math.max(0, 1 - y / 220);
      cue.style.opacity = cueOpacity.toFixed(3);
      cue.style.pointerEvents = cueOpacity < 0.1 ? 'none' : '';
    }

    const wide = window.innerWidth > 900;

    if (heroBg && wide) {
      heroBg.style.transform = 'translateY(' + (y * 0.3).toFixed(1) + 'px)';
    }

    if (heroInner) {
      heroInner.style.transform = wide ? 'translateY(' + (y * 0.1).toFixed(1) + 'px)' : '';
      heroInner.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.85)).toFixed(3);
    }

    if (contactGlow && contactSection && wide) {
      const top = contactSection.offsetTop;
      const raw =
        (y + window.innerHeight - top) / (window.innerHeight + contactSection.offsetHeight);
      const ratio = Math.max(0, Math.min(1, raw));
      contactGlow.style.transform =
        'translateX(-50%) translateY(' + ((ratio - 0.5) * -70).toFixed(1) + 'px)';
    }

    if (marqueeTrack) {
      const velocity = Math.abs(y - lastScrollY);
      if (velocity > 0) marqueeDur = Math.max(9, Math.min(marqueeDur, 38 - velocity * 1.5));
    }

    lastScrollY = y;
  };

  let ticking = false;
  const onScrollRaf = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onScroll();
    });
  };

  window.addEventListener('scroll', onScrollRaf, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (marqueeTrack && !reduce) {
    const marqueeLoop = (): void => {
      marqueeDur += (38 - marqueeDur) * 0.03;
      if (Math.abs(marqueeDur - marqueeApplied) > 0.05) {
        marqueeApplied = marqueeDur;
        marqueeTrack.style.animationDuration = marqueeDur.toFixed(2) + 's';
      }
      requestAnimationFrame(marqueeLoop);
    };
    marqueeLoop();
  }
}
