// "Apply all": the dashboard's replacement for replying "apply all" in Pepper's DM (decision H-05, option b).
const { config, today } = require('./lib');
const monday = require('./connectors/monday');
const slack = require('./connectors/slack');
const { parseStrategy, validateAll, select, stale } = require('./strategyLogic');
const { appendSignal } = require('./learningLog');
const { isDryRun } = require('./done');

const bad = (msg, code = 400) => Object.assign(new Error(msg), { code });
const url = (id) => `https://monday.monday.com/boards/${config.boards.projects}/pulses/${id}`;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function find() {
  const t = today();
  const items = await monday.groupItems(config.groups.canonical.pepperTasks.id);
  const item = items.find((i) => i.name.includes('Daily Strategy') && i.name.includes(t));
  if (!item) return { state: 'none', date: t };
  if (item.status === 'Done') return { state: 'done', date: t, item };
  const parsed = parseStrategy(await monday.itemUpdates(item.id), t);
  return { ...parsed, date: t, item };
}

async function load() {
  const f = await find();
  const base = { state: f.state, date: f.date, itemId: f.item && f.item.id, itemUrl: f.item && url(f.item.id), dryRun: isDryRun() };
  if (f.state !== 'awaiting') return { ...base, error: f.error || null };
  const { valid, invalid } = validateAll(f.proposals, config);
  return { ...base, proposals: valid.map((p) => ({ n: p.n, text: p.text, ops: p.ops.length })), invalid };
}

// numbers: 'all' or [n, ...]. Reads and checks always run; writes need DRY_RUN=0.
async function apply(numbers) {
  const f = await find();
  if (f.state === 'applied' || f.state === 'done') throw bad('Today\'s proposals were already handled', 409);
  if (f.state !== 'awaiting') throw bad(`There is nothing to apply (${f.state})`, 409);
  const { valid, invalid } = validateAll(f.proposals, config);
  const { chosen, rejected } = select(valid, numbers);
  if (!chosen.length) throw bad('No proposals selected');
  const dry = isDryRun();

  const ids = [...new Set(chosen.flatMap((p) => p.ops.filter((o) => o.itemId).map((o) => o.itemId)))];
  const states = ids.length ? await monday.itemStates(ids) : new Map();
  const existingTasks = new Set((await monday.groupItems(config.groups.canonical.pepperTasks.id)).map((i) => i.name));

  const applied = [], skipped = [], failed = [];
  for (const p of chosen) {
    // Check the whole proposal before touching anything; one stale or duplicate operation skips the whole number.
    let reason = null;
    for (const o of p.ops) {
      if (o.type === 'email_task') { if (existingTasks.has(o.name)) reason = 'that email task already exists'; }
      else reason = reason || stale(o, states.get(o.itemId));
    }
    if (reason) { skipped.push({ n: p.n, text: p.text, reason }); continue; }
    if (dry) { applied.push({ n: p.n, text: p.text, would: p.ops.map((o) => describe(o)) }); continue; }
    try {
      for (const o of p.ops) {
        if (o.type === 'move') await monday.moveToGroup(o.itemId, o.toGroup);
        else if (o.type === 'date') await monday.setDate(o.itemId, o.date);
        else if (o.type === 'priority') await monday.setPriority(o.itemId, o.label);
        else if (o.type === 'email_task') { await monday.createEmailTask(o); existingTasks.add(o.name); }
      }
      applied.push({ n: p.n, text: p.text });
    } catch (e) { failed.push({ n: p.n, text: p.text, error: e.message }); }
  }
  const result = { dryRun: dry, applied, skipped, failed, rejected: rejected.map((p) => ({ n: p.n, text: p.text })), invalid };
  if (dry) return result;

  // Record it everywhere, in this order: board confirmation (carries the APPLIED marker), item Done, Pepper, learning log.
  result.record = {};
  const list = (xs, f2) => xs.map(f2).join('<br>') || '—';
  const body = `<b>Applied from the dashboard</b> (${applied.length} applied, ${skipped.length} skipped, ${failed.length} failed, ${rejected.length} not selected)<br><br>`
    + `<b>Applied</b><br>${list(applied, (x) => `${x.n}. ${esc(x.text)}`)}<br><br><b>Skipped</b><br>${list(skipped, (x) => `${x.n}. ${esc(x.text)} (${esc(x.reason)})`)}<br><br>`
    + `<b>Failed</b><br>${list(failed, (x) => `${x.n}. ${esc(x.text)} (${esc(x.error)})`)}<br><br><b>Not selected</b><br>${list(rejected, (x) => `${x.n}. ${esc(x.text)}`)}<br><br>`
    + `APPLIED | strategy_date:${f.date} | applied:${applied.length} | skipped:${skipped.length + failed.length} | by:dashboard`;
  await step(result, 'board', async () => { await monday.postUpdate(f.item.id, body); await monday.setRequestStatusOn(f.item.id, 'Done'); });
  await step(result, 'pepper', async () => { await slack.sendDm(config.pepper.userId, `✅ הוחל: ${applied.length} שינויים · דולג: ${skipped.length + failed.length + rejected.length}\n${url(f.item.id)}`); });
  await step(result, 'learningLog', async () => {
    const names = (xs) => xs.map((x) => `"${x.text}"`).join('; ') || 'none';
    return appendSignal({ date: f.date, type: 'approval', body:
      `**What happened.** Ilan applied ${applied.length} of ${valid.length} strategy proposals from the dashboard (${skipped.length} skipped as stale or duplicate, ${failed.length} failed).\n\n`
      + `**Rejected.** ${rejected.length ? names(rejected) + '. Each is a judgement the model got wrong; name what it was and why.' : 'none (Apply all).'}\n\n`
      + `**Not recorded.** Accuracy and slippage entries are written by the agent's own APPLY run; this one was applied from the dashboard.` });
  });
  return result;
}

