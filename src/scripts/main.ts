import { initProjectsCarousel } from './carousel';
import { initLang } from './lang';
import { initModal } from './modal';
import { initNav } from './nav';
import { initPointer } from './pointer';
import { initReveal } from './reveal';
import { initScroll } from './scroll';

/**
 * Entry point for all client behaviour.
 *
 * Order mirrors the original inline script: language first (so `data-en` nodes
 * are swapped before anything measures the DOM), then nav, scroll, reveal,
 * pointer and finally the modal wiring.
 */
function boot(): void {
  initLang();
  initNav();
  initScroll();
  initReveal();
  initPointer();
  initModal();
  initProjectsCarousel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
