// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://topolia.fr',
  output: 'static',
  adapter: netlify(),
  integrations: [mdx(), sitemap(), clerk()],
  redirects: {
    // L'article 2 scanners a été réécrit en comparatif 3 scanners (juin 2026).
    '/articles/rtc360-vs-faro-focus': '/articles/rtc360-vs-faro-focus-vs-trimble-x9',
  },
});
