// Enquiry draft must sound like Masha, not a form letter (Grisha 21 Oct 2026):
// starts "Hey!", lowercase i, no "confirm", no sign-off, no formal phrasing, rules (partner / a dog and a cat / £190k / WA),
// and different listings get different wording.
import fs from 'fs';
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const a = src.indexOf('function vh('), b = src.indexOf('function draft(id){');
if (a < 0 || b < a) { console.error('enquiry_voice: enqText helpers not found'); process.exit(1); }
globalThis.fmtD = () => '1 Nov';
const enqText = new Function(src.slice(a, b) + '; return enqText;')();
const BAD = [/\bconfirm/i, /\bDear\b/, /Kind regards|Thank you,\s*\n|Maria Surkova/i, /\bI\b|\bI'/, /london time|\(\s*uk time\s*\)/i, /\bhusband\b|service dog/i, /\n/, /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u];
const ids = ['94258452', '93960210', '150171911', '94044120', '93217989', '163036916', '93233982', '94047639'];
const out = ids.map((id, i) => enqText({ id, available: '2026-11-01' }, 'Holloway Road', i % 2 === 0));
let fail = 0;
for (const t of out) {
  if (!t.startsWith('Hey!')) { console.error('not "Hey!":', t); fail++; }
  for (const rx of BAD) if (rx.test(t)) { console.error('robotic', rx, '→', t); fail++; }
  for (const must of ['my partner', 'a dog and a cat', '£190k', '+34605227263', 'Holloway Road']) if (!t.includes(must)) { console.error('missing', must, '→', t); fail++; }
}
if (new Set(out).size !== out.length) { console.error('identical enquiry text for different listings'); fail++; }
if (enqText({ id: '1' }, 'X', false) !== enqText({ id: '1' }, 'X', false)) { console.error('not deterministic'); fail++; }
if (fail) process.exit(1);
console.log('enquiry_voice ok:', out[0]);
