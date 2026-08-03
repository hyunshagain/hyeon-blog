#!/usr/bin/env node
/**
 * 품질 게이트 — 발행 직전의 마지막 방어선.
 *
 * 아카이브의 가치는 편수가 아니라 신뢰성이다. 반년 뒤에 다시 읽었을 때 그 기록이
 * 실제로 내가 한 일이고 내가 내린 판단인지 확인할 수 있어야 한다.
 * 이 스크립트는 그 최소 조건을 CI 단계에서 강제한다. 하나라도 걸리면 머지가 막힌다.
 *
 * 검사 대상은 발행될 글(draft: false)뿐이다. 초안은 건너뛴다 —
 * draft를 false로 바꾸는 것 자체가 다시 PR이고, 그때 이 게이트를 다시 통과해야 한다.
 *
 *   실행:  npm run gate
 *   링크 검사 생략:  npm run gate -- --skip-links
 */

import { readdir, readFile, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POSTS_DIR = join(ROOT, 'src/content/posts');
const LANGS = ['ko', 'en'];

const CONFIG = {
  /** 1인칭 분석 블록의 최소 실질 글자 수. */
  minAnalysisChars: 400,
  /** 직전 글들과 H2 골격이 이 이상 겹치면 템플릿 재사용으로 본다. */
  maxHeadingSimilarity: 0.7,
  /** 몇 편 전까지 비교할지. */
  compareWindow: 5,
  /** H2가 이보다 적으면 유사도 검사가 무의미하므로 건너뛴다. */
  minHeadingsForSimilarity: 4,
  /** 7일간 이 편수를 넘으면 경고(차단은 아님). */
  maxPostsPer7Days: 2,
  linkTimeoutMs: 12_000,
  userAgent: 'hyeon-blog-quality-gate/1.0 (+link availability check)',
};

const ANALYSIS_RE =
  /(?:<!--\s*analysis:start\s*-->|\{\/\*\s*analysis:start\s*\*\/\})([\s\S]*?)(?:<!--\s*analysis:end\s*-->|\{\/\*\s*analysis:end\s*\*\/\})/;

// ─────────────────────────────── 유틸 ───────────────────────────────

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s);
const red = (s) => paint('31', s);
const yellow = (s) => paint('33', s);
const green = (s) => paint('32', s);
const dim = (s) => paint('2', s);

function stripCodeFences(md) {
  return md.replace(/^```[\s\S]*?^```/gm, '').replace(/^~~~[\s\S]*?^~~~/gm, '');
}

