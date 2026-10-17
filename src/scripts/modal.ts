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

/** Opens the modal for a project id (`data-project`). */
export function openProject(id: string | null): void {
  if (!id) return;
  const project = projects[id];
  if (!project || !modalEl || !modalBody) return;

  const lang = currentLang();
  const copy: ProjectCopy = project[lang] ?? project.en;
  const labels: ModalLabels = LABELS[lang] ?? LABELS.en;

  modalBody.innerHTML = renderProject(project, copy, labels);
  modalBody.scrollTop = 0;

  const active = document.activeElement;
  lastFocus = active instanceof HTMLElement ? active : null;

  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';

  window.setTimeout(() => {
    if (modalClose) modalClose.focus();
  }, 60);
}

/** Closes the modal and restores focus to the card that opened it. */
export function closeModal(): void {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/** Caches elements, loads the payload, and binds all modal triggers. */
export function initModal(): void {
  modalEl = document.getElementById('modal');
  modalBody = document.getElementById('modalBody');
  modalClose = document.getElementById('modalClose') as HTMLButtonElement | null;

  if (!modalEl || !modalBody || !modalClose) return;

  projects = readPayload();

  const cards = Array.prototype.slice.call(
    document.querySelectorAll<HTMLElement>('.project-card'),
  ) as HTMLElement[];

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      openProject(card.getAttribute('data-project'));
    });
    card.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProject(card.getAttribute('data-project'));
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
    if (event.key === 'Escape' && modalEl && modalEl.classList.contains('open')) {
      closeModal();
    }
  });
}
