/**
 * Scroll layer: sticky nav state, reading progress, scrollspy, hero/contact
 * parallax and the experience rail. Ported 1:1 from the original inline
 * script, including the `ticking` rAF guard.
 *
 * The marquee deliberately has NO scroll coupling: it runs as a plain CSS
 * animation (`scroll 38s linear infinite`) on the compositor, so page
 * scrolling never disturbs its motion.
 */

/** Matches the original `reduce` guard. */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Query all matching elements as a real array. */
function all<T extends Element>(selector: string): T[] {
  return Array.prototype.slice.call(document.querySelectorAll(selector)) as T[];
}

// Experience rail refs — cached at init, read by `updateExpRail()` on every
// scroll frame. Both must exist for the fill to move; `updateExpRail()`
// no-ops when either is missing (e.g. a page without the rail).
let railEl: HTMLElement | null = null;
let expEl: HTMLElement | null = null;

/**
 * Fills the experience rail in proportion to how far the experience list
 * has scrolled through the viewport. `scaleY` only — no layout thrash.
 */
function updateExpRail(): void {
  if (!expEl || !railEl) return;
  const rect = expEl.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 when the list top hits 55% of the viewport, 1 when its bottom passes 55%.
  const anchor = vh * 0.55;
  const p = Math.max(0, Math.min(1, (anchor - rect.top) / (rect.height + vh * 0.25)));
  railEl.style.transform = 'scaleY(' + p.toFixed(4) + ')';
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

  // Experience rail — the fill is scaleY-only and driven from onScroll.
  expEl = document.getElementById('experience');
  railEl = document.querySelector<HTMLElement>('.exp-rail-fill');

  const navLinks = all<HTMLAnchorElement>('.nav-links a');
  const sectionEls = all<HTMLElement>('main section[id]');

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

    updateExpRail();
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

  // The language toggle rewrites text nodes (layout is identical in practice,
  // but margins/scrollTop can shift) — re-measure the rail once the toggle
  // handler in `lang.ts` has run. Registered after `initLang()`, so this
  // listener fires second and sees the post-swap layout.
  all<HTMLButtonElement>('.lang button').forEach((button) => {
    button.addEventListener('click', () => {
      updateExpRail();
    });
  });
}
