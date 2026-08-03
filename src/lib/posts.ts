import { getCollection, type CollectionEntry } from 'astro:content';

export const LANGS = ['ko', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'ko';

export type Post = CollectionEntry<'posts'>;

export interface PostRef {
  entry: Post;
  lang: Lang;
  /** ko/en 짝을 잇는 키. 파일 경로에서 파생되므로 어긋날 수 없다. */
  pairKey: string;
}

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** `ko/2026-08-10-foo` → { lang: 'ko', pairKey: '2026-08-10-foo' } */
export function splitId(id: string): { lang: Lang; pairKey: string } {
  const [head, ...rest] = id.split('/');
  if (!isLang(head) || rest.length === 0) {
    throw new Error(
      `글 파일은 posts/<ko|en>/<이름>.md 형태여야 합니다. 잘못된 위치: "${id}"`,
    );
  }
  return { lang: head, pairKey: rest.join('/') };
}

/**
 * 발행 대상 글 목록. 개발 서버에서는 draft도 보이고, 프로덕션 빌드에서는 빠진다.
 * 최신순 정렬.
 */
export async function getPosts(lang?: Lang): Promise<PostRef[]> {
  const showDrafts = import.meta.env.DEV;
  const entries = await getCollection('posts', ({ data }) => showDrafts || !data.draft);

  return entries
    .map((entry) => ({ entry, ...splitId(entry.id) }))
    .filter((post) => (lang ? post.lang === lang : true))
    .sort((a, b) => b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf());
}

/** 같은 글의 다른 언어 판본을 찾는다. 없으면 null. */
export async function findTranslation(post: PostRef): Promise<PostRef | null> {
  const other: Lang = post.lang === 'ko' ? 'en' : 'ko';
  const candidates = await getPosts(other);
  return candidates.find((p) => p.pairKey === post.pairKey) ?? null;
}

export const UI = {
  ko: {
    siteTitle: '하성현',
    tagline: '산업공학, 데이터, 그리고 직접 해본 것들',
    readMore: '읽기',
    sources: '출처',
    evidence: '이 글의 근거',
    published: '발행',
    updated: '수정',
    draftBadge: '초안',
    otherLang: 'English',
    noPosts: '아직 발행된 글이 없습니다.',
    backToList: '← 글 목록',
  },
  en: {
    siteTitle: 'Seonghyeon Ha',
    tagline: 'Industrial engineering, data, and things I actually built',
    readMore: 'Read',
    sources: 'Sources',
    evidence: 'Evidence in this post',
    published: 'Published',
    updated: 'Updated',
    draftBadge: 'Draft',
    otherLang: '한국어',
    noPosts: 'No posts published yet.',
    backToList: '← All posts',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
