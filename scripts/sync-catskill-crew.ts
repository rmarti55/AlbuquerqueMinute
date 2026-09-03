#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASE = 'https://catskillcrew.beehiiv.com';
const ROOT = join(process.cwd(), 'data', 'catskill-crew');
const ISSUES_DIR = join(ROOT, 'issues');
const META_DIR = join(ROOT, 'meta');
const USER_AGENT = 'Mozilla/5.0 (compatible; CatskillCrewArchiver/1.0)';
const DELAY_MS = 300;

const STOP_MARKERS = [
  'Keep Reading',
  'View more',
  'Sign in to comment',
  'Leave a comment',
  'Recommended reading',
  'SUBSCRIBEPARTNERCONTRIBUTE',
];

type ArchivePost = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  author: string | null;
};

type IssueRecord = {
  id: string;
  title: string;
  slug: string;
  edition: number;
  published_at: string;
  author: string | null;
  source_url: string;
  word_count: number;
  sections: string[];
  image_urls: string[];
  tags: string[];
  file: string;
  status: 'ok' | 'error';
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(url: string): string {
  return execSync(`curl -sS -A ${JSON.stringify(USER_AGENT)} ${JSON.stringify(url)}`, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function htmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, '');

  text = decodeHtml(text).replace(/\r/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n[ \t]+/g, '\n');
  return text.trim();
}

function extractContentChunk(html: string): string {
  const start = html.indexOf('dream-post-content-doc');
  if (start === -1) return html;

  let chunk = html.slice(start);
  for (const marker of STOP_MARKERS) {
    const idx = chunk.indexOf(marker);
    if (idx !== -1) chunk = chunk.slice(0, idx);
  }
  return chunk;
}

function extractSections(chunk: string): string[] {
  const sections: string[] = [];
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(chunk)) !== null) {
    const heading = htmlToText(match[1]).trim();
    if (heading && !sections.includes(heading)) sections.push(heading);
  }
  return sections;
}

