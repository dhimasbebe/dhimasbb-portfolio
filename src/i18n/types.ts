/**
 * Shared i18n types for the single-URL language toggle.
 *
 * Every translatable string in the content collections is a `Bilingual`, and
 * every translatable node in the DOM carries `data-en` / `data-id` attributes.
 */

/** The two languages the site renders. */
export type Lang = 'en' | 'id';

/** A string that exists in both site languages. */
export interface Bilingual {
  en: string;
  id: string;
}

/** Labels for the project modal sections, per language. */
export interface ModalLabels {
  overview: string;
  challenge: string;
  role: string;
  features: string;
  tools: string;
}

/** Modal copy for one language. */
export interface ProjectCopy {
  tag: string;
  status: string;
  title: string;
  sub: string;
  overview: string;
  challenge: string;
  role: string;
  features: string[];
  linkText: string;
}

/** One project's modal content, keyed by the project id in the payload. */
export interface ProjectModalContent {
  tools: string[];
  link: string;
  en: ProjectCopy;
  id: ProjectCopy;
}

/**
 * The `#projects-data` JSON payload: a map of project id → modal content.
 *
 * A map is used rather than a flat array because each entry needs both a
 * project id and the Indonesian copy under the key `id` — two properties that
 * cannot coexist on one object literal. The map shape is also exactly what the
 * original `PROJECTS` object looked like at runtime.
 */
export type ProjectModalPayload = Record<string, ProjectModalContent>;
