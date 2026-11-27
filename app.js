const $ = (id) => document.getElementById(id);
const PAGE = document.body.dataset.tool || '';
const NAMES = { detector: 'Detector', beautifier: 'Beautifier', cleaner: 'Basic Cleaner', prometheus: 'Prometheus', luaobfuscator: 'LuaObfuscator', clyde: 'Clyde', ironveil: 'Ironveil V1', hercules: 'Hercules' };
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
  const show = () => { $('demo').textContent = clean ? MonkzDeobf.deobfuscate(SAMPLE_HOME).code : SAMPLE_HOME; $('flip').textContent = clean ? 'Show original' : 'Deobfuscate'; };
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
  function stop() { if (job) { job.cancel(); clearTimeout(job.timer); job = null; } $('run').textContent = verb; }

  function guess(src) {
    const rules = [['ironveil', /ironveil/i], ['clyde', /clyde/i], ['luaobfuscator', /luaobfuscator\.com/i], ['prometheus', /prometheus|wearedevs\.net/i], ['hercules', /hercules-obfuscator|Obfuscated by Hercules/i]];
    const hit = rules.find(([, r]) => r.test(src));
    return hit ? hit[0] : null;
  }

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
  function local(src, finish, fail) {
    const w = new Worker('worker.js');
    w.onerror = (e) => fail(e.message || 'The worker could not be loaded.');
    w.onmessage = ({ data }) => (data.ok ? finish(data) : fail(data.error));
    w.postMessage({ id: PAGE, source: src });
    return () => w.terminate();
  }

  $('run').onclick = () => {
    if (job) { stop(); say('Cancelled.'); return; }
    reset();
    const src = $('in').value;
    if (!src.trim()) return say('Add a script first.');
    if (new Blob([src]).size > 1000000) return say('The script is larger than 1 MB.');
    try {
      if (PAGE === 'detector') {
        const g = guess(src);
        say(g ? `Best match: ${NAMES[g]}` : 'No supported obfuscator marker was found. The code may still be obfuscated.');
        if (g) note('Suggested tool:', '', g);
        warnings(src);
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
    const fail = (why) => { stop(); say(`${NAMES[PAGE]} failed: ${why}`); note('Use the Detector to confirm that this is the right tool.', 'warn'); };
    const finish = (data) => {
      stop(); output(data.code); say('Output ready. Always review the result.');
      for (const n of data.notes) note(String(n), 'warn');
      warnings(data.code, 'In output, ');
    };
    say(`${NAMES[PAGE]} is running...`); $('run').textContent = 'Cancel';
    job = { cancel: () => {}, timer: setTimeout(() => fail('It took longer than 60 seconds.'), 60000) };
    try { job.cancel = (PAGE === 'hercules' ? remote : local)(src, finish, fail); } catch (e) { fail(e.message); }
  };

  /* editing the input cancels a running job and clears stale results */
  const changed = () => { stop(); reset(); };
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
