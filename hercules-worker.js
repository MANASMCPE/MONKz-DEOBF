/* Runs the Python Hercules engine in the browser with Pyodide. The script is not uploaded. */
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const text = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error('Missing site file: ' + url); return r.text(); };

onmessage = async ({ data }) => {
  let stage = 'Python could not be downloaded. Check your connection or ad blocker.';
  try {
    postMessage({ status: 'Loading Python in your browser. The first run can take a while...' });
    importScripts(PYODIDE + 'pyodide.js');
    const py = await loadPyodide({ indexURL: PYODIDE });
    stage = 'The Hercules engine could not be loaded.';
    const names = JSON.parse(await text('engines/hercules/files.json'));
    py.FS.mkdirTree('/engine/deobfhercules');
    await Promise.all(names.map(async (n) => py.FS.writeFile('/engine/deobfhercules/' + n, await text('engines/hercules/deobfhercules/' + n))));
    const glue = await text('engines/hercules/run.py');
    py.runPython('import sys\nsys.path.insert(0, "/engine")');
    py.globals.set('SOURCE', data.source);
    postMessage({ status: 'Hercules is running in your browser...' });
    stage = 'The script could not be processed in browser mode.';
    postMessage(JSON.parse(py.runPython(glue)));
  } catch (err) {
    postMessage({ ok: false, error: stage });
  }
};
