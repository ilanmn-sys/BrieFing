// The Email tab's data: inbox threads, triaged in one batch, classified against the real thread.
const gmail = require('./connectors/gmail');
const { triage, classify } = require('./triage');
const { isDryRun } = require('./done');

async function load() {
  const { threads, estimate, snapshotAt } = await gmail.listThreads(50);
  const tri = await triage(threads.filter((t) => !t.automated && !t.selfOnly && !t.lastFromMe && !t.broadcast)); // only threads that could need me
  const out = threads.map((t) => ({ ...t, ...classify(t, tri.results.get(t.id)) }));
  console.log(`email loaded: ${out.length} of ~${estimate} threads, triage ${tri.ok ? 'ok' : 'FAILED (' + tri.error + ')'}`);
  return { threads: out, estimate, triageOk: tri.ok, triageError: tri.error || null, dryRun: isDryRun(), snapshotAt: snapshotAt || null };
}
module.exports = { load };
