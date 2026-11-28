/* One worker per run: the page terminates it on cancel or timeout. */
importScripts('shim.js', 'executor.js');
onmessage = (e) => {
  const { source, options } = e.data;
  try {
    importScripts('vendor/prometheus.js');
    const result = MonkzExecute(MonkzTool.req, MonkzBytes.to(source), { ...options, fromBytes: MonkzBytes.from }, (m) => postMessage(m));
    postMessage({ type: 'done', ...result });
  } catch (err) {
    postMessage({ type: 'fatal', error: err instanceof RangeError ? 'The script needed more memory or depth than the sandbox allows.' : String((err && err.message) || 'The sandbox failed.') });
  }
};
