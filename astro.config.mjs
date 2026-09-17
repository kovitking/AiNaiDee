// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Baked into the build, not read at runtime: it goes into the sitemap and every
// absolute OG image URL. Changing the public origin means rebuilding.
// With the www: Imperva 308s the naked domain to www.ainaidee.com, so a page
// that canonicalizes to the apex points at a URL that never returns 200.
const site = process.env.SITE_URL || 'https://www.ainaidee.com';

// https://astro.build/config
export default defineConfig({
  site,
  adapter: node({ mode: 'standalone' }),
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // /design is the superseded standalone demo kept only as a reference —
      // near-duplicate of the real home page, excluded from `astro check`, and
      // carrying its own <head> with no GA tag. It also sends `noindex`.
      // /blog and /en/blog are now pure 301 redirects to blog.ainaidee.com
      // (see src/pages/blog/index.astro) — the sitemap integration lists SSR
      // routes too, not just prerendered ones, so without this filter a
      // redirecting URL would sit in the sitemap pointing Google at a 301.
      filter: (page) => {
        const path = new URL(page).pathname
        return !path.startsWith('/design') && path !== '/blog/' && path !== '/en/blog/'
      },
      i18n: {
        defaultLocale: 'th',
        locales: {
          th: 'th-TH',
          en: 'en-US',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es'
    }
  }
});
