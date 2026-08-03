// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: Vercel 연결 후 실제 도메인으로 교체. RSS와 sitemap의 절대 URL에 쓰인다.
  site: 'https://example.com',

  i18n: {
    locales: ['ko', 'en'],
    defaultLocale: 'ko',
    routing: { prefixDefaultLocale: true },
  },

  redirects: {
    '/': '/ko/',
  },

  integrations: [react(), mdx(), sitemap()],
});
