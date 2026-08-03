# hyeon-blog

프로젝트 결과물을 모아 남기는 개인 아카이브. Astro + GitHub + Vercel, 한국어 원본 / 영어 번역.

## 왜

프로젝트를 끝내면 결과물이 흩어진다. 코드는 저장소에, 분석은 노트북 어딘가에,
"왜 그렇게 결정했는지"는 머릿속에만 남는다. 반년 뒤에 다시 열어보면 코드는 그대로인데
판단의 근거가 사라져 있다.

이 저장소는 그걸 한 곳에 남기기 위한 아카이브다.

**수집과 정리는 자동화한다. 쓰는 것은 자동화하지 않는다.**
자동으로 채워진 아카이브는 나중에 믿을 수 없기 때문이다. 반년 뒤에 그 기록이 내 판단인지
모델이 만든 문장인지 구분할 수 없다면, 편수가 아무리 많아도 아카이브로서는 실패다.

그래서 이 저장소에는 **자동 발행 경로가 존재하지 않는다.** 글은 PR로만 들어오고,
품질 게이트 8종을 통과해야 하며, 머지는 사람이 한다.

게이트가 강제하는 것은 문체가 아니라 **나중에 다시 읽었을 때 쓸모 있는 기록의 최소 조건**이다.
실제 산출물(`evidence`), 그때 내가 내린 판단(분석 블록), 그리고 매번 같은 틀로 찍어내지
않았다는 것.

## 명령어

```bash
npm run dev       # 개발 서버 (초안도 보임)
npm run gate      # 품질 게이트 8종
npm run build     # 프로덕션 빌드 (초안 제외)
npm run verify    # 게이트 + 빌드, 링크 검사 생략
```

## 글 쓰는 법

파일 위치가 곧 메타데이터다. `lang`과 짝 키를 프런트매터에 중복해서 적지 않는다.

```
src/content/posts/ko/2026-08-10-무언가.md   ← 원본
src/content/posts/en/2026-08-10-무언가.md   ← 번역 (같은 파일명)
```

프런트매터:

```yaml
---
title: 제목
description: 한 문장 요약
pubDate: 2026-08-10
tags: [태그]
draft: true
evidence:                       # 최소 1개. 없으면 빌드 실패.
  - type: chart                 # chart | screenshot | dataset | measurement | code
    ref: public/evidence/x.png  # 저장소 루트 기준. 실제로 존재해야 함.
    note: 왜 이게 나만 낼 수 있는 증거인지
sources:                        # 최소 1개
  - https://example.com/출처
---
```

본문에는 1인칭 분석 블록이 있어야 한다. 실질 400자 이상.

```markdown
<!-- analysis:start -->
조사한 내용이 아니라 내가 내린 판단.
<!-- analysis:end -->
```

`.mdx` 파일이라면 `{/* analysis:start */}` 형태를 쓴다.

## 품질 게이트

| # | 검사 | 실패 시 |
| --- | --- | --- |
| 1 | `evidence` 최소 1개 + 참조 파일 실재 | 차단 |
| 2 | `sources` 최소 1개 + 링크 응답 확인 | 차단 |
| 3 | 분석 블록 400자 이상 | 차단 |
| 4 | 직전 5편과 H2 골격 유사도 70% 초과 | 차단 |
| 5 | LLM 상투어 (`scripts/cliches.json`) | 차단 |
| 6 | 영어판에 대응하는 한국어 원본 존재 + 원본이 발행됨 | 차단 |
| 7 | 이미지 대체 텍스트 | 차단 |
| 8 | 7일간 2편 초과 | 경고 |

검사 대상은 `draft: false`인 글뿐이다. 초안은 건너뛴다 —
`draft`를 false로 바꾸는 것 자체가 다시 PR이고, 그때 게이트를 다시 통과해야 한다.

기준값은 `scripts/quality-gate.mjs` 상단 `CONFIG`에서 조정한다.
단, **검사에 걸렸을 때 기준값을 낮추는 건 우회다.** 글을 고쳐야 한다.

## 발행 흐름

```
OpenClaw ──→ draft/<slug> ──→ PR ──→ Vercel Preview
                               │
                        CI 품질 게이트
                               │
                    ❌ 실패 → 사유 알림
                    ✅ 통과 → PR 요약 알림
                               │
                     사람이 Preview 확인 후 머지
                               │
                        main → 프로덕션
```

머지가 곧 발행이고, 머지는 사람만 한다.

## 디렉토리

```
src/content/posts/{ko,en}/   발행되는 글. 사람이 쓴 문장만.
content/_research/           OpenClaw의 리서치 노트. 빌드 범위 밖. 절대 렌더링 안 됨.
scripts/quality-gate.mjs     게이트 8종
scripts/cliches.json         상투어 목록 — 이게 곧 '내 문체'의 정의
openclaw/RULES.md            에이전트 금지 항목 + 권한 설정
openclaw/HEARTBEAT.md        에이전트 스케줄 작업
docs/specs/                  설계 기록
```

## 남은 설정 (계정 작업)

`docs/specs/2026-08-03-blog-design.md`의 마지막 절 참조.
GitHub 저장소 생성, branch protection, Vercel 연결, PAT 발급, `astro.config.mjs`의 `site` 교체.
