/* MONKz DEOBF engine: static analysis only, input code is never executed */
(function (root) {
  const KW = new Set('and break do else elseif end false for function goto if in local nil not or repeat return then true until while'.split(' '));
  const OPS = ['...=', '//=', '..=', '...', '==', '~=', '<=', '>=', '..', '::', '//', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '^=', '->'];

  function tokenize(src) {
    const out = []; let i = 0, nl = 0;
    const re = (r) => { r.lastIndex = i; const m = r.exec(src); return m && m[0]; };
    const longEnd = (at) => {
      const r = /\[(=*)\[/y; r.lastIndex = at; const m = r.exec(src);
      if (!m) return -1;
      const close = ']' + m[1] + ']', e = src.indexOf(close, at + m[0].length);
      if (e < 0) throw new Error('Unterminated long string or comment');
      return e + close.length;
    };
    const quotedEnd = (at) => {
      const q = src[at]; let j = at + 1;
      while (j < src.length && src[j] !== q) {
        if (src[j] === '\\') {
          if (src[j + 1] === 'z') { j += 2; while (/\s/.test(src[j] || '')) j++; continue; }
          if (src[j + 1] === '\r' && src[j + 2] === '\n') j++;
          j += 2; continue;
        }
        if (src[j] === '\n' && q !== '`') break;
        j++;
      }
      if (src[j] !== q) throw new Error('Unterminated string (position ' + at + ')');
      return j + 1;
    };
    const push = (t, end) => { out.push({ t, v: src.slice(i, end), nl }); nl = 0; i = end; };
    while (i < src.length) {
      const c = src[i]; let s, e;
      if (c === '\n') { nl++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (src.startsWith('--', i)) {
        e = longEnd(i + 2);
        if (e < 0) { e = src.indexOf('\n', i); if (e < 0) e = src.length; }
        push('com', e);
      } else if (c === '"' || c === "'") push('str', quotedEnd(i));
      else if (c === '`') push('interp', quotedEnd(i));
      else if (c === '[' && (e = longEnd(i)) > 0) push('long', e);
      else if ((s = re(/(?:0[xX](?:[0-9a-fA-F_]*\.?[0-9a-fA-F_]+\.?)(?:[pP][+-]?\d+)?|0[bB][01_]+|(?:\d[\d_]*(?:\.(?!\.)[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)(?:[uU]?[lL][lL])?/y))) push('num', i + s.length);
      else if ((s = re(/[A-Za-z_\u0080-\uffff][A-Za-z0-9_\u0080-\uffff]*/y))) push(KW.has(s) ? 'kw' : 'name', i + s.length);
      else push('op', i + (OPS.find((o) => src.startsWith(o, i)) || c).length);
    }
    return out;
  }

  /* ---- strings: Lua source <-> bytes ---- */
  const enc = new TextEncoder();
  function decodeString(lit) {
    const body = lit.slice(1, -1), bytes = [];
    const add = (s) => { for (const b of enc.encode(s)) bytes.push(b); };
    const simple = { a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11, '\\': 92, '"': 34, "'": 39, '\n': 10 };
    const r = /\\(?:(\d{1,3})|x([0-9a-fA-F]{2})|u\{([0-9a-fA-F]+)\}|z\s*|(\r\n|[\s\S]))|([^\\]+)/g;
    let m;
    while ((m = r.exec(body))) {
      if (m[5] !== undefined) add(m[5]);
      else if (m[1]) { if (+m[1] > 255) return null; bytes.push(+m[1]); }
      else if (m[2]) bytes.push(parseInt(m[2], 16));
      else if (m[3]) { const cp = parseInt(m[3], 16); if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return null; add(String.fromCodePoint(cp)); }
      else if (m[4] !== undefined) {
        const k = m[4] === '\r\n' ? '\n' : m[4];
        if (!(k in simple)) return null;
        bytes.push(simple[k]);
      }
    }
    return bytes;
  }
  function encodeString(bytes) {
    let text = null;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(new Uint8Array(bytes)); } catch (_) {}
    const chars = text === null ? bytes.map((b) => [b, String.fromCharCode(b)]) : Array.from(text, (ch) => [ch.codePointAt(0), ch]);
    let out = '"';
    for (const [n, ch] of chars) {
      if (ch === '"') out += '\\"';
      else if (ch === '\\') out += '\\\\';
      else if (n === 10) out += '\\n';
      else if (n === 13) out += '\\r';
      else if (n === 9) out += '\\t';
      else if (n < 32 || n === 127 || (text === null && n > 127)) out += '\\' + String(n).padStart(3, '0');
      else out += ch;
    }
    return out + '"';
  }

  const isValue = (t) => !!t && (['name', 'num', 'str', 'long', 'interp'].includes(t.t) || [')', ']', '}', 'end', 'true', 'false', 'nil', '...'].includes(t.v));
  const EXPR_BEFORE = new Set(['=', '(', ',', '{', '[', 'return', '..', '==', '~=', '<', '>', '<=', '>=', 'and', 'or']);
  const TIGHT = new Set(['+', '-', '*', '/', '//', '%', '^', '#', 'not']);
  const intVal = (v) => {
    const s = v.replace(/_/g, '');
    if (!/^(\d+|0[xX][0-9a-fA-F]+|0[bB][01]+)$/.test(s)) return null;
    const n = Number(s); return Number.isSafeInteger(n) ? n : null;
  };

  function evalInts(list) {
    let p = 0, ops = 0;
    const safe = (n) => (n !== null && Number.isSafeInteger(n) ? n : null);
    const atom = () => {
      const t = list[p++]; if (!t) return null;
      if (t.v === '-') { const a = atom(); return a === null ? null : -a; }
      if (t.v === '(') { const a = sum(); return list[p++]?.v === ')' ? a : null; }
      return t.t === 'num' ? intVal(t.v) : null;
    };
    const prod = () => { let a = atom(); while (a !== null && list[p]?.v === '*') { p++; ops++; const b = atom(); a = b === null ? null : safe(a * b); } return a; };
    const sum = () => { let a = prod(); while (a !== null && (list[p]?.v === '+' || list[p]?.v === '-')) { const o = list[p++].v; ops++; const b = prod(); a = b === null ? null : safe(o === '+' ? a + b : a - b); } return a; };
    const r = sum();
    return p === list.length && ops > 0 ? r : null;
  }

  function simplify(toks, stats) {
    let changed = true, rounds = 0;
    while (changed && rounds++ < 20) {
      changed = false;
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i], prev = toks[i - 1];
        /* (123 + 45 * 2) -> 213 */
        if (t.v === '(' && prev && !isValue(prev)) {
          let j = i + 1, d = 1;
          for (; j < toks.length && j - i < 60; j++) {
            const x = toks[j];
            if (x.v === '(') d++; else if (x.v === ')') { if (--d === 0) break; }
            else if (!(x.t === 'num' || ['+', '-', '*'].includes(x.v))) break;
          }
          if (d === 0 && prev.v !== 'function') {
            const val = evalInts(toks.slice(i + 1, j));
            if (val !== null) {
              const wrap = val < 0;
              const rep = { t: 'num', v: wrap ? '(' + val + ')' : String(val), nl: t.nl };
              toks.splice(i, j - i + 1, rep); stats.numbers++; changed = true; continue;
            }
          }
        }
        /* string.char(72, 105) -> "Hi" */
        if (t.v === 'string' && toks[i + 1]?.v === '.' && toks[i + 2]?.v === 'char' && toks[i + 3]?.v === '(' && prev && EXPR_BEFORE.has(prev.v)) {
          const bytes = []; let j = i + 4, ok = false;
          while (toks[j]?.t === 'num') {
            const n = intVal(toks[j].v);
            if (n === null || n > 255) break;
            bytes.push(n); j++;
            if (toks[j]?.v === ',') { j++; continue; }
            ok = toks[j]?.v === ')'; break;
          }
          if (ok) {
            let v = encodeString(bytes);
            if (['.', ':', '[', '('].includes(toks[j + 1]?.v)) v = '(' + v + ')';
            toks.splice(i, j - i + 1, { t: 'str', v, nl: t.nl }); stats.chars++; changed = true; continue;
          }
        }
        /* "Hel" .. "lo" -> "Hello" */
        if (t.t === 'str' && t.v[0] !== '(' && toks[i + 1]?.v === '..' && toks[i + 2]?.t === 'str' && toks[i + 2].v[0] !== '(' && !(prev && TIGHT.has(prev.v)) && toks[i + 3]?.v !== '^') {
          const a = decodeString(t.v), b = decodeString(toks[i + 2].v);
          if (a && b) { toks.splice(i, 3, { t: 'str', v: encodeString(a.concat(b)), nl: t.nl }); stats.joins++; changed = true; i--; }
        }
      }
    }
    return toks;
  }

  function beautify(toks) {
    let out = '', line = '', depth = 0;
    const stack = []; /* {kind, indented, line} */
    let lineNo = 0, lineDepth = 0, brk = false, ifExpr = 0, fnHead = [];
    const flush = () => { if (line) { out += '    '.repeat(Math.max(0, lineDepth)) + line + '\n'; line = ''; lineNo++; } };
    const open = (kind) => { const indented = !stack.some((s) => s.line === lineNo && s.indented); if (indented) depth++; stack.push({ kind, indented, line: lineNo }); };
    const close = () => { const s = stack.pop(); if (s && s.indented) depth--; };
    const STARTERS = new Set(['local', 'if', 'for', 'while', 'return', 'repeat', 'function', 'break']);
    let prev = null, prevUnary = false;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i], v = t.v, code = t.t === 'kw' || t.t === 'op';
      const exprIf = code && v === 'if' && prev && (EXPR_BEFORE.has(prev.v) || TIGHT.has(prev.v));
      if (exprIf) ifExpr++;
      const inExprIf = ifExpr > 0 && code && (v === 'then' || v === 'else' || v === 'elseif');
      const closer = code && !inExprIf && ['end', 'until', '}', 'else', 'elseif'].includes(v);
      let want = brk || t.nl > 0 || closer;
      brk = false;
      if (prev && isValue(prev) && (t.t === 'name' || (t.t === 'kw' && STARTERS.has(v) && !exprIf))) {
        if (!['type', 'export'].includes(prev.v)) want = true;
      }
      if (want) flush();
      if (closer) close();
      if (!line) lineDepth = depth;
      let space = !!line;
      if (prev && line) {
        if ([',', ';', ')', ']', '.', ':'].includes(v) || ['(', '[', '.', ':', '#'].includes(prev.v)) space = false;
        if ((v === '(' || v === '[') && (isValue(prev) || prev.v === 'function')) space = false;
        if (prevUnary) space = prev.v === '-' && v[0] === '-';
        if (prev.v === '{' || v === '}') space = false;
      }
      line += (space ? ' ' : '') + v;
      prevUnary = (v === '-' || v === '#' || v === '~') && (!prev || !isValue(prev));
      if (t.t === 'com') { brk = true; continue; } /* comments never become "prev" */
      if (code && !inExprIf) {
        if (v === 'function') { open('function'); fnHead.push(0); }
        else if (v === 'then' || v === 'do' || v === 'repeat' || v === 'else') { open(v); brk = true; }
        else if (v === '{') { open('{'); brk = toks[i + 1]?.v !== '}'; }
        else if (v === ';') brk = true;
        else if (v === 'end' || v === 'until') { /* closed above */ }
        if (fnHead.length) {
          if (v === '(') fnHead[fnHead.length - 1]++;
          else if (v === ')' && --fnHead[fnHead.length - 1] === 0) { fnHead.pop(); if (toks[i + 1]?.v !== ':') brk = true; }
        }
      }
      if (inExprIf && v === 'else') ifExpr--;
      prev = t;
    }
    flush();
    return out;
  }

  function detect(src) {
    const found = [];
    const add = (name, level, why) => found.push({ name, level, why });
    if (/Luraph Obfuscator|\bLPH_[A-Z_]+/i.test(src)) add('Luraph', 'vm', 'Luraph header or LPH_ marker');
    if (/MoonSec/i.test(src)) add('MoonSec', 'vm', 'MoonSec marker');
    if (/IronBrew/i.test(src)) add('IronBrew', 'vm', 'IronBrew marker');
    if (/wearedevs\.net/i.test(src)) add('WeAreDevs', 'vm', 'wearedevs.net marker');
    if (/luaobfuscator\.com/i.test(src)) add('LuaObfuscator.com', 'vm', 'luaobfuscator.com marker');
    if (/Luarmor|api\.luarmor\.net/i.test(src)) add('Luarmor', 'loader', 'Luarmor reference');
    if (/\b(loadstring|load)\s*\(/.test(src)) add('Dynamic loader', 'warn', 'loadstring/load runs code at runtime');
    if (/HttpGet|HttpPost|http_request|syn\.request/.test(src)) add('Network call', 'warn', 'the script communicates over the internet');
    if (/discord(?:app)?\.com\/api\/webhooks/i.test(src)) add('Discord webhook', 'danger', 'can send data outside');
    return found;
  }

  function deobfuscate(src, opts = {}) {
    const o = Object.assign({ strings: true, fold: true, comments: false }, opts);
    const stats = { strings: 0, numbers: 0, chars: 0, joins: 0 };
    let toks = tokenize(src);
    if (!o.comments) {
      const kept = []; let carry = 0;
      for (const t of toks) { if (t.t === 'com') { carry += t.nl; continue; } t.nl += carry; carry = 0; kept.push(t); }
      toks = kept;
    }
    if (o.strings) for (const t of toks) if (t.t === 'str') {
      const b = decodeString(t.v); if (!b) continue;
      const v = encodeString(b);
      if (/\\(\d|x|u|z)/.test(t.v) && v !== t.v) stats.strings++;
      t.v = v;
    }
    if (o.fold) simplify(toks, stats);
    const code = beautify(toks);
    /* detection also looks at decoded output, so hidden URLs show up */
    const seen = new Map();
    for (const f of detect(src).concat(detect(code))) seen.set(f.name, f);
    return { code, stats, found: [...seen.values()] };
  }

  const api = { tokenize, deobfuscate, detect, decodeString, encodeString };
  if (typeof module !== 'undefined') module.exports = api; else root.MonkzDeobf = api;
})(this);
