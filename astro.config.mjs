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
});
