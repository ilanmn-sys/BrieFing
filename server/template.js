// Prompt templating: {{path.to.value}} filled from config.json, so no ID is ever hard-coded in a prompt
// (config.json is the only place IDs live). An unknown placeholder is an error, never an empty string.
// {{json path}} renders an object or array as compact JSON (for tables such as the comms owner map).
function render(text, config) {
  return String(text).replace(/\{\{\s*(json\s+)?([\w.-]+)\s*\}\}/g, (_, asJson, p) => {
    const v = p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), config);
    if (v === undefined || v === null) throw new Error(`unresolved placeholder {{${p}}}`);
    if (asJson) return JSON.stringify(v);
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') throw new Error(`placeholder {{${p}}} is an object, not a value`);
    return String(v);
  });
}
module.exports = { render };
