/* Ironveil-Deobfuscator-V1-main - see licenses/ironveil.txt (modified: unused eval helper removed) */
MonkzModules("index.js", {
"index.js": function (module, exports, require, Buffer, process, console) {
'use strict';
const fs = require('fs');
const { parseObfuscated: pO, extractSalts: eSa } = require('./utils/parse');
const { hashPayload: hP, xorDec: xD, lzwDec: lD, deser: ds } = require('./utils/unpack');
const { buildRawMap: bR, BINARY_NAMES: bN, UNARY_NAMES: uN, EXPR_NAMES: eN, STMT_NAMES: sN } = require('./utils/opcodes');
const { decodeIR: dI } = require('./utils/decode');
const { Gen: G } = require('./utils/ir2lua');
function aC(f, k, hS, eH) {
  const n = f.length;
  if (n === 0) throw new Error();
  if (n === 1) return f[0];
  const sq = f.join('');
  const sd = dB(sq, k);
  if (sd) return sq;
  if (n <= 8) {
    const pr = [...Array(n).keys()];
    for (const x of pm(pr)) {
      const c = x.map(i => f[i]).join('');
      const d = dB(c, k);
      if (d) {
        if ((hP(d, hS) >>> 0) === (eH >>> 0)) return c;
      }
    }
  }
  return sq;
}
function dB(b, k) {
  try { return lD(xD(Buffer.from(b, 'base64'), k)); } catch { return null; }
}
function* pm(a) {
  if (a.length <= 1) { yield a; return; }
  for (let i = 0; i < a.length; i++) {
    const r = a.filter((_, j) => j !== i);
    for (const x of pm(r)) yield [a[i], ...x];
  }
}
function mS(d, db, df) {
  return {
    lval: d[0] || 0, field: d[1] || 0, expr: d[2] || 0, stmt: d[3] || 0,
    binary: db[0] || 0, unary: db[1] || 0,
    defBinary: df[0] || 0, defUnary: df[1] || 0, defExpr: df[2] || 0, defStmt: df[3] || 0,
  };
}
function vS(s, d, bs, es, ss) {
  try {
    const bm = bR(bs, d, s.defBinary, bN);
    const em = bR(es, d, s.defExpr, eN);
    const sm = bR(ss, d, s.defStmt, sN);
    return [...bm.values()].every(n => bN.includes(n)) &&
           [...em.values()].every(n => eN.includes(n)) &&
           [...sm.values()].every(n => sN.includes(n)) &&
           bm.size > 0 && em.size > 0 && sm.size > 0;
  } catch { return false; }
}
function rDS(d, db, df, ds, bs, us, es, ss) {
  const nt = mS(d, db, df);
  if (vS(nt, ds, bs, es, ss)) return nt;
  for (const dp of pm([...Array(Math.min(df.length, 4)).keys()])) {
    const s = mS(d, db, dp.map(i => df[i]));
    if (vS(s, ds, bs, es, ss)) return s;
  }
  return nt;
}
function de(s) {
  const { frags: fg, payloadKey: pk, payloadHashSeed: phs, payloadHash: ph } = pO(s);
  const si = eSa(s);
  const b = aC(fg, pk, phs, ph);
  const rw = Buffer.from(b, 'base64');
  const dc = xD(rw, pk);
  const tx = lD(dc);
  if ((hP(tx, phs) >>> 0) !== (ph >>> 0)) throw new Error();
  const pl = ds(tx);
  const [, en, rf, m] = pl;
  const [oS, dS, bS, uS, eS, sS] = m;
  const sl = rDS(si.dec, si.decB, si.def, dS, bS, uS, eS, sS);
  let ac, oc;
  const rx = new RegExp(`\\((\\d+),[a-zA-Z_]\\w*,${sl.binary}\\),.*?\\(((\\d+),[a-zA-Z_]\\w*,${sl.binary})\\)`);
  const mt = s.match(rx);
  if (mt) { ac = parseInt(mt[1]); oc = parseInt(mt[3]); }
  const bm = bR(bS, dS, sl.defBinary, bN);
  if (ac !== undefined) bm.set(ac, 'and');
  if (oc !== undefined) bm.set(oc, 'or');
  const rm = {
    binary: bm, unary: bR(uS, dS, sl.defUnary, uN),
    expr: bR(eS, dS, sl.defExpr, eN), stmt: bR(sS, dS, sl.defStmt, sN),
    lval: new Map(), field: new Map(),
  };
  let ir;
  try {
    ir = dI(pl, sl, rm);
    const is = JSON.stringify(ir);
    if (is.includes('"bin_') || is.includes('"un_')) throw new Error();
  } catch {
    const t = sl.binary; sl.binary = sl.unary; sl.unary = t;
    rm.lval = new Map(); rm.field = new Map();
    ir = dI(pl, sl, rm);
  }
  const { names: nm, strings: st } = eP(s);
  function tB(stms) {
    if (!stms) return stms;
    if (typeof stms[0] === 'string') {
      if (stms[0] === 'if' && stms[1] && stms[1].length === 1 && (!stms[2] || stms[2].length === 0)) {
        const c = stms[1][0][0];
        if (c && ((c[0] === 'bool' && c[1] !== 1) || (c[0] === 'mini' && c[1] && c[1].length === 1 && c[1][0][0] === 4 && c[1][0][1] !== 1))) return [];
      }
      tS(stms); return stms;
    }
    if (Array.isArray(stms)) {
      for (let i = 0; i < stms.length; i++) {
        let x = stms[i];
        if (!x) continue;
        if (x[0] === 'if' && x[1] && x[1].length === 1 && (!x[2] || x[2].length === 0)) {
          const c = x[1][0][0];
          if (c && ((c[0] === 'bool' && c[1] !== 1) || (c[0] === 'mini' && c[1] && c[1].length === 1 && c[1][0][0] === 4 && c[1][0][1] !== 1))) {
            stms.splice(i, 1); i--; continue;
          }
        }
        stms[i] = tS(x);
      }
      return stms;
    }
    return stms;
  }
  function tS(x) {
    if (!x || typeof x[0] !== 'string') return x;
    if (x[0] === 'if') {
      if (x[1]) x[1].forEach(c => { c[1] = tB(c[1]); });
      if (x[2]) x[2] = tB(x[2]);
    } else if (['while', 'repeat', 'fornum', 'forin', 'do'].includes(x[0])) {
      const idx = x[0] === 'while' ? 2 : x[0] === 'repeat' ? 1 : x[0] === 'fornum' ? 5 : x[0] === 'forin' ? 3 : 1;
      if(x[idx]) x[idx] = tB(x[idx]);
    }
    return x;
  }
  if (ir && ir.fns) ir.fns.forEach(fn => { if (fn && fn.body) fn.body = tB(fn.body); });
  const g = new G(nm, st);
  return g.pr({ entry: en, fns: ir.fns, names: nm, strings: st });
}
function eP(s) {
  const xD = (e, k) => {
    const b = Buffer.alloc(e.length);
    for (let i = 0; i < e.length; i++) b[i] = (e.charCodeAt(i) ^ ((k + i + 1) & 0xff)) & 0xff;
    return b.toString('utf8');
  };
  const pS = (x) => x.replace(/\\(\d{1,3})|\\n|\\r|\\t|\\"|\\\\|\\0/g, (m, d) => {
    if (d !== undefined) return String.fromCharCode(parseInt(d));
    if (m === '\\n') return '\n'; if (m === '\\r') return '\r'; if (m === '\\t') return '\t';
    if (m === '\\"') return '"'; if (m === '\\\\') return '\\'; if (m === '\\0') return '\0'; return m;
  });
  const pSE = (e) => {
    const p = [], r = /"((?:[^"\\]|\\.)*)"/g; let m;
    while ((m = r.exec(e)) !== null) p.push(pS(m[1]));
    return p.join('');
  };
  const dPB = (b, pf) => {
    const r = [], rx = /([a-zA-Z0-9_]+)\[\{((?:"(?:[^"\\]|\\.)*"\s*(?:\.\.\s*"(?:[^"\\]|\\.)*"\s*)*)),\s*(\d+)\s*\}\]/g; let m;
    while ((m = rx.exec(b)) !== null) if (m[1] === pf) r.push(xD(pSE(m[2]), parseInt(m[3])));
    return r;
  };
  const l = s.split('\n')[3] || s, w8 = l.indexOf('W[8]={'), w9 = l.indexOf('W[9]={');
  let rs = [], n = [];
  if (w8 > -1) {
    const e = w9 > w8 ? w9 : w8 + 8000, b = l.substring(w8, e), m = b.match(/W\[8\]=\{(\w+)\[/);
    rs = dPB(b, m ? m[1] : 'f80');
  }
  if (w9 > -1) {
    const b = l.substring(w9, w9 + 20000), m = b.match(/W\[9\]=\{(\w+)\[/);
    n = dPB(b, m ? m[1] : 'g80');
  }
  if (rs.length === 0 && n.length === 0) {
    const pm = new Map(), r = /([a-zA-Z0-9_]+)\[\{\s*((?:"(?:[^"\\]|\\.)*"\s*(?:\.\.\s*"(?:[^"\\]|\\.)*"\s*)*))\s*,\s*(\d+)\s*\}\]/g; let m;
    while ((m = r.exec(s)) !== null) {
      if (!pm.has(m[1])) pm.set(m[1], []);
      pm.get(m[1]).push(xD(pSE(m[2]), parseInt(m[3])));
    }
    const k = Array.from(pm.keys());
    rs = pm.get(k[0]) || []; n = pm.get(k[1]) || [];
  }
  let w10 = 1, w11 = 0;
  const m10_new = l.match(/\[10\]=\(\(function\(\)return\s+(\d+)\s+end\)\(\)-(\d+)\)/);
  const m10_new2 = l.match(/\[10\]=\(\((\d+)\)-\((\d+)\)\)/);
  const m10_old = l.match(/W\[10\]=\(\(\(\(\((\d+)\)\+(\d+)\)-\2\)\/(\d+)\)\)/);
  if (m10_new) w10 = parseInt(m10_new[1]) - parseInt(m10_new[2]);
  else if (m10_new2) w10 = parseInt(m10_new2[1]) - parseInt(m10_new2[2]);
  else if (m10_old) w10 = Math.floor(parseInt(m10_old[1]) / parseInt(m10_old[3]));

  const m11_new = l.match(/\[11\]=\(\(function\(\)return\s+(\d+)\s+end\)\(\)-(\d+)\)/);
  const m11_new2 = l.match(/\[11\]=\(\((\d+)\)-\((\d+)\)\)/);
  const m11_old = l.match(/W\[11\]=\(\(\(\(\((\d+)\)\+(\d+)\)-\2\)\/(\d+)\)\)/);
  if (m11_new) w11 = parseInt(m11_new[1]) - parseInt(m11_new[2]);
  else if (m11_new2) w11 = parseInt(m11_new2[1]) - parseInt(m11_new2[2]);
  else if (m11_old) w11 = Math.floor(parseInt(m11_old[1]) / parseInt(m11_old[3]));
  let st;
  const ps = rs.length;
  if (ps > 0 && (w10 !== 1 || w11 !== 0)) {
    const mr = ps * 3; st = new Array(mr);
    for (let a = 1; a <= mr; a++) st[a - 1] = rs[((a - 1) * w10 + w11) % ps];
  } else st = rs;
  return { names: n, strings: st };
}
const bt = require('./Beautiful/beautifier.js');
function dF(i, o) {
  const s = fs.readFileSync(i, 'utf8'); let r = de(s);
  try { r = bt.Beautify(r, { RenameVariables: false, RenameGlobals: false }); } catch {}
  r = `-- deobfuscated by LeakD discord.gg/qteAQmfJmP\n\n` + r.trimStart();
  if (o) fs.writeFileSync(o, r, 'utf8');
  return r;
}
module.exports = { deobfuscate: de, deobfuscateFile: dF };
if (require.main === module) {
  const [,, i, o] = process.argv;
  if (!i) {
    console.error('\x1b[31m[!] Missing input file path.\x1b[0m');
    process.exit(1);
  }
  try {
    console.error('\x1b[1;35mdeobfuscator made by LeakD discord.gg/qteAQmfJmP\x1b[0m');
    const start = Date.now();
    const r = dF(i, o);
    const elapsed = Date.now() - start;
    console.error(`\x1b[1;32m[+] Successfully deobfuscated in \x1b[1;33m${elapsed}ms\x1b[0m`);
    if (o) {
      console.log(`\x1b[1;36m[+] Output saved to: \x1b[1;37m${require('path').resolve(o)}\x1b[0m`);
    } else {
      console.log(r);
    }
  } catch (e) {
    console.error('\x1b[31m[!] Deobfuscation failed:\x1b[0m', e);
    process.exit(1);
  }
}

},
"utils/parse.js": function (module, exports, require, Buffer, process, console) {
'use strict';
function* eS(s) {
  let i = 0, n = false, q = '', e = false, st = 0;
  while (i < s.length) {
    const c = s[i];
    if (n) {
      if (e) { e = false; }
      else if (c === '\\') { e = true; }
      else if (c === q) { yield s.slice(st + 1, i); n = false; }
      i++; continue;
    }
    if (c === '"' || c === "'") { n = true; q = c; st = i; }
    i++;
  }
}
function fF(s) {
  const f = [];
  for (const x of eS(s)) if (x.length >= 80 && /^[A-Za-z0-9+/=]+$/.test(x)) f.push(x);
  return f;
}
function fK(s) {
  const c = [];
  for (const m of s.matchAll(/,(\d{5,12})\)[^,]{1,400},(\d{5,12})\)~=(\d{5,12})/g))
    c.push({ payloadKey: parseInt(m[1]) >>> 0, payloadHashSeed: parseInt(m[2]) >>> 0, payloadHash: parseInt(m[3]) >>> 0 });
  if (c.length > 0) return c[0];
  for (const m of s.matchAll(/\((\d{5,12})\)[^~]{1,400}~=(\d{5,12})/g)) {
    const b = s.slice(Math.max(0, m.index - 300), m.index);
    const bm = [...b.matchAll(/,(\d{5,12})\)/g)];
    if (bm.length > 0) c.push({ payloadKey: parseInt(bm[bm.length - 1][1]) >>> 0, payloadHashSeed: parseInt(m[1]) >>> 0, payloadHash: parseInt(m[2]) >>> 0 });
  }
  return c[0] || null;
}
function pO(s) {
  if (!s.includes('ironveil')) throw new Error('');
  const f = fF(s);
  if (f.length === 0) throw new Error('');
  const k = fK(s);
  if (!k) throw new Error('');
  return { frags: f, ...k };
}
function eSa(s) {
  const c = new Set();
  const a = (r, v) => { if (v > 0 && v <= 65535 && !c.has(v)) { c.add(v); r.push(v); } };
  const d1 = [], d2 = [], df = [];
  for (const m of s.matchAll(/\[1\],\s*\w{1,3}\[1\],\s*\w{1,3},\s*(\d{1,5}),\s*\w{1,3}\[3\],\s*\w{1,3}\[5\]/g)) a(d1, parseInt(m[1]));
  for (const m of s.matchAll(/\[2\],\s*\w{1,3}\[2\],\s*\w{1,3},\s*(\d{1,5}),\s*\w{1,3}\[4\],\s*\w{1,3}\[6\]/g)) a(d2, parseInt(m[1]));
  for (const m of s.matchAll(/\[1\],\s*\w{1,3},\s*\w{1,3},\s*(\d{1,5})\)/g)) a(df, parseInt(m[1]));
  return { dec: d1, decB: d2, def: df };
}
module.exports = { parseObfuscated: pO, extractSalts: eSa };

},
"utils/unpack.js": function (module, exports, require, Buffer, process, console) {
'use strict';
const { nxs: n } = require('./xor');
function xD(b, s) {
  let r = ((s ^ 0x13579bdf) >>> 0) || 0x9e3779b9;
  const o = Buffer.allocUnsafe(b.length);
  for (let i = 0; i < b.length; i++) {
    r = n(r);
    const m = ((r & 0xff) + ((s + ((i + 1) * 29)) & 0xff)) & 0xff;
    o[i] = b[i] ^ m;
  }
  return o;
}
function lD(b) {
  const c = [];
  for (let i = 0; i < b.length; i += 2) c.push((b[i] << 8) | b[i + 1]);
  const C = 256, E = 257;
  let d = null, nx = 258, k = [], p = null;
  function r() {
    d = [];
    for (let i = 0; i < 256; i++) d[i] = String.fromCharCode(i);
    nx = 258; p = null;
  }
  r();
  for (const x of c) {
    if (x === C) { r(); continue; }
    if (x === E) break;
    let y;
    if (x < nx) y = d[x];
    else if (x === nx && p !== null) y = p + p[0];
    else throw new Error('');
    k.push(y);
    if (p !== null) d[nx++] = p + y[0];
    p = y;
  }
  return k.join('');
}
function ds(s) {
  let i = 0;
  function r(d) {
    const p = i;
    while (s[i] !== d) i++;
    const v = s.slice(p, i); i++;
    return v;
  }
  function v() {
    const t = s[i++];
    if (t === 'Z') return null;
    if (t === 'T') return true;
    if (t === 'F') return false;
    if (t === 'N') return Number(r(';'));
    if (t === 'S') {
      const l = Number(r(':')) || 0;
      const x = s.slice(i, i + l); i += l;
      const b = [];
      for (let j = 0; j < x.length; j += 2) b.push(parseInt(x.slice(j, j + 2), 16) || 0);
      return Buffer.from(b).toString('utf8');
    }
    if (t === 'A') {
      const l = Number(r('[')) || 0;
      const a = [];
      for (let j = 0; j < l; j++) a.push(v());
      i++;
      return a;
    }
    if (t === 'O') {
      const l = Number(r('{')) || 0;
      const o = {};
      for (let j = 0; j < l; j++) { const k = v(); o[k] = v(); }
      i++;
      return o;
    }
    throw new Error('');
  }
  return v();
}
function hP(s, e) {
  let h = ((e ^ 0xa5a5a5a5) >>> 0);
  for (let i = 0; i < s.length; i++) {
    h = (h + (s.charCodeAt(i) & 0xff) + (((i + 1) * 97) >>> 0)) >>> 0;
    h ^= (h << 13) >>> 0; h ^= h >>> 7; h ^= (h << 17) >>> 0;
    h >>>= 0;
  }
  return h >>> 0;
}
function eP(b, k, ps, eh) {
  const rw = Buffer.from(b, 'base64');
  const d = xD(rw, k);
  const t = lD(d);
  const a = hP(t, ps);
  if (eh !== undefined && a !== (eh >>> 0)) throw new Error('');
  return ds(t);
}
module.exports = { extractPayload: eP, hashPayload: hP, xorDec: xD, lzwDec: lD, deser: ds };

},
"utils/xor.js": function (module, exports, require, Buffer, process, console) {
'use strict';
class X {
  constructor(s) { this.s = (s >>> 0) || 0x9e3779b9; }
  next() {
    let x = this.s >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x >>> 0;
    return this.s;
  }
  int(m) { return m <= 0 ? 0 : this.next() % m; }
  range(l, h) { return h <= l ? l : l + this.int(h - l + 1); }
}
function nx(s) {
  let x = s >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return x >>> 0;
}
module.exports = { XS: X, nxs: nx };

},
"utils/opcodes.js": function (module, exports, require, Buffer, process, console) {
'use strict';
const oM = 0xffff;
const bN = ['+','-','*','/','%','^','..','==','~=','<','<=','>','>=','&','|','~','<<','>>'];
const uN = ['-','not','#','~'];
const eN = ['id','str','num','bool','nil','vararg','binary','unary','member','call','table','function','mini'];
const sN = ['local','assign','expr','return','if','while','repeat','fornum','forin','break','continue','do','func'];
const lN = ['id','member'];
const fN = ['array','record','general'];

function o(s, k, sa) {
  const se = (k + (s * 149) + (sa * 53)) & oM;
  const m = (se ^ (((s * 17) + (sa * 29)) & oM)) & oM;
  const sp = (((k >>> (s & 7)) ^ (((s * 97) + (sa * 11)) & oM))) & oM;
  const sh = ((s + sa + (k % 7)) % 15) + 1;
  const a = (sp + sa + (s * 3)) & oM;
  const ma = (m + sp + sh) & oM;
  return { m, sh, a, ma };
}
function rl(v, s) {
  const a = s & 15;
  if (a === 0) return v & oM;
  return (((v << a) | (v >>> (16 - a))) & oM) >>> 0;
}
function eO(v, s, k, sa) {
  const x = o(s, k, sa);
  let r = (v ^ x.m) & oM;
  r = rl(r, x.sh);
  r = (r + x.a) & oM;
  r = (r ^ x.ma) & oM;
  return r >>> 0;
}
function rr(v, s) {
  const a = s & 15;
  if (a === 0) return v & oM;
  return (((v >>> a) | (v << (16 - a))) & oM) >>> 0;
}
function dO(e, s, k, sa) {
  const x = o(s, k, sa);
  let r = (e ^ x.ma) & oM;
  r = (r - x.a + 0x10000) & oM;
  r = rr(r, x.sh);
  r = (r ^ x.m) & oM;
  return r >>> 0;
}
function dK(s, i) {
  const v = (s + (i * 977) + (i * 131)) & oM;
  return v === 0 ? 1 : v;
}
function cM(p, h, s, sa) {
  return ((p * 131) + (h * 17) + sa + s) & oM;
}
function nH(h, d, s, sa) {
  return ((h * 257) + d + sa + s) & oM;
}
function dNO(e, s, k, sa, st) {
  const rX = dO(e, s, k, sa);
  const m = cM(st.pn, st.nh, s, sa);
  const r = (rX ^ m) & oM;
  st.pn = r;
  st.nh = nH(st.nh, r, s, sa);
  return r;
}
function dOO(e, s, k, sa, st) {
  const rX = dO(e, s, k, sa);
  const m = cM(st.po, st.oh, s, sa);
  const r = (rX ^ m) & oM;
  st.po = r;
  st.oh = nH(st.oh, r, s, sa);
  return r;
}
function bR(t, d, s, n) {
  const m = new Map();
  for (const e of t) m.set(dO(e[0], e[1][0], d, s), n[e[1][0] - 1]);
  return m;
}
const bS = bR;
function bC(p) {
  const [, e, f, m] = p;
  const [oS, dS, bS, uS, eS, sS] = m;
  return { entry: e, fns: f, opcodeSeed: oS, defSeed: dS, binSpecs: bS, unarySpecs: uS, exprSpecs: eS, stmtSpecs: sS };
}
module.exports = {
  encodeOpcode: eO, decodeOpcode: dO, decodeNodeOpcode: dNO, decodeOpOpcode: dOO,
  deriveKey: dK, buildRawMap: bR, buildSpecMap: bS,
  buildOpcodeContext: bC,
  BINARY_NAMES: bN, UNARY_NAMES: uN, EXPR_NAMES: eN, STMT_NAMES: sN, LVALUE_NAMES: lN, FIELD_NAMES: fN,
  OP_MASK: oM
};

},
"utils/decode.js": function (module, exports, require, Buffer, process, console) {
'use strict';
const { deriveKey: dK, decodeOpcode: dOp, OP_MASK: oM } = require('./opcodes');
function bM(t, ds, s, n) {
  const m = new Map();
  for (const e of t) m.set(dOp(e[0], e[1][0], ds, s), n[e[1][0] - 1]);
  return m;
}
function dF(f, os, fi, s, rm) {
  const p = Array.isArray(f[0]) ? f[0] : [];
  const rb = Array.isArray(f[1]) ? f[1] : [];
  const v = f[2] === 1;
  const k = dK(os, fi);
  const st = { n: 0, op: 0, pn: 0, po: 0, nh: 0, oh: 0 };
  const b = rb.map(x => dS(x, k, st, s, rm));
  return { params: p, vararg: v, body: b };
}
function nN(st) { st.n += 1; return st.n; }
function nO(st) { st.op += 1; return st.op; }
function dNO(e, k, s, st) {
  const sl = nN(st);
  const rx = dOp(e, sl, k, s);
  const m = cM(st.pn, st.nh, sl, s);
  const r = (rx ^ m) & oM;
  st.pn = r; st.nh = nH(st.nh, r, sl, s);
  return r;
}
function dOO(e, k, s, st) {
  const sl = nO(st);
  const rx = dOp(e, sl, k, s);
  const m = cM(st.po, st.oh, sl, s);
  const r = (rx ^ m) & oM;
  st.po = r; st.oh = nH(st.oh, r, sl, s);
  return r;
}
function cM(p, h, sl, s) { return ((p * 131) + (h * 17) + s + sl) & oM; }
function nH(h, d, sl, s) { return ((h * 257) + d + s + sl) & oM; }
function rS(r, rm) { return rm.stmt.get(r) || `stmt_${r}`; }
function rE(r, rm) { return rm.expr.get(r) || `expr_${r}`; }
function rL(r, rm) { return rm.lval.get(r) || `lval_${r}`; }
function rF(r, rm) { return rm.field.get(r) || `field_${r}`; }
function rB(r, rm) { return rm.binary.get(r) || `bin_${r}`; }
function rU(r, rm) { return rm.unary.get(r) || `un_${r}`; }
function dS(s, k, st, slt, rm) {
  const a = s.slice();
  const rt = dNO(a[0], k, slt.stmt, st);
  const n = rS(rt, rm);
  a[0] = n;
  switch (n) {
    case 'local': a[2] = a[2].map(e => dE(e, k, st, slt, rm)); break;
    case 'assign':
      a[1] = a[1].map(lv => dL(lv, k, st, slt, rm));
      a[2] = a[2].map(e => dE(e, k, st, slt, rm));
      break;
    case 'expr': a[1] = dE(a[1], k, st, slt, rm); break;
    case 'return': a[1] = a[1].map(e => dE(e, k, st, slt, rm)); break;
    case 'if':
      a[1] = a[1].map(([c, b]) => [dE(c, k, st, slt, rm), b.map(x => dS(x, k, st, slt, rm))]);
      if (a[2]) a[2] = a[2].map(x => dS(x, k, st, slt, rm));
      break;
    case 'while':
      a[1] = dE(a[1], k, st, slt, rm);
      a[2] = a[2].map(x => dS(x, k, st, slt, rm));
      break;
    case 'repeat':
      a[1] = a[1].map(x => dS(x, k, st, slt, rm));
      a[2] = dE(a[2], k, st, slt, rm);
      break;
    case 'fornum':
      a[2] = dE(a[2], k, st, slt, rm);
      a[3] = dE(a[3], k, st, slt, rm);
      if (a[4]) a[4] = dE(a[4], k, st, slt, rm);
      a[5] = a[5].map(x => dS(x, k, st, slt, rm));
      break;
    case 'forin':
      a[2] = a[2].map(e => dE(e, k, st, slt, rm));
      a[3] = a[3].map(x => dS(x, k, st, slt, rm));
      break;
    case 'do':
      a[1] = a[1].map(x => dS(x, k, st, slt, rm));
      break;
    case 'func':
      a[2] = dL(a[2], k, st, slt, rm);
      break;
  }
  return a;
}
function dE(e, k, st, slt, rm) {
  if (!e || !Array.isArray(e)) return e;
  const a = e.slice();
  const rt = dNO(a[0], k, slt.expr, st);
  const n = rE(rt, rm);
  a[0] = n;
  switch (n) {
    case 'binary':
      a[1] = rB(dOO(a[1], k, slt.binary, st), rm);
      a[2] = dE(a[2], k, st, slt, rm);
      a[3] = dE(a[3], k, st, slt, rm);
      break;
    case 'unary':
      a[1] = rU(dOO(a[1], k, slt.unary, st), rm);
      a[2] = dE(a[2], k, st, slt, rm);
      break;
    case 'member':
      a[1] = dE(a[1], k, st, slt, rm);
      if (a[3] === 1) a[2] = dE(a[2], k, st, slt, rm);
      break;
    case 'call':
      a[1] = dE(a[1], k, st, slt, rm);
      a[2] = a[2].map(x => dE(x, k, st, slt, rm));
      break;
    case 'table':
      a[1] = a[1].map(f => dFi(f, k, st, slt, rm));
      break;
  }
  return a;
}
function dL(lv, k, st, slt, rm) {
  const a = lv.slice();
  const rt = dNO(a[0], k, slt.lval, st);
  let n = rL(rt, rm);
  if (n.startsWith('lval_')) {
    n = lv.length === 2 ? 'id' : 'member';
    rm.lval.set(rt, n);
  }
  a[0] = n;
  if (a[0] === 'member') {
    a[1] = dE(a[1], k, st, slt, rm);
    if (a[3] === 1) a[2] = dE(a[2], k, st, slt, rm);
  }
  return a;
}
function dFi(f, k, st, slt, rm) {
  const a = f.slice();
  const rt = dNO(a[0], k, slt.field, st);
  let n = rF(rt, rm);
  if (n.startsWith('field_')) {
    if (f.length === 2) n = 'array';
    else if (typeof f[1] === 'number') n = 'record';
    else n = 'general';
    rm.field.set(rt, n);
  }
  a[0] = n;
  if (a[0] === 'array') a[1] = dE(a[1], k, st, slt, rm);
  else if (a[0] === 'record') a[2] = dE(a[2], k, st, slt, rm);
  else { a[1] = dE(a[1], k, st, slt, rm); a[2] = dE(a[2], k, st, slt, rm); }
  return a;
}
function dI(p, s, rm) {
  return { entry: p[1], fns: p[2].map((f, i) => dF(f, p[3][0], i + 1, s, rm)) };
}
module.exports = { decodeIR: dI, buildRawMap: bM, decodeFunction: dF, decodeStmt: dS, decodeExpr: dE };

},
"utils/ir2lua.js": function (module, exports, require, Buffer, process, console) {
'use strict';
const bO = ['+','-','*','/','%','^','..','==','~=','<','<=','>','>=','&','|','~','<<','>>'];
const uO = ['-','not','#','~'];
const P = { 'or':1,'and':2,'<':3,'<=':3,'>':3,'>=':3,'==':3,'~=':3,'..':4,'+':5,'-':5,'*':6,'/':6,'%':6,'^':8,'#':7,'not':7 };
function nP(o, c, ir) {
  const p = P[o] || 0, ch = P[c] || 0;
  if (ch === 0) return false;
  if (p > ch) return true;
  if (p === ch && ir && o !== '^') return true;
  return false;
}
function gOp(n) {
  if (!n || !Array.isArray(n)) return null;
  if (n[0] === 'binary') return typeof n[1] === 'string' ? n[1] : bO[(n[1] || 1) - 1] || '?';
  if (n[0] === 'unary') return typeof n[1] === 'string' ? n[1] : uO[(n[1] || 1) - 1] || '?';
  return null;
}
class G {
  constructor(n, s) { this.n = n; this.s = s; this.i = 0; }
  nm(r) { return this.n[r - 1] || ('_n' + r); }
  st(r) { return this.s[r - 1]; }
  id() { return '  '.repeat(this.i); }
  ex(e, f) {
    if (!e || !Array.isArray(e)) return '?';
    const [t, ...a] = e;
    switch (t) {
      case 'id': return this.nm(a[0]);
      case 'str': return lS(this.st(a[0]));
      case 'num': return String(a[0]);
      case 'bool': return a[0] === 1 ? 'true' : 'false';
      case 'nil': return 'nil';
      case 'vararg': return '...';
      case 'binary': {
        const o = typeof a[0] === 'string' ? a[0] : bO[(a[0] || 1) - 1] || '?';
        const l = this.ex(a[1], f), r = this.ex(a[2], f);
        const le = a[1], re = a[2];
        const wl = le && nP(o, gOp(le), false);
        const wr = re && nP(o, gOp(re), true);
        return `${wl ? '(' + l + ')' : l} ${o} ${wr ? '(' + r + ')' : r}`;
      }
      case 'unary': {
        const o = typeof a[0] === 'string' ? a[0] : uO[(a[0] || 1) - 1] || '?';
        const ar = this.ex(a[1], f);
        const sp = /[a-z]/.test(o) ? ' ' : '';
        return `${o}${sp}${ar}`;
      }
      case 'member': {
        const b = this.ex(a[0], f);
        if (a[2] === 1) return `${b}[${this.ex(a[1], f)}]`;
        return `${b}.${this.nm(a[1])}`;
      }
      case 'call': {
        const b = a[0], c = a[1] || [], s = a[2] === 1;
        if (s && Array.isArray(b) && b[0] === 'member' && b[2] !== 1) {
          const ob = this.ex(b[1], f), mt = this.nm(b[2]);
          return `${ob}:${mt}(${c.map(x => this.ex(x, f)).join(', ')})`;
        }
        return `${this.ex(b, f)}(${c.map(x => this.ex(x, f)).join(', ')})`;
      }
      case 'table': {
        const fi = a[0] || [];
        if (fi.length === 0) return '{}';
        return `{${fi.map(x => this.fd(x, f)).join(', ')}}`;
      }
      case 'function': {
        const fn = f[a[0] - 1];
        if (!fn) return 'function(...) end';
        return this.fE(fn, f);
      }
      case 'mini': return this.mE(a[0], f);
      default: return `nil`;
    }
  }
  fd(f, fs) {
    const [t, ...a] = f;
    if (t === 'array') return this.ex(a[0], fs);
    if (t === 'record') return `${this.nm(a[0])} = ${this.ex(a[1], fs)}`;
    return `[${this.ex(a[0], fs)}] = ${this.ex(a[1], fs)}`;
  }
  mE(p, f) {
    if (!p || !p.length) return 'nil';
    const s = [];
    for (const i of p) {
      const o = i[0];
      if (o === 1) s.push({ v: this.nm(i[1]), op: null });
      else if (o === 2) s.push({ v: lS(this.st(i[1])), op: null });
      else if (o === 3) s.push({ v: String(i[1]), op: null });
      else if (o === 4) s.push({ v: i[1] === 1 ? 'true' : 'false', op: null });
      else if (o === 5) s.push({ v: 'nil', op: null });
      else if (o === 6) { const b = s.pop(); s.push({ v: `${b.v}.${this.nm(i[1])}`, op: null }); }
      else if (o === 7) { const k = s.pop(); const b = s.pop(); s.push({ v: `${b.v}[${k.v}]`, op: null }); }
      else if (o === 8) { 
        const a = s.pop(); const u = uO[(i[1] || 1) - 1] || '?'; 
        const aV = (a.op && nP(u, a.op, false)) ? `(${a.v})` : a.v;
        s.push({ v: `${u}${/[a-z]/.test(u) ? ' ' : ''}${aV}`, op: u }); 
      }
      else if (o === 9) { 
        const r = s.pop(); const l = s.pop(); const bo = bO[(i[1] || 1) - 1] || '?'; 
        const lV = (l.op && nP(bo, l.op, false)) ? `(${l.v})` : l.v;
        const rV = (r.op && nP(bo, r.op, true)) ? `(${r.v})` : r.v;
        s.push({ v: `${lV} ${bo} ${rV}`, op: bo }); 
      }
    }
    return s[0] ? s[0].v : 'nil';
  }
  lv(l, f) {
    const [t, ...a] = l;
    if (t === 'id') return this.nm(a[0]);
    const b = this.ex(a[0], f);
    if (a[2] === 1) return `${b}[${this.ex(a[1], f)}]`;
    return `${b}.${this.nm(a[1])}`;
  }
  sm(s, f) {
    if (!s || !Array.isArray(s)) return '';
    const [t, ...a] = s, id = this.id();
    switch (t) {
      case 'local': {
        const v = a[0].map(r => this.nm(r)).join(', '), vl = a[1];
        if (!vl || vl.length === 0) return `${id}local ${v}`;
        return `${id}local ${v} = ${vl.map(e => this.ex(e, f)).join(', ')}`;
      }
      case 'assign': return `${id}${a[0].map(x => this.lv(x, f)).join(', ')} = ${a[1].map(x => this.ex(x, f)).join(', ')}`;
      case 'expr': return `${id}${this.ex(a[0], f)}`;
      case 'return': return (!a[0] || a[0].length === 0) ? `${id}return` : `${id}return ${a[0].map(e => this.ex(e, f)).join(', ')}`;
      case 'if': {
        let o = '';
        for (let i = 0; i < a[0].length; i++) {
          o += i === 0 ? `${id}if ${this.ex(a[0][i][0], f)} then\n` : `${id}elseif ${this.ex(a[0][i][0], f)} then\n`;
          o += this.bk(a[0][i][1], f);
        }
        if (a[1]) o += `${id}else\n${this.bk(a[1], f)}`;
        return o + `${id}end`;
      }
      case 'while': return `${id}while ${this.ex(a[0], f)} do\n${this.bk(a[1], f)}${id}end`;
      case 'repeat': return `${id}repeat\n${this.bk(a[0], f)}${id}until ${this.ex(a[1], f)}`;
      case 'fornum': return `${id}for ${this.nm(a[0])} = ${this.ex(a[1], f)}, ${this.ex(a[2], f)}${a[3] ? `, ${this.ex(a[3], f)}` : ''} do\n${this.bk(a[4], f)}${id}end`;
      case 'forin': return `${id}for ${a[0].map(r => this.nm(r)).join(', ')} in ${a[1].map(e => this.ex(e, f)).join(', ')} do\n${this.bk(a[2], f)}${id}end`;
      case 'break': return `${id}break`;
      case 'continue': return `${id}continue`;
      case 'do': return `${id}do\n${this.bk(a[0], f)}${id}end`;
      case 'func': {
        const il = a[0] === 1, l = this.lv(a[1], f), fn = f[a[2] - 1];
        if (!fn) return `${id}${il ? 'local ' : ''}function ${l}() end`;
        const p = fn.params.map(r => this.nm(r)).join(', ');
        const v = fn.vararg ? (fn.params.length > 0 ? ', ...' : '...') : '';
        let o = `${id}${il ? 'local ' : ''}function ${l}(${p}${v})\n`;
        this.i++; o += this.bk(fn.body, f); this.i--;
        return o + `${id}end`;
      }
      default: return ``;
    }
  }
  bk(s, f) {
    if (!s) return '';
    this.i++; const l = s.map(x => this.sm(x, f)).filter(Boolean); this.i--;
    return l.map(x => x + '\n').join('');
  }
  fE(f, fs) {
    const p = f.params.map(r => this.nm(r)).join(', ');
    const v = f.vararg ? (f.params.length > 0 ? ', ...' : '...') : '';
    let o = `function(${p}${v})\n`;
    o += this.bk(f.body, fs);
    return o + `${this.id()}end`;
  }
  pr(m) {
    const { entry: e, fns: f } = m, r = f[e - 1];
    if (!r) return '';
    return this.bk(r.body, f).trimEnd();
  }
}
function lS(s) {
  if (s === null || s === undefined) return '""';
  return '"' + String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r') + '"';
}
module.exports = { Gen: G, luaStr: lS };

},
"Beautiful/beautifier.js": function (module, exports, require, Buffer, process, console) {
/*
    discord.gg/boronide


    Luamin.js | beautify or minify your Lua scripts!

*/



// This project is old, stop dming me about bad coding practice. Thanks.


function hashString(key) {
    var hash = 0, i = key.length;

    while (i--) {
        hash += key.charCodeAt(i);
        hash += (hash << 10);
        hash ^= (hash >> 6);
    }
    hash += (hash << 3);
    hash ^= (hash >> 11);
    hash += (hash << 15);
    return hash;
}

const print = console.log
const assert = function (a, b) {
    if (!a) {
        throw b
    }
}

function parseFloat(str, radix) {
    if (!str) return 0;
    var parts = str.toString().split(".");
    if (parts.length > 1) {
        return parseInt(parts[0], radix) + parseInt(parts[1], radix) / Math.pow(radix, parts[1].length);
    }
    return parseInt(parts[0], radix);
}

function transformA2B(a, b) {
    if (b == null) return;
    for (var [i, v] of Object.entries(b)) {
        a[i] = v
    }
}

let WhiteChars = [
    ' ',
    '\n',
    '\t',
    '\r'
]

let Main_CharacterForEscape = {
    'r': '\r',
    'n': '\n',
    't': '\t',
    '"': '"',
    "'": "'",
    '\\': '\\',
}

const CharacterForEscape = new Proxy(Main_CharacterForEscape, {
    get(a, b) { return parseFloat(b) }
})

let AllIdentStartChars = [
    'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X',
    'Y', 'Z', '_', 'a',
    'b', 'c', 'd', 'e',
    'f', 'g', 'h', 'i',
    'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q',
    'r', 's', 't', 'u',
    'v', 'w', 'x', 'y',
    'z'
]

let AllIdentChars = [
    '0', '1', '2', '3',
    '4', '5', '6', '7',
    '8', '9',


    'A', 'B',
    'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z',
    '_', 'a', 'b', 'c',
    'd', 'e', 'f', 'g',
    't', 'u', 'v', 'w',
    'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's',
    'x', 'y', 'z',
]

let Digits = [
    '0', '1', '2', '3',
    '4', '5', '6', '7',
    '8', '9',
]

let HexDigits = [
    '0', '1', '2', '3',
    '4', '5', '6', '7',
    '8', '9',

    'a', 'b', 'c', 'd', 'e', 'f',
    'A', 'B', 'C', 'D', 'E', 'F',
]

let Symbols = [
    '+', '-', '*', ')', ';',
    '/', '^', '%', '#',
    ',', '{', '}', ':',
    '[', ']', '(', '.', '`'
]

let EqualSymbols = [
    '~', '=', '>', '<'
]

let CompoundSymbols = [
    '+', '-', '*', '/', '^', '..', '%', '//'
]

let Compounds = [
    '+=', '-=', '*=', '/=', '^=', '..=', '%=', '//='
]

let Keywords = [
    'and', 'break', 'do', 'else',
    'elseif', 'end', 'false', 'for',
    'function', 'goto', 'if', 'in',
    'local', 'nil', 'not', 'or',
    'repeat', 'return', 'then', 'true',
    'until', 'while', 'continue'
]

let IdentKeywords = [
    'continue', 'goto'
]

let BlockFollowKeyword = [
    'else', 'elseif',
    'until', 'end'
]

let UnopSet = [
    '-', 'not', '#', '~'
]

let BinopSet = [
    '+', '-', '*', '/', '%', '^', '#', '//',
    '&', '|', '~', '<<', '>>',
    '..', '.', ':',
    '>', '<', '<=', '>=', '~=', '==',
    '+=', '-=', '*=', '/=', '%=', '^=', '..=', '//=',
    'and', 'or'
]

let UnaryPriority = 11
let BinaryPriority = {
    '^': [13, 12],
    '%': [10, 10],
    '//': [10, 10],
    '/': [10, 10],
    '*': [10, 10],
    '+': [9, 9],
    '-': [9, 9],

    '..': [8, 7],
    '>>': [7, 7],
    '<<': [7, 7],
    '&': [6, 6],
    '~': [5, 5],
    '|': [4, 4],

    '==': [3, 3],
    '~=': [3, 3],
    '>=': [3, 3],
    '<=': [3, 3],
    '>': [3, 3],
    '<': [3, 3],

    '+=': [3, 3],
    '-=': [3, 3],
    '*=': [3, 3],
    '/=': [3, 3],
    '^=': [3, 3],
    '%=': [3, 3],
    '..=': [3, 3],
    '//=': [3, 3],

    'and': [2, 2],
    'or': [1, 1],
}

function CreateLuaTokenStream(text) {
    let p = 0
    let length = text.length
    let tokenBuffer = []

    function look(n) {
        n = n || 0
        if (p <= length) {
            return text.substr(p + n, 1)
        } else {
            return ''
        }
    }

    function get() {
        if (p <= length) {
            let c = text.substr(p, 1)
            p++
            return c
        } else {
            return ''
        }
    }

    function error(str) {
        let q = 0
        let line = 1
        let char = 1
        while (q <= p) {
            if (text.substr(q, 1) == '\n') {
                line++
                char = 1
            } else {
                char++
            }
        }
        let i_;
        for (i_ = 0; i_ < tokenBuffer.length; i_++) {
            let token = tokenBuffer[i_]
            print(`${token.Type}<${token.Source}>`)
        }
        throw `file<${line}:${char}>: ${str}`
    }

    function longdata(eqcount) {
        while (true) {
            let c = get()
            if (c == '') {
                error("Unfinished long string.")
            } else if (c == ']') {
                let done = true // Until contested
                let i;
                for (i = 1; i <= eqcount; i++) {
                    if (look() == '=') {
                        p++
                    } else {
                        done = false
                        break
                    }
                }
                if (done && get() == ']') {
                    return
                }
            }
        }
    }

    function getopen() {
        let startp = p
        while (look() == '=') {
            p++
        }
        if (look() == '[') {
            p++
            return p - startp - 1
        } else {
            p = startp
            return
        }
    }

    let whiteStart = 0
    let tokenStart = 0
    let tokens = 0
    function token(type) {
        tokens++

        let src = text.substr(tokenStart, (p - tokenStart))
        let ntype = null
        if (type == "Number") {
            src = src.replace(/[\_]+/g, '');

            if (src.substr(0, 2).toLowerCase() == "0x") {
                ntype = 'hex'
                if (parseInt(src, 16) < 999999999999)
                    src = parseInt(src, 16)
            } else if (src.substr(0, 2).toLowerCase() == "0b") {
                ntype = 'bin'
                if (parseInt(src.substr(2), 2) < 999999999999)
                    src = parseInt(src.substr(2), 2)
            }
        }
        let tk = {
            'Type': type,
            'LeadingWhite': text.substr(whiteStart, (tokenStart - whiteStart)),
            'Source': src
        }
        if (ntype !== null) {
            tk.NType = ntype
        }
        tokenBuffer.push(tk)

        whiteStart = p
        tokenStart = p
        return tk
    }

    while (true) {
        whiteStart = p
        while (true) {
            let c = look()
            if (c == '') {
                break
            } else if (c == '-') {
                if (look(1) == "-") {
                    p += 2

                    if (look() == "[") {
                        p++
                        let eqcount = getopen()

                        if (eqcount != null) {
                            longdata(eqcount)
                            whiteStart = p
                        } else {
                            while (true) {
                                let c2 = get()
                                if (c2 == "" || c2 == "\n") {
                                    break
                                }
                            }
                        }
                    } else {
                        while (true) {
                            let c2 = get()
                            if (c2 == "" || c2 == "\n") {
                                break
                            }
                        }
                    }
                } else {
                    break
                }
            } else if (WhiteChars.includes(c)) {
                p++
            } else {
                break
            }
        }

        tokenStart = p
        let c1 = get()
        if (c1 == '') {
            // End of file
            token('Eof')
            break
        } else if (c1 == '\'' || c1 == '\"') {
            // String constant
            while (true) {
                let c2 = get()
                if (c2 == '\\') {
                    let c3 = get()
                    let esc = CharacterForEscape[c3]
                    if (esc == null) {
                        throw (`Invalid Escape Sequence \`${c3}\`.`)
                    }
                } else if (c2 == c1) {
                    break
                } else if (c2 == "") {
                    throw ("Unfinished string!")
                }
            }
            token('String')
        } else if (c1 == '`') {
            // Hash string
            while (true) {
                let c2 = get()
                if (c2 == '\\') {
                    let c3 = get()
                    let esc = CharacterForEscape[c3]
                    if (esc == null) {
                        throw (`Invalid Escape Sequence \`${c3}\`.`)
                    }
                } else if (c2 == c1) {
                    break
                } else if (c2 == "") {
                    throw ("Unfinished string!")
                }
            }

            token('Hash')
        } else if (AllIdentStartChars.includes(c1)) {
            // Ident or keyword
            while (AllIdentChars.includes(look())) {
                p++
            }

            if (Keywords.includes(text.substr(tokenStart, (p - tokenStart)))) {
                token("Keyword")
            } else {
                token("Ident")
            }

        } else if (Digits.includes(c1) || (c1 == '.' && Digits.includes(look()))) {
            // Number
            if (c1 == '0' && look().toLowerCase() == 'x') {
                p++
                // Hex number
                while (HexDigits.includes(look()) || look() === '_') {
                    p++
                }
            } else if (c1 == '0' && look().toLowerCase() == 'b') {
                p++
                // Binary number
                while (look() === '0' || look() === '1' || look() === '_') {
                    p++
                }
            } else {
                // Normal number
                while (Digits.includes(look()) || look() === '_') {
                    p++
                }

                if (look() == '.') {
                    // With decimal point
                    p++
                    while (Digits.includes(look())) {
                        p++
                    }
                }

                if (look() == 'e' || look() == 'E') {
                    // With exponent
                    p++
                    if (look() == '-' || look() == '+') {
                        p++
                    }
                    while (Digits.includes(look())) {
                        p++
                    }
                }
            }
            token("Number")
        } else if (c1 == '[') {
            // Symbol or Long String
            let eqCount = getopen()
            if (eqCount != null) {
                // Long String
                longdata(eqCount)
                token("String")
            } else {
                // Symbol
                token("Symbol")
            }
        } else if (c1 == '.') {
            // Greedily consume up to 3 `.` for . / .. / ... tokens / ..= compound
            if (look() == '.') {
                get()
                if (look() == '.') {
                    get()
                } else if (look() == '=') {
                    get()
                }
            }
            token("Symbol")
        } else if ((c1 + look()) == '//') {
            // Floor Division -& Compound
            get()
            if (look() == '=')
                get()
            token('Symbol')
        } else if ((c1 + look()) == '::') {
            get()
            token('Symbol')
        } else if (BinopSet.includes(c1 + look())) {
            // Binary Operations 
            get()
            token("Symbol")
        } else if (EqualSymbols.includes(c1)) {
            // Single or double equal sign
            if (look() == "=") {
                p++
            }
            token("Symbol")
        } else if (CompoundSymbols.includes(c1) && look() == '=') {
            // Compounds
            get()
            token('Symbol')
        } else if (Symbols.includes(c1)) {
            // Symbols
            token("Symbol")
        } else {
            throw (`Bad symbol \`${c1}\` in source. ${p}`)
        }
    }

    return tokenBuffer
}

function CreateLuaParser(text) {
    // Token stream and pointer into it
    let tokens = CreateLuaTokenStream(text)

    let p = 0
    function get() {
        let tok = tokens[p]
        if (p < tokens.length) {
            p++
        }
        return tok
    }
    function peek(n) {
        n = p + (n || 0)
        return tokens[n] || tokens[tokens.length - 1]
    }

    function getTokenStartPosition(token) {
        let line = 1
        let char = 0
        let tkNum = 0
        while (true) {
            let tk = tokens[tkNum]
            let text
            if (tk == token) {
                text = tk.LeadingWhite
            } else {
                text = tk.LeadingWhite + tk.Source
            }

            let i
            for (i = 0; i <= text.length; i++) {
                let c = text.substr(i, 1)
                if (c == '\n') {
                    line++
                    char = 0
                } else {
                    char++
                }
            }

            if (tk == token) {
                break
            }
            tkNum++
        }
        return `${line}:${char + 1}`
    }

    function debugMark() {
        let tk = peek()
        return `<${tk.Type} \`${tk.Source}\`> at: ${getTokenStartPosition(tk)}`
    }

    function isBlockFollow() {
        let tok = peek()
        return tok.Type == 'Eof' || (tok.Type == 'Keyword' && BlockFollowKeyword.includes(tok.Source))
    }

    function isUnop() {
        return UnopSet.includes(peek().Source) || false
    }

    function isBinop() {
        return BinopSet.includes(peek().Source) || false
    }

    function expect(type, source) {
        let tk = peek()
        if (tk.Type == type && (source == null || tk.Source == source)) {
            return get()
        } else if (
            (tk.Type == 'Keyword' && type == 'Ident')
            && IdentKeywords.includes(tk.Source)
            && (source == null || tk.Source == source)) {
            return get()
        } else {
            let i
            for (i = -3; i <= 3; i++) {
                print(`Tokens[${i}] = \`${peek(i).Source}\``)
            }
            if (source) {
                let a = `${getTokenStartPosition(tk)}: \`${source}\` expected.`
                throw a
            } else {
                let a = `${getTokenStartPosition(tk)}: ${type} expected.`
                throw a
            }
        }
    }

    function MkNode(node) {
        let getf = node.GetFirstToken
        let getl = node.GetLastToken

        let self = node
        node.GetFirstToken = function () {
            let t = getf(self)
            assert(t)
            return t
        }

        node.GetLastToken = function () {
            let t = getl(self)
            assert(t)
            return t
        }

        return node
    }

    let block
    let expr

    function exprlist(locals, upvals) {
        let exprList = [expr(locals, upvals)]
        let commaList = []
        while (peek().Source == ",") {
            commaList.push(get())
            exprList.push(expr(locals, upvals))
        }
        return [exprList, commaList]
    }

    function prefixexpr(locals, upvals) {
        let tk = peek()
        if (tk.Source == '(') {
            let oparenTk = get()
            let inner = expr(locals, upvals)
            let cparenTk = expect('Symbol', ')')
            let node
            node = MkNode({
                'Type': 'ParenExpr',
                'Expression': inner,
                'Token_OpenParen': oparenTk,
                'Token_CloseParen': cparenTk,
                'GetFirstToken': () => node.Token_OpenParen,
                'GetLastToken': () => node.Token_CloseParen,
            })
            return node
        } else if ((tk.Type == "Ident") || (tk.Type == "Keyword" && IdentKeywords.includes(tk.Source))) {
            let node
            node = MkNode({
                'Type': 'VariableExpr',
                'Token': get(),
                'GetFirstToken': () => node.Token,
                'GetLastToken': () => node.Token,
            })

            if (locals[node.Token.Source] != null && locals[node.Token.Source]?.Tokens?.push != null) {
                locals[node.Token.Source].Tokens.push(node.Token)
                locals[node.Token.Source].UseCountIncrease()
            } else if (upvals[node.Token.Source] != null && upvals[node.Token.Source]?.Tokens?.push != null) {
                upvals[node.Token.Source].Tokens.push(node.Token)
                upvals[node.Token.Source].UseCountIncrease()
            }

            return node
        } else {
            print(debugMark())
            let a = (`${getTokenStartPosition(tk)}: Unexpected symbol. ${tk.Type} ${tk.Source}`)
            throw a
        }
    }

    function tableexpr(locals, upvals) {
        let obrace = expect("Symbol", "{")
        let entries = []
        let seperators = []
        while (peek().Source != "}") {
            let indx
            let val
            if (peek().Source == '[') {
                // Index
                let obrac = get()
                let index = expr(locals, upvals)
                let cbrac = expect("Symbol", "]")
                let eq = expect("Symbol", "=")
                let value = expr(locals, upvals)

                indx = index.Token && index.Token.Source
                val = value

                entries.push({
                    "EntryType": "Index",
                    "Index": index,
                    "Value": value,
                    "Token_OpenBracket": obrac,
                    "Token_CloseBracket": cbrac,
                    "Token_Equals": eq,
                })
            } else if ((peek().Type == "Ident" || (peek().Type == "Keyword" && IdentKeywords.includes(peek().Source))) && peek(1).Source == "=") {
                // Field
                let field = get()
                let eq = get()
                let value = expr(locals, upvals)

                indx = field
                val = value
                entries.push({
                    "EntryType": "Field",
                    "Field": field,
                    "Value": value,
                    "Token_Equals": eq,
                })
            } else {
                // Value

                let value = expr(locals, upvals)
                entries.push({
                    "EntryType": "Value",
                    "Value": value,
                })
            }

            if (peek().Source == "," || peek().Source == ";") {
                seperators.push(get())
            } else {
                break
            }
        }

        let cbrace = expect("Symbol", "}")
        let node
        node = MkNode({
            "Type": "TableLiteral",
            "EntryList": entries,
            "Token_SeperatorList": seperators,
            "Token_OpenBrace": obrace,
            "Token_CloseBrace": cbrace,
            "GetFirstToken": () => node.Token_OpenBrace,
            "GetLastToken": () => node.Token_CloseBrace,
        })
        return node
    }

    function varlist(acceptVarg, localdecl) {
        let varList = []
        let commaList = []
        if ((peek().Type == "Ident") || (peek().Type == "Keyword" && IdentKeywords.includes(peek().Source))) {
            let idn = get()
            if (localdecl) {
                if (peek().Source == '<' && peek(2).Source == '>') {
                    let attrb = peek(1).Source
                    idn.Attribute = { LeadingWhite: peek().LeadingWhite, Source: `<${attrb}>` }
                    get();
                    get();
                    get();
                }
            }
            varList.push(idn)
        } else if (peek().Source == "..." && acceptVarg) {
            return [varList, commaList, get()]
        }
        while (peek().Source == ",") {
            commaList.push(get())
            if (peek().Source == "..." && acceptVarg) {
                return [varList, commaList, get()]
            } else {
                let id = expect("Ident")
                if (localdecl) {
                    if (peek().Source == '<' && peek(2).Source == '>') {
                        let attrb = peek(1).Source
                        id.Attribute = { LeadingWhite: peek().LeadingWhite, Source: `<${attrb}>` }
                        get();
                        get();
                        get();
                    }
                }
                varList.push(id)
            }
        }
        return [varList, commaList]
    }

    function blockbody(terminator, locals, upvals) {
        let body = block(locals, upvals)
        let after = peek()
        if (after.Type == "Keyword" && after.Source == terminator) {
            get()
            return [body, after]
        } else {
            print(after.Type, after.Source)
            throw `${getTokenStartPosition(after)}: ${terminator} expected.`
        }
    }

    function funcdecl(isAnonymous, locals, upvals, local) {
        let functionKw = get()

        let nameChain
        let nameChainSeperator

        if (!isAnonymous) {
            nameChain = []
            nameChainSeperator = []

            let token = expect("Ident")
            nameChain.push(token)

            while (peek().Source == ".") {
                nameChainSeperator.push(get())
                nameChain.push(expect("Ident"))
            }

            if (peek().Source == ":") {
                nameChainSeperator.push(get())
                nameChain.push(expect("Ident"))
            }
        }

        let oparenTk = expect("Symbol", "(")

        let [argList, argCommaList, vargToken] = varlist(true)
        let cparenTk = expect("Symbol", ")")
        let [fbody, enTk] = blockbody("end", locals, upvals)

        let node
        node = MkNode({
            "Type": (isAnonymous == true ? "FunctionLiteral" : "FunctionStat"),
            "NameChain": nameChain,
            "ArgList": argList,
            "Body": fbody,

            "Token_Function": functionKw,
            "Token_NameChainSeperator": nameChainSeperator,
            "Token_OpenParen": oparenTk,
            "Token_Varg": vargToken,
            "Token_ArgCommaList": argCommaList,
            "Token_CloseParen": cparenTk,
            "Token_End": enTk,
            "GetFirstToken": () => node.Token_Function,
            "GetLastToken": () => node.Token_End,
        })
        return node
    }

    function functionargs(locals, upvals) {
        let tk = peek()
        if (tk.Source == "(") {
            let oparenTk = get()
            let argList = []
            let argCommaList = []
            while (peek().Source != ")") {
                argList.push(expr(locals, upvals));
                if (peek().Source == ",") {
                    argCommaList.push(get())
                } else {
                    break
                }
            }

            let cparenTk = expect("Symbol", ")")
            let node
            node = MkNode({
                "CallType": "ArgCall",
                "ArgList": argList,

                "Token_CommaList": argCommaList,
                "Token_OpenParen": oparenTk,
                "Token_CloseParen": cparenTk,
                "GetFirstToken": () => node.Token_OpenParen,
                "GetLastToken": () => node.Token_CloseParen,
            })
            return node
        } else if (tk.Source == "{") {
            let node
            node = MkNode({
                "CallType": "TableCall",
                "TableExpr": expr(locals, upvals),
                "GetFirstToken": () => node.TableExpr.GetFirstToken(),
                "GetLastToken": () => node.TableExpr.GetLastToken(),
            })
            return node
        } else if (tk.Type == "String") {
            let node
            node = MkNode({
                "CallType": "StringCall",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else {
            throw "Function arguments expected."
        }
    }


    function primaryexpr(locals, upvals) {
        let base = prefixexpr(locals, upvals)
        assert(base, "nil prefixexpr")

        while (true) {
            let tk = peek()

            if (tk.Source == ".") {
                let dotTk = get()
                let fieldName = expect("Ident")
                let node
                node = MkNode({
                    "Type": "FieldExpr",
                    "Base": base,
                    "Field": fieldName,
                    "Token_Dot": dotTk,
                    "GetFirstToken": () => node.Base.GetFirstToken(),
                    "GetLastToken": () => node.Field,
                })
                base = node
            } else if (tk.Source == ":") {
                let colonTk = get()
                let methodName = expect("Ident")
                let fargs = functionargs(locals, upvals)
                let node
                node = MkNode({
                    "Type": "MethodExpr",
                    "Base": base,
                    "Method": methodName,
                    "FunctionArguments": fargs,
                    "Token_Colon": colonTk,
                    "GetFirstToken": () => node.Base.GetFirstToken(),
                    "GetLastToken": () => node.FunctionArguments.GetLastToken(),
                })
                base = node
            } else if (tk.Source == "[") {
                let obrac = get()
                let index = expr(locals, upvals)
                let cbrac = expect("Symbol", "]")
                let node
                node = MkNode({
                    "Type": "IndexExpr",
                    "Base": base,
                    "Index": index,
                    "Token_OpenBracket": obrac,
                    "Token_CloseBracket": cbrac,
                    "GetFirstToken": () => node.Base.GetFirstToken(),
                    "GetLastToken": () => node.Token_CloseBracket,
                })
                base = node
            } else if (tk.Source == "{" || tk.Source == "(" || tk.Type == "String") {
                let node
                node = MkNode({
                    "Type": "CallExpr",
                    "Base": base,
                    "FunctionArguments": functionargs(locals, upvals),
                    "GetFirstToken": () => node.Base.GetFirstToken(),
                    "GetLastToken": () => node.FunctionArguments.GetLastToken(),
                })
                base = node
            } else if (Compounds.includes(tk.Source)) {
                let compoundTk = get()
                let rhsExpr = expr(locals, upvals)

                let node
                node = MkNode({
                    "Type": "CompoundStat",
                    "Base": base,
                    "Token_Compound": compoundTk,
                    "Rhs": rhsExpr,
                    "Lhs": base,
                    "GetFirstToken": () => node.Base.GetFirstToken(),
                    "GetLastToken": () => node.Rhs.GetLastToken(),
                })
                base = node
            } else {
                return base
            }
        }
    }

    function simpleexpr(locals, upvals) {
        let tk = peek()
        if (tk.Type == "Number") {
            let node
            node = MkNode({
                "Type": "NumberLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token
            })

            return node
        } else if (tk.Type == "String") {
            let node
            node = MkNode({
                "Type": "StringLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else if (tk.Type == "Hash") {
            let node
            node = MkNode({
                "Type": "HashLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else if (tk.Source == "nil") {
            let node
            node = MkNode({
                "Type": "NilLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else if (tk.Source == "true" || tk.Source == "false") {
            let node
            node = MkNode({
                "Type": "BooleanLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else if (tk.Source == "...") {
            let node
            node = MkNode({
                "Type": "VargLiteral",
                "Token": get(),
                "GetFirstToken": () => node.Token,
                "GetLastToken": () => node.Token,
            })
            return node
        } else if (tk.Source == "{") {
            return tableexpr(locals, upvals)
        } else if (tk.Source == "function") {
            return funcdecl(true, locals, upvals)
        } else if (tk.Source == "if") {
            return ifstat(true, locals, upvals)
        } else {
            return primaryexpr(locals, upvals)
        }
    }

    function subexpr(limit, locals, upvals) {
        let curNode
        if (isUnop()) {
            let opTk = get()
            let ex = subexpr(UnaryPriority, locals, upvals)
            let node
            node = MkNode({
                "Type": "UnopExpr",
                "Token_Op": opTk,
                "Rhs": ex,
                "GetFirstToken": () => node.Token_Op,
                "GetLastToken": () => node.Rhs.GetLastToken(),
            })
            curNode = node
        } else {
            curNode = simpleexpr(locals, upvals)
            assert(curNode, "nil sipleexpr")
        }

        while (isBinop() && BinaryPriority[peek().Source] != undefined && BinaryPriority[peek().Source][0] > limit) {
            let opTk = get()
            let rhs = subexpr(BinaryPriority[opTk.Source][1], locals, upvals)
            assert(rhs, "RhsNeeded")
            let node
            node = MkNode({
                "Type": "BinopExpr",
                "Lhs": curNode,
                "Rhs": rhs,
                "Token_Op": opTk,
                "GetFirstToken": () => node.Lhs.GetFirstToken(),
                "GetLastToken": () => node.Rhs.GetLastToken(),
            })
            curNode = node
        }
        return curNode
    }

    expr = (locals, upvals) => subexpr(0, locals, upvals)

    function exprstat(locals, upvals) {
        let ex = primaryexpr(locals, upvals)

        if (ex.Type == "MethodExpr" || ex.Type == "CallExpr") {
            let node
            node = MkNode({
                "Type": "CallExprStat",
                "Expression": ex,
                "GetFirstToken": () => node.Expression.GetFirstToken(),
                "GetLastToken": () => node.Expression.GetLastToken(),
            })
            return node
        } else if (ex.Type == "CompoundStat") {
            return ex
        } else {
            let lhs = [ex]
            let lhsSeperator = []
            ex.IsStat = true
            while (peek().Source == ",") {
                lhsSeperator.push(get())
                let lhsPart = primaryexpr(locals, upvals)
                if (lhsPart.Type == "MethodExpr" || lhsPart.Type == "CallExpr") {
                    throw "Bad left hand side of asignment"
                }
                lhsPart.IsStat = true
                lhs.push(lhsPart)
            }
            let eq = expect("Symbol", "=")
            let rhs = [expr(locals, upvals)]
            let rhsSeperator = []
            while (peek().Source == ",") {
                rhsSeperator.push(get())
                rhs.push(expr(locals, upvals))
            }

            let node
            node = MkNode({
                "Type": "AssignmentStat",
                "Rhs": rhs,
                "Lhs": lhs,
                "Token_Equals": eq,
                "Token_LhsSeperatorList": lhsSeperator,
                "Token_RhsSeperatorList": rhsSeperator,
                "GetFirstToken": () => node.Lhs[0].GetFirstToken(),
                "GetLastToken": () => node.Rhs[node.Rhs.length - 1].GetLastToken(),
            })

            return node
        }
    }

    function ifstat(isExpr, locals, upvals) {
        let ifKw = get()
        let condition = expr(locals, upvals)
        let thenKw = expect("Keyword", "then")
        let ifBody = isExpr ? expr(locals, upvals) : block(locals, upvals)
        let elseClauses = []
        while (peek().Source == "elseif" || peek().Source == "else") {
            let elseifKw = get()
            let elseifCondition
            let elseifThenKw
            if (elseifKw.Source == "elseif") {
                elseifCondition = expr(locals, upvals)
                elseifThenKw = expect("Keyword", "then")
            }
            let elseifBody = isExpr ? expr(locals, upvals) : block(locals, upvals)
            elseClauses.push({
                "Condition": elseifCondition,
                "Body": elseifBody,

                "ClauseType": elseifKw.Source,
                "Token": elseifKw,
                "Token_Then": elseifThenKw,
            })
            if (elseifKw.Source == "else") {
                break
            }
        }
        let enKw = isExpr ? null : expect("Keyword", "end")
        let node
        node = MkNode({
            "Type": isExpr ? "IfExpr" : "IfStat",
            "Condition": condition,
            "Body": ifBody,
            "ElseClauseList": elseClauses,

            "Token_If": ifKw,
            "Token_Then": thenKw,
            "Token_End": enKw,
            "GetFirstToken": () => node.Token_If,
            "GetLastToken": () => node.Token_End,
        })
        return node
    }


    function dostat(locals, upvals) {
        let doKw = get()
        let [body, enKw] = blockbody("end", locals, upvals)

        let node
        node = MkNode({
            "Type": "DoStat",
            "Body": body,

            "Token_Do": doKw,
            "Token_End": enKw,
            "GetFirstToken": () => node.Token_Do,
            "GetLastToken": () => node.Token_End,
        })
        return node
    }

    function whilestat(locals, upvals) {
        let whileKw = get()
        let condition = expr(locals, upvals)
        let doKw = expect("Keyword", "do")
        let [body, enKw] = blockbody("end", locals, upvals)

        let node
        node = MkNode({
            "Type": "WhileStat",
            "Condition": condition,
            "Body": body,

            "Token_While": whileKw,
            "Token_Do": doKw,
            "Token_End": enKw,
            "GetFirstToken": () => node.Token_While,
            "GetLastToken": () => node.Token_End,
        })
        return node
    }

    function forstat(locals, upvals) {
        let forKw = get()
        let [loopVars, loopVarCommas] = varlist()
        let node = []
        if (peek().Source == "=") {
            let eqTk = get()
            let [exprList, exprCommaList] = exprlist(locals, upvals)
            if (exprList.length < 2 || exprList.length > 3) {
                throw "Expected 2 or 3 values for range bounds"
            }
            let doTk = expect("Keyword", "do")
            let [body, enTk] = blockbody("end", locals, upvals)
            let node
            node = MkNode({
                "Type": "NumericForStat",
                "VarList": loopVars,
                "RangeList": exprList,
                "Body": body,

                "Token_For": forKw,
                "Token_VarCommaList": loopVarCommas,
                "Token_Equals": eqTk,
                "Token_RangeCommaList": exprCommaList,
                "Token_Do": doTk,
                "Token_End": enTk,
                "GetFirstToken": () => node.Token_For,
                "GetLastToken": () => node.Token_End,
            })
            return node
        } else if (peek().Source == "in") {
            let inTk = get()
            let [exprList, exprCommaList] = exprlist(locals, upvals)
            let doTk = expect("Keyword", "do")
            let [body, enTk] = blockbody("end", locals, upvals)
            let node
            node = MkNode({
                "Type": "GenericForStat",
                "VarList": loopVars,
                "GeneratorList": exprList,
                "Body": body,

                "Token_For": forKw,
                "Token_VarCommaList": loopVarCommas,
                "Token_In": inTk,
                "Token_GeneratorCommaList": exprCommaList,
                "Token_Do": doTk,
                "Token_End": enTk,
                "GetFirstToken": () => node.Token_For,
                "GetLastToken": () => node.Token_End
            })
            return node
        }
    }

    function repeatstat(locals, upvals) {
        let repeatKw = get()
        let [body, untilTk] = blockbody("until", locals)
        let condition = expr(locals, upvals)

        let node
        node = MkNode({
            "Type": "RepeatStat",
            "Body": body,
            "Condition": condition,

            "Token_Repeat": repeatKw,
            "Token_Until": untilTk,
            "GetFirstToken": () => node.Token_Repeat,
            "GetLastToken": () => node.Condition.GetLastToken(),
        })
        return node
    }

    function localdecl(locals, upvals) {
        let localKw = get()
        if (peek().Source == "function") {
            let funcStat = funcdecl(false, locals, upvals, true)
            if (funcStat.NameChain.length > 1) {
                throw getTokenStartPosition(funcStat.Token_NameChainSeperator[0]) + ": `(` expected."
            }

            let node
            node = MkNode({
                "Type": "LocalFunctionStat",
                "FunctionStat": funcStat,
                "Token_Local": localKw,
                "GetFirstToken": () => node.Token_Local,
                "GetLastToken": () => node.FunctionStat.GetLastToken(),
            })
            return node
        } else if (peek().Type == "Ident" || (peek().Type == "Keyword" && IdentKeywords.includes(peek().Source))) {
            let [varList, varCommaList] = varlist(false, true)
            let exprList = []
            let exprCommaList = []
            let eqToken
            if (peek().Source == "=") {
                eqToken = get()
                let [exprList1, exprCommaList1] = exprlist(locals, upvals)
                exprList = exprList1
                exprCommaList = exprCommaList1
            }

            let node
            node = MkNode({
                "Type": "LocalVarStat",
                "VarList": varList,
                "ExprList": exprList,
                "Token_Local": localKw,
                "Token_Equals": eqToken,
                "Token_VarCommaList": varCommaList,
                "Token_ExprCommaList": exprCommaList,
                "GetFirstToken": () => node.Token_Local,
                "GetLastToken": function () {
                    if (node.ExprList.length > 0) {
                        return node.ExprList[node.ExprList.length - 1].GetLastToken()
                    } else {
                        return node.VarList[node.VarList.length - 1]
                    }
                },
            })
            return node
        } else {
            throw "`function` or ident expected"
        }
    }

    function retstat(locals, upvals) {
        let returnKw = get()
        let exprList
        let commaList
        if (isBlockFollow() || peek().Source == ";") {
            exprList = []
            commaList = []
        } else {
            [exprList, commaList] = exprlist(locals, upvals)
        }
        let self
        self = {
            "Type": "ReturnStat",
            "ExprList": exprList,
            "Token_Return": returnKw,
            "Token_CommaList": commaList,
            "GetFirstToken": () => self.Token_Return,
            "GetLastToken": function () {
                if (self.ExprList.length > 0) {
                    return self.ExprList[self.ExprList.length - 1].GetLastToken()
                } else {
                    return self.Token_Return
                }
            },
        }
        return self
    }

    function breakstat() {
        let breakKw = get()
        let self
        self = {
            "Type": "BreakStat",
            "Token_Break": breakKw,
            "GetFirstToken": () => self.Token_Break,
            "GetLastToken": () => self.Token_Break,
        }
        return self
    }

    function continuestat(locals, upvals) {
        if (peek(1).Source == '(')
            return [false, exprstat(locals, upvals)]

        let continueKw = get()
        let self
        self = {
            "Type": "ContinueStat",
            "Token_Continue": continueKw,
            "GetFirstToken": () => self.Token_Continue,
            "GetLastToken": () => self.Token_Continue,
        }

        return [true, self]
    }

    function gotostat() {
        let gotoKw = get()
        let labelKw
        if (peek().Type == 'Keyword')
            labelKw = expect('Keyword')
        else
            labelKw = expect('Ident')

        let self
        self = {
            "Type": "GotoStat",
            "Token_Goto": gotoKw,
            "Token_Label": labelKw,
            "GetFirstToken": () => self.Token_Goto,
            "GetLastToken": () => self.Token_Label
        }
        return self
    }

    function labelstat() {
        let colonsKw1 = get()
        let labelKw
        if (peek().Type == 'Keyword')
            labelKw = expect('Keyword')
        else
            labelKw = expect('Ident')
        let colonsKw2 = expect('Symbol', '::')

        let self
        self = {
            "Type": "LabelStat",
            "Token_ColonsLeft": colonsKw1,
            "Token_Label": labelKw,
            "Token_ColonsRight": colonsKw2,
            "GetFirstToken": () => self.Token_ColonsLeft,
            "GetLastToken": () => self.Token_ColonsRight
        }
        return self
    }

    function statement(locals, upvals) {
        let tok = peek()
        if (tok.Source == "if") {
            return [false, ifstat(false, locals, upvals)]
        } else if (tok.Source == "while") {
            return [false, whilestat(locals, upvals)]
        } else if (tok.Source == "do") {
            return [false, dostat(locals, upvals)]
        } else if (tok.Source == "for") {
            return [false, forstat(locals, upvals)]
        } else if (tok.Source == "repeat") {
            return [false, repeatstat(locals, upvals)]
        } else if (tok.Source == "function") {
            return [false, funcdecl(false, locals, upvals)]
        } else if (tok.Source == "local") {
            return [false, localdecl(locals, upvals)]
        } else if (tok.Source == "return") {
            return [true, retstat(locals, upvals)]
        } else if (tok.Source == "break") {
            return [true, breakstat(locals, upvals)]
        } else if (tok.Source == "continue") {
            return continuestat(locals, upvals)
        } else if (tok.Source == 'goto') {
            return [false, gotostat()]
        } else if (tok.Source == '::') {
            return [false, labelstat()]
        } else {
            return [false, exprstat(locals, upvals)]
        }
    }


    let blocks = 1
    block = function (a, b) {
        let statements = []
        let semicolons = []
        let isLast = false

        let locals = {}
        let upvals = {}
        if (b != null) {
            for (let [i, v] of Object.entries(b)) {
                upvals[i] = v
            }
        }

        if (a != null) {
            for (let [i, v] of Object.entries(a)) {
                upvals[i] = v
            }
        }


        let thing
        let i = 0
        while (!isLast && !isBlockFollow()) {
            if (thing && thing == peek()) {
                print(`INFINITE LOOP POSSIBLE ON STATEMENT ${thing.Source} :`, thing)
            }
            thing = peek()
            let [isLast, stat] = statement(locals, upvals)
            if (stat) {
                statements.push(stat);


                switch (stat.Type) {
                    case "LocalVarStat":
                        stat.VarList.forEach(token => {

                            token.UseCount = 0
                            token.Number = i++
                            locals[token.Source] = token

                            let tokens = []
                            function lol() {
                                token.UseCount++
                                tokens.forEach(t => {
                                    t.UseCount = token.UseCount
                                })
                            }

                            token.Tokens = {}
                            token.Tokens.push = (t) => {
                                t.UseCountIncrease = lol
                                t.UseCount = token.UseCount
                                t.Tokens = token.Tokens
                                tokens.push(t)
                            }
                            token.Tokens.get = () => tokens

                            token.UseCountIncrease = lol
                        })
                        break

                    case "LocalFunctionStat":

                        let nameChain = stat.FunctionStat.NameChain
                        if (nameChain.length === 1) {
                            let token = nameChain[0]
                            token.UseCount = 0
                            token.Number = i++
                            locals[token.Source] = token

                            let tokens = []
                            function lol() {
                                token.UseCount++
                                tokens.forEach(t => {
                                    t.UseCount = token.UseCount
                                })
                            }

                            token.Tokens = {}
                            token.Tokens.push = (t) => {
                                t.UseCountIncrease = lol
                                t.UseCount = token.UseCount
                                t.Tokens = token.Tokens
                                tokens.push(t)
                            }
                            token.Tokens.get = () => tokens

                            token.UseCountIncrease = lol
                        }
                        break

                    default:
                        break
                }
            }

            let next = peek()
            if (next.Type == "Symbol" && next.Source == ";") {
                semicolons[statements.length - 1] = get()
            }
        }

        let node
        node = {
            "Type": "StatList",
            "StatementList": statements,
            "SemicolonList": semicolons,
            "GetFirstToken": function () {
                if (node.StatementList.length == 0) {
                    return
                } else {
                    return node.StatementList[0]?.GetFirstToken()
                }
            },
            "GetLastToken": function () {
                if (node.StatementList.length == 0) {
                    return
                } else if (node.SemicolonList[node.StatementList.length - 1]) {
                    return node.SemicolonList[node.StatementList.length - 1]
                } else {
                    return node.StatementList[node.StatementList.length - 1].GetLastToken()
                }
            },
        }
        return node
    }

    return block([], [])
}

function VisitAst(ast, visitors) {
    let ExprType = {
        'BinopExpr': true, 'UnopExpr': true,
        'NumberLiteral': true, 'StringLiteral': true, 'NilLiteral': true, 'BooleanLiteral': true, 'VargLiteral': true, "HashLiteral": true,
        'FieldExpr': true, 'IndexExpr': true,
        'MethodExpr': true, 'CallExpr': true,
        'FunctionLiteral': true,
        'VariableExpr': true,
        'ParenExpr': true,
        'TableLiteral': true,
    }

    let StatType = {
        'StatList': true,
        'BreakStat': true,
        'ContinueStat': true,
        'LabelStat': true,
        'GotoStat': true,
        'ReturnStat': true,
        'LocalVarStat': true,
        'LocalFunctionStat': true,
        'FunctionStat': true,
        'RepeatStat': true,
        'GenericForStat': true,
        'NumericForStat': true,
        'WhileStat': true,
        'DoStat': true,
        'IfStat': true,
        'CallExprStat': true,
        'AssignmentStat': true,
        'CompoundStat': true
    }

    for (var [visitorSubject, visitor] of Object.entries(visitors)) {
        if (visitorSubject === 'VisitStat' || visitorSubject === 'VisitExpr')
            continue

        if (!StatType[visitorSubject] && !ExprType[visitorSubject]) {
            throw `Invalid visitor target: \`${visitorSubject}\``
        }
    }


    function preVisit(exprOrStat) {
        if (exprOrStat != null) {
            let visitor = visitors[exprOrStat.Type]
            if (typeof (visitor) == "function") {
                return visitor(exprOrStat)
            } else if (visitor && visitor.Pre) {
                return visitor.Pre(exprOrStat)
            }
        }
    }

    function postVisit(exprOrStat) {
        let visitor = visitors[exprOrStat.Type]
        if (visitor && typeof (visitor) == "object" && visitor.Post) {
            return visitor.Post(exprOrStat)
        }
    }

    let visitExpr
    let visitStat

    visitExpr = function (expr) {
        if (preVisit(expr)) {
            return
        }

        if (expr.Type == "BinopExpr") {
            visitExpr(expr.Lhs)
            visitExpr(expr.Rhs)
        } else if (expr.Type == "UnopExpr") {
            visitExpr(expr.Rhs)
        } else if (expr.Type == "NumberLiteral" || expr.Type == "StringLiteral"
            || expr.Type == "NilLiteral" || expr.Type == "BooleanLiteral"
            || expr.Type == "VargLiteral" || expr.Type == 'HashLiteral') {
            //No
        } else if (expr.Type == "FieldExpr") {
            visitExpr(expr.Base)
        } else if (expr.Type == "IndexExpr") {
            visitExpr(expr.Base)
            visitExpr(expr.Index)
        } else if (expr.Type == "MethodExpr" || expr.Type == "CallExpr") {
            visitExpr(expr.Base)
            if (expr.FunctionArguments.CallType == "ArgCall") {
                expr.FunctionArguments.ArgList.forEach((argExpr, index) => {
                    visitExpr(argExpr)
                })
            } else if (expr.FunctionArguments.CallType == "TableCall") {
                visitExpr(expr.FunctionArguments.TableExpr)
            }
        } else if (expr.Type == "FunctionLiteral") {
            visitStat(expr.Body)
        } else if (expr.Type == "VariableExpr") {
            // no
        } else if (expr.Type == "ParenExpr") {
            visitExpr(expr.Expression)

        } else if (expr.Type == "TableLiteral") {
            expr.EntryList.forEach((entry, index) => {
                if (entry.EntryType == "Field") {
                    visitExpr(entry.Value)
                } else if (entry.EntryType == "Index") {
                    visitExpr(entry.Index)
                    visitExpr(entry.Value)
                } else if (entry.EntryType == "Value") {
                    visitExpr(entry.Value)
                } else {
                    throw "unreachable"
                }
            })
        } else if (expr.Type == "CompoundStat") {
            visitExpr(expr.Lhs)
            visitExpr(expr.Rhs)
        } else if (expr.Type == "IfExpr") {
            visitExpr(expr.Condition)
            visitExpr(expr.Body)
            expr.ElseClauseList.forEach((clause) => {
                if (clause.Condition != null) {
                    visitExpr(clause.Condition)
                }
                visitExpr(clause.Body)
            })
        } else {
            throw `unreachable, type: ${expr.Type}: ${expr}`
        }
        postVisit(expr)
    }

    visitStat = function (stat) {
        if (preVisit(stat)) {
            return
        }

        if (stat.Type == "StatList") {
            stat.StatementList.forEach((ch, index) => {
                if (ch != null) {
                    if (ch === null || ch.Type === null) {
                        return
                    }

                    ch.Remove = () => {
                        stat.StatementList[index] = null
                    }

                    visitStat(ch)
                }
            })
        } else if (stat.Type == "BreakStat") {
            // no
        } else if (stat.Type == "ContinueStat") {
            // fuck off
        } else if (stat.Type == 'GotoStat') {
            //
        } else if (stat.Type == 'LabelStat') {
            // 
        } else if (stat.Type == "ReturnStat") {
            stat.ExprList.forEach((expr, index) => {
                visitExpr(expr)
            })
        } else if (stat.Type == "LocalVarStat") {
            if (stat.Token_Equals) {
                stat.ExprList.forEach((expr, index) => {
                    visitExpr(expr)
                })
            }
        } else if (stat.Type == "LocalFunctionStat") {
            visitStat(stat.FunctionStat.Body)
        } else if (stat.Type == "FunctionStat") {
            visitStat(stat.Body)
        } else if (stat.Type == "RepeatStat") {
            visitStat(stat.Body)
            visitExpr(stat.Condition)
        } else if (stat.Type == "GenericForStat") {
            stat.GeneratorList.forEach((expr, index) => {
                visitExpr(expr)
            })
            visitStat(stat.Body)
        } else if (stat.Type == "NumericForStat") {
            stat.RangeList.forEach((expr, index) => {
                visitExpr(expr)
            })
            visitStat(stat.Body)
        } else if (stat.Type == "WhileStat") {
            visitExpr(stat.Condition)
            visitStat(stat.Body)
        } else if (stat.Type == "DoStat") {
            visitStat(stat.Body)
        } else if (stat.Type == "IfStat") {
            visitExpr(stat.Condition)
            visitStat(stat.Body)
            stat.ElseClauseList.forEach((clause) => {
                if (clause.Condition != null) {
                    visitExpr(clause.Condition)
                }
                visitStat(clause.Body)
            })
        } else if (stat.Type == "CallExprStat") {
            visitExpr(stat.Expression)
        } else if (stat.Type == "CompoundStat") {
            visitExpr(stat.Lhs)
            visitExpr(stat.Rhs)
        } else if (stat.Type == "AssignmentStat") {
            stat.Lhs.forEach((ex) => {
                visitExpr(ex)
            })
            stat.Rhs.forEach((ex) => {
                visitExpr(ex)
            })
        } else {
            throw (`Unreachable code. Got ` + stat.Type)
        }
        postVisit(stat)
    }

    visitors.VisitStat = visitStat
    visitors.VisitExpr = visitExpr

    if (StatType[ast.Type]) {
        visitStat(ast)
    } else {
        visitExpr(ast)
    }
}

function AddVariableInfo(ast) {
    let globalVars = []
    let currentScope

    let locationGenerator = 0
    function markLocation() {
        locationGenerator++
        return locationGenerator
    }

    function pushScope() {
        currentScope = {
            "ParentScope": currentScope,
            "ChildScopeList": [],
            "VariableList": [],
            "BeginLocation": markLocation(),
            "Depth": null,
            "GetVar": null
        }
        if (currentScope.ParentScope) {
            currentScope.Depth = currentScope.ParentScope.Depth + 1
            currentScope.ParentScope.ChildScopeList.push(currentScope)
        } else {
            currentScope.Depth = 1
        }
        let self = currentScope
        currentScope.GetVar = function (varName) {
            for (const _var of self.VariableList) {
                if (_var.Name == varName) {
                    return _var
                }
            }
            if (self.ParentScope) {
                return self.ParentScope.GetVar(varName)
            } else {
                for (const _var of globalVars) {
                    if (_var.Name == varName) {
                        return _var
                    }
                }
            }
        }
    }

    function popScope() {
        let scope = currentScope

        scope.EndLocation = markLocation()

        scope.VariableList.forEach((v) => {
            v.ScopeEndLocation = scope.EndLocation
        })

        currentScope = scope.ParentScope
        return scope
    }
    pushScope()

    function addLocalVar(name, setNameFunc, localInfo) {
        assert(localInfo, "Missing localInfo")
        assert(name, "Missing local var name")
        let _var = {
            "Type": "Local",
            "Name": name,
            "RenameList": [setNameFunc],
            "AssignedTo": false,
            "Info": localInfo,
            "Scope": currentScope,
            "BeginLocation": markLocation(),
            "EndLocation": markLocation(),
            "ReferenceLocationList": [markLocation()],
        }
        _var.Rename = function (newName) {
            _var.Name = newName
            _var.RenameList.forEach((renameFunc) => {
                renameFunc(newName)
            })
        }

        currentScope.VariableList.push(_var)
        return _var
    }

    function getGlobalVar(name) {
        for (const _var of globalVars) {
            if (_var.Name == name) {
                return _var
            }
        }

        let _var = {
            "Type": "Global",
            "Name": name,
            "RenameList": [],
            "AssignedTo": false,
            "Scope": null,
            "BeginLocation": markLocation(),
            "EndLocation": markLocation(),
            "ReferenceLocationList": [],
        }

        _var.Rename = function (newName) {
            _var.Name = newName
            _var.RenameList.forEach((renameFunc) => {
                renameFunc(newName)
            })
        }

        globalVars.push(_var)

        return _var
    }


    function addGlobalReference(name, setNameFunc) {
        assert(name, "Missing var name")
        let _var = getGlobalVar(name)
        _var.RenameList.push(setNameFunc)
        return _var
    }

    function getLocalVar(scope, name) {
        let i
        for (i = scope.VariableList.length - 1; i >= 0; i--) {
            if (scope.VariableList[i].Name == name) {
                return scope.VariableList[i]
            }
        }

        if (scope.ParentScope) {
            let _var = getLocalVar(scope.ParentScope, name)
            if (_var) {
                return _var
            }
        }

        return
    }

    function referenceVariable(name, setNameFunc) {
        assert(name, "Missing var name")
        let _var = getLocalVar(currentScope, name)
        if (_var) {
            _var.RenameList.push(setNameFunc)
        } else {
            _var = addGlobalReference(name, setNameFunc)
        }

        let curLocation = markLocation()
        _var.EndLocation = curLocation
        _var.ReferenceLocationList.push(_var.EndLocation)
        return _var
    }

    let visitor = {}
    visitor.FunctionLiteral = {

        "Pre": function (expr) {
            pushScope()
            expr.ArgList.forEach((ident, index) => {
                let _var = addLocalVar(ident.Source, function (name, d) {
                    if (!d)
                        ident.Source = name
                }, {
                    "Type": "Argument",
                    "Index": index
                })
                ident.var = _var
            })
        },

        "Post": function (expr) {
            popScope()
        },
    }

    visitor.VariableExpr = function (expr) {
        expr.Variable = referenceVariable(expr.Token.Source, function (newName, saveStat = false) {
            if (saveStat && expr.IsStat)
                return;

            expr.Token.Source = newName
        })
    }

    visitor.StatList = {
        "Pre": function (stat) {
            pushScope()
        },

        "Post": function (stat) {
            if (!stat.SkipPop) {
                popScope()
            }
        },
    }

    visitor.LocalVarStat = {
        "Post": function (stat) {

            stat.VarList.forEach((ident, varNum) => {
                addLocalVar(ident.Source, function (name) {
                    stat.VarList[varNum].Source = name
                }, {
                    "Type": "Local",
                    "Expr": stat.ExprList
                })
            })
        },
    }

    visitor.LocalFunctionStat = {
        "Pre": function (stat) {
            addLocalVar(stat.FunctionStat.NameChain[0].Source, function (name) {
                stat.FunctionStat.NameChain[0].Source = name
            }, {
                "Type": "LocalFunction",
            })

            pushScope()

            stat.FunctionStat.ArgList.forEach((ident, index) => {
                addLocalVar(ident.Source, function (name) {
                    ident.Source = name
                }, {
                    "Type": "Argument",
                    "Index": index,
                })
            })
        },

        "Post": function () {
            popScope()
        }
    }

    visitor.FunctionStat = {
        "Pre": function (stat) {
            let nameChain = stat.NameChain
            let _var
            if (nameChain.length == 1) {
                if (getLocalVar(currentScope, nameChain[0].Source)) {
                    _var = referenceVariable(nameChain[0].Source, function (name) {
                        nameChain[0].Source = name
                    })
                } else {
                    _var = addGlobalReference(nameChain[0].Source, function (name) {
                        nameChain[0].Source = name
                    })
                }
            } else {
                _var = referenceVariable(nameChain[0].Source, function (name) {
                    nameChain[0].Source = name
                })
            }
            _var.AssignedTo = true
            pushScope()
            stat.ArgList.forEach((ident, index) => {
                addLocalVar(ident.Source, function (name) {
                    ident.Source = name
                }, {
                    "Type": "Argument",
                    "Index": index,
                })
            })
        },

        "Post": function () {
            popScope()
        }
    }

    visitor.GenericForStat = {
        "Pre": function (stat) {

            stat.GeneratorList.forEach((ex) => {
                VisitAst(ex, visitor)
            })

            pushScope()
            stat.VarList.forEach((ident, index) => {
                addLocalVar(ident.Source, function (name) {
                    ident.Source = name
                }, {
                    "Type": "ForRange",
                    "Index": index,
                })
            })
            VisitAst(stat.Body, visitor)
            popScope()
            return true
        }
    }

    visitor.NumericForStat = {
        "Pre": function (stat) {
            stat.RangeList.forEach((ex) => {
                VisitAst(ex, visitor)
            })

            pushScope()
            stat.VarList.forEach((ident, index) => {
                addLocalVar(ident.Source, function (name) {
                    ident.Source = name
                }, {
                    "Type": "ForRange",
                    "Index": index,
                })
            })
            VisitAst(stat.Body, visitor)
            popScope()
            return true
        }
    }

    visitor.RepeatStat = {
        "Pre": function (stat) {
            stat.Body.SkipPop = true
        },
        "Post": function (stat) {
            popScope()
        }
    }
    visitor.AssignmentStat = {
        "Post": function (stat) {
            stat.Lhs.forEach((ex) => {
                if (ex.Variable != null) {
                    ex.Variable.AssignedTo = true
                }
            })
        }
    }
    VisitAst(ast, visitor)
    return [globalVars, popScope()]
}

function PrintAst(ast) {
    let printStat
    let printExpr
    let buffer = ''
    let getLeadingWhite = (tk) =>
        (typeof tk?.LeadingWhite !== 'string' ? ' ' : tk.LeadingWhite)

    function printt(tk) {
        if (tk.LeadingWhite == null || tk.Source == null) {
            throw `Bad token: tk=${tk} | lwhite=${tk.LeadingWhite} | source=${tk.Source}`
        }
        buffer = `${buffer}${tk.LeadingWhite}${tk.Source}`
    }

    printExpr = function (expr) {
        if (expr.Type == "BinopExpr") {
            printExpr(expr.Lhs)
            printt(expr.Token_Op)
            printExpr(expr.Rhs)
        } else if (expr.Type == "UnopExpr") {
            printt(expr.Token_Op)
            printExpr(expr.Rhs)
        } else if (
            expr.Type == "NumberLiteral" || expr.Type == "StringLiteral"
            || expr.Type == "NilLiteral" || expr.Type == "BooleanLiteral"
            || expr.Type == "VargLiteral" || expr.Type == 'HashLiteral') {
            printt(expr.Token)
        } else if (expr.Type == "FieldExpr") {
            printExpr(expr.Base)
            printt(expr.Token_Dot)
            printt(expr.Field)
        } else if (expr.Type == "IndexExpr") {
            printExpr(expr.Base)
            printt(expr.Token_OpenBracket)
            printExpr(expr.Index)
            printt(expr.Token_CloseBracket)
        } else if (expr.Type == "MethodExpr" || expr.Type == "CallExpr") {
            printExpr(expr.Base)
            if (expr.Type == "MethodExpr") {
                printt(expr.Token_Colon)
                printt(expr.Method)
            }
            if (expr.FunctionArguments.CallType == "StringCall") {
                printt(expr.FunctionArguments.Token)
            } else if (expr.FunctionArguments.CallType == "ArgCall") {
                printt(expr.FunctionArguments.Token_OpenParen)
                expr.FunctionArguments.ArgList.forEach((argExpr, index) => {
                    printExpr(argExpr)
                    let sep = expr.FunctionArguments.Token_CommaList[index]
                    if (sep != null) {
                        printt(sep)
                    }
                })
                printt(expr.FunctionArguments.Token_CloseParen)
            } else if (expr.FunctionArguments.CallType == "TableCall") {
                printExpr(expr.FunctionArguments.TableExpr)
            }
        } else if (expr.Type == "FunctionLiteral") {
            printt(expr.Token_Function)
            printt(expr.Token_OpenParen)
            expr.ArgList.forEach((arg, index) => {
                printt(arg)
                let comma = expr.Token_ArgCommaList[index]
                if (comma != null) {
                    printt(comma)
                }
            })
            if (expr.Token_Varg != null) {
                printt(expr.Token_Varg)
            }
            printt(expr.Token_CloseParen)
            printStat(expr.Body)
            printt(expr.Token_End)
        } else if (expr.Type == "VariableExpr") {
            printt(expr.Token)
        } else if (expr.Type == "ParenExpr") {
            printt(expr.Token_OpenParen)
            printExpr(expr.Expression)
            printt(expr.Token_CloseParen)
        } else if (expr.Type == "TableLiteral") {
            printt(expr.Token_OpenBrace)
            expr.EntryList.forEach((entry, index) => {
                if (entry.EntryType == "Field") {
                    printt(entry.Field)
                    printt(entry.Token_Equals)
                    printExpr(entry.Value)
                } else if (entry.EntryType == "Index") {
                    printt(entry.Token_OpenBracket)
                    printExpr(entry.Index)
                    printt(entry.Token_CloseBracket)
                    printt(entry.Token_Equals)
                    printExpr(entry.Value)
                } else if (entry.EntryType == "Value") {
                    printExpr(entry.Value)
                } else {
                    throw "unreachable"
                }
                let sep = expr.Token_SeperatorList[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(expr.Token_CloseBrace)
        } else if (expr.Type == "CompoundStat") {
            printStat(expr)
        } else if (expr.Type == "IfExpr") {
            printt(expr.Token_If)
            printExpr(expr.Condition)
            printt(expr.Token_Then)
            printExpr(expr.Body)
            expr.ElseClauseList.forEach((clause) => {
                printt(clause.Token)
                if (clause.Condition != null) {
                    printExpr(clause.Condition)
                    printt(clause.Token_Then)
                }
                printExpr(clause.Body)
            })
        } else {
            throw `unreachable, type: ${expr.Type}: ${expr}`
        }
    }
    printStat = function (stat) {
        if (stat == null) {
            throw `STAT IS NIL! ${stat}`
        }

        if (stat.Type === 'StatList' && stat.StatementList.length === 0)
            return


        if (stat.WrapInDo) {
            let wspace = getLeadingWhite(stat.GetFirstToken())
            stat.GetFirstToken().LeadingWhite = ''
            buffer += `${wspace}do `
        }

        if (stat.Type == "StatList") {
            stat.StatementList.forEach((ch, index) => {
                if (ch === null || ch.Type === null) {
                    return
                }

                ch.Remove = () => {
                    stat.StatementList[index] = null
                }

                printStat(ch)
                if (stat.SemicolonList[index]) {
                    printt(stat.SemicolonList[index])
                }
            })

        } else if (stat.Type == "BreakStat") {
            printt(stat.Token_Break)
        } else if (stat.Type == "ContinueStat") {
            printt(stat.Token_Continue)
        } else if (stat.Type == 'GotoStat') {
            printt(stat.Token_Goto)
            printt(stat.Token_Label)
        } else if (stat.Type == 'LabelStat') {
            printt(stat.Token_ColonsLeft)
            printt(stat.Token_Label)
            printt(stat.Token_ColonsRight)
        } else if (stat.Type == "ReturnStat") {
            printt(stat.Token_Return)
            stat.ExprList.forEach((expr, index) => {
                printExpr(expr)
                if (stat.Token_CommaList[index]) {
                    printt(stat.Token_CommaList[index])
                }
            })
        } else if (stat.Type == "LocalVarStat") {
            printt(stat.Token_Local)
            stat.VarList.forEach((_var, index) => {
                printt(_var)
                if (_var.Attribute != null) {
                    printt(_var.Attribute)
                }
                let comma = stat.Token_VarCommaList[index]
                if (comma != null) {
                    printt(comma)
                }
            })
            if (stat.Token_Equals != null) {
                printt(stat.Token_Equals)
                stat.ExprList.forEach((expr, index) => {
                    printExpr(expr)
                    let comma = stat.Token_ExprCommaList[index]
                    if (comma != null) {
                        printt(comma)
                    }
                })
            }
        } else if (stat.Type == "LocalFunctionStat") {
            printt(stat.Token_Local)
            printt(stat.FunctionStat.Token_Function)
            printt(stat.FunctionStat.NameChain[0])
            printt(stat.FunctionStat.Token_OpenParen)
            stat.FunctionStat.ArgList.forEach((arg, index) => {
                printt(arg)
                let comma = stat.FunctionStat.Token_ArgCommaList[index]
                if (comma != null) {
                    printt(comma)
                }
            })
            if (stat.FunctionStat.Token_Varg) {
                printt(stat.FunctionStat.Token_Varg)
            }
            printt(stat.FunctionStat.Token_CloseParen)
            printStat(stat.FunctionStat.Body)
            printt(stat.FunctionStat.Token_End)
        } else if (stat.Type == "FunctionStat") {
            printt(stat.Token_Function)
            stat.NameChain.forEach((part, index) => {
                printt(part)
                let sep = stat.Token_NameChainSeperator[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(stat.Token_OpenParen)
            stat.ArgList.forEach((arg, index) => {
                printt(arg)
                let comma = stat.Token_ArgCommaList[index]
                if (comma != null) {
                    printt(comma)
                }
            })
            if (stat.Token_Varg) {
                printt(stat.Token_Varg)
            }
            printt(stat.Token_CloseParen)
            printStat(stat.Body)
            printt(stat.Token_End)
        } else if (stat.Type == "RepeatStat") {
            printt(stat.Token_Repeat)
            printStat(stat.Body)
            printt(stat.Token_Until)
            printExpr(stat.Condition)
        } else if (stat.Type == "GenericForStat") {
            printt(stat.Token_For)
            stat.VarList.forEach((_var, index) => {
                printt(_var)
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(stat.Token_In)
            stat.GeneratorList.forEach((expr, index) => {
                printExpr(expr)
                let sep = stat.Token_GeneratorCommaList[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(stat.Token_Do)
            printStat(stat.Body)
            printt(stat.Token_End)
        } else if (stat.Type == "NumericForStat") {
            printt(stat.Token_For)
            stat.VarList.forEach((_var, index) => {
                printt(_var)
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {
                    printt(sep);
                }
            })
            printt(stat.Token_Equals)
            stat.RangeList.forEach((expr, index) => {
                printExpr(expr)
                let sep = stat.Token_RangeCommaList[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(stat.Token_Do)
            printStat(stat.Body)
            printt(stat.Token_End)
        } else if (stat.Type == "WhileStat") {
            printt(stat.Token_While)
            printExpr(stat.Condition)
            printt(stat.Token_Do)
            printStat(stat.Body)
            printt(stat.Token_End)
        } else if (stat.Type == "DoStat") {
            printt(stat.Token_Do)
            printStat(stat.Body)

            printt(stat.Token_End)
        } else if (stat.Type == "IfStat") {
            printt(stat.Token_If)
            printExpr(stat.Condition)
            printt(stat.Token_Then)
            printStat(stat.Body)
            stat.ElseClauseList.forEach((clause) => {
                printt(clause.Token)
                if (clause.Condition != null) {
                    printExpr(clause.Condition)
                    printt(clause.Token_Then)
                }
                printStat(clause.Body)
            })
            printt(stat.Token_End)
        } else if (stat.Type == "CallExprStat") {
            printExpr(stat.Expression)
        } else if (stat.Type == "CompoundStat") { // Fuck you Wally
            printExpr(stat.Lhs)
            printt(stat.Token_Compound)
            printExpr(stat.Rhs)
            stat.Type = "CompoundStat"
        } else if (stat.Type == "AssignmentStat") {
            stat.Lhs.forEach((ex, index) => {
                printExpr(ex)
                let sep = stat.Token_LhsSeperatorList[index]
                if (sep != null) {
                    printt(sep)
                }
            })
            printt(stat.Token_Equals)
            stat.Rhs.forEach((ex, index) => {
                printExpr(ex)
                let sep = stat.Token_RhsSeperatorList[index]
                if (sep != null) {
                    printt(sep);
                }
            })
        } else {
            assert(false, "unreachable")
        }

        if (stat.WrapInDo) {
            buffer += ` end `
        }
    }
    printStat(ast)

    return buffer
}

function FormatAst(ast, indentation) {
    let formatStat
    let formatExpr
    let currentIndent = 0
    function applyIndent(token) {
        if (token === undefined)
            return



        let indentString = `\n${(indentation).repeat(currentIndent)}`
        if (token.LeadingWhite == '' || (token.LeadingWhite.substr(-indentString.length, indentString.length) != indentString)) {
            //token.LeadingWhite = token.LeadingWhite.replace("\n?[\t ]*$") /Remove all \n & \t at end of string
            // idk string patterns in js :(

            let newstr = ""
            let i
            let last
            for (i = token.LeadingWhite.length; i >= 0; i--) {
                let cur = token.LeadingWhite.substr(i, 1)
                if (cur == "" || cur.match(/\s/g)) {
                } else {
                    newstr = token.LeadingWhite.substr(0, i + 1)
                    break
                }
            }

            token.LeadingWhite = `${newstr}${indentString}`
        }
    }

    function indent() {
        currentIndent++
    }

    function undent() {
        currentIndent--
        assert(currentIndent >= 0, "Undented too far")
    }

    function leadingChar(tk) {
        if (tk.LeadingWhite.length > 0) {
            return tk.LeadingWhite.substr(0, 1)
        } else {
            return tk.Source.toString().substr(0, 1)
        }
    }

    function trimToken(tk) {
        tk.LeadingWhite = tk.LeadingWhite.trim()
    }
    function padToken(tk) {
        trimToken(tk)
        if (!WhiteChars.includes(leadingChar(tk))) {
            tk.LeadingWhite = ' ' + tk.LeadingWhite
        }
    }

    function padExpr(expr) {
        padToken(expr.GetFirstToken())
    }

    function formatBody(openToken, bodyStat, closeToken) {
        indent()
        formatStat(bodyStat)
        undent()
        applyIndent(closeToken)
    }

    formatExpr = function (expr) {
        if (expr.Type == "BinopExpr") {
            formatExpr(expr.Lhs)
            formatExpr(expr.Rhs)
            //if (expr.Token_Op.Source == "..") { // ayeaye
            //    expr.Token_Op.LeadingWhite = " "
            //   expr.Rhs.GetFirstToken.LeadingWhite = " "
            //} else {
            padExpr(expr.Rhs)
            padToken(expr.Token_Op)
            //}
        } else if (expr.Type == "UnopExpr") {
            //padToken(expr.Token_Op)
            formatExpr(expr.Rhs)
            padToken(expr.Rhs.GetFirstToken())
        } else if (expr.Type == "NumberLiteral" || expr.Type == "StringLiteral"
            || expr.Type == "NilLiteral" || expr.Type == "BooleanLiteral"
            || expr.Type == "VargLiteral" || expr.Type == 'HashLiteral') {
            // no
            trimToken(expr.Token)
            if (expr.Type == 'HashLiteral') {
                expr.Token.Source = '"' + hashString(`${expr.Token.Source.substring(1, expr.Token.Source.length - 1)}`) + '"'
                expr.Type = 'StringLiteral'
                expr.Token.Type = 'String'
            }

        } else if (expr.Type == "FieldExpr") {
            formatExpr(expr.Base)
        } else if (expr.Type == "IndexExpr") {
            formatExpr(expr.Base)
            formatExpr(expr.Index)
        } else if (expr.Type == "MethodExpr" || expr.Type == "CallExpr") {
            formatExpr(expr.Base)
            trimToken(expr.FunctionArguments.GetFirstToken())
            trimToken(expr.FunctionArguments.GetLastToken())
            if (expr.Type == "MethodExpr") {
            }

            if (expr.FunctionArguments.CallType == "StringCall") {
            } else if (expr.FunctionArguments.CallType == "ArgCall") {
                expr.FunctionArguments.ArgList.forEach((argExpr, index) => {
                    formatExpr(argExpr)
                    if (index > 0) {
                        padExpr(argExpr)
                    }
                    let sep = expr.FunctionArguments.Token_CommaList[index]
                    if (sep != null)
                        trimToken(sep)
                })

            } else if (expr.FunctionArguments.CallType == "TableCall") {
                formatExpr(expr.FunctionArguments.TableExpr)
            }
        } else if (expr.Type == "FunctionLiteral") {
            expr.ArgList.forEach((arg, index) => {
                if (index > 0) {
                    padToken(arg)
                }
                let comma = expr.Token_ArgCommaList[index]
                if (comma != null) {

                }
            })

            if (expr.ArgList.length > 0 && expr.Token_Varg != null) {
                padToken(expr.Token_Varg)
            }
            formatBody(expr.Token_CloseParen, expr.Body, expr.Token_End)
        } else if (expr.Type == "VariableExpr") {
            // no
        } else if (expr.Type == "ParenExpr") {
            trimToken(expr.Token_OpenParen)
            trimToken(expr.Token_CloseParen)

            formatExpr(expr.Expression)
        } else if (expr.Type == "TableLiteral") {
            if (expr.EntryList.length == 0) {

            } else {
                indent()

                let die = 100
                expr.EntryList.forEach((entry, index) => {
                    if (entry.EntryType == "Field") {
                        if (expr.EntryList.length > die) {
                            StripAst(entry.Value)
                        } else {
                            applyIndent(entry.Field)
                        }

                        padToken(entry.Token_Equals)
                        formatExpr(entry.Value)
                        padExpr(entry.Value)
                    } else if (entry.EntryType == "Index") {
                        if (expr.EntryList.length > die)
                            trimToken(entry.Token_OpenBracket)
                        //entry.Token_OpenBracket.LeadingWhite = ''
                        else
                            applyIndent(entry.Token_OpenBracket);

                        formatExpr(entry.Index)

                        padToken(entry.Token_Equals)
                        formatExpr(entry.Value)
                        padExpr(entry.Value)
                    } else if (entry.EntryType == "Value") {
                        formatExpr(entry.Value)

                        if (expr.EntryList.length > die) {
                            StripAst(entry.Value)
                        } else {
                            applyIndent(entry.Value.GetFirstToken())
                        }
                    } else {
                        assert(false, "unreachable")
                    }
                    let sep = expr.Token_SeperatorList[index]
                    if (sep != null) {
                        if (expr.EntryList.length > die)
                            sep.LeadingWhite = '';
                        else
                            trimToken(sep)
                    }
                })
                undent()
                if (expr.EntryList.length > die) {
                    expr.Token_CloseBrace.LeadingWhite = ''
                } else {
                    applyIndent(expr.Token_CloseBrace)
                }
            }
        } else if (expr.Type == 'CompoundStat') {
            formatStat(expr)
        } else if (expr.Type == "IfExpr") {
            formatExpr(expr.Condition)
            padExpr(expr.Condition)
            padToken(expr.Token_Then)

            let lastBodyOpen = expr.Token_Then
            let lastBody = expr.Body

            expr.ElseClauseList.forEach((clause) => {
                formatExpr(lastBody)
                padToken(lastBody.GetFirstToken())
                padToken(clause.Token)
                padToken(lastBodyOpen)
                lastBodyOpen = clause.Token

                if (clause.Condition != null) {
                    formatExpr(clause.Condition)
                    padExpr(clause.Condition)
                    padToken(clause.Token_Then)
                    lastBodyOpen = clause.Token_Then
                }
                lastBody = clause.Body
            })

            formatExpr(lastBody)
            padToken(lastBodyOpen)
            padToken(lastBody.GetFirstToken())
        } else {
            print(expr)
            throw (`unreachable, type: ${expr.Type}:` + expr)
        }
    }

    formatStat = function (stat) {
        if (stat.Type == "StatList") {
            stat.StatementList.forEach((stat, index) => {
                if (stat === null || stat.Type === null) {
                    return
                }

                if (stat.Type === 'StatList' && stat.StatementList.length === 0)
                    return


                stat.Remove = () => {
                    stat.StatementList[index] = null
                }

                formatStat(stat)
                applyIndent(stat.GetFirstToken())
            })
        } else if (stat.Type == "BreakStat") {
            // no
        } else if (stat.Type == "ContinueStat") {
            // fuck off
        } else if (stat.Type == 'GotoStat') {
            // todo - format goto stat.
        } else if (stat.Type == 'LabelStat') {
            // todo - not much
        } else if (stat.Type == "ReturnStat") {

            stat.ExprList.forEach((expr, index) => {
                formatExpr(expr)
                padExpr(expr)
                if (stat.Token_CommaList[index]) {

                }
            })
        } else if (stat.Type == "LocalVarStat") {
            stat.VarList.forEach((_var, index) => {
                padToken(_var)
                if (_var.Attribute) {
                    _var.Attribute.LeadingWhite = ' '
                }
                let comma = stat.Token_VarCommaList[index]
                if (comma != null) {

                }
            })
            if (stat.Token_Equals) {
                //stat.Token_Equals.LeadingWhite = ''
                trimToken(stat.Token_Equals)
                padToken(stat.Token_Equals)

                let newlist = []
                let newcommalist = []
                stat.ExprList.forEach((expr, index) => {
                    if (expr != null) {
                        if (index < stat.VarList.length) {
                            newlist.push(expr)
                            newcommalist.push(stat.Token_ExprCommaList[index])
                        } else if (expr.Type == "CallExpr" || expr.Type == "ParenExpr" || expr.Type == "VargLiteral" || expr.Type == "BinopExpr" || expr.Type == "UnopExpr") {
                            newlist.push(expr)
                            newcommalist.push(stat.Token_ExprCommaList[index])
                        }
                    }
                })

                stat.ExprList = newlist
                stat.CommaList = newcommalist

                stat.ExprList.forEach((expr, index) => {
                    if (expr != null) {
                        formatExpr(expr)
                        padExpr(expr)
                        let comma = stat.Token_ExprCommaList[index]
                        if (comma != null && stat.ExprList.length - 1 == index) {
                            stat.Token_ExprCommaList[index] = null
                        }
                    }
                })
            }
        } else if (stat.Type == "LocalFunctionStat") {
            padToken(stat.FunctionStat.Token_Function)
            padToken(stat.FunctionStat.NameChain[0])

            stat.FunctionStat.ArgList.forEach((arg, index) => {
                if (index > 0) {
                    padToken(arg)
                } else {
                    trimToken(arg)
                }

                let comma = stat.FunctionStat.Token_ArgCommaList[index]
                if (comma)
                    trimToken(comma)
            })

            if (stat.FunctionStat.ArgList.length > 0 && stat.FunctionStat.Token_Varg) {
                trimToken(stat.FunctionStat.Token_Varg)
                padToken(stat.FunctionStat.Token_Varg)
            } else if (stat.FunctionStat.Token_Varg) {
                trimToken(stat.FunctionStat.Token_Varg)
            }

            trimToken(stat.FunctionStat.Token_OpenParen)
            trimToken(stat.FunctionStat.Token_CloseParen)
            formatBody(stat.FunctionStat.Token_CloseParen, stat.FunctionStat.Body, stat.FunctionStat.Token_End)
        } else if (stat.Type == "FunctionStat") {
            stat.NameChain.forEach((part, index) => {
                if (index == 0) {
                    padToken(part)
                }
                let sep = stat.Token_NameChainSeperator[index]
                if (sep != null) {

                }
            })

            stat.ArgList.forEach((arg, index) => {
                if (index > 0) {
                    padToken(arg)
                }
                let comma = stat.Token_ArgCommaList[index]
                if (comma != null) {

                }
            })

            if (stat.ArgList.length > 0 && stat.Token_Varg) {
                padToken(stat.Token_Varg)
            }

            formatBody(stat.Token_CloseParen, stat.Body, stat.Token_End)
        } else if (stat.Type == "RepeatStat") {
            formatBody(stat.Token_Repeat, stat.Body, stat.Token_Until)
            formatExpr(stat.Condition)
            padExpr(stat.Condition)
        } else if (stat.Type == "GenericForStat") {
            stat.VarList.forEach((_var, index) => {
                padToken(_var)
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {

                }
            })
            padToken(stat.Token_In)
            stat.GeneratorList.forEach((expr, index) => {
                formatExpr(expr)
                padExpr(expr)
                let sep = stat.Token_GeneratorCommaList[index]
                if (sep != null) {

                }
            })
            padToken(stat.Token_Do)
            formatBody(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "NumericForStat") {
            stat.VarList.forEach((_var, index) => {
                padToken(_var)
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {

                }
            })
            padToken(stat.Token_Equals)
            stat.RangeList.forEach((expr, index) => {
                formatExpr(expr)
                padExpr(expr)
                let sep = stat.Token_RangeCommaList[index]
                if (sep != null) {

                }
            })
            padToken(stat.Token_Do)
            formatBody(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "WhileStat") {
            formatExpr(stat.Condition)
            padExpr(stat.Condition)
            padToken(stat.Token_Do)
            formatBody(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "DoStat") {
            formatBody(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "IfStat") {
            formatExpr(stat.Condition)
            padExpr(stat.Condition)
            padToken(stat.Token_Then)

            let lastBodyOpen = stat.Token_Then
            let lastBody = stat.Body

            stat.ElseClauseList.forEach((clause) => {
                formatBody(lastBodyOpen, lastBody, clause.Token)
                lastBodyOpen = clause.Token

                if (clause.Condition != null) {
                    formatExpr(clause.Condition)
                    padExpr(clause.Condition)
                    padToken(clause.Token_Then)
                    lastBodyOpen = clause.Token_Then
                }
                lastBody = clause.Body
            })

            formatBody(lastBodyOpen, lastBody, stat.Token_End)
        } else if (stat.Type == "CallExprStat") {
            formatExpr(stat.Expression)
        } else if (stat.Type == "CompoundStat") {
            formatExpr(stat.Lhs)
            formatExpr(stat.Rhs)

            padExpr(stat.Lhs)
            padExpr(stat.Rhs)
            padToken(stat.Token_Compound)
        } else if (stat.Type == "AssignmentStat") {
            stat.Lhs.forEach((ex, index) => {
                formatExpr(ex)
                if (index > 0) {
                    padExpr(ex)
                }
                let sep = stat.Token_LhsSeperatorList[index]
                if (sep != null) {

                }
            })
            padToken(stat.Token_Equals)
            stat.Rhs.forEach((ex, index) => {
                formatExpr(ex)
                padExpr(ex)
                let sep = stat.Token_RhsSeperatorList[index]
                if (sep != null) {

                }
            })
        } else {
            assert(false, "Unreachable")
        }
    }

    formatStat(ast)
}

function StripAst(ast) {
    let stripStat
    let stripExpr
    function stript(token) {
        if (token)
            token.LeadingWhite = ''
    }
    function joint(tokenA, tokenB, shit = false) {
        stript(tokenB)

        let lastCh = (typeof tokenA.Source == 'string' ? tokenA.Source : tokenA.Source.toString()).substr(tokenA.Source.length - 1, 1)
        let firstCh = (typeof tokenB.Source == 'string' ? tokenB.Source : tokenB.Source.toString()).substr(0, 1)

        if ((lastCh == "-" && firstCh == "-") || (AllIdentChars.includes(lastCh) && AllIdentChars.includes(firstCh)) || (shit && lastCh == ')' && firstCh == '(')) {
            tokenB.LeadingWhite = shit ? ';' : ' '
        } else {
            tokenB.LeadingWhite = ""
        }
    }

    function bodyjoint(open, body, close) {
        stripStat(body)
        stript(close)
        let bodyFirst = body.GetFirstToken()
        let bodyLast = body.GetLastToken()

        if (bodyFirst != null) {
            joint(open, bodyFirst)
            joint(bodyLast, close)
        } else {
            joint(open, close)
        }
    }

    stripExpr = function (expr) {
        if (expr.Type === "BinopExpr") {
            stripExpr(expr.Lhs)
            stripExpr(expr.Rhs)

            if (expr.Lhs.Type == 'NumberLiteral' && expr.Token_Op.Source == '..') {
                expr.Token_Op.LeadingWhite = ' '
            } else {
                stript(expr.Token_Op)
                joint(expr.Lhs.GetLastToken(), expr.Token_Op)
            }

            joint(expr.Token_Op, expr.Rhs.GetFirstToken())
        } else if (expr.Type === "UnopExpr") {
            stript(expr.Token_Op)
            stripExpr(expr.Rhs)

            joint(expr.Token_Op, expr.Rhs.GetFirstToken())
        } else if (expr.Type === "NumberLiteral" || expr.Type === "StringLiteral"
            || expr.Type === "NilLiteral" || expr.Type === "BooleanLiteral"
            || expr.Type === "VargLiteral" || expr.Type === 'HashLiteral') {
            stript(expr.Token)
        } else if (expr.Type == "FieldExpr") {
            stripExpr(expr.Base)
            stript(expr.Token_Dot)
            stript(expr.Field)
        } else if (expr.Type == "IndexExpr") {
            stripExpr(expr.Base)
            stript(expr.Token_OpenBracket)
            stripExpr(expr.Index)
            stript(expr.Token_CloseBracket)
        } else if (expr.Type == "MethodExpr" || expr.Type == "CallExpr") {
            stripExpr(expr.Base)
            if (expr.Type == "MethodExpr") {
                stript(expr.Token_Colon)
                stript(expr.Method)
            }
            if (expr.FunctionArguments.CallType == "StringCall") {
                stript(expr.FunctionArguments.Token)
            } else if (expr.FunctionArguments.CallType == "ArgCall") {
                stript(expr.FunctionArguments.Token_OpenParen)
                expr.FunctionArguments.ArgList.forEach((argExpr, index) => {
                    stripExpr(argExpr)
                    let sep = expr.FunctionArguments.Token_CommaList[index]
                    if (sep != null) {
                        stript(sep)
                    }
                })
                stript(expr.FunctionArguments.Token_CloseParen)
            } else if (expr.FunctionArguments.CallType == "TableCall") {
                stripExpr(expr.FunctionArguments.TableExpr)
            }
        } else if (expr.Type == "FunctionLiteral") {
            stript(expr.Token_Function)
            stript(expr.Token_OpenParen)
            expr.ArgList.forEach((arg, index) => {
                stript(arg)
                let comma = expr.Token_ArgCommaList[index]
                if (comma != null) {
                    stript(comma)
                }
            })
            if (expr.Token_Varg != null) {
                stript(expr.Token_Varg)
            }
            stript(expr.Token_CloseParen)
            bodyjoint(expr.Token_CloseParen, expr.Body, expr.Token_End)
        } else if (expr.Type == "VariableExpr") {
            stript(expr.Token)
        } else if (expr.Type == "ParenExpr") {
            stript(expr.Token_OpenParen)
            stripExpr(expr.Expression)
            stript(expr.Token_CloseParen)
        } else if (expr.Type == "IfExpr") {
            stript(expr.Token_If)
            stripExpr(expr.Condition)
            joint(expr.Token_If, expr.Condition.GetFirstToken())
            joint(expr.Condition.GetLastToken(), expr.Token_Then)

            let lastBodyOpen = expr.Token_Then
            let lastBody = expr.Body

            expr.ElseClauseList.forEach((clause, i) => {
                joint(lastBodyOpen, lastBody.GetFirstToken())
                joint(lastBody.GetLastToken(), clause.Token)
                lastBodyOpen = clause.Token

                if (clause.Condition != null) {
                    stripExpr(clause.Condition)
                    joint(clause.Token, clause.Condition.GetFirstToken())
                    joint(clause.Condition.GetLastToken(), clause.Token_Then)
                    lastBodyOpen = clause.Token_Then
                }

                stripExpr(clause.Body)
                lastBody = clause.Body
            })

            joint(lastBodyOpen, lastBody.GetFirstToken())
            //bodyjoint(lastBodyOpen, lastBody, expr.Token_End)
        } else if (expr.Type == "TableLiteral") {
            stript(expr.Token_OpenBrace)
            expr.EntryList.forEach((entry, index) => {
                if (entry.EntryType == "Field") {
                    stript(entry.Field)
                    stript(entry.Token_Equals)
                    stripExpr(entry.Value)
                } else if (entry.EntryType == "Index") {
                    stript(entry.Token_OpenBracket)
                    stripExpr(entry.Index)
                    stript(entry.Token_CloseBracket)
                    stript(entry.Token_Equals)
                    stripExpr(entry.Value)
                } else if (entry.EntryType == "Value") {
                    stripExpr(entry.Value)
                } else {
                    assert(false, "unreachable")
                }
                let sep = expr.Token_SeperatorList[index]
                if (sep != null) {
                    stript(sep)
                }
            })

            expr.Token_SeperatorList[expr.EntryList.length - 1] = null
            stript(expr.Token_CloseBrace)
        } else {
            throw (`unreachable, type: ${expr.Type}:${expr}  ${console.trace()}`)
        }
    }

    stripStat = function (stat) {
        if (stat.Type == "StatList") {
            let i
            for (i = 0; i <= stat.StatementList.length; i++) {
                let chStat = stat.StatementList[i]
                if (chStat == null) continue;

                stripStat(chStat)
                stript(chStat.GetFirstToken())
                let lastChStat = stat.StatementList[i - 1]
                if (lastChStat != null) {
                    let bannedCombos = {
                        ')': ['(', '['],
                        ']': ['(', '[']
                    }

                    if (stat.SemicolonList[i - 1]) {
                        let lastS = lastChStat.GetLastToken().Source
                        let firstS = chStat.GetFirstToken().Source
                        if (bannedCombos[lastS] === null || bannedCombos[lastS] === undefined || !bannedCombos[lastS].includes(firstS)) {
                            stat.SemicolonList[i - 1] = null
                        }
                    }

                    if (!stat.SemicolonList[i - 1]) {
                        joint(lastChStat.GetLastToken(), chStat.GetFirstToken(), true)
                    }
                }
            }

            stat.SemicolonList[stat.StatementList.length - 1] = null
            if (stat.StatementList.length > 0) {
                stript(stat.StatementList[0].GetFirstToken())
            }
        } else if (stat.Type == "BreakStat") {
            stript(stat.Token_Break)
        } else if (stat.Type == "ContinueStat") {
            stript(stat.Token_Continue)
        } else if (stat.Type == 'GotoStat') {
            // todo strip goto stat
            stript(stat.Token_Goto)
            joint(stat.Token_Goto, stat.Token_Label)
        } else if (stat.Type == 'LabelStat') {
            stript(stat.Token_ColonsLeft)
            stript(stat.Token_Label)
            stript(stat.Token_ColonsRight)
        } else if (stat.Type == "ReturnStat") {
            stript(stat.Token_Return)
            stat.ExprList.forEach((expr, index) => {
                stripExpr(expr)
                if (stat.Token_CommaList[index] != null) {
                    stript(stat.Token_CommaList[index])
                }
            })
            if (stat.ExprList.length > 0) {
                joint(stat.Token_Return, stat.ExprList[0].GetFirstToken())
            }
        } else if (stat.Type == "LocalVarStat") {
            stript(stat.Token_Local)
            let dontStripEqualSign = false
            stat.VarList.forEach((_var, index) => {
                if (index == 0) {
                    joint(stat.Token_Local, _var)
                } else {
                    stript(_var)
                }
                if (_var.Attribute) {
                    stript(_var.Attribute)
                    if ((index + 1) == stat.VarList.length)
                        dontStripEqualSign = true
                }

                let comma = stat.Token_VarCommaList[index]
                if (comma != null) {
                    stript(comma)
                }
            })
            if (stat.Token_Equals != null) {
                if (!dontStripEqualSign)
                    stript(stat.Token_Equals)
                stat.ExprList.forEach((expr, index) => {
                    stripExpr(expr)
                    let comma = stat.Token_ExprCommaList[index]
                    if (comma != null) {
                        stript(comma)
                    }
                })
            }
        } else if (stat.Type == "LocalFunctionStat") {
            stript(stat.Token_Local)
            joint(stat.Token_Local, stat.FunctionStat.Token_Function)
            joint(stat.FunctionStat.Token_Function, stat.FunctionStat.NameChain[0])
            joint(stat.FunctionStat.NameChain[0], stat.FunctionStat.Token_OpenParen)

            stat.FunctionStat.ArgList.forEach((arg, index) => {
                stript(arg)
                let comma = stat.FunctionStat.Token_ArgCommaList[index]
                if (comma != null) {
                    stript(comma)
                }
            })
            if (stat.FunctionStat.Token_Varg) {
                stript(stat.FunctionStat.Token_Varg)
            }
            stript(stat.FunctionStat.Token_CloseParen)
            bodyjoint(stat.FunctionStat.Token_CloseParen, stat.FunctionStat.Body, stat.FunctionStat.Token_End)
        } else if (stat.Type == "FunctionStat") {
            stript(stat.Token_Function)
            stat.NameChain.forEach((part, index) => {
                if (index == 0) {
                    joint(stat.Token_Function, part)
                } else {
                    stript(part)
                }
                let sep = stat.Token_NameChainSeperator[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            stript(stat.Token_OpenParen)
            stat.ArgList.forEach((arg, index) => {
                stript(arg)
                let comma = stat.Token_ArgCommaList[index]
                if (comma != null) {
                    stript(comma)
                }
            })

            if (stat.Token_Varg) {
                stript(stat.Token_Varg)
            }
            stript(stat.Token_CloseParen)
            bodyjoint(stat.Token_CloseParen, stat.Body, stat.Token_End)
        } else if (stat.Type == "RepeatStat") {
            stript(stat.Token_Repeat)
            bodyjoint(stat.Token_Repeat, stat.Body, stat.Token_Until)
            stripExpr(stat.Condition)
            joint(stat.Token_Until, stat.Condition.GetFirstToken())
        } else if (stat.Type == "GenericForStat") {
            stript(stat.Token_For)
            stat.VarList.forEach((_var, index) => {
                if (index == 0) {
                    joint(stat.Token_For, _var)
                } else {
                    stript(_var)
                }
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            joint(stat.VarList[stat.VarList.length - 1], stat.Token_In)
            stat.GeneratorList.forEach((expr, index) => {
                stripExpr(expr)
                if (index == 0) {
                    joint(stat.Token_In, expr.GetFirstToken())
                }
                let sep = stat.Token_GeneratorCommaList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            joint(stat.GeneratorList[stat.GeneratorList.length - 1].GetLastToken(), stat.Token_Do)
            bodyjoint(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "NumericForStat") {
            stript(stat.Token_For)
            stat.VarList.forEach((_var, index) => {
                if (index == 0) {
                    joint(stat.Token_For, _var)
                } else {
                    stript(_var)
                }
                let sep = stat.Token_VarCommaList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            joint(stat.VarList[stat.VarList.length - 1], stat.Token_Equals)
            stat.RangeList.forEach((expr, index) => {
                stripExpr(expr)
                if (index == 0) {
                    joint(stat.Token_Equals, expr.GetFirstToken())
                }
                let sep = stat.Token_RangeCommaList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            joint(stat.RangeList[stat.RangeList.length - 1].GetLastToken(), stat.Token_Do)
            bodyjoint(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "WhileStat") {
            stript(stat.Token_While)
            stripExpr(stat.Condition)
            stript(stat.Token_Do)
            joint(stat.Token_While, stat.Condition.GetFirstToken())
            joint(stat.Condition.GetLastToken(), stat.Token_Do)
            bodyjoint(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "DoStat") {
            stript(stat.Token_Do)
            stript(stat.Token_End)
            bodyjoint(stat.Token_Do, stat.Body, stat.Token_End)
        } else if (stat.Type == "IfStat") {
            stript(stat.Token_If)
            stripExpr(stat.Condition)
            joint(stat.Token_If, stat.Condition.GetFirstToken())
            joint(stat.Condition.GetLastToken(), stat.Token_Then)

            let lastBodyOpen = stat.Token_Then
            let lastBody = stat.Body

            stat.ElseClauseList.forEach((clause, i) => {
                bodyjoint(lastBodyOpen, lastBody, clause.Token)
                lastBodyOpen = clause.Token

                if (clause.Condition != null) {
                    stripExpr(clause.Condition)
                    joint(clause.Token, clause.Condition.GetFirstToken())
                    joint(clause.Condition.GetLastToken(), clause.Token_Then)
                    lastBodyOpen = clause.Token_Then
                }

                stripStat(clause.Body)
                lastBody = clause.Body
            })

            bodyjoint(lastBodyOpen, lastBody, stat.Token_End)
        } else if (stat.Type == "CallExprStat") {
            stripExpr(stat.Expression)
        } else if (stat.Type == "CompoundStat") {
            stripExpr(stat.Lhs)
            stript(stat.Token_Compound)
            stripExpr(stat.Rhs)

            joint(stat.Lhs.GetLastToken(), stat.Token_Compound)
            joint(stat.Token_Compound, stat.Rhs.GetFirstToken())

            //lastBody = stat.Body
        } else if (stat.Type == "AssignmentStat") {
            stat.Lhs.forEach((ex, index) => {
                stripExpr(ex)
                let sep = stat.Token_LhsSeperatorList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
            stript(stat.Token_Equals)
            stat.Rhs.forEach((ex, index) => {
                stripExpr(ex)
                let sep = stat.Token_RhsSeperatorList[index]
                if (sep != null) {
                    stript(sep)
                }
            })
        } else {
            return stripExpr(stat)
        }
    }

    stripStat(ast)
}

let VarDigits = []

let i
for (i = "a".charCodeAt(); i <= "z".charCodeAt(); i++) VarDigits.push(String.fromCharCode(i));
for (i = "A".charCodeAt(); i <= "Z".charCodeAt(); i++) VarDigits.push(String.fromCharCode(i));
for (i = "0".charCodeAt(); i <= "9".charCodeAt(); i++) VarDigits.push(String.fromCharCode(i));
VarDigits.push("_")

let VarStartDigits = []
for (i = "a".charCodeAt(); i <= "z".charCodeAt(); i++) VarStartDigits.push(String.fromCharCode(i));
for (i = "A".charCodeAt(); i <= "Z".charCodeAt(); i++) VarStartDigits.push(String.fromCharCode(i));


function indexToVarName(index) {
    let id = ""
    let d = index % VarStartDigits.length
    index = (index - d) / VarStartDigits.length
    id = `${id}${VarStartDigits[d]}`
    while (index > 0) {
        let d = index % VarDigits.length
        index = (index - d) / VarDigits.length
        id = `${id}${VarDigits[d]}`
    }
    return id
}


function MinifyVariables_2(globalScope, rootScope, renameGlobals) {
    let globalUsedNames = []
    for (var [kw, _] of Object.entries(Keywords)) {
        globalUsedNames[kw] = true
    }

    let allVariables = []
    let allLocalVariables = []

    globalScope.forEach((_var) => {
        if (_var.AssignedTo && renameGlobals) {
            allVariables.push(_var)
        } else {
            globalUsedNames[_var.Name] = true
        }
    })

    function addFrom(scope) {
        scope.VariableList.forEach((_var) => {
            allVariables.push(_var)
            allLocalVariables.push(_var)
        })
        scope.ChildScopeList.forEach((childScope) => {
            addFrom(childScope)
        })
    }
    addFrom(rootScope)

    allVariables.forEach((_var) => {
        _var.UsedNameArray = []
    })

    allVariables.sort((a, b) => a - b)

    let nextValidNameIndex = 0
    let varNamesLazy = []

    function varIndexToValidName(i) {
        let name = varNamesLazy[i]
        if (name == null) {
            name = indexToVarName(nextValidNameIndex)
            nextValidNameIndex++
            while (globalUsedNames[name]) {
                name = indexToVarName(nextValidNameIndex)
                nextValidNameIndex++
            }
            varNamesLazy[i] = name
        }
        return name
    }


    allVariables.forEach((_var, _) => {
        _var.Renamed = true

        let i = 0
        while (_var.UsedNameArray[i]) {
            i++
        }

        _var.Rename(varIndexToValidName(i))

        if (_var.Scope) {

            allVariables.forEach((otherVar) => {
                if (!otherVar.Renamed) {
                    if (!otherVar.Scope || otherVar.Scope.Depth < _var.Scope.Depth) {
                        otherVar.ReferenceLocationList.some((refAt) => {
                            if (refAt >= _var.BeginLocation && refAt <= _var.ScopeEndLocation) {
                                otherVar.UsedNameArray[i] = true
                                return true
                            }
                            return false
                        })
                    } else if (otherVar.Scope.Depth > _var.Scope.Depth) {
                        _var.ReferenceLocationList.some((refAt) => {
                            if (refAt >= otherVar.BeginLocation && refAt <= otherVar.ScopeEndLocation) {
                                otherVar.UsedNameArray[i] = true
                                return true
                            }
                            return false
                        })
                    } else {
                        if (_var.BeginLocation < otherVar.EndLocation && _var.EndLocation > otherVar.BeginLocation) {
                            otherVar.UsedNameArray[i] = true
                        }
                    }
                }
            })
        } else {
            allVariables.forEach((otherVar) => {
                if (!otherVar.Renamed) {
                    if (otherVar.Type == "Global") {
                        otherVar.UsedNameArray[i] = true
                    } else if (otherVar.Type == "Local") {

                        _var.ReferenceLocationList.some((refAt) => {
                            if (refAt >= otherVar.BeginLocation && refAt <= otherVar.ScopeEndLocation) {
                                otherVar.UsedNameArray[i] = true
                                return true
                            }

                            return false
                        })
                    } else {
                        throw "Unreachable"
                    }
                }
            })
        }
    })
}

function BeautifyVariables(globalScope, rootScope, renameGlobals) {
    let externalGlobals = []
    globalScope.forEach((_var) => {
        if (!_var.AssignedTo || !renameGlobals) {
            externalGlobals[_var.Name] = true
        }
    })

    let localNumber = 1
    let globalNumber = 1
    function setVarName(_var, name) {
        _var.Name = name
        _var.RenameList.forEach((setter) => {
            setter(name)
        })
    }

    if (renameGlobals) {
        let names = {}
        globalScope.forEach((_var) => {
            if (_var.AssignedTo && !_var.ChangedName) {
                names[_var.Name] = names[_var.Name] || `G_${globalNumber}_`
                _var.ChangedName = true
                setVarName(_var, names[_var.Name])
                globalNumber++
            }
        })
    }

    function modify(scope) {
        scope.VariableList.forEach((_var) => {
            let name = `L_${localNumber}_`
            if (_var.Info.Type == "Argument") {
                name = `${name}arg${_var.Info.Index}`
            } else if (_var.Info.Type == "LocalFunction") {
                name = `${name}func`
            } else if (_var.Info.Type == "ForRange") {
                name = `${name}forvar${_var.Info.Index}`
            }
            setVarName(_var, name)
            localNumber++
        })
        scope.ChildScopeList.forEach((scope1) => {
            modify(scope1)
        })
    }

    modify(rootScope)
}

function GetInnerExpression(stat) {
    let inner = stat
    while (inner.Type === 'ParenExpr')
        inner = inner.Expression
    return inner
}

function RemoveExtraParenExpr(ast) {
    let visitor = {}

    visitor.ParenExpr = expr => {
        let inner = GetInnerExpression(expr.Expression)
        transformA2B(expr.Expression, inner)
    }

    VisitAst(ast, visitor)
}

function RemoveExtraDoStatements(ast) {
    let visitor = {}

    visitor.DoStat = stat => {
        // Todo : add stat.Parent
        if (stat.Body === null || (stat.Body.Type == "StatList" && stat.Body.StatementList.length === 0)) {
            return stat.Remove()
        } else if (stat.Body.StatementList.length === 1) {
            let s = stat.Body.StatementList[0]
            if (s !== null) {
                if (s.Type !== 'ContinueStat'
                    && s.Type !== 'BreakStat'
                    && s.Type !== 'ReturnStat') {
                    transformA2B(stat, s)
                }
            }
        }
    }

    VisitAst(ast, visitor)
}

function constantsEqual(la, ra) {
    switch (la.Type) {
        case 'NilLiteral':
            return ra.Type === 'NilLiteral'

        case 'BooleanLiteral':
            return ra.Type === 'BooleanLiteral' && la.Token.Source === ra.Token.Source

        case 'NumberLiteral':
            return ra.Type === 'NumberLiteral' && la.Token.Source === ra.Token.Source

        case 'StringLiteral':
            return ra.Type === 'StringLiteral' && la.Token.Source === ra.Token.Source

        case 'HashLiteral':
            return ra.Type === 'HashLiteral' && la.Token.Source === ra.Token.Source

        default:
            return false
    }
}

function isTruthful(expr) {
    switch (expr.Type) {
        case 'NilLiteral':
            return false
        case 'BooleanLiteral':
            return expr.Token.Source === 'true'
        case 'StringLiteral':
        case 'HashLiteral':
        case 'FunctionLiteral':
        case 'NumberLiteral':
            return true
        default:
            return -1
    }
}

function removeStringChars(a) {
    if (a == null || a.substr == null) return;

    let start = a.substr(0, 1)
    let ret
    if (start == `"` || start == `'`) ret = a.substr(1, a.length - 2);
    if (start == `[`) {
        let count = 0;
        let p = 1;
        while (a.substr(p, 1) == '=') {
            count++;
            p++;
        }

        ret = a.substr(2 + count, a.length - 4 - count - 2);
    }
    if (ret == null) return '';

    let newret = ''
    let i
    for (i = 0; i <= ret.length; i++) {
        let c = ret.substr(i, 1)

        if (c == `'` || c == `"`) {
            newret += `\\${c}`
        } else {
            newret += c
        }
    }
    return newret
}

function createLiteral(type, source, leadingWhite = '') {
    let x; x = {
        Type: type,
        Token: {
            Type: 'Keyword',
            LeadingWhite: leadingWhite,
            Source: '' + source
        },
        GetFirstToken: () => x.Token,
        GetLastToken: () => x.Token
    }
    return x
}

function foldUnary(result, op, arg) {
    switch (op.Source) {
        case 'not':
            let res = isTruthful(arg)
            if (res !== -1) {
                transformA2B(result, createLiteral('BooleanLiteral', !res, op.LeadingWhite))
            }

            break
        case '-':
            if (arg.Type === "NumberLiteral") {
                transformA2B(result, createLiteral('NumberLiteral', -parseFloat(arg.Token.Source), op.LeadingWhite))
            }
            break
        case '#':
            if (arg.Type === "StringLiteral") {
                transformA2B(result, createLiteral('NumberLiteral', removeStringChars(arg.Token.Source).length, op.LeadingWhite))
            }
            break
    }
}

function foldBinary(result, op, la, ra) {
    switch (op.Source) {
        case '+':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    parseFloat(la.Token.Source) + parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            } // todo : else if (Vector...)

            break
        case '-':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    parseFloat(la.Token.Source) - parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            } // todo : else if (Vector...)

            break
        case '*':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    parseFloat(la.Token.Source) * parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            } // todo : else if (Vector...)

            break
        case '/':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    parseFloat(la.Token.Source) / parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            } // todo : else if (Vector...)

            break
        case '//':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    Math.floor(parseFloat(la.Token.Source) / parseFloat(ra.Token.Source)),
                    la.GetFirstToken().LeadingWhite
                ))
            }

            break
        case '%':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                let [la1, ra1] = [parseFloat(la.Token.Source), parseFloat(ra.Token.Source)]
                transformA2B(result, createLiteral('NumberLiteral',
                    la1 - Math.floor(la1 / ra1) * ra1,
                    la.GetFirstToken().LeadingWhite
                ))
            }

            break
        case '^':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('NumberLiteral',
                    Math.pow(parseFloat(la.Token.Source), parseFloat(ra.Token.Source)),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '..':
            if (la.Type === 'StringLiteral' && ra.Type === 'StringLiteral') {
                transformA2B(result, createLiteral('StringLiteral',
                    Math.floor(la.Token.Source + ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '~=':
            if (la.Type !== 'Unknown' && ra.Type !== 'Unknown') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    !constantsEqual(la, ra),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '==':
            if (la.Type !== 'Unknown' && ra.Type !== 'Unknown') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    constantsEqual(la, ra),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '<':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    parseFloat(la.Token.Source) < parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '<=':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    parseFloat(la.Token.Source) <= parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '>':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    parseFloat(la.Token.Source) > parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case '>=':
            if (la.Type === 'NumberLiteral' && ra.Type === 'NumberLiteral') {
                transformA2B(result, createLiteral('BooleanLiteral',
                    parseFloat(la.Token.Source) >= parseFloat(ra.Token.Source),
                    la.GetFirstToken().LeadingWhite
                ))
            }
            break
        case 'and':
            if (la.Type !== 'Unknown') {
                let res = isTruthful(la)
                //if (la === -1)
                //    return
                if (res)
                    transformA2B(result, ra)
                else
                    transformA2B(result, la)
            }
            break
        case 'or':
            if (la.Type !== 'Unknown') {
                let res = isTruthful(la)
                // if la !== -1
                if (res)
                    transformA2B(result, la)
                else
                    transformA2B(result, ra)
            }
            break
    }
}

function ValueTracking(ast) {
    let globals = {}
    let variables = {}

    function assign(variable) {
        if (variable.Type == 'VariableExpr') {
            // variable.Info.Type == 'Local'
            // remember to remove if
            if (variables[variable.Token.Source])
                variables[variable.Token.Source].written = true
        } // else if Global
        else {
            // visit
        }
    }

    let visitor = {}

    // VariableExpr
    visitor.LocalVarStat = node => {
        for (let i = 0; i < node.VarList.length && i < node.ExprList.length; ++i) {
            variables[node.VarList[i].Source] = node.ExprList[i]
        }

        for (let i = node.ExprList.length; i < node.VarList.length; ++i) {
            variables[node.VarList[i].Source] = null
        }

        return true
    }

    visitor.AssignmentStat = node => {
        for (let i = 0; i < node.Lhs.length; ++i) {
            assign(node.Lhs[i])
        }

        for (let i = 0; i < node.Rhs.length; ++i) {
            visitor.VisitExpr(node.Rhs[i])
        }

        return false
    }

    visitor.CompoundStat = node => {
        assign(node.Lhs)
        return false
    }

    visitor.LocalFunctionStat = node => {
        variables[node.FunctionStat.NameChain[0].Source] = node.FunctionStat
        return true
    }

    visitor.FunctionStat = node => {
        assign(node.NameChain[0])
        return false
    }

    visitor.FunctionLiteral = node => {
        node.ArgList.forEach(v => {
            variables[v.var.Name] = null
        })
        return false
    }

    VisitAst(ast, visitor)
    return [variables, globals]
}

function SolveSimpleMath(ast, variables, globals) {
    let locals = {}
    let constants = {}
    let wasEmpty = variables.length === 0 && locals.length === 0

    function recordConstant(map, key, value) {
        if (value.Type !== 'Unknown') {
            map[key] = value
        } else if (wasEmpty) {
            ;
        } else if (old = map[key]) {
            old.Type = 'Unknown'
        }
    }

    function recordValue(local, value) {
        let v = variables[local.Source]
        if (!v) return;
        if (!v.written) {
            v.constant = (value.Type !== 'Unknown')
            recordConstant(locals, local.Source, value)
        }
    }

    let analyze;
    analyze = node => {
        let result = {
            Type: 'Unknown'
        }

        switch (node.Type) {
            case 'NilLiteral':
            case 'BooleanLiteral':
            case 'NumberLiteral':
            case 'StringLiteral':
                result = node
                break
            case 'ParenExpr':
                let innerExpr = analyze(node.Expression)
                if (innerExpr.Type !== 'Unknown')
                    result = innerExpr
                break
            case 'UnopExpr':
                let arg = analyze(node.Rhs)
                if (arg.Type !== 'Unknown')
                    foldUnary(result, node.Token_Op, arg)
                break
            case 'BinopExpr':
                let la = analyze(node.Lhs)
                let ra = analyze(node.Rhs)

                if (la.Type !== 'Unknown')
                    foldBinary(result, node.Token_Op, la, ra)

                break

            case 'VariableExpr':
                let l = locals[node.Variable.Name]
                if (l)
                    result = l
                break

            case 'IfStat':
                if (node.ElseClauseList.length === 1 && node.ElseClauseList[0].ClauseType === 'else') {
                    let cond = analyze(node.Condition)
                    //let trueExpr = analyze(node.Body)
                    //let falseExpr = analyze(node.ElseClauseList[0])
                    if (cond.Type !== 'Unknown') {
                        transformA2B(result, isTruthful(cond) ? node.Body : node.ElseClauseList[0].Body)
                    }
                }
                break

            default:
                break
        }
        //recordConstant(constants, node, result)

        return result
    }

    let visitor = {}
    visitor.UnopExpr = expr => {
        // We can theoretically remove double not not's
        // unless they do (not not _1 == true/false) ...
        /*if (expr.Token_Op.Source === 'not') {
            let inner = GetInnerExpression(expr.Rhs)
            if (inner.Type === 'UnopExpr' && inner.Token_Op.Source === 'not') {
                transformA2B(expr, inner.Rhs)
                return visitor.VisitExpr(expr)
            }
        }*/

        let result = analyze(expr)
        if (result.Type !== 'Unknown')
            transformA2B(expr, result)
    }

    visitor.BinopExpr = expr => {
        let result = analyze(expr)

        if (result.Type !== 'Unknown')
            transformA2B(expr, result)
    }

    visitor.IfStat = stat => {
        let result = analyze(stat)
        if (result.Type !== 'Unknown')
            transformA2B(stat, result)
    }

    visitor.LocalVarStat = node => {
        for (let i = 0; i < node.VarList.length && i < node.ExprList.length; ++i) {
            let arg = analyze(node.ExprList[i])
            //console.log(node.ExprList[i])
            recordValue(node.VarList[i], arg)
        }

        if (node.VarList.length > node.ExprList.length) {
            let last = node.ExprList.length > 0 ? node.ExprList[node.ExprList.length - 1] : null
            let multRet = last && (last.Type === 'CallExpr' || last.Type === 'VargLiteral')
            if (!multRet) {
                for (let i = node.ExprList.length; i < node.VarList.length; ++i) {
                    recordValue(node.VarList[i], { Type: 'Unknown' }) // should be nil
                }
            }
        } else {
            for (let i = node.VarList.length; i < node.ExprList.length; ++i) {
                analyze(node.ExprList[i])
            }
        }
    }

    VisitAst(ast, visitor)
}

// Removed old watermark

let luaminp = {}

luaminp.Minify = function (scr, options) {

    let ast = CreateLuaParser(scr)
    let [glb, root] = AddVariableInfo(ast)

    if (options.RenameVariables == true) {
        MinifyVariables_2(glb, root, options.RenameGlobals)
    }

    if (options.SolveMath == true) {
        let [variables, globals] = ValueTracking(ast)
        SolveSimpleMath(ast, variables, globals)
    }

    StripAst(ast)

    return PrintAst(ast)
}

luaminp.Beautify = function (scr, options) {
    let ast = CreateLuaParser(scr)
    let [glb, root] = AddVariableInfo(ast)
    if (options.RenameVariables) {
        BeautifyVariables(glb, root, options.RenameGlobals)
    }

    if (options.SolveMath) {
        RemoveExtraDoStatements(ast)
        RemoveExtraParenExpr(ast)

        let [variables, globals] = ValueTracking(ast)
        SolveSimpleMath(ast, variables, globals)
        //SolveMath(ast) // oboy
        //SolveCFlow(ast) 
    }

    options.Indentation = (typeof options.Indentation === 'string') ? options.Indentation : '\t'
    FormatAst(ast, options.Indentation)

    return PrintAst(ast)
}


try {
    if (module != null && module.exports != null) {
        module.exports.Beautify = luaminp.Beautify
        module.exports.Minify = luaminp.Minify
    }
} catch (err) {/*idontcareboutthis*/ }

//export {luaminp as luamin};
},
});
