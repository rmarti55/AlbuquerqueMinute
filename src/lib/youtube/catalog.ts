import { DateTime } from 'luxon';
import { EVENT_TIMEZONE } from '@/lib/datetime';
import { fetchHtml, parseFlexibleDate } from '@/lib/ingest/html';

export const GOVTV_BOARDS_CHANNEL_ID = 'UCEqpcP42AmnpJPyuOy1jASQ';
export const GOVTV_BOARDS_RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${GOVTV_BOARDS_CHANNEL_ID}`;

export type YoutubeCatalogEntry = {
  videoId: string;
  title: string;
  publishedAt: Date;
  meetingDate: Date | null;
};

export function parseYoutubeRss(xml: string): YoutubeCatalogEntry[] {
  const entries: YoutubeCatalogEntry[] = [];
  const blocks = xml.split(/<entry>/).slice(1);
  for (const block of blocks) {
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = decodeXml(block.match(/<title>([^<]+)<\/title>/)?.[1] ?? '');
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!videoId || !title) continue;
    const meetingDate = parseFlexibleDate(title)?.toJSDate() ?? null;
    entries.push({
      videoId,
      title,
      publishedAt: published
        ? DateTime.fromISO(published, { zone: EVENT_TIMEZONE }).toJSDate()
        : new Date(),
      meetingDate,
    });
  }
  return entries;
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchYoutubeCatalog(): Promise<YoutubeCatalogEntry[]> {
  return parseYoutubeRss(await fetchHtml(GOVTV_BOARDS_RSS));
}
