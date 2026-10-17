import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content collections for the portfolio.
 *
 * Every bilingual string is stored as `{ en, id }` and rendered at build time
 * as `<span data-en="…" data-id="…">EN</span>`, which the single-URL language
 * toggle in `src/scripts/lang.ts` swaps at runtime.
 */

/** A string that exists in both site languages. */
const bilingual = z.object({
  en: z.string(),
  id: z.string(),
});

/** A section heading block (label + title, optional intro paragraph). */
const sectionHead = z.object({
  label: z.string(),
  title: bilingual,
  intro: bilingual.optional(),
});

const site = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/site' }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
      ogImage: z.string(),
      locale: z.string(),
    }),
    nav: z.array(
      z.object({
        href: z.string(),
        label: bilingual,
      }),
    ),
    brand: z.object({
      mark: z.string(),
      name: z.string(),
      ariaLabel: z.string(),
    }),
    cv: z.object({
      label: bilingual,
      href: z.string(),
    }),
    hero: z.object({
      eyebrow: z.string(),
      titleLines: z.array(
        z.object({
          text: bilingual,
          accent: z.boolean(),
        }),
      ),
      sub: bilingual,
      primaryCta: z.object({ label: bilingual, href: z.string() }),
      stats: z.array(
        z.object({
          value: z.number().int(),
          suffix: z.string(),
          label: bilingual,
        }),
      ),
      scrollCueLabel: z.string(),
    }),
    marquee: z.array(z.string()),
    sections: z.object({
      about: sectionHead,
      experience: sectionHead,
      education: sectionHead,
      projects: sectionHead,
      publications: sectionHead,
      contact: sectionHead,
    }),
    about: z.object({
      paragraphs: z.array(bilingual),
      duties: z.array(
        z.object({
          num: z.string(),
          title: bilingual,
          body: bilingual,
        }),
      ),
      toolboxLabel: bilingual,
      chips: z.array(z.string()),
    }),
    education: z.object({
      columnLabel: bilingual,
      certificationLabel: bilingual,
    }),
    contact: z.object({
      email: z.string(),
      linkedin: z.string(),
      whatsapp: z.string(),
      emailLabel: bilingual,
      mailLink: z.string(),
    }),
    footer: z.object({
      copyright: z.string(),
      backToTop: bilingual,
    }),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/experience' }),
  schema: z.object({
    order: z.number().int(),
    tag: bilingual,
    period: z.string(),
    role: z.string(),
    company: z.string(),
    points: z.array(bilingual),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/education' }),
  schema: z.object({
    order: z.number().int(),
    institution: z.string(),
    meta: bilingual,
    note: bilingual,
    year: z.string().optional(),
  }),
});

const certifications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/certifications' }),
  schema: z.object({
    order: z.number().int(),
    name: z.string(),
    issuer: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    order: z.number().int(),
    /** Card title (bilingual only for the e-commerce project). */
    title: bilingual,
    /** Card-only copy — deliberately different from the modal copy below. */
    card: z.object({
      ariaLabel: z.string(),
      tag: bilingual,
      desc: bilingual,
      chips: z.array(bilingual),
    }),
    /** Tool chips shown in the modal. */
    tools: z.array(z.string()),
    /** Optional external link opened from the modal. */
    link: z.string(),
    en: z.object({
      tag: z.string(),
      status: z.string(),
      title: z.string(),
      sub: z.string(),
      overview: z.string(),
      challenge: z.string(),
      role: z.string(),
      features: z.array(z.string()),
      linkText: z.string(),
    }),
    id: z.object({
      tag: z.string(),
      status: z.string(),
      title: z.string(),
      sub: z.string(),
      overview: z.string(),
      challenge: z.string(),
      role: z.string(),
      features: z.array(z.string()),
      linkText: z.string(),
    }),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/publications' }),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    journal: z.string(),
    href: z.string(),
  }),
});

export const collections = {
  site,
  experience,
  education,
  certifications,
  projects,
  publications,
};
