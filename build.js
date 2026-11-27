// One-time: packs third-party tool sources into vendor/*.js. Usage: node build.js <extracted-dir>
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const top = (n) => path.join(root, n, n);
const tools = {
  prometheus: ['Prometheus-Deobfuscator-main', 'src', 'index'],
  luaobfuscator: ['LuaObfuscator-Deobfuscator-main', '', 'deobf'],
  clyde: ['ClydeDeobfuscator-main', '', 'clyde_static_deob'],
  ironveil: ['Ironveil-Deobfuscator-V1-main', 'deobfuscator', 'index'],
};
fs.mkdirSync('vendor/licenses', { recursive: true });
for (const [id, [repo, sub, entry]] of Object.entries(tools)) {
  const base = path.join(top(repo), sub), mods = {};
  const add = (key) => {
    if (key in mods) return;
    let src = fs.readFileSync(path.join(base, key), 'utf8').replace(/^#!.*\n/, '');
    if (id === 'ironveil' && key === 'utils/parse.js') {
      // MONKz change: remove unused eval()-based helper
      const a = src.indexOf('function eL('), b = src.indexOf('function* eS(');
      if (a < 0 || b < a) throw new Error('eval patch failed');
      src = src.slice(0, a) + src.slice(b);
      src = src.replace(/evalLuaNum:\s*eL,\s*/, '');
      if (/\beval\(|\beL\b/.test(src)) throw new Error('eval still present');
    }
    mods[key] = src;
    for (const m of src.matchAll(/require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
      const t = path.posix.normalize(path.posix.join(path.posix.dirname(key), m[1]));
      add([t, t + '.js', t + '/index.js'].find((c) => fs.existsSync(path.join(base, c)) && fs.statSync(path.join(base, c)).isFile()));
    }
  };
  add(entry + '.js');
  let out = `/* ${repo} - see licenses/${id}.txt${id === 'ironveil' ? ' (modified: unused eval helper removed)' : ''} */\nMonkzModules(${JSON.stringify(entry + '.js')}, {\n`;
  for (const [k, s] of Object.entries(mods)) out += `${JSON.stringify(k)}: function (module, exports, require, Buffer, process, console) {\n${s}\n},\n`;
  fs.writeFileSync(`vendor/${id}.js`, out + '});\n');
  fs.copyFileSync(path.join(top(repo), 'LICENSE'), `vendor/licenses/${id}.txt`);
  console.log(id, Object.keys(mods).length, 'modules');
}
