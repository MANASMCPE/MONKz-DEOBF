importScripts('shim.js');
const IDS = ['prometheus', 'luaobfuscator', 'clyde', 'ironveil'];
onmessage = (e) => {
  const { id, source } = e.data;
  try {
    if (!IDS.includes(id)) throw new Error('Unknown tool');
    importScripts('vendor/' + id + '.js');
    postMessage({ ok: true, ...MonkzRun(id, source) });
  } catch (err) { const m = String((err && err.message) || ''); postMessage({ ok: false, error: !m || /^(det:|Error$)/.test(m) ? 'This payload is not supported.' : m }); }
};
