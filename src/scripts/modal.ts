import { LABELS } from '../i18n/labels';
import type {
  Lang,
  ModalLabels,
  ProjectCopy,
  ProjectModalContent,
  ProjectModalPayload,
} from '../i18n/types';

/**
 * Project detail modal.
 *
 * The eight project entries are embedded at build time as JSON inside
 * `<script type="application/json" id="projects-data">` (written by
 * `ProjectModal.astro`). This module only reads that payload — no network
 * request, no client-side content duplication.
 */

let modalEl: HTMLElement | null = null;
let modalBody: HTMLElement | null = null;
let modalClose: HTMLButtonElement | null = null;
let lastFocus: HTMLElement | null = null;
let projects: ProjectModalPayload = {};
let flipPanel: HTMLElement | null = null;
let flipCard: HTMLElement | null = null;
let closing = false;
let running: Animation | null = null;
let openGeneration = 0;

/** Escapes text for safe interpolation into the modal markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Reads the language that `lang.ts` last applied to `<html>`. */
function currentLang(): Lang {
  return document.documentElement.lang === 'id' ? 'id' : 'en';
}

/** Parses the embedded `#projects-data` payload, tolerating malformed JSON. */
function readPayload(): ProjectModalPayload {
  const node = document.getElementById('projects-data');
  if (!node || !node.textContent) return {};
  try {
    const parsed: unknown = JSON.parse(node.textContent);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ProjectModalPayload;
  } catch {
    return {};
  }
}

/** Builds the inner HTML for one project entry. */
function renderProject(
  project: ProjectModalContent,
  copy: ProjectCopy,
  labels: ModalLabels,
): string {
  let html = '';
  html += '<span class="m-tag">' + esc(copy.tag) + '</span>';
  if (copy.status) {
    html += '<span class="m-status">' + esc(copy.status) + '</span>';
  }
  html += '<h3 class="m-title" id="modalTitle">' + esc(copy.title) + '</h3>';
  html += '<p class="m-sub">' + esc(copy.sub) + '</p>';
  html += '<div class="m-section"><h5>' + esc(labels.overview) + '</h5><p>' + esc(copy.overview) + '</p></div>';
  html += '<div class="m-section"><h5>' + esc(labels.challenge) + '</h5><p>' + esc(copy.challenge) + '</p></div>';
  html += '<div class="m-section"><h5>' + esc(labels.role) + '</h5><p>' + esc(copy.role) + '</p></div>';
  html += '<div class="m-section"><h5>' + esc(labels.features) + '</h5><ul class="m-list">';
  html += copy.features.map((feature) => '<li>' + esc(feature) + '</li>').join('');
  html += '</ul></div>';
  html += '<div class="m-section"><h5>' + esc(labels.tools) + '</h5><div class="chips">';
  html += project.tools.map((tool) => '<span class="chip">' + esc(tool) + '</span>').join('');
  html += '</div></div>';

  if (project.link && copy.linkText) {
    html +=
      '<a class="m-link" href="' +
      esc(project.link) +
      '" target="_blank" rel="noopener">' +
      esc(copy.linkText) +
      ' <span>↗</span></a>';
  }

  return html;
}

/** prefers-reduced-motion check (matches the original `reduce` guard). */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * FLIP geometry helper. `frame()` computes the card's viewport rect minus
 * the panel rect, so the panel can start exactly on top of the card and
 * animate to its resting position.
 */
function frame(panel: HTMLElement, card: HTMLElement): { x: number; y: number; scale: number } {
  const p = panel.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  // Clamp scale so a small card doesn't produce a giant start rectangle.
  const scale = Math.max(0.25, Math.min(1, c.width / p.width));
  return { x: c.left - p.left, y: c.top - p.top, scale };
}

/** Opens the modal for a project id (`data-project`), FLIP-animating from the clicked card. */
export function openProject(id: string | null, card?: HTMLElement | null): void {
  if (!id) return;

  // A close FLIP may still be in flight (user re-clicked a card within the
  // ~320ms reverse window): invalidate that close's teardown BEFORE
  // canceling it — the cancel event may fire synchronously, and `done()`
  // must see the new generation so it can't strip `.open` from this modal
  // or steal its focus.
  openGeneration += 1;
  if (running) {
    running.cancel();
    running = null;
  }
  closing = false;

  const project = projects[id];
  if (!project || !modalEl || !modalBody) return;

  const lang = currentLang();
  const copy: ProjectCopy = project[lang] ?? project.en;
  const labels: ModalLabels = LABELS[lang] ?? LABELS.en;

  modalBody.innerHTML = renderProject(project, copy, labels);
  modalBody.scrollTop = 0;

  const active = document.activeElement;
  lastFocus = active instanceof HTMLElement ? active : null;

  flipCard = card ?? null;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';

  // FLIP open: panel starts exactly on top of the card, flies to rest.
  if (flipPanel && flipCard && !prefersReducedMotion()) {
    // A finished reverse FLIP keeps its `fill:'both'` transform on the panel
    // — cancel it first so `frame()` measures the panel at rest.
    if (running) {
      running.cancel();
      running = null;
    }
    const { x, y, scale } = frame(flipPanel, flipCard);
    const from = { transform: `translate(${x}px, ${y}px) scale(${scale})` };
    const to = { transform: 'none' };
    running = flipPanel.animate([{ ...from, opacity: 0 }, { ...to, opacity: 1 }], {
      duration: 420,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'both',
    });
  }

  // rAF focus: two frames — the first paints, the second guarantees the
  // panel is laid out (and the FLIP won't steal focus back). Focusability
  // is computed from the last committed style, which lags the `visibility`
  // flip by a frame — so retry every frame until the focus has actually
  // taken, and only then stop polling.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      let frames = 0;
      const focusWhenVisible = (): void => {
        if (!modalEl || !modalClose || !modalEl.classList.contains('open')) return;
        if (modalEl.contains(document.activeElement)) return; // focus took
        modalClose.focus();
        frames += 1;
        if (frames > 120) return; // ~2s safety valve — never poll forever
        requestAnimationFrame(focusWhenVisible);
      };
      focusWhenVisible();
    });
  });
}

