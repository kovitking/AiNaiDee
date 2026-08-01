// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Baked into the build, not read at runtime: it goes into the sitemap and every
// absolute OG image URL. Changing the public origin means rebuilding.
const site = process.env.SITE_URL || 'https://ainaidee.com';

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
