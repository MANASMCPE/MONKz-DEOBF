const $ = (id) => document.getElementById(id);
const PAGE = document.body.dataset.tool || '';
const NAMES = { executor: 'Sandbox Executor', detector: 'Detector', beautifier: 'Beautifier', cleaner: 'Basic Cleaner', prometheus: 'Prometheus', luaobfuscator: 'LuaObfuscator', clyde: 'Clyde', ironveil: 'Ironveil V1', hercules: 'Hercules' };
const SANDBOX_HELPS = ['IronBrew 1', 'IronBrew 2', 'Synapse Xen', 'JayFuscator'];
const WORKER_TOOLS = ['prometheus', 'luaobfuscator', 'clyde', 'ironveil'];

function theme(mode) { document.documentElement.dataset.theme = mode; $('theme').textContent = mode === 'light' ? 'Dark' : 'Light'; }
let mode = 'dark'; try { mode = localStorage.getItem('theme') || mode; } catch (_) {}
theme(mode);
$('theme').onclick = () => { mode = mode === 'dark' ? 'light' : 'dark'; theme(mode); try { localStorage.setItem('theme', mode); } catch (_) {} };

if ($('demo')) {
  const SAMPLE_HOME = String.raw`local a="\72\101\108\108\111"
local b=string.char(87,111,114,108,100)
if (10+5*2)>5 then print(a.." "..b) end`;
  let clean = false;
  let timer = 0;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* "decode" effect: random glyphs settle into the real text from left to right */
  const reveal = (text) => {
    clearInterval(timer);
    if (still) { $('demo').textContent = text; return; }
    let done = 0;
    timer = setInterval(() => {
      done += Math.ceil(text.length / 28);
      $('demo').textContent = text.slice(0, done) + text.slice(done).replace(/\S/g, () => '#$%&*<>{}[]=+01'[Math.random() * 15 | 0]);
      if (done >= text.length) clearInterval(timer);
    }, 30);
  };
  const show = () => { reveal(clean ? MonkzDeobf.deobfuscate(SAMPLE_HOME).code : SAMPLE_HOME); $('flip').textContent = clean ? 'Show original' : 'Deobfuscate'; };
  $('flip').onclick = () => { clean = !clean; show(); };
  show();
}

if (PAGE) toolPage();

