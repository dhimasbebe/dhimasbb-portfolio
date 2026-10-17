import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * Build-time content accessors.
 *
 * Collections are sorted by their `order` field so the rendered order never
 * depends on the file system. All accessors fail loudly when content is
 * missing, which turns a broken CMS edit into a failed build instead of a
 * silently empty section.
 */

export type Profile = CollectionEntry<'site'>['data'];
export type ExperienceItem = CollectionEntry<'experience'>['data'];
export type EducationItem = CollectionEntry<'education'>['data'];
export type CertificationItem = CollectionEntry<'certifications'>['data'];
export type ProjectEntry = CollectionEntry<'projects'>;
export type ProjectItem = ProjectEntry['data'];
export type PublicationItem = CollectionEntry<'publications'>['data'];

/** Ascending sort helper for collections that expose an `order` field. */
function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

/** The single site profile entry (`src/content/site/profile.md`). */
export async function getProfile(): Promise<Profile> {
  const entry = await getEntry('site', 'profile');
  if (!entry) {
    throw new Error('Missing content entry: src/content/site/profile.md');
  }
  return entry.data;
}

/** Work experience, newest first as authored via `order`. */
export async function getExperience(): Promise<ExperienceItem[]> {
  const items = await getCollection('experience');
  return items.map((item) => item.data).sort(byOrder);
}

/** Education history. */
export async function getEducation(): Promise<EducationItem[]> {
  const items = await getCollection('education');
  return items.map((item) => item.data).sort(byOrder);
}

/** Certifications. */
export async function getCertifications(): Promise<CertificationItem[]> {
  const items = await getCollection('certifications');
  return items.map((item) => item.data).sort(byOrder);
}

/** Project entries, keeping the collection `id` (used as `data-project`). */
export async function getProjects(): Promise<ProjectEntry[]> {
  const items = await getCollection('projects');
  return items.sort((a, b) => a.data.order - b.data.order);
}

/** Peer-reviewed publications. */
export async function getPublications(): Promise<PublicationItem[]> {
  const items = await getCollection('publications');
  return items.map((item) => item.data).sort(byOrder);
}
