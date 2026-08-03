import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { LANGS, UI, getPosts, type Lang } from '../../lib/posts';

export async function getStaticPaths() {
  return LANGS.map((lang) => ({ params: { lang } }));
}

export async function GET(context: APIContext) {
  const lang = context.params.lang as Lang;
  const posts = await getPosts(lang);

  return rss({
    title: UI[lang].siteTitle,
    description: UI[lang].tagline,
    site: context.site!,
    items: posts.map(({ entry, pairKey }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/${lang}/posts/${pairKey}/`,
    })),
  });
}
