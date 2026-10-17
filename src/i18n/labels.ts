import type { Lang, ModalLabels } from './types';

/**
 * Project modal section labels — copied verbatim from the original inline
 * `LABELS` object in index.html.
 */
export const LABELS: Record<Lang, ModalLabels> = {
  en: {
    overview: 'Overview',
    challenge: 'The challenge',
    role: 'My role',
    features: 'Key features',
    tools: 'Tools',
  },
  id: {
    overview: 'Ringkasan',
    challenge: 'Tantangan',
    role: 'Peran saya',
    features: 'Fitur utama',
    tools: 'Alat & teknologi',
  },
};

/** Language used when nothing is stored yet (matches `<html lang="en">`). */
export const DEFAULT_LANG: Lang = 'en';

/** localStorage key for the persisted language preference. */
export const STORAGE_KEY = 'portfolio-lang';

/** Narrow an arbitrary string to a supported `Lang`. */
export function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'id';
}
