import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 고유 증거 — 이 글에만 있을 수 있는 것.
 * 내 데이터로 그린 차트, 내가 찍은 스크린샷, 내가 측정한 숫자, 내가 쓴 코드.
 *
 * 스키마에서 최소 1개를 강제한다. 없으면 빌드 자체가 실패한다.
 * 이 규칙 하나가 스팸 분류기와 사람 독자를 동시에 통과시킨다.
 */
const evidenceSchema = z.object({
  type: z.enum(['chart', 'screenshot', 'dataset', 'measurement', 'code']),
  /** 저장소 루트 기준 경로. 품질 게이트가 실제 존재 여부를 확인한다. */
  ref: z.string().min(1),
  /** 이게 왜 나만 낼 수 있는 증거인지 한 줄로. */
  note: z.string().min(1),
});

export const collections = {
  posts: defineCollection({
    // 경로가 곧 메타데이터다: posts/<lang>/<pairKey>.md
    // lang과 pairKey를 frontmatter에 중복해서 적지 않으므로 어긋날 수가 없다.
    loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
    schema: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      evidence: z.array(evidenceSchema).min(1),
      sources: z.array(z.string().url()).min(1),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(true),
    }),
  }),
};
