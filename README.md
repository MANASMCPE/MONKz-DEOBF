<p align="center"><img src="favicon.svg" width="96" alt="MONKz DEOBF logo"></p>
<h1 align="center">MONKz DEOBF</h1>
<p align="center"><b>Lua and Luau deobfuscation tools in one clean website.</b></p>

---

## Deobfuscators

| | Name | What it targets | Status | Runs in |
|:-:|---|---|---|---|
| <img src="logos/prometheus.svg" width="40" alt=""> | **Prometheus** | Prometheus-protected scripts | Experimental | Browser |
| <img src="logos/luaobfuscator.svg" width="40" alt=""> | **LuaObfuscator** | LuaObfuscator.com output | Experimental | Browser |
| <img src="logos/clyde.svg" width="40" alt=""> | **Clyde** | Clyde Protection output | Experimental | Browser |
| <img src="logos/ironveil.svg" width="40" alt=""> | **Ironveil V1** | Ironveil V1 output | Tested with 1 sample | Browser |
| <img src="logos/hercules.svg" width="40" alt=""> | **Hercules** | Hercules VM and BytecodeEncoder payloads | Engine returned output for 7 of 9 bundled samples in standard Python. Browser mode not yet verified | Browser (Pyodide), optional Vercel Python |

## Utilities

| | Name | What it does |
|:-:|---|---|
| <img src="logos/detector.svg" width="40" alt=""> | **Detector** | Looks for known markers and suggests a tool. It also flags loaders, network calls and Discord webhooks it can see. |
| <img src="logos/beautifier.svg" width="40" alt=""> | **Beautifier** | Fixes indentation and line breaks. |
| <img src="logos/cleaner.svg" width="40" alt=""> | **Basic Cleaner** | Decodes escaped strings, numeric `string.char` calls and simple constant math. |

## Features

- **A page for every tool**, with swipeable tool tabs
- **Upload or paste:** drag and drop, file picker or a text box
- **Copy and download** results, or send them to the Beautifier
- **Detector shortcut** that carries your script to the suggested tool
- **Dark and light themes**
- **Responsive layout** for phones and desktops
- **Background processing** for browser engines, with cancel and a 60 second limit
- **Site icon and an original illustrated logo for every tool**
- **Animations:** decoding text effect, page and card transitions, and a progress bar while an engine runs. Motion is reduced when your device asks for it

## Privacy and safety

- Browser tools process your script on your device. This site does not upload it for processing.
- **Hercules runs in the browser** with Pyodide, loaded from cdn.jsdelivr.net. Only if you choose server mode is your script sent to the site's Python function. The application code does not save or log it. The hosting provider may keep technical request logs.
- Decoded output may be incomplete or behave differently from the original. Review it before use.
- A script with no warnings is not necessarily safe.

## Built with

HTML, CSS and JavaScript, Web Workers, Pyodide (Python in the browser), and an optional Python function on Vercel.

## Credits

| Engine | Author | License |
|---|---|---|
| Prometheus Deobfuscator | LeakD | [MIT](vendor/licenses/prometheus.txt) |
| LuaObfuscator Deobfuscator | LeakD / Prostone | [MIT](vendor/licenses/luaobfuscator.txt) |
| ClydeDeobf | @_jmi. (OmniDBF) | [MIT](vendor/licenses/clyde.txt) |
| Ironveil Deobfuscator (unused eval helper removed) | LeakD / prostone_ | [MIT](vendor/licenses/ironveil.txt) |
| deobfhercules | see license | [Apache 2.0](vendor/licenses/hercules.txt) |

---

<p align="center">Use only on your own code or code you have permission to analyze.</p>
