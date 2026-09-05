import { DateTime } from 'luxon';
import { EVENT_TIMEZONE } from '@/lib/datetime';

export const FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export async function fetchHtml(url: string, attempts = 3): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/atom+xml,application/xml',
          'User-Agent': FETCH_UA,
        },
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        throw new Error(`GET ${url} failed (${res.status})`);
      }
      return res.text();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`GET ${url} failed`);
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#13;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export type HtmlLink = { href: string; text: string };

export function extractLinks(html: string, base: string): HtmlLink[] {
  const links: HtmlLink[] = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    if (href.startsWith('#') || href.startsWith('javascript:')) continue;
    links.push({
      href: absoluteUrl(href, base),
      text: stripTags(match[2]),
    });
  }
  return links;
}

const MONTH_NAMES =
  'January|February|March|April|May|June|July|August|September|October|November|December';
const MONTH_ABBR = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';

export const DATE_IN_TEXT = new RegExp(
  `\\b(?:(?:${MONTH_NAMES}|${MONTH_ABBR})\\.?\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\b`,
  'i',
);

const DATE_FORMATS = [
  'MMMM d, yyyy',
  'MMMM dd, yyyy',
  'MMM d, yyyy',
  'MMM. d, yyyy',
  'MMM d yyyy',
  'M/d/yyyy',
  'M-d-yyyy',
  'M/d/yy',
  'EEEE, MMMM d, yyyy',
];

export function parseFlexibleDate(raw: string): DateTime | null {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const snippet = cleaned.match(DATE_IN_TEXT)?.[0];
  if (!snippet) return null;
  const normalized = snippet.replace(/\bSept\b/i, 'Sep').replace(/\./g, '');
  for (const fmt of DATE_FORMATS) {
    const dt = DateTime.fromFormat(normalized, fmt, { zone: EVENT_TIMEZONE });
    if (dt.isValid) return dt.startOf('day');
  }
  return null;
}

const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i;

export function parseFlexibleTime(raw: string): { hour: number; minute: number } | null {
  const match = raw.match(TIME_RE);
  if (!match) return null;
  let hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const ampm = match[3].replace(/\./g, '').toLowerCase();
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  return { hour, minute };
}

export function combineDateTime(
  date: DateTime,
  time: { hour: number; minute: number } | null,
  fallback: { hour: number; minute: number },
): Date {
  const t = time ?? fallback;
  return date.set({ hour: t.hour, minute: t.minute, second: 0, millisecond: 0 }).toJSDate();
}

export function youtubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'live' || parts[0] === 'embed' || parts[0] === 'shorts') {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function classifyFile(text: string, href: string): string | null {
  const blob = `${text} ${href}`.toLowerCase();
  if (blob.includes('agenda')) return 'agenda';
  if (blob.includes('minutes') || blob.includes('action sheet')) return 'minutes';
  if (blob.includes('staff report')) return 'staff_report';
  if (blob.includes('notice of decision') || blob.includes('notices of decision')) {
    return 'decision';
  }
  if (href.toLowerCase().endsWith('.pdf')) return 'pdf';
  return null;
}

export function isRecordingLink(text: string, href: string): boolean {
  const blob = `${text} ${href}`.toLowerCase();
  return (
    blob.includes('zoom.us/rec') ||
    blob.includes('recording') ||
    Boolean(youtubeIdFromUrl(href))
  );
}
