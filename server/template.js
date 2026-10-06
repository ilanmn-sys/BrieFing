// Prompt templating: {{path.to.value}} filled from config.json, so no ID is ever hard-coded in a prompt
// (config.json is the only place IDs live). An unknown placeholder is an error, never an empty string.
function render(text, config) {
  return String(text).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), config);
    if (v === undefined || v === null) throw new Error(`unresolved placeholder {{${p}}}`);
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') throw new Error(`placeholder {{${p}}} is an object, not a value`);
    return String(v);
  });
}
module.exports = { render };