function extractImageUrls(chunk: string): string[] {
  const urls = new Set<string>();
  const patterns = [
    /(?:src|href)=["']([^"']+\.(?:png|jpe?g|gif|webp|svg)[^"']*)["']/gi,
    /https?:\/\/media\d*\.giphy\.com\/[^\s"']+/gi,
    /https?:\/\/media\.beehiiv\.com\/[^\s"']+/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(chunk)) !== null) {
      const url = decodeHtml(match[1] ?? match[0]).replace(/&amp;/g, '&');
      if (url.startsWith('http')) urls.add(url);
    }
  }

  return [...urls];
}

function extractMeta(html: string) {
  let title: string | null = null;
  const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (ogMatch) title = decodeHtml(ogMatch[1].trim());
  else if (titleMatch) title = decodeHtml(titleMatch[1].trim());

  const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]+)"/i);
  const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);

  return {
    title,
    author: authorMatch ? decodeHtml(authorMatch[1].trim()) : null,
    publishedAt: timeMatch?.[1] ?? null,
  };
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function yamlEscape(value: string): string {
  if (/[:#\[\]{}|>&*!%@`'",]/.test(value) || value.includes('\n')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

function yamlList(values: string[]): string {
  if (values.length === 0) return '  []';
  return values.map((v) => `  - ${yamlEscape(v)}`).join('\n');
}

function formatIssueFile(record: IssueRecord, body: string): string {
  const frontmatter = [
    '---',
    `id: ${record.id}`,
    `title: ${yamlEscape(record.title)}`,
    `slug: ${record.slug}`,
    `edition: ${record.edition}`,
    `published_at: ${record.published_at}`,
    `author: ${record.author ? yamlEscape(record.author) : 'null'}`,
    `source_url: ${record.source_url}`,
    `word_count: ${record.word_count}`,
    'sections:',
    yamlList(record.sections),
    'image_urls:',
    yamlList(record.image_urls),
    'tags:',
    yamlList(record.tags),
    '---',
    '',
    body,
    '',
  ].join('\n');

  return frontmatter;
}

function issuePath(post: ArchivePost, edition: number): string {
  const date = post.publishedAt.slice(0, 10);
  const year = date.slice(0, 4);
  return join('issues', year, `${date}-${post.slug}.md`);
}

async function fetchArchivePosts(): Promise<ArchivePost[]> {
  const bySlug = new Map<string, ArchivePost>();
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page++) {
    const url = `${BASE}/archive?page=${page}&_data=routes%2Farchive`;
    const data = JSON.parse(fetchText(url)) as {
      page: {
        viewable_page_version: {
          content: { content: Array<{ content?: Array<{ type?: string; attrs?: { data?: { posts?: Array<Record<string, unknown>>; pagination?: { total_pages?: number } } } }> }> };
        };
      };
    };

    const sections = data.page.viewable_page_version.content.content;
    for (const section of sections) {
      for (const block of section.content ?? []) {
        if (block.type !== 'post' || !block.attrs?.data?.posts) continue;
        const pagination = block.attrs.data.pagination;
        if (pagination?.total_pages) totalPages = pagination.total_pages;

        for (const raw of block.attrs.data.posts) {
          const slug = String(raw.slug ?? '');
          if (!slug || bySlug.has(slug)) continue;
          const authors = (raw.authors as Array<{ name?: string }> | undefined) ?? [];
          bySlug.set(slug, {
            id: String(raw.id ?? ''),
            title: String(raw.web_title ?? ''),
            slug,
            publishedAt: String(raw.scheduled_at ?? raw.override_scheduled_at ?? ''),
            author: authors[0]?.name ?? null,
          });
        }
      }
    }

    console.log(`Archive page ${page}/${totalPages}: ${bySlug.size} posts collected`);
    await sleep(DELAY_MS);
  }

  return [...bySlug.values()].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );
}

function buildCatalogMd(issues: IssueRecord[]): string {
  const lines = [
    '# Catskill Crew Corpus Catalog',
    '',
    `Total issues: **${issues.length}**`,
    '',
    '| # | Date | Title | Slug | Words | File |',
    '|---|------|-------|------|-------|------|',
  ];

  for (const issue of issues) {
    const date = issue.published_at.slice(0, 10);
    const title = issue.title.replace(/\|/g, '\\|');
    lines.push(
      `| ${issue.edition} | ${date} | ${title} | ${issue.slug} | ${issue.word_count} | [${issue.file}](${issue.file}) |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

function buildReadme(issues: IssueRecord[]): string {
  const first = issues[0];
  const last = issues[issues.length - 1];
  return `# Catskill Crew Research Corpus

Local archive of public Catskill Crew newsletter issues for competitive analysis and editorial research in Cursor.

## Contents

- \`catalog.md\` — scannable index of all issues (start here)
- \`catalog.json\` — machine-readable index
- \`issues/YYYY/YYYY-MM-DD-slug.md\` — one file per issue with YAML frontmatter
- \`meta/stats.json\` — corpus statistics
- \`meta/fetch-log.json\` — last sync run details

## Corpus

- **Issues:** ${issues.length}
- **Date range:** ${first?.published_at.slice(0, 10) ?? '?'} → ${last?.published_at.slice(0, 10) ?? '?'}
- **First edition:** \`${first?.file ?? ''}\`
- **Latest edition:** \`${last?.file ?? ''}\`

## Using in Cursor

Reference these paths in chat:

- \`@data/catskill-crew/catalog.md\` — overview and navigation
- \`@data/catskill-crew/issues/2024/\` — analyze a specific year
- \`@data/catskill-crew/issues/2023/2023-11-27-catskill-crew-newsletter-b178.md\` — first edition baseline

### Example prompts

- Analyze recurring editorial formats across \`@data/catskill-crew/catalog.md\`
- Compare voice and tone in the first 10 vs last 10 issues
- Extract event-listing patterns from 2024 issues
- What monetization or partner blocks does Catskill Crew use?
- How did section structure evolve from 2023 to 2026?

## Sync

\`\`\`bash
npm run sync:catskill-crew
\`\`\`

Re-running is safe; it refreshes all issue files and catalogs.
`;
}

function removeLegacyFlatFiles() {
  for (const name of readdirSync(ROOT)) {
    if (name.endsWith('.md') && name !== 'catalog.md' && name !== 'README.md') {
      rmSync(join(ROOT, name));
    }
    if (name === 'index.json') {
      rmSync(join(ROOT, name));
    }
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  mkdirSync(ISSUES_DIR, { recursive: true });
  mkdirSync(META_DIR, { recursive: true });

  console.log('Fetching archive index...');
  const archivePosts = await fetchArchivePosts();
  console.log(`Found ${archivePosts.length} posts`);

  const issues: IssueRecord[] = [];
  const errors: Array<{ slug: string; error: string }> = [];

  for (let i = 0; i < archivePosts.length; i++) {
    const post = archivePosts[i];
    const edition = i + 1;
    const sourceUrl = `${BASE}/p/${post.slug}`;
    const relativeFile = issuePath(post, edition).replace(/\\/g, '/');
    const absoluteFile = join(ROOT, relativeFile);

    process.stdout.write(`[${edition}/${archivePosts.length}] ${post.slug}... `);

    try {
      const html = fetchText(sourceUrl);
      const meta = extractMeta(html);
      const chunk = extractContentChunk(html);
      const body = htmlToText(chunk).replace(/^dream-post-content-doc">\s*/i, '');
      const sections = extractSections(chunk);
      const imageUrls = extractImageUrls(chunk);
      const title = meta.title ?? post.title;
      const author = meta.author ?? post.author;
      const publishedAt = meta.publishedAt ?? post.publishedAt;

      const record: IssueRecord = {
        id: post.id,
        title,
        slug: post.slug,
        edition,
        published_at: publishedAt,
        author,
        source_url: sourceUrl,
        word_count: wordCount(body),
        sections,
        image_urls: imageUrls,
        tags: [],
        file: relativeFile,
        status: 'ok',
      };

      mkdirSync(join(ROOT, 'issues', publishedAt.slice(0, 4)), { recursive: true });
      writeFileSync(absoluteFile, formatIssueFile(record, body), 'utf8');
      issues.push(record);
      console.log('ok');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ slug: post.slug, error: message });
      issues.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        edition,
        published_at: post.publishedAt,
        author: post.author,
        source_url: sourceUrl,
        word_count: 0,
        sections: [],
        image_urls: [],
        tags: [],
        file: relativeFile,
        status: 'error',
        error: message,
      });
      console.log(`error: ${message}`);
    }

    await sleep(DELAY_MS);
  }

  const okIssues = issues.filter((issue) => issue.status === 'ok');
  const totalWords = okIssues.reduce((sum, issue) => sum + issue.word_count, 0);
  const stats = {
    issue_count: issues.length,
    successful: okIssues.length,
    failed: errors.length,
    date_range: {
      first: okIssues[0]?.published_at ?? null,
      last: okIssues[okIssues.length - 1]?.published_at ?? null,
    },
    total_words: totalWords,
    avg_words: okIssues.length ? Math.round(totalWords / okIssues.length) : 0,
    fetched_at: new Date().toISOString(),
  };

  const catalog = {
    source: `${BASE}/archive`,
    fetched_at: stats.fetched_at,
    count: issues.length,
    successful: okIssues.length,
    errors,
    issues,
  };

  writeFileSync(join(ROOT, 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
  writeFileSync(join(ROOT, 'catalog.md'), buildCatalogMd(okIssues), 'utf8');
  writeFileSync(join(ROOT, 'README.md'), buildReadme(okIssues), 'utf8');
  writeFileSync(join(META_DIR, 'stats.json'), JSON.stringify(stats, null, 2), 'utf8');
  writeFileSync(
    join(META_DIR, 'fetch-log.json'),
    JSON.stringify({ started_at: startedAt, finished_at: stats.fetched_at, errors }, null, 2),
    'utf8',
  );

  removeLegacyFlatFiles();

  console.log('\nSync complete.');
  console.log(JSON.stringify(stats, null, 2));
  console.log(`Corpus written to ${relative(process.cwd(), ROOT)}`);

  if (errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
