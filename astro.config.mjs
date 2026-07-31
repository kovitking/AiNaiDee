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
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es'
    }
  }
});
