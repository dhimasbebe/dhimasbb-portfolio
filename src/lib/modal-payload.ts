import type { ProjectModalPayload } from '../i18n/types';
import type { ProjectEntry } from './content';

/**
 * Builds the `#projects-data` payload consumed by `src/scripts/modal.ts`.
 *
 * Only modal copy is included — the shorter card copy (`card.*`) stays in the
 * markup and must never leak into the modal. Entries are keyed by the content
 * collection id, which is also the card's `data-project` value.
 */
export function buildModalPayload(projects: ProjectEntry[]): ProjectModalPayload {
  const payload: ProjectModalPayload = {};

  projects.forEach((entry) => {
    payload[entry.id] = {
      tools: [...entry.data.tools],
      link: entry.data.link,
      en: { ...entry.data.en, features: [...entry.data.en.features] },
      id: { ...entry.data.id, features: [...entry.data.id.features] },
    };
  });

  return payload;
}

/**
 * Serialises the modal payload for embedding inside a `<script type="application/json">`
 * block. `<` is escaped so a stray sequence can never close the script tag.
 */
export function serializeModalPayload(payload: ProjectModalPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
