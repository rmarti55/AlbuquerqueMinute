import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ABCWUA_TENANT } from './config';
import { parseAbcwuaPublishedSchedule, parseLegistarCalendarHtml } from './calendar-html';

const ROW = `
<a id="ctl00_ContentPlaceHolder1_gridCalendar_ctl00_ctl06_hypBody">Technical Customer Advisory Committee</a>
</td><td class="rgSorted">9/3/2026</td><td>
<span id="ctl00_ContentPlaceHolder1_gridCalendar_ctl00_ctl06_lblTime">4:00 PM</span>
<a id="x_hypMeetingDetail" href="MeetingDetail.aspx?ID=1440548&GUID=abc">Meeting details</a>
<a id="x_hypAgenda" href="View.ashx?M=A&ID=1440548">Agenda Packet</a>
`;

describe('abcwua calendar fallback', () => {
  it('parses a Calendar.aspx row', () => {
    const meetings = parseLegistarCalendarHtml(
      ROW,
      ABCWUA_TENANT,
      'https://abcwua.legistar.com/Calendar.aspx',
    );
    assert.equal(meetings.length, 1);
    assert.equal(meetings[0].sourceId, '1440548');
    assert.equal(meetings[0].body, 'Technical Customer Advisory Committee');
    assert.ok(meetings[0].agendaUrl?.includes('View.ashx'));
  });

  it('parses published 2026 board dates', () => {
    const meetings = parseAbcwuaPublishedSchedule(
      'February 4th March 18th September 23rd October 21st',
    );
    assert.ok(meetings.some((m) => m.sourceId === 'published:2026-09-23'));
    assert.ok(meetings.some((m) => m.sourceId === 'published:2026-10-21'));
  });
});