async function skip() {
  const f = await find();
  if (f.state !== 'awaiting') throw bad(`There is nothing to skip (${f.state})`, 409);
  const { valid } = validateAll(f.proposals, config);
  const result = { dryRun: isDryRun(), skipped: valid.length };
  if (result.dryRun) return { ...result, would: `post a skip note on the strategy item, mark it Done, DM Pepper, log ${valid.length} rejections` };
  result.record = {};
  await step(result, 'board', async () => {
    await monday.postUpdate(f.item.id, `<b>Skipped from the dashboard.</b> Nothing was applied.<br><br>APPLIED | strategy_date:${f.date} | applied:0 | skipped:${valid.length} | by:dashboard`);
    await monday.setRequestStatusOn(f.item.id, 'Done');
  });
  await step(result, 'pepper', async () => { await slack.sendDm(config.pepper.userId, `⏭ דולג על כל ההצעות (${valid.length})\n${url(f.item.id)}`); });
  await step(result, 'learningLog', async () => appendSignal({ date: f.date, type: 'approval', body:
    `**What happened.** Ilan skipped all ${valid.length} strategy proposals from the dashboard.\n\n**Rejected.** ${valid.map((p) => `"${p.text}"`).join('; ') || 'none'}. Every one is a judgement the model got wrong; name what it was and why.` }));
  return result;
}

const describe = (o) => o.type === 'move' ? `move ${o.itemId} to ${o.toGroup}` : o.type === 'date' ? `set date of ${o.itemId} to ${o.date || 'empty'}` : o.type === 'priority' ? `set priority of ${o.itemId} to ${o.label}` : `create email task "${o.name}"`;

// One record-keeping step: never throws, so a failure is reported on the result instead of hiding the others.
async function step(result, name, fn) {
  try { const v = await fn(); result.record[name] = v ? `ok (${v})` : 'ok'; } catch (e) { result.record[name] = `FAILED: ${e.message}`; }
}

module.exports = { load, apply, skip, find };
