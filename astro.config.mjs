// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Astro configuration for the Dhimas Bintang Bagaskara portfolio.
 *
 * - `output: 'static'`  : pure static HTML, no server runtime required.
 * - `build.format: 'directory'` : `/` is emitted as `dist/index.html`.
 * - `@astrojs/sitemap`  : generates `sitemap-index.xml` at build time.
 */
export default defineConfig({
  site: 'https://dhimasbb.web.id',
  output: 'static',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [sitemap()],
  compressHTML: true,
});
