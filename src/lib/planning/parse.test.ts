import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePlanningPage } from './parse';
import { PLANNING_BODIES } from './config';

const EPC_SNIPPET = `
<h3>Meeting for September 17, 2026</h3>
<ul>
<li>EPC Public Hearing September 17, 2026 at 08:40 AM Mountain Time</li>
<li><a href="https://cabq.zoom.us/j/83932559165">Zoom Link</a></li>
</ul>
<h3>Meeting for August 20, 2026</h3>
<ul>
<li><a href="https://documents.cabq.gov/planning/epc/agenda.pdf">Agenda for August 20, 2026</a></li>
<li><a href="https://documents.cabq.gov/planning/epc/minutes.pdf">Minutes for August 20, 2026</a></li>
</ul>
<h3>Meeting for December 18, 2025</h3>
<ul>
<li><a href="https://cabq.zoom.us/rec/share/abc.def">EPC Public Hearing December 18, 2025 - Zoom Recording</a></li>
<li><a href="https://documents.cabq.gov/planning/epc/dec.pdf">Agenda for December 18, 2025</a></li>
</ul>
`;

describe('parsePlanningPage', () => {
  const epc = PLANNING_BODIES[0];

  it('extracts dated meetings with files and zoom recordings', () => {
    const meetings = parsePlanningPage(EPC_SNIPPET, epc);
    assert.equal(meetings.length, 3);
    assert.equal(meetings[0].sourceId, 'epc:2026-09-17');
    assert.equal(meetings[0].body, 'Environmental Planning Commission');
    assert.equal(meetings[1].agendaUrl, 'https://documents.cabq.gov/planning/epc/agenda.pdf');
    assert.equal(meetings[1].files?.some((f) => f.type === 'minutes'), true);
    assert.equal(meetings[2].video?.matchMethod, 'planning_page');
    assert.ok(meetings[2].video?.playerUrl?.includes('zoom.us/rec'));
  });

  it('parses ZHE and DHO list-item dates', () => {
    const zhe = parsePlanningPage(
      `<h2>2026</h2><ul><li>September 15, 2026</li><li><a href="https://documents.cabq.gov/zhe/agenda.pdf">Agenda for September 15, 2026</a></li></ul>`,
      PLANNING_BODIES[1],
    );
    assert.ok(zhe.some((m) => m.sourceId === 'zhe:2026-09-15' && m.agendaUrl));

    const dho = parsePlanningPage(
      `<li>Meeting for <a href="https://documents.cabq.gov/dho/agenda.pdf">August 26, 2026</a> (Online Meeting)</li>`,
      PLANNING_BODIES[2],
    );
    assert.ok(dho.some((m) => m.sourceId === 'dho:2026-08-26'));
  });
});