function normalizeHeading(text) {
  return text
    .toLowerCase()
    .replace(/[`*_~[\]()#:.,!?"'—–‘’“”-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractH2(md) {
  const out = [];
  for (const m of stripCodeFences(md).matchAll(/^##\s+(.+?)\s*$/gm)) {
    const h = normalizeHeading(m[1]);
    if (h) out.push(h);
  }
  return out;
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  for (const x of A) if (B.has(x)) intersection++;
  return intersection / (A.size + B.size - intersection);
}

/** 마크다운 문법을 걷어낸 실질 글자 수. */
function plainTextLength(md) {
  return stripCodeFences(md)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim().length;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────── 수집 ───────────────────────────────

async function collectPosts() {
  const posts = [];

  for (const lang of LANGS) {
    const dir = join(POSTS_DIR, lang);
    let files;
    try {
      files = await readdir(dir);
    } catch {
      continue; // 해당 언어 디렉토리가 아직 없을 수 있다.
    }

    for (const file of files.sort()) {
      if (!/\.mdx?$/.test(file)) continue;
      const path = join(dir, file);
      const raw = await readFile(path, 'utf8');
      const { data, content } = matter(raw);
      posts.push({
        lang,
        pairKey: file.replace(/\.mdx?$/, ''),
        relPath: relative(ROOT, path),
        data,
        body: content,
        pubDate: data.pubDate ? new Date(data.pubDate) : null,
        isDraft: data.draft !== false,
      });
    }
  }

  return posts;
}

// ─────────────────────────────── 검사 ───────────────────────────────

/** 1. 고유 증거가 실제로 존재하는 파일을 가리키는가 */
async function checkEvidence(post, fail) {
  const evidence = post.data.evidence;
  if (!Array.isArray(evidence) || evidence.length === 0) {
    fail('고유 증거(evidence)가 최소 1개 필요합니다. 내 데이터·스크린샷·측정값·코드 중 하나.');
    return;
  }
  for (const item of evidence) {
    if (!item?.ref) {
      fail('evidence 항목에 ref 경로가 없습니다.');
      continue;
    }
    if (!(await exists(join(ROOT, item.ref)))) {
      fail(`evidence 파일을 찾을 수 없습니다: ${item.ref} (저장소 루트 기준 경로여야 합니다)`);
    }
  }
}

/** 2. 출처 링크가 살아있는가 */
async function checkSources(post, fail, warn, skipLinks) {
  const sources = post.data.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    fail('출처(sources)가 최소 1개 필요합니다.');
    return;
  }
  if (skipLinks) return;

  for (const url of sources) {
    const status = await probe(url);
    if (status === 'dead') fail(`출처 링크가 죽었습니다: ${url}`);
    else if (status === 'blocked') warn(`출처 링크 확인 불가(봇 차단으로 보임): ${url}`);
    else if (status === 'error') warn(`출처 링크 접속 실패(네트워크 문제일 수 있음): ${url}`);
  }
}

async function probe(url) {
  const attempt = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.linkTimeoutMs);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': CONFIG.userAgent },
      });
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let status = await attempt('HEAD');
    // 많은 사이트가 HEAD를 막아둔다. GET으로 한 번 더.
    if ([403, 405, 501, 500].includes(status)) status = await attempt('GET');

    if (status === 404 || status === 410) return 'dead';
    if (status >= 400) return 'blocked';
    return 'ok';
  } catch {
    return 'error';
  }
}

/** 3. 1인칭 분석 블록이 충분한가 */
function checkAnalysis(post, fail) {
  // 코드 펜스 안의 사용법 예시가 진짜 분석 블록으로 오인되지 않도록 먼저 걷어낸다.
  const match = stripCodeFences(post.body).match(ANALYSIS_RE);
  if (!match) {
    fail(
      '1인칭 분석 블록이 없습니다. 본문 어딘가에 다음을 넣으세요:\n' +
        '        <!-- analysis:start --> ... 내 해석과 판단 ... <!-- analysis:end -->\n' +
        '        (.mdx 파일은 {/* analysis:start */} 형태)',
    );
    return;
  }
  const length = plainTextLength(match[1]);
  if (length < CONFIG.minAnalysisChars) {
    fail(
      `분석 블록이 너무 짧습니다: ${length}자 (최소 ${CONFIG.minAnalysisChars}자). ` +
        '조사한 내용 말고 내가 내린 판단을 쓰는 자리입니다.',
    );
  }
}

/** 4. 직전 글들과 뼈대가 똑같지 않은가 */
function checkHeadingSimilarity(post, published, fail) {
  const mine = extractH2(post.body);
  if (mine.length < CONFIG.minHeadingsForSimilarity) return;

  const earlier = published
    .filter((p) => p.lang === post.lang && p.relPath !== post.relPath)
    .filter((p) => p.pubDate && post.pubDate && p.pubDate < post.pubDate)
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, CONFIG.compareWindow);

  for (const other of earlier) {
    const theirs = extractH2(other.body);
    if (theirs.length < CONFIG.minHeadingsForSimilarity) continue;

    const score = jaccard(mine, theirs);
    if (score > CONFIG.maxHeadingSimilarity) {
      fail(
        `H2 골격이 이전 글과 ${(score * 100).toFixed(0)}% 겹칩니다 ` +
          `(기준 ${CONFIG.maxHeadingSimilarity * 100}%): ${other.relPath}\n` +
          '        LLM 초안은 매번 같은 뼈대를 만듭니다. 이게 스팸 분류기가 가장 먼저 잡는 신호입니다.',
      );
    }
  }
}

/** 5. LLM 상투어 */
function checkCliches(post, cliches, fail) {
  const haystack = stripCodeFences(post.body).toLowerCase();
  const hits = (cliches[post.lang] ?? []).filter((phrase) =>
    haystack.includes(phrase.toLowerCase()),
  );
  if (hits.length > 0) {
    fail(`LLM 상투어가 남아 있습니다: ${hits.map((h) => `"${h}"`).join(', ')}`);
  }
}

/** 6. 영어판은 한국어 원본 없이 존재할 수 없다 */
function checkPairing(post, all, fail) {
  if (post.lang !== 'en') return;

  const source = all.find((p) => p.lang === 'ko' && p.pairKey === post.pairKey);
  if (!source) {
    fail(
      `대응하는 한국어 원본이 없습니다: src/content/posts/ko/${post.pairKey}.md\n` +
        '        영어판은 번역이지 독립 발행물이 아닙니다. 원본 없는 영어 글은 발행되지 않습니다.',
    );
    return;
  }
  if (source.isDraft) {
    fail(`한국어 원본이 아직 초안입니다. 원본이 발행된 뒤에 번역을 발행하세요: ${source.relPath}`);
  }
}

/** 7. 이미지 대체 텍스트 */
function checkImageAlt(post, fail) {
  const src = stripCodeFences(post.body);
  const problems = [];

  for (const m of src.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (!m[1].trim()) problems.push(m[2]);
  }
  for (const m of src.matchAll(/<img\b[^>]*>/gi)) {
    const alt = m[0].match(/\balt\s*=\s*["']([^"']*)["']/i);
    if (!alt || !alt[1].trim()) problems.push(m[0].slice(0, 70));
  }

  for (const p of problems) {
    fail(`이미지에 대체 텍스트가 없습니다: ${p}`);
  }
}

/** 8. 발행 속도 (경고만) */
function checkCadence(published, warn) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = published.filter(
    (p) => p.lang === 'ko' && p.pubDate && p.pubDate.getTime() >= weekAgo,
  );
  if (recent.length > CONFIG.maxPostsPer7Days) {
    warn(
      `최근 7일간 ${recent.length}편 발행 예정입니다 (권장 ${CONFIG.maxPostsPer7Days}편 이하). ` +
        '속도가 곧 스팸 신호입니다. 주 1편이 목표였다는 걸 기억하세요.',
    );
  }
}

// ─────────────────────────────── 실행 ───────────────────────────────

async function main() {
  const skipLinks = process.argv.includes('--skip-links');

  const cliches = JSON.parse(await readFile(join(ROOT, 'scripts/cliches.json'), 'utf8'));
  const all = await collectPosts();
  const published = all.filter((p) => !p.isDraft);

  console.log(
    `\n품질 게이트 — 전체 ${all.length}편 중 발행 대상 ${published.length}편 검사` +
      (skipLinks ? dim(' (링크 검사 생략)') : '') +
      '\n',
  );

  const errors = [];
  const warnings = [];

  for (const post of all) {
    if (post.isDraft) {
      console.log(`${dim('○')} ${post.relPath} ${dim('— 초안, 건너뜀')}`);
      continue;
    }

    const local = { errors: [], warnings: [] };
    const fail = (msg) => local.errors.push(msg);
    const warn = (msg) => local.warnings.push(msg);

    await checkEvidence(post, fail);
    await checkSources(post, fail, warn, skipLinks);
    checkAnalysis(post, fail);
    checkHeadingSimilarity(post, published, fail);
    checkCliches(post, cliches, fail);
    checkPairing(post, all, fail);
    checkImageAlt(post, fail);

    const mark = local.errors.length > 0 ? red('✗') : local.warnings.length > 0 ? yellow('!') : green('✓');
    console.log(`${mark} ${post.relPath}`);
    for (const e of local.errors) console.log(`    ${red('✗')} ${e}`);
    for (const w of local.warnings) console.log(`    ${yellow('!')} ${w}`);

    errors.push(...local.errors.map((e) => `${post.relPath}: ${e}`));
    warnings.push(...local.warnings.map((w) => `${post.relPath}: ${w}`));
  }

  const cadenceWarnings = [];
  checkCadence(published, (msg) => cadenceWarnings.push(msg));
  for (const w of cadenceWarnings) console.log(`\n${yellow('!')} ${w}`);
  warnings.push(...cadenceWarnings);

  console.log('');
  if (errors.length > 0) {
    console.log(red(`실패: ${errors.length}건 차단, ${warnings.length}건 경고\n`));
    process.exit(1);
  }
  console.log(green(`통과: 차단 0건, 경고 ${warnings.length}건\n`));
}

main().catch((err) => {
  console.error(red('\n품질 게이트 실행 중 오류:'), err);
  process.exit(1);
});
