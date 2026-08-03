// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // RSS·sitemap·canonical 링크의 절대 URL 기준. 반드시 '안정 주소'여야 한다.
  // 배포별 임시 주소(hyeon-blog-<해시>-....vercel.app)를 넣으면 링크가 옛 배포에 고정된다.
  // 나중에 커스텀 도메인을 붙이면 이 값만 바꾸면 된다.
  site: 'https://hyeon-blog.vercel.app',

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
