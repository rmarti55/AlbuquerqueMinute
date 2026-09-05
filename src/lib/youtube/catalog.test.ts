import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseYoutubeRss } from './catalog';
import { pickMatch } from './pick';

const RSS = `<?xml version="1.0"?>
<feed>
 <entry>
  <yt:videoId>gKKl5xNYHgs</yt:videoId>
  <title>Intergovernmental Legislative Relations Committee Meeting - September 2, 2026</title>
  <published>2026-09-03T10:21:49+00:00</published>
 </entry>
</feed>`;

describe('youtube catalog', () => {
  it('parses RSS titles and meeting dates', () => {
    const entries = parseYoutubeRss(RSS);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].videoId, 'gKKl5xNYHgs');
    assert.ok(entries[0].meetingDate);
  });

  it('matches by date and body tokens', () => {
    const [entry] = parseYoutubeRss(RSS);
    const match = pickMatch(entry, [
      {
        id: 1,
        body: 'Intergovernmental Legislative Relations Committee',
        startAt: new Date('2026-09-02T21:00:00.000Z'),
      },
      {
        id: 2,
        body: 'City Council',
        startAt: new Date('2026-09-02T21:00:00.000Z'),
      },
    ]);
    assert.equal(match?.id, 1);
  });
});
