import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCpoaEventsPage } from './parse';

const HTML = `
<h2>2026 CPOAB Meeting Information</h2>
<p>Meetings will begin at 5 p.m. unless noted otherwise</p>
<ul>
<li>Thursday, September 10, 2026</li>
<li>Tuesday, October 6, 2026, the CPOAB meeting will be held on October 6, 2026</li>
</ul>
<p>Sep 10, 2026 from 05:00 PM to 09:00 PM — Vincent E. Griego Chambers</p>
`;

describe('parseCpoaEventsPage', () => {
  it('dedupes annual list dates', () => {
    const meetings = parseCpoaEventsPage(HTML);
    const days = meetings.map((m) => m.sourceId).sort();
    assert.deepEqual(days, ['cpoab:2026-09-10', 'cpoab:2026-10-06']);
    assert.equal(meetings[0].source, 'cpoa');
  });
});
