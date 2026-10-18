/**
 * Mobile project carousel: keeps the pagination dots in sync with the
 * snap position and lets dots jump to a card. Self-gating — safe to call
 * on every viewport (the desktop grid has no overflow, scroll never fires).
 */
export function initProjectsCarousel(): void {
  const grid = document.querySelector<HTMLElement>('.projects-grid');
  const dots = document.querySelector<HTMLElement>('.projects-dots');
  if (!grid || !dots) return;

  const buttons = Array.prototype.slice.call(
    dots.querySelectorAll<HTMLButtonElement>('button'),
  ) as HTMLButtonElement[];
  if (buttons.length === 0) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Card pitch: element width + grid gap (16px). Measured on demand. */
  const pitch = (): number => {
    const first = grid.firstElementChild as HTMLElement | null;
    if (!first) return 0;
    return first.getBoundingClientRect().width + 16;
  };

  const setActive = (index: number): void => {
    buttons.forEach((button, i) => {
      const on = i === index;
      button.classList.toggle('active', on);
      if (on) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };

  const activeIndex = (): number => {
    const step = pitch();
    if (step <= 0) return 0;
    return Math.max(0, Math.min(buttons.length - 1, Math.round(grid.scrollLeft / step)));
  };

  let ticking = false;
  grid.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setActive(activeIndex());
      });
    },
    { passive: true },
  );

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => {
      const card = grid.children[i] as HTMLElement | undefined;
      if (!card) return;
      // block:'nearest' avoids hijacking vertical scroll.
      card.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActive(i);
    });
  });

  // Keep dots honest on load and orientation change.
  const refresh = (): void => setActive(activeIndex());
  window.addEventListener('resize', refresh, { passive: true });
  refresh();
}