/** Closes the modal: reverse-FLIP back to the card when possible, focus returns to the card. */
export function closeModal(): void {
  if (!modalEl || closing) return;
  closing = true;

  // Cancel any in-flight open FLIP first: its fill:'both' would otherwise
  // still be applied while frame() measures the panel, sending the reverse
  // flight to a mid-air offset instead of the card.
  if (running) {
    running.cancel();
    running = null;
  }

  // Generation snapshot: if another project is opened while the reverse
  // flight runs, this close's teardown must not touch the new modal.
  const gen = openGeneration;

  const restoreFocus = (): void => {
    if (gen !== openGeneration) return;
    // Don't yank focus back if the user deliberately moved it elsewhere
    // (e.g. started tabbing the page) while the close flight ran.
    const active = document.activeElement;
    if (modalEl && !modalEl.contains(active) && active !== document.body) return;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    flipCard = null;
  };

  const finishClose = (): void => {
    modalEl?.classList.remove('open');
    modalEl?.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  };

  // If the card scrolled out of view (or motion is reduced / no card was
  // recorded), skip the reverse flight and close instantly.
  const canFly =
    flipPanel &&
    flipCard &&
    !prefersReducedMotion() &&
    flipCard.getBoundingClientRect().bottom > 0 &&
    flipCard.getBoundingClientRect().top < window.innerHeight;

  if (canFly && flipPanel && flipCard) {
    const { x, y, scale } = frame(flipPanel, flipCard);
    const to = { transform: `translate(${x}px, ${y}px) scale(${scale})` };
    const anim = flipPanel.animate([{ transform: 'none', opacity: 1 }, { ...to, opacity: 0 }], {
      duration: 320,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'both',
    });
    let settled = false;
    const done = (): void => {
      if (settled) return;
      settled = true;
      // `closing` stays true for the whole reverse flight so a queued
      // Escape/Enter can't re-enter mid-animation.
      closing = false;
      if (gen === openGeneration) {
        finishClose();
        restoreFocus();
        // Drop the fill:'both' end state so a later non-FLIP open (e.g.
        // reduced motion) doesn't inherit the reverse-flight transform.
        anim.cancel();
      }
    };
    anim.addEventListener('finish', done);
    anim.addEventListener('cancel', done);
    anim.finished.catch(() => {
      /* handled via the cancel listener */
    });
  } else {
    finishClose();
    restoreFocus();
    closing = false;
  }
}

/** Caches elements, loads the payload, and binds all modal triggers. */
export function initModal(): void {
  modalEl = document.getElementById('modal');
  modalBody = document.getElementById('modalBody');
  modalClose = document.getElementById('modalClose') as HTMLButtonElement | null;
  flipPanel = document.getElementById('modalPanel');

  if (!modalEl || !modalBody || !modalClose) return;

  projects = readPayload();

  const cards = Array.prototype.slice.call(
    document.querySelectorAll<HTMLElement>('.project-card'),
  ) as HTMLElement[];

  cards.forEach((card) => {
    card.addEventListener('click', (event: MouseEvent) => {
      flipCard = (event.currentTarget as HTMLElement) ?? null;
      openProject(card.getAttribute('data-project'), flipCard);
    });
    card.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flipCard = card;
        openProject(card.getAttribute('data-project'), card);
      }
    });
  });

  modalClose.addEventListener('click', closeModal);

  const closers = Array.prototype.slice.call(
    document.querySelectorAll<HTMLElement>('[data-close]'),
  ) as HTMLElement[];
  closers.forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    // Overlay guard: ignore keys while the close FLIP is in flight so a
    // queued Escape/Tab can't re-enter mid-animation.
    if (closing) return;

    // Focus trap — Tab cycles between the panel's focusable elements.
    if (event.key === 'Tab' && modalEl?.classList.contains('open')) {
      const focusables = (Array.prototype.slice.call(
        modalEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[]).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!modalEl.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    if (event.key === 'Escape' && modalEl && modalEl.classList.contains('open')) {
      closeModal();
    }
  });
}
