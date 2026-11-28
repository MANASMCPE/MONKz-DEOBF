/*
 * MONKz Sandbox Executor.
 * Runs a Lua script inside a JavaScript tree-walking interpreter with a fake Roblox
 * environment, and records what the script tries to do. Nothing is injected into a game,
 * and the Lua code has no access to the network, files or the page.
 * The base interpreter and parser come from the MIT licensed Prometheus Deobfuscator by LeakD.
 */
(function (g) {
  const LIMITS = { log: 4000, layers: 40, layerBytes: 2000000, strings: 3000, string: 4000000, list: 200000, waits: 400, callbacks: 150, line: 600 };

  g.MonkzExecute = function (req, source, options, emit) {
    const { Interpreter } = req('interp/interpreter.js');
    const V = req('interp/values.js');
    const ops = req('interp/ops.js');
    const { parse: parseRaw } = req('lua/parser.js');
    const { resolve } = req('lua/scope.js');
    /*
     * The base interpreter keys locals by name, so declaring a name twice in one block would
     * change what earlier closures see. Give every local binding its own internal name.
     */
    const parse = (code, opts) => {
      const ast = parseRaw(code, opts);
      const resolved = resolve(ast);
      const unique = (b) => `${b.name}\u0001${b.id}`;
      const declared = new Set();
      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { for (const item of node) visit(item); return; }
        const k = node.kind;
        if (k === 'Name' || (node.binding && node.binding.kind !== 'global' && typeof node.name === 'string' && !node.body)) {
          if (node.binding && node.binding.kind !== 'global') node.name = unique(node.binding);
        }
        for (const key of Object.keys(node)) if (key !== 'binding' && key !== 'bindings' && key !== 'scope') visit(node[key]);
      };
      visit(ast.body || ast);
      for (const b of resolved.allBindings) {
        if (b.kind === 'global' || !b.declaration) continue;
        declared.add(b.declaration);
      }
      for (const d of declared) {
        if (d.names) d.names = d.bindings.map(unique);
        else if (d.params) d.params = d.bindings.map(unique);
        else if (d.variables) d.variables = d.bindings.map(unique);
        else if (d.variable !== undefined) d.variable = unique(d.binding);
        else if (d.binding) d.name = unique(d.binding);
      }
      return ast;
    };
    const { LuaError, LuaTable, LuaFunction, luaType } = V;

    const fail = (message) => { const e = new Error(message); e.name = 'LuaLimitError'; e.sandbox = true; return e; };

    /* Table length: remember the last border so large arrays do not become quadratic. */
    LuaTable.prototype.length = function () {
      let n = this.border || 0;
      while (n > 0 && this.map.get(n) === undefined) n -= 1;
      while (this.map.get(n + 1) !== undefined) n += 1;
      this.border = n;
      return n;
    };

    /* Lua 5.3 bit operators, which the base interpreter does not implement. */
    const arith = ops.arith.base || ops.arith;
    const BITS = { '&': (a, b) => a & b, '|': (a, b) => a | b, '~': (a, b) => a ^ b, '<<': (a, b) => (b >= 32 ? 0 : a << b), '>>': (a, b) => (b >= 32 ? 0 : a >>> b) };
    ops.arith = (vm, op, a, b) => {
      if (!BITS[op]) return arith(vm, op, a, b);
      const x = V.toNumber(a), y = V.toNumber(b);
      if (x === undefined || y === undefined) throw new LuaError('bit operator needs numbers');
      return BITS[op](x >>> 0, y >>> 0) >>> 0;
    };
    ops.arith.base = arith;
    const unary = Interpreter.prototype.evalUnary.base || Interpreter.prototype.evalUnary;
    Interpreter.prototype.evalUnary = function (node, scope) {
      if (node.operator !== '~') return unary.call(this, node, scope);
      const x = V.toNumber(this.eval(node.argument, scope));
      if (x === undefined) throw new LuaError('bit operator needs a number');
      return ~x >>> 0;
    };
    Interpreter.prototype.evalUnary.base = unary;

    /* Name the missing function in "cannot call nil" errors. */
    const evalMulti = Interpreter.prototype.evalMulti.base || Interpreter.prototype.evalMulti;
    const plain = (n) => String(n).split('\u0001')[0];
    const label = (n) => {
      if (!n) return '';
      if (n.kind === 'Name') return plain(n.name);
      if (n.kind === 'Index' && n.index && n.index.kind === 'String') return `${label(n.base) || '?'}.${n.index.value.slice(0, 40)}`;
      return '';
    };
    Interpreter.prototype.evalMulti = function (node, scope) {
      try { return evalMulti.call(this, node, scope); } catch (e) {
        if (e instanceof LuaError && e.value === 'cannot call nil') {
          const who = node.kind === 'MethodCall' ? `${label(node.base) || '?'}:${node.method}` : label(node.base);
          if (who) { e.value = `cannot call nil (${who})`; e.message = e.value; }
        }
        throw e;
      }
    };
    Interpreter.prototype.evalMulti.base = evalMulti;

    /* Memory guard for string building. */
    const concat = ops.concat.base || ops.concat;
    ops.concat = (rt, a, b) => {
      if (typeof a === 'string' && typeof b === 'string' && a.length + b.length > LIMITS.string) throw fail('a string grew past the sandbox size limit');
      return concat(rt, a, b);
    };
    ops.concat.base = concat;

    const rt = new Interpreter({ stepLimit: options.steps || 20e6, maxCallDepth: 180 });
    const G = rt.globals;

    /* ---------- recording ---------- */
    let batch = [], logged = 0, dropped = 0, lastFlush = Date.now(), lastLine = '', repeats = 0;
    const flush = () => { if (batch.length) emit({ type: 'log', lines: batch }); batch = []; lastFlush = Date.now(); };
    const push = (line) => {
      if (logged >= LIMITS.log) { dropped += 1; return; }
      logged += 1; batch.push(line);
      if (batch.length >= 50 || Date.now() - lastFlush > 200) flush();
    };
    const endRepeat = () => { if (repeats) push(`-- previous line repeated ${repeats} more time(s)`); repeats = 0; };
    const log = (line) => {
      if (line.length > LIMITS.line) line = line.slice(0, LIMITS.line) + ' ... (line cut)';
      if (line === lastLine) { repeats += 1; return; }
      endRepeat(); lastLine = line; push(line);
    };

    /* Send waiting lines during long loops, so a cancel or timeout still shows them. */
    const tick = rt.tick;
    let nextCheck = 50000;
    rt.tick = function (count) {
      tick.call(this, count);
      if (this.steps >= nextCheck) { nextCheck = this.steps + 50000; if (batch.length && Date.now() - lastFlush > 150) flush(); }
    };

    /* Strings are bytes inside the VM. Show valid UTF-8 as text and other bytes as escapes. */
    const text = options.fromBytes || ((s) => s);
    const quote = (s) => {
      const cut = s.length > 300;
      const body = (cut ? s.slice(0, 300) : s).replace(/[\\"\x00-\x1f\x7f]/g, (c) => (c === '\\' || c === '"' ? '\\' + c : c === '\n' ? '\\n' : c === '\t' ? '\\t' : c === '\r' ? '\\r' : '\\' + c.charCodeAt(0)));
      return `"${text(body)}"${cut ? ' --[[ cut ]]' : ''}`;
    };

    const strings = new Set();
    const capture = (s) => {
      if (typeof s !== 'string' || s.length < 4 || s.length > 2000 || strings.size >= LIMITS.strings || strings.has(s)) return;
      let printable = 0;
      for (let i = 0; i < s.length; i += 1) { const c = s.charCodeAt(i); if ((c >= 32 && c !== 127) || c === 9 || c === 10 || c === 13) printable += 1; }
      if (printable / s.length < 0.95) return;
      strings.add(s); emit({ type: 'string', value: quote(s) });
    };

    /* ---------- fake Roblox objects ---------- */
    const mocks = new WeakMap(); // table -> { name, parent, key }
    const names = new Set();
    const isMock = (v) => mocks.has(v);
    const fresh = (hint) => {
      let base = /^[A-Za-z_]\w{0,30}$/.test(hint || '') ? hint : 'v';
      let n = base === 'v' ? 1 : 0, name = n ? base + n : base;
      while (names.has(name) || G.get(name) !== undefined) { n += 1; name = base + n; }
      names.add(name); return name;
    };

    const show = (v, depth = 0) => {
      if (v === undefined || v === null) return 'nil';
      if (typeof v === 'string') return quote(v);
      if (typeof v === 'number') return V.numberToString(v);
      if (typeof v === 'boolean') return String(v);
      if (isMock(v)) return mocks.get(v).name;
      if (v instanceof LuaTable) {
        if (depth >= 2) return '{...}';
        const parts = []; let next = 1;
        for (const [k, val] of v.map) {
          if (parts.length >= 12) { parts.push('...'); break; }
          if (k === next) { parts.push(show(val, depth + 1)); next += 1; }
          else if (typeof k === 'string' && /^[A-Za-z_]\w*$/.test(k)) parts.push(`${k} = ${show(val, depth + 1)}`);
          else parts.push(`[${show(k, depth + 1)}] = ${show(val, depth + 1)}`);
        }
        return `{${parts.join(', ')}}`;
      }
      if (luaType(v) === 'function') return 'function() end';
      return 'userdata';
    };
    const member = (base, key) => (typeof key === 'string' && /^[A-Za-z_]\w*$/.test(key) ? `${base}.${key}` : `${base}[${show(key)}]`);

    const callbacks = [];
    const remember = (fn, label) => { if (callbacks.length < LIMITS.callbacks) callbacks.push({ fn, label }); };
    let remotes = 0;
    const REMOTE = '__monkz_remote_';

    function mock(name, parent, key) {
      const t = new LuaTable(), meta = new LuaTable(), values = new Map(), children = new Map();
      const info = { name, parent, key };
      mocks.set(t, info);
      meta.set('__metatable', 'The metatable is locked');
      meta.set('__index', (i, [, k]) => {
        if (values.has(k)) return [values.get(k)];
        if (!children.has(k)) children.set(k, mock(member(info.name, k), t, k));
        return [children.get(k)];
      });
      meta.set('__newindex', (i, [, k, v]) => {
        values.set(k, v);
        log(`${member(info.name, k)} = ${show(v)}`);
        if (luaType(v) === 'function') remember(v, member(info.name, k));
        return [];
      });
      meta.set('__call', (i, [, ...args]) => [call(info, args)]);
      meta.set('__tostring', () => [info.name]);
      for (const ev of ['__add', '__sub', '__mul', '__div', '__mod', '__pow', '__unm']) meta.set(ev, () => [t]);
      meta.set('__concat', (i, [a, b]) => [`${isMock(a) ? mocks.get(a).name : ops.stringify(a)}${isMock(b) ? mocks.get(b).name : ops.stringify(b)}`]);
      meta.set('__len', () => [0]);
      meta.set('__lt', () => [false]);
      meta.set('__le', () => [false]);
      t.metatable = meta;
      return t;
    }

    function call(info, args) {
      const isMethod = info.parent && args[0] === info.parent && typeof info.key === 'string';
      const shown = (isMethod ? args.slice(1) : args);
      const target = isMethod ? `${mocks.get(info.parent).name}:${info.key}` : info.name;
      const expr = `${target}(${shown.map((a) => show(a)).join(', ')})`;
      const key = typeof info.key === 'string' ? info.key : '';
      if (/^Http(Get|Post)(Async)?$/.test(key)) {
        remotes += 1;
        log(`${expr} -- NETWORK REQUEST (blocked by sandbox, response is fake)`);
        return REMOTE + remotes;
      }
      if (key === 'Wait' || key === 'wait') { waited(); log(expr); return mock(fresh('event'), null, null); }
      if (/^(IsA|IsDescendantOf|IsStudio|IsClient|IsLoaded)$/.test(key)) { log(expr); return key !== 'IsStudio'; }
      if (key === 'JSONEncode') { log(expr); return '{}'; }
      if (key === 'GetChildren' || key === 'GetDescendants' || key === 'GetPlayers') { log(expr); return new LuaTable(); }
      for (const a of shown) if (luaType(a) === 'function') remember(a, expr);
      let hint = 'v';
      if ((key === 'GetService' || key === 'FindService') && typeof shown[0] === 'string') hint = shown[0];
      else if (/Instance\.new$/.test(info.name) && typeof shown[0] === 'string') hint = shown[0].charAt(0).toLowerCase() + shown[0].slice(1);
      const result = fresh(hint);
      log(`local ${result} = ${expr}`);
      return mock(result, null, null);
    }

    let waits = 0;
    function waited() { waits += 1; if (waits > LIMITS.waits) throw fail('the script keeps waiting in a loop, so the sandbox stopped it'); }

    /* ---------- loadstring: every generated layer is captured before it runs ---------- */
    let layers = 0, layerBytes = 0;
    const load = (i, args) => {
      let chunk = args[0];
      if (luaType(chunk) === 'function') {
        let built = '';
        for (let n = 0; n < 100000; n += 1) { const part = rt.call(chunk, [])[0]; if (typeof part !== 'string' || part === '') break; built += part; if (built.length > LIMITS.string) throw fail('loaded code is too large'); }
        chunk = built;
      }
      if (typeof chunk !== 'string') return [undefined, 'load: expected a string'];
      if (chunk.startsWith(REMOTE)) {
        const id = chunk.slice(REMOTE.length).replace(/\D.*$/, '');
        log(`-- loadstring() was called on the response of network request #${id}`);
        return [() => [mock(fresh('remoteLibrary'), null, null)]];
      }
      const binary = chunk.charCodeAt(0) === 27;
      if (layers < LIMITS.layers && layerBytes + chunk.length <= LIMITS.layerBytes) {
        layers += 1; layerBytes += chunk.length;
        emit({ type: 'layer', index: layers, binary, code: binary ? `-- binary bytecode, ${chunk.length} bytes (not shown)` : text(chunk) });
        log(`-- loadstring() layer #${layers} captured (${chunk.length} bytes)`);
      }
      if (binary) return [undefined, 'bytecode cannot run in this sandbox'];
      let ast;
      try { ast = parse(chunk, { name: 'layer' }); } catch (e) { return [undefined, String(e.message)]; }
      const fn = new LuaFunction({ kind: ast.kind, params: [], body: ast.body, isVararg: true }, rt.rootScope(), 'loaded chunk');
      return [fn];
    };

    /* ---------- environment ---------- */
    const lib = (name) => G.get(name);
    const def = (name, value) => G.set(name, value);
    const table = (entries) => { const t = new LuaTable(); for (const [k, v] of Object.entries(entries)) t.set(k, v); return t; };
    const logged_ = (name, result) => (i, args) => { log(`${name}(${args.map((a) => show(a)).join(', ')})`); return result ? result(args) : []; };

    def('_ENV', G);
    def('loadstring', load);
    def('load', load);
    def('print', (i, args) => { log(`print(${args.map((a) => show(a)).join(', ')})`); return []; });
    def('warn', (i, args) => { log(`warn(${args.map((a) => show(a)).join(', ')})`); return []; });
    lib('io').set('write', logged_('io.write'));
    const baseType = lib('type');
    def('type', (i, args) => (isMock(args[0]) ? ['userdata'] : baseType(i, args)));
    def('typeof', (i, args) => (isMock(args[0]) ? ['Instance'] : baseType(i, args)));
    const baseUnpack = lib('unpack');
    const unpack = (i, args) => {
      const [t, a, b] = args;
      if (t instanceof LuaTable) { const from = a === undefined ? 1 : V.toNumber(a), to = b === undefined ? t.length() : V.toNumber(b); if (to - from > 8000) throw new LuaError('too many results to unpack'); }
      return baseUnpack(i, args);
    };
    def('unpack', unpack); lib('table').set('unpack', unpack);
    /* pairs with a key snapshot, so large tables stay fast */
    def('pairs', (i, args) => {
      const t = args[0];
      const handler = i.metamethod(t, '__pairs');
      if (handler) return i.call(handler, [t]);
      if (!(t instanceof LuaTable)) throw new LuaError(`bad argument to 'pairs' (table expected, got ${luaType(t)})`);
      const keys = isMock(t) ? [] : t.keys(); let at = 0;
      return [() => { while (at < keys.length) { const k = keys[at++]; const v = t.get(k); if (v !== undefined) return [k, v]; } return [undefined]; }, t, undefined];
    });

    const string = lib('string'), tbl = lib('table'), math = lib('math');
    const char = string.get('char'), rep = string.get('rep'), join = tbl.get('concat');
    string.set('char', (i, args) => { const out = char(i, args); capture(out[0]); return out; });
    string.set('rep', (i, args) => { const n = V.toNumber(args[1]) || 0, len = String(args[0] ?? '').length + String(args[2] ?? '').length; if (n > LIMITS.list || n * len > LIMITS.string) throw fail('string.rep asked for more memory than the sandbox allows'); return rep(i, args); });
    tbl.set('concat', (i, args) => { const out = join(i, args); if (out[0].length > LIMITS.string) throw fail('a string grew past the sandbox size limit'); capture(out[0]); return out; });
    string.set('split', (i, [s, sep]) => [V.LuaTable.from(String(s).split(sep === undefined ? ',' : sep))]);
    tbl.set('find', (i, [t, v, from]) => { for (let k = from || 1; t.get(k) !== undefined; k += 1) if (ops.rawEquals(t.get(k), v)) return [k]; return [undefined]; });
    tbl.set('create', (i, [n, v]) => { if (n > LIMITS.list) throw fail('table.create is too large'); const t = new LuaTable(); if (v !== undefined) for (let k = 1; k <= n; k += 1) t.set(k, v); return [t]; });
    tbl.set('clone', (i, [t]) => { const c = new LuaTable(); for (const [k, v] of t.map) c.set(k, v); c.metatable = t.metatable; return [c]; });
    tbl.set('clear', (i, [t]) => { for (const k of t.keys()) t.set(k, undefined); return []; });
    tbl.set('freeze', (i, [t]) => [t]);
    tbl.set('move', (i, [a, f, e, t, b]) => { const dst = b || a; if (e - f > LIMITS.list) throw fail('table.move range is too large'); const values = []; for (let k = f; k <= e; k += 1) values.push(a.get(k)); values.forEach((v, n) => dst.set(t + n, v)); return [dst]; });
    math.set('tointeger', (i, [x]) => [Number.isInteger(x) ? x : undefined]);
    math.set('type', (i, [x]) => [typeof x === 'number' ? (Number.isInteger(x) ? 'integer' : 'float') : undefined]);
    const format = string.get('format'), gsub = string.get('gsub');
    string.set('format', (i, args) => { if (/%[-+ #0]*(\d{3,}|\d*\.\d{3,})/.test(String(args[0]))) throw new LuaError('invalid format (width or precision too long)'); return format(i, args); });
    string.set('gsub', (i, args) => {
      if (typeof args[0] === 'string' && typeof args[2] === 'string' && args[2].length * (args[0].length + 1) > LIMITS.string * 4) throw fail('string.gsub asked for more memory than the sandbox allows');
      const out = gsub(i, args); if (out[0].length > LIMITS.string) throw fail('a string grew past the sandbox size limit'); return out;
    });
    math.set('clamp', (i, [x, a, b]) => [Math.min(Math.max(x, a), b)]);
    math.set('round', (i, [x]) => [Math.sign(x) * Math.round(Math.abs(x))]);
    math.set('sign', (i, [x]) => [Math.sign(x)]);
    math.set('ldexp', (i, [x, e]) => [x * 2 ** e]);
    math.set('frexp', (i, [x]) => { if (!x || !Number.isFinite(x)) return [x, 0]; let e = Math.max(-1073, Math.floor(Math.log2(Math.abs(x))) + 1), m = x * 2 ** -e; while (Math.abs(m) < 0.5) { m *= 2; e -= 1; } while (Math.abs(m) >= 1) { m /= 2; e += 1; } return [m, e]; });

    /* Luau bit32 returns unsigned results. LuaJIT style "bit" stays signed. */
    const u = (v) => { const n = V.toNumber(v); if (n === undefined) throw new LuaError('bit32: number expected'); return (((Math.floor(n) % 4294967296) + 4294967296) % 4294967296) >>> 0; };
    const shl = (a, n) => (n <= -32 || n >= 32 ? 0 : n < 0 ? a >>> -n : (a << n) >>> 0);
    const rot = (a, n) => { n = ((n % 32) + 32) % 32; return ((a << n) | (a >>> ((32 - n) % 32))) >>> 0; };
    def('bit32', table({
      band: (i, a) => [a.reduce((x, y) => (x & u(y)) >>> 0, 0xffffffff)],
      bor: (i, a) => [a.reduce((x, y) => (x | u(y)) >>> 0, 0)],
      bxor: (i, a) => [a.reduce((x, y) => (x ^ u(y)) >>> 0, 0)],
      bnot: (i, [a]) => [~u(a) >>> 0],
      btest: (i, a) => [a.reduce((x, y) => (x & u(y)) >>> 0, 0xffffffff) !== 0],
      lshift: (i, [a, n]) => [shl(u(a), V.toNumber(n))],
      rshift: (i, [a, n]) => [shl(u(a), -V.toNumber(n))],
      arshift: (i, [a, n]) => { const x = u(a), s = V.toNumber(n); return [s < 0 ? shl(x, -s) : ((x | 0) >> Math.min(s, 31)) >>> 0]; },
      lrotate: (i, [a, n]) => [rot(u(a), V.toNumber(n))],
      rrotate: (i, [a, n]) => [rot(u(a), -V.toNumber(n))],
      extract: (i, [a, f, w = 1]) => [(u(a) >>> f) & (w >= 32 ? 0xffffffff : (1 << w) - 1)],
      replace: (i, [a, v, f, w = 1]) => { const m = w >= 32 ? 0xffffffff : (1 << w) - 1; return [((u(a) & ~(m << f)) | ((u(v) & m) << f)) >>> 0]; },
      countlz: (i, [a]) => [Math.clz32(u(a))],
    }));

    for (const name of ['game', 'workspace', 'script', 'shared', 'Instance', 'Enum', 'Vector2', 'Vector3', 'UDim', 'UDim2', 'Color3', 'ColorSequence', 'ColorSequenceKeypoint', 'NumberSequence', 'NumberSequenceKeypoint', 'NumberRange', 'CFrame', 'TweenInfo', 'BrickColor', 'Ray', 'RaycastParams', 'Rect', 'Region3', 'Font', 'DateTime', 'Random', 'Drawing', 'PhysicalProperties']) {
      names.add(name); def(name, mock(name, null, null));
    }
    const run = (fn, args) => { try { rt.call(fn, args); } catch (e) { if (e.name === 'LuaLimitError' || e.sandbox) throw e; log(`-- error inside a spawned function: ${errorText(e)}`); } };
    const later = (fn, args) => { if (luaType(fn) === 'function') run(fn, args); return []; };
    const doWait = () => { waited(); return [0.03, 0]; };
    def('wait', doWait);
    def('spawn', (i, [fn]) => later(fn, []));
    def('delay', (i, [, fn]) => later(fn, []));
    def('task', table({ wait: doWait, spawn: (i, [fn, ...a]) => { later(fn, a); return [fn]; }, defer: (i, [fn, ...a]) => { later(fn, a); return [fn]; }, delay: (i, [, fn, ...a]) => { later(fn, a); return [fn]; }, cancel: () => [] }));
    def('tick', () => [1700000000 + rt.steps / 1e7]);
    def('time', () => [rt.steps / 1e7]);
    const genv = G;
    def('getgenv', () => [genv]);
    def('getrenv', () => [genv]);
    const response = () => table({ StatusCode: 200, Success: true, Body: '', Headers: new LuaTable() });
    const request = (name) => (i, [o]) => { log(`${name}(${show(o)}) -- NETWORK REQUEST (blocked by sandbox, response is fake)`); return [response()]; };
    def('request', request('request'));
    def('http_request', request('http_request'));
    def('syn', table({ request: request('syn.request') }));
    def('http', table({ request: request('http.request') }));
    const files = new Map();
    def('writefile', (i, [p, d]) => { log(`writefile(${show(p)}, ${show(d)})`); if (files.size < 100) files.set(p, d); return []; });
    def('appendfile', logged_('appendfile'));
    def('readfile', (i, [p]) => { log(`readfile(${show(p)})`); return [files.get(p) || '']; });
    def('isfile', (i, [p]) => { log(`isfile(${show(p)})`); return [files.has(p)]; });
    for (const name of ['isfolder', 'makefolder', 'delfile', 'delfolder', 'setclipboard', 'toclipboard', 'queue_on_teleport', 'hookfunction', 'hookmetamethod', 'firesignal', 'fireclickdetector', 'firetouchinterest', 'fireproximityprompt', 'mouse1click', 'keypress', 'keyrelease', 'setfpscap', 'rconsoleprint']) def(name, logged_(name, name === 'isfolder' ? () => [false] : null));
    def('identifyexecutor', () => ['MONKz Sandbox', '1.0']);

    /* The tree-walking interpreter cannot pause a function, so say so instead of guessing. */
    lib('coroutine').set('yield', () => { throw fail('the script uses coroutine.yield, which the sandbox does not support'); });

    /* ---------- run ---------- */
    const errorText = (e) => {
      if (e instanceof LuaError) { const v = e.value; return text(typeof v === 'string' ? v : show(v)); }
      if (e instanceof RangeError) return 'the script went too deep for the sandbox';
      return String((e && e.message) || e);
    };
    const started = Date.now();
    let status = 'finished', detail = '';
    let chunk;
    try { chunk = parse(source, { name: 'script' }); } catch (e) {
      return { status: 'syntax', detail: String(e.message), steps: 0, ms: 0, logged: 0, dropped: 0, layers: 0, strings: 0 };
    }
    const stop = (e) => {
      if (e && (e.name === 'LuaLimitError' || e.sandbox)) { status = 'limit'; detail = /step limit/.test(e.message) ? 'the step limit was reached' : e.message; }
      else { status = 'error'; detail = errorText(e); }
    };
    try {
      const returned = rt.runChunk(chunk, []);
      if (returned.length) log(`-- script returned: ${returned.map((v) => show(v)).join(', ')}`);
      if (options.callbacks) {
        for (let n = 0; n < callbacks.length; n += 1) {
          const { fn, label } = callbacks[n];
          log(`-- exploring callback from: ${label.slice(0, 120)}`);
          run(fn, [mock(fresh('arg'), null, null), false]);
        }
      }
    } catch (e) { stop(e); }
    endRepeat(); flush();
    return { status, detail: detail.slice(0, 400), steps: rt.steps, ms: Date.now() - started, logged, dropped, layers, strings: strings.size };
  };
})(typeof self !== 'undefined' ? self : globalThis);