function toolPage() {
  const SAMPLE = String.raw`local a="\72\101\108\108\111" local b=string.char(87,111,114,108,100) if (10+5*2)>5 then print(a.." "..b) end`;
  const verb = $('run').textContent;
  let job = null;
  const tab = document.querySelector('#tabs [aria-current]');
  $('tabs').scrollLeft = tab.offsetLeft - $('tabs').offsetLeft - 40;

  const say = (t) => { $('msg').textContent = t; };
  function note(text, level = '', go = null) {
    const d = document.createElement('div'); d.className = 'tag ' + level; d.textContent = text;
    if (go) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Open ' + NAMES[go]; b.onclick = () => send(go, $('in').value); d.append(' ', b); }
    $('report').append(d);
  }
  const warnings = (code, prefix = '') => { for (const f of MonkzDeobf.detect(code)) note(`${prefix}${f.name}: ${f.why}`, f.level); };
  function send(id, code) {
    try { sessionStorage.setItem('monkz-carry', JSON.stringify({ id, code })); }
    catch (_) { say('The script could not be carried over. Copy it and paste it on the other page.'); return; }
    location.href = id + '.html';
  }
  try {
    const c = JSON.parse(sessionStorage.getItem('monkz-carry'));
    if (c && c.id === PAGE) { $('in').value = c.code; sessionStorage.removeItem('monkz-carry'); }
  } catch (_) {}

  function reset() { $('out').value = ''; $('result').hidden = true; $('report').replaceChildren(); say(''); }
  function output(code) { $('out').value = code; $('result').hidden = false; }
  function stop() { if (job) { job.cancel(); clearTimeout(job.timer); job = null; } $('run').textContent = verb; document.querySelector('.panel').classList.remove('busy'); }

  function remote(src, finish, fail) {
    const ctl = new AbortController();
    fetch('/api/hercules', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: src, signal: ctl.signal })
      .then(async (res) => {
        let data;
        try { data = await res.json(); } catch (_) { throw new Error(`Server error (${res.status}). The Hercules API may not be deployed.`); }
        if (!data.ok) throw new Error(data.error);
        finish(data);
      })
      .catch((e) => { if (!ctl.signal.aborted) fail(e.message); });
    return () => ctl.abort();
  }
  function pyodide(src, finish, fail) {
    const w = new Worker('hercules-worker.js');
    w.onerror = () => fail('The browser worker could not be loaded.');
    w.onmessage = ({ data }) => { if (data.status) say(data.status); else if (data.ok) finish(data); else fail(data.error); };
    w.postMessage({ source: src });
    return () => w.terminate();
  }
  function local(src, finish, fail) {
    const w = new Worker('worker.js');
    w.onerror = (e) => fail(e.message || 'The worker could not be loaded.');
    w.onmessage = ({ data }) => (data.ok ? finish(data) : fail(data.error));
    w.postMessage({ id: PAGE, source: src });
    return () => w.terminate();
  }

  /* Sandbox Executor: results arrive while the script runs, so they survive a cancel or timeout. */
  const views = { log: [], layers: [], strings: [] };
  let view = 'log';
  function showView(name) {
    view = name;
    const text = name === 'log' ? views.log.join('\n') : name === 'layers' ? views.layers.map((l) => `-- ===== layer ${l.index} =====\n${l.code}`).join('\n\n') : views.strings.join('\n');
    const empty = { log: '-- No behaviour was recorded.', layers: '-- No loadstring() layers were captured.', strings: '-- No strings were captured.' };
    output(text || empty[name]);
    for (const b of document.querySelectorAll('#views button')) {
      const n = b.dataset.view; b.setAttribute('aria-pressed', String(n === name));
      b.textContent = `${b.dataset.label} (${views[n].length})`;
    }
  }
  if (PAGE === 'executor') for (const b of document.querySelectorAll('#views button')) b.onclick = () => showView(b.dataset.view);

  function execute(src) {
    const steps = Number($('depth').value);
    const seconds = steps > 20e6 ? 120 : 45;
    const w = new Worker('executor-worker.js');
    for (const k of Object.keys(views)) views[k] = [];
    let drawn = 0;
    const end = (message, level = '') => { stop(); showView(views.log.length ? 'log' : views.layers.length ? 'layers' : views.strings.length ? 'strings' : 'log'); say(message); if (level) note(level, 'warn'); };
    job = { cancel: () => w.terminate(), partial: () => end('Stopped. Showing what was recorded before you cancelled.') };
    $('run').textContent = 'Cancel';
    document.querySelector('.panel').classList.add('busy');
    say('Running in the sandbox…');
    job.timer = setTimeout(() => end(`Stopped after ${seconds} seconds. Showing partial results.`), seconds * 1000);
    w.onerror = () => end('The sandbox crashed, possibly from too much memory. Showing partial results.');
    w.onmessage = ({ data }) => {
      if (data.type === 'log') views.log.push(...data.lines);
      else if (data.type === 'layer') views.layers.push(data);
      else if (data.type === 'string') views.strings.push(data.value);
      else if (data.type === 'fatal') end(data.error);
      else if (data.type === 'done') {
        const told = {
          finished: 'The script finished in the sandbox.',
          error: `The script stopped with an error: ${data.detail}`,
          limit: `The sandbox stopped the script: ${data.detail}.`,
          syntax: `The sandbox could not read this script: ${data.detail}`,
        };
        const extra = data.dropped ? `${data.dropped} more log lines were not shown.` : data.status === 'finished' ? '' : 'Results may be partial. Some scripts detect sandboxes or use features that are not supported.';
        end(told[data.status], extra);
        for (const f of MonkzDeobf.detect(views.log.concat(views.strings, views.layers.map((l) => l.code)).join('\n'))) if (f.level !== 'vm') note(`Seen during the run: ${f.name}`, f.level);
        return;
      }
      if (Date.now() - drawn > 400) { drawn = Date.now(); say(`Running… ${views.log.length} actions, ${views.strings.length} strings`); }
    };
    w.postMessage({ source: src, options: { steps, callbacks: $('callbacks').checked } });
  }

  $('run').onclick = () => {
    if (job && job.partial) { job.partial(); return; }
    if (job) { stop(); say('Cancelled.'); return; }
    reset();
    const src = $('in').value;
    if (!src.trim()) return say('Add a script first.');
    if (new Blob([src]).size > 1000000) return say('The script is larger than 1 MB.');
    try {
      if (PAGE === 'executor') return execute(src);
      if (PAGE === 'detector') {
        const found = MonkzDeobf.detect(src);
        const vms = found.filter((f) => f.level === 'vm');
        say(vms.length ? `Detected: ${vms.map((f) => f.name).join(', ')}` : 'No known obfuscator signature was found. The code may still be obfuscated.');
        for (const f of vms) {
          if (f.tool) note(`${f.name}: ${f.why}`, '', f.tool);
          else if (SANDBOX_HELPS.includes(f.name)) note(`${f.name}: ${f.why}. There is no deobfuscator for it, but the Sandbox Executor read some tested samples.`, f.level, 'executor');
          else note(`${f.name}: ${f.why}. This site has no deobfuscator for it yet.`, f.level);
        }
        for (const f of found.filter((x) => x.level !== 'vm')) note(`${f.name}: ${f.why}`, f.level);
        return;
      }
      if (PAGE === 'beautifier' || PAGE === 'cleaner') {
        const o = PAGE === 'beautifier' ? { strings: false, fold: false, comments: true } : { strings: $('strings').checked, fold: $('fold').checked, comments: $('comments').checked };
        const r = MonkzDeobf.deobfuscate(src, o), n = r.stats;
        output(r.code);
        say(PAGE === 'beautifier' ? 'Formatting complete.' : `Strings: ${n.strings} | Numbers: ${n.numbers} | string.char: ${n.chars} | Joins: ${n.joins}`);
        for (const f of r.found) note(`${f.name}: ${f.why}`, f.level);
        return;
      }
    } catch (e) { return say('Error: ' + e.message); }
    if (PAGE !== 'hercules' && !WORKER_TOOLS.includes(PAGE)) return;
    warnings(src);
    const useServer = PAGE === 'hercules' && $('server').checked;
    const limit = PAGE === 'hercules' ? 180 : 60;
    const fail = (why) => {
      stop(); say(`${NAMES[PAGE]} failed: ${why}`); note('Use the Detector to confirm that this is the right tool.', 'warn');
      if (PAGE === 'hercules' && !useServer) note('If browser mode cannot run, you can tick "Use the Vercel server" and try again. That uploads your script.', 'warn');
    };
    const finish = (data) => {
      stop(); output(data.code); say('Output ready. Always review the result.');
      for (const n of data.notes) note(String(n), 'warn');
      warnings(data.code, 'In output, ');
    };
    say(`${NAMES[PAGE]} is running...`); $('run').textContent = 'Cancel'; document.querySelector('.panel').classList.add('busy');
    job = { cancel: () => {}, timer: setTimeout(() => fail(`It took longer than ${limit} seconds.`), limit * 1000) };
    try { job.cancel = (useServer ? remote : PAGE === 'hercules' ? pyodide : local)(src, finish, fail); } catch (e) { fail(e.message); }
  };

  /* editing the input cancels a running job and clears stale results */
  const changed = () => { stop(); reset(); };
  if ($('server')) $('server').onchange = () => { stop(); reset(); };
  $('in').oninput = () => { changed(); $('fname').textContent = 'Drop a script file here'; };
  async function load(f) {
    if (!f) return;
    changed();
    if (f.size > 1000000) return say('The file is larger than 1 MB.');
    $('in').value = await f.text(); $('fname').textContent = f.name;
  }
  $('file').onchange = (e) => { load(e.target.files[0]); e.target.value = ''; };
  for (const ev of ['dragover', 'dragleave', 'drop']) $('drop').addEventListener(ev, (e) => { e.preventDefault(); $('drop').classList.toggle('over', ev === 'dragover'); if (ev === 'drop') load(e.dataTransfer.files[0]); });
  if ($('sample')) $('sample').onclick = () => { changed(); $('in').value = SAMPLE; };
  $('clear').onclick = () => { changed(); $('in').value = ''; $('fname').textContent = 'Drop a script file here'; };
  $('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out').value); say('Copied.'); } catch (_) { $('out').select(); say('Press copy to copy the selected text.'); } };
  $('save').onclick = () => { const url = URL.createObjectURL(new Blob([$('out').value])); const a = document.createElement('a'); a.href = url; a.download = 'monkz-deobf.lua'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  if ($('pretty')) $('pretty').onclick = () => send('beautifier', $('out').value);
}
