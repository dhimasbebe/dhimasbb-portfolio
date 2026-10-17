/**
 * Reveal layer: scroll-triggered `.reveal` classes plus the hero counters.
 * Ported 1:1 from the original inline script — same IntersectionObserver
 * threshold and rootMargin, same easing curve for `countUp`.
 *
 * The counters are server-rendered with their final value (02+, 04, 02) so the
 * numbers stay meaningful without JavaScript. When JS runs, it takes ownership
 * of the element immediately and animates from 00 exactly like the original.
 */

/** Matches the original `reduce` guard. */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Query all matching elements as a real array. */
function all<T extends Element>(selector: string, ctx: ParentNode = document): T[] {
  return Array.prototype.slice.call(ctx.querySelectorAll(selector)) as T[];
}

/** Formats a counter value with the original two-digit padding plus suffix. */
function formatValue(value: number, el: Element): string {
  const suffix = el.getAttribute('data-suffix') || '';
  return String(value).padStart(2, '0') + suffix;
}

/** Animates one `[data-count]` element from 0 to its target. */
function countUp(el: HTMLElement): void {
  const target = parseInt(el.getAttribute('data-count') || '0', 10) || 0;

  if (prefersReducedMotion()) {
    el.textContent = formatValue(target, el);
    return;
  }

  const duration = 1500;
  let start: number | null = null;

  const frame = (now: number): void => {
    if (start === null) start = now;
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatValue(Math.round(target * eased), el);
    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

/** Starts every counter that has not run yet. */
function runCounters(scope: ParentNode): void {
  all<HTMLElement>('[data-count]', scope).forEach((el) => {
    if (!el.getAttribute('data-done')) {
      el.setAttribute('data-done', '1');
      countUp(el);
    }
  });
}

/** Initialises scroll reveals and the hero stat counters. */
export function initReveal(): void {
  const reduce = prefersReducedMotion();

  // Take ownership of the server-rendered numbers so the animation starts at 00.
  if (!reduce) {
    all<HTMLElement>('.hero-stats [data-count]').forEach((el) => {
      el.textContent = formatValue(0, el);
    });
  }

  window.setTimeout(() => {
    runCounters(document);
  }, 1100);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        runCounters(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
  );

  all<HTMLElement>('.reveal').forEach((el) => {
    observer.observe(el);
  });
}
