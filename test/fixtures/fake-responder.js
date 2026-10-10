// Answers tool calls the way the real connectors do (shapes captured from the real monday, Gmail and Slack
// connectors on 2026-10-07/10; Calendar follows the Google Calendar API event format).
const T = new Date(); const iso = (h) => new Date(T.getTime() + h * 3600000).toISOString();
const SLACK = JSON.stringify({ results: '# Search Results for: \n\n## Messages (2 results)\n### Result 1 of 2\nChannel: DM (ID: D0XYZ)\nParticipants: Ilan Manassen (ID: U038UEUQC1Y), Dana Cohen (ID: U0ABC123)\nFrom: Dana Cohen <dana@x.com> (ID: U0ABC123) \nTime: 2026-10-10 20:00:00 IDT\nMessage_ts: 1791650000.000100\nPermalink: [link](https:\\/\\/x)\nText: \nneed your OK on the quote\n\n---\n\n### Result 2 of 2\nChannel: DM (ID: D0BCAGJV0AD)\nParticipants: Ilan Manassen (ID: U038UEUQC1Y), Pepper (ID: U0BBLHZH4DC)\nFrom: Pepper (ID: U0BBLHZH4DC)  [BOT]\nTime: 2026-10-10 21:03:36 IDT\nMessage_ts: 1791655416.274729\nPermalink: [link](https:\\/\\/y)\nText: \nתועד.\n\n---\n\n', pagination_info: 'End of results' });
function respond(name, input) {
  const tool = name.split('__').pop();
  if (tool === 'all_monday_api') {
    const q = input.query;
    if (/^mutation/.test(q)) return { result: { change_column_value: { id: '1234567890' }, create_update: { id: '99' }, move_item_to_group: { id: '1234567890' } } };
    if (/items_page\(limit:500\)\{ cursor items/.test(q)) return { result: { boards: [{ items_page: { cursor: null, items: [
      { id: '1000001', name: 'Send the quote to Dana', updated_at: '2026-10-09T10:00:00Z', group: { id: 'group_mm4rgvq6' }, column_values: [{ id: 'status', text: 'Working on it' }, { id: 'date4', text: '' }, { id: 'color_mm5wqmy7', text: '' }, { id: 'person', text: 'Ilan Manassen' }] },
      { id: '1000002', name: 'Waiting on legal', updated_at: '2026-10-08T10:00:00Z', group: { id: 'group_title' }, column_values: [{ id: 'status', text: 'Stuck' }, { id: 'date4', text: '' }, { id: 'color_mm5wqmy7', text: '' }, { id: 'person', text: '' }] }] } }] } };
    if (/updates\(limit:3\)/.test(q)) return { result: { items: [{ id: '1000002', updates: [{ text_body: 'ממתין לאישור — בעל אחריות: Noam' }] }] } };
    if (/items_page\(limit:100/.test(q)) return { result: { boards: [{ items_page: { cursor: null, items: [] } }] } };
    if (/column_id:"group"/.test(q)) return { result: { boards: [{ items_page: { items: [] } }] } };
    return { result: { boards: [] } };
  }
  if (tool === 'search_threads') return { result: { resultCountEstimate: '2', threads: [
    { id: 't1', messageCount: 1, messages: [{ id: 'm1', threadId: 't1', sender: 'Dana Cohen <dana@partner.com>', toRecipients: ['ilanmn@monday.com'], subject: 'Quote approval', snippet: 'Can you approve the quote?', date: iso(-3), labelIds: ['UNREAD', 'INBOX'] }] },
    { id: 't2', messageCount: 1, messages: [{ id: 'm2', threadId: 't2', sender: 'alerts@muckrack.com', toRecipients: ['ilanmn@monday.com'], subject: 'Alert', snippet: 'monday.com in the news', date: iso(-5), labelIds: ['INBOX'] }] }] } };
  if (tool === 'get_thread') return { result: { messages: [{ id: 'm1', sender: 'Dana Cohen <dana@partner.com>', date: iso(-3), plaintextBody: 'Can you approve the quote?' }] } };
  if (tool === 'create_draft') return { result: { id: 'r-draft-1', threadId: 't1' } };
  if (tool === 'list_events') return { result: { items: [
    { id: 'e1', summary: 'Weekly comms sync', start: { dateTime: iso(2) }, end: { dateTime: iso(3) }, attendees: [{ self: true, responseStatus: 'accepted' }] },
    { id: 'e2', summary: 'Declined thing', start: { dateTime: iso(4) }, end: { dateTime: iso(5) }, attendees: [{ self: true, responseStatus: 'declined' }] }] } };
  if (tool === 'slack_search_public_and_private') return { result: SLACK };
  if (tool === 'slack_send_message') return { result: 'Message sent: https://monday.slack.com/archives/D0BCAGJV0AD/p1791655416274729' };
  if (tool === 'slack_read_channel') return { result: { messages: 'Channel: DM\n\nDana Cohen <dana@x.com>: need your OK [2026-10-10 20:00:00 IDT]' } };
  if (tool === 'list_recent_files') return { result: { files: [{ id: 'f1' }] } };
  return { result: `unknown tool ${tool}`, isError: true };
}
module.exports = { respond, complete: () => '[{"id":"t1","urgency":"high","action":"decision","unreplied":true,"reason":"approval asked","proposedBody":""}]' };
