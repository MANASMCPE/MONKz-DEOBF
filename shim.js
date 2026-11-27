/* Minimal Node shims + tiny CommonJS loader for the vendored tools */
(function (g) {
  const te = new TextEncoder();
  class Buf extends Uint8Array {
    static from(x, enc) {
      if (typeof x !== 'string') { if (x instanceof ArrayBuffer) return new Buf(x); const b = new Buf(x.length); b.set(x); return b; }
      enc = (enc || 'utf8').toLowerCase();
      let a;
      if (enc === 'latin1' || enc === 'binary') a = Array.from({ length: x.length }, (_, i) => x.charCodeAt(i) & 255);
      else if (enc === 'base64') { const s = x.replace(/-/g, '+').replace(/_/g, '/').split('=')[0].replace(/[^A-Za-z0-9+/]/g, ''); const d = atob(s.length % 4 === 1 ? s.slice(0, -1) : s); a = Array.from(d, (c) => c.charCodeAt(0)); }
      else if (enc === 'hex') a = ((x.match(/^(?:[0-9a-fA-F]{2})*/) || [''])[0].match(/../g) || []).map((h) => parseInt(h, 16));
      else if (enc === 'utf8' || enc === 'utf-8') a = te.encode(x);
      else throw new Error('encoding not supported: ' + enc);
      const b = new Buf(a.length); b.set(a); return b;
    }
    static alloc(n, fill) { const b = new Buf(n); if (fill !== undefined) b.fill(fill); return b; }
    static allocUnsafe(n) { return new Buf(n); }
    static isBuffer(x) { return x instanceof Buf; }
    slice(a, b) { return this.subarray(a, b); }
    toString(enc, start, end) {
      const v = this.subarray(start || 0, end === undefined ? this.length : end);
      enc = (enc || 'utf8').toLowerCase();
      if (enc === 'utf8' || enc === 'utf-8') return new TextDecoder('utf-8', { ignoreBOM: true }).decode(v);
      if (enc === 'hex') return Array.from(v, (n) => n.toString(16).padStart(2, '0')).join('');
      let s = ''; for (let i = 0; i < v.length; i += 8192) s += String.fromCharCode.apply(null, v.subarray(i, i + 8192));
      if (enc === 'latin1' || enc === 'binary') return s;
      if (enc === 'base64') return btoa(s);
      throw new Error('encoding not supported: ' + enc);
    }
    readDoubleLE(o = 0) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(o, true); }
    writeUInt32LE(v, o = 0) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(o, v >>> 0, true); return o + 4; }
  }
  const noFile = () => { throw new Error('file access is not available in the browser'); };
  const fs = { readFileSync: noFile, writeFileSync: noFile, mkdirSync: noFile, existsSync: () => false };
  const proc = { env: {}, argv: [], stderr: { write() {} }, stdout: { write() {} }, exit: noFile };
  const quiet = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
  g.MonkzModules = function (entry, mods) {
    const cache = {};
    const load = (key) => {
      if (cache[key]) return cache[key].exports;
      const module = (cache[key] = { exports: {} });
      const req = (name) => {
        if (name === 'fs') return fs;
        if (name === 'path') return {};
        const parts = key.split('/').slice(0, -1);
        for (const p of name.split('/')) if (p === '..') parts.pop(); else if (p !== '.') parts.push(p);
        const t = parts.join('/'), hit = [t, t + '.js', t + '/index.js'].find((c) => mods[c]);
        if (!hit) throw new Error('module missing: ' + name);
        return load(hit);
      };
      mods[key].call(module.exports, module, module.exports, req, Buf, proc, quiet);
      return module.exports;
    };
    g.MonkzTool = { load: () => load(entry), req: load };
  };
  /* Same entry points the tools' own CLIs use */
  g.MonkzRun = function (id, source) {
    const api = g.MonkzTool.load();
    if (id === 'prometheus') { const r = api.deobfuscate(source, {}); return { code: r.code, notes: r.warnings || [] }; }
    if (id === 'luaobfuscator') return { code: api.deobf(source, { log: false }).reconstructed, notes: [] };
    if (id === 'clyde') {
      if (!api.detectClyde(source)?.isClyde) throw new Error('This does not look like Clyde output');
      const r = api.deobfuscateClyde(source);
      if (!r.success) throw new Error(r.error || 'Clyde decoding failed');
      return { code: r.output, notes: [] };
    }
    if (id === 'ironveil') {
      let code = api.deobfuscate(source); const notes = [];
      try { code = g.MonkzTool.req('Beautiful/beautifier.js').Beautify(code, { RenameVariables: false, RenameGlobals: false }); } catch (_) { notes.push('The beautifier step was skipped'); }
      return { code: '-- deobfuscated by LeakD discord.gg/qteAQmfJmP\n\n' + code.trimStart(), notes };
    }
    throw new Error('Unknown tool');
  };
})(self);
