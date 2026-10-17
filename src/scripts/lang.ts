import { DEFAULT_LANG, STORAGE_KEY, isLang } from '../i18n/labels';
import type { Lang } from '../i18n/types';
import { closeModal } from './modal';

/**
 * Single-URL language toggle.
 *
 * No `/id/` route exists: both languages ship in the same HTML, and switching
 * language rewrites the `textContent` of every `[data-en]` node from its
 * `data-en` / `data-id` attribute. Ported 1:1 from the original inline script.
 */

let current: Lang = DEFAULT_LANG;

/** Query all matching elements as a real array (no live NodeList). */
function all<T extends Element>(selector: string, ctx: ParentNode = document): T[] {
  return Array.prototype.slice.call(ctx.querySelectorAll(selector)) as T[];
}

/** Wraps every word of a section title in its own reveal span. */
export function splitTitles(): void {
  all<HTMLElement>('.sec-title, .contact-title').forEach((el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    el.innerHTML = text
      .split(' ')
      .map((word, index) => {
        const safe = word
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const delay = (index * 0.05).toFixed(2);
        return (
          '<span class="tw"><span class="tw-i" style="transition-delay:' +
          delay +
          's">' +
          safe +
          '</span></span>'
        );
      })
      .join(' ');
  });
}

/**
 * Applies a language to the document.
 *
 * @param lang Language to switch to.
 * @param save When true (default), persists the choice in localStorage.
 */
export function setLang(lang: Lang, save = true): void {
  current = lang;
  document.documentElement.lang = lang;

  all<HTMLElement>('[data-en]').forEach((el) => {
    const value = el.getAttribute('data-' + lang);
    if (value !== null) el.textContent = value;
  });

  all<HTMLButtonElement>('.lang button').forEach((button) => {
    const on = button.getAttribute('data-lang') === lang;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  splitTitles();

  if (save) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage can be blocked — the toggle still works for this session. */
    }
  }

  const modal = document.getElementById('modal');
  if (modal && modal.classList.contains('open')) closeModal();
}

/** Reads the stored preference, applies it, and wires the toggle buttons. */
export function initLang(): void {
  let saved: Lang = DEFAULT_LANG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) saved = stored;
  } catch {
    /* Ignore storage errors and fall back to the default language. */
  }

  setLang(saved, false);

  all<HTMLButtonElement>('.lang button').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.getAttribute('data-lang');
      if (isLang(next)) setLang(next);
    });
  });
}

/** The language currently applied to the document. */
export function getLang(): Lang {
  return current;
}
