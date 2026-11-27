```{=html}
<p align="center">
```
`<img src="favicon.svg" width="112" alt="MONKz DEOBF logo">`{=html}
```{=html}
</p>
```
```{=html}
<h1 align="center">
```
MONKz DEOBF
```{=html}
</h1>
```
```{=html}
<p align="center">
```
`<a href="https://github.com/">`{=html}`<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=19&pause=1000&color=00F5D4&center=true&vCenter=true&width=650&lines=Decode.+Understand.+Take+Control.;Lua+%26+Luau+Deobfuscation+Toolkit;One+workspace.+Multiple+engines." alt="Animated typing headline">`{=html}`</a>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<b>`{=html}A sleek, browser-based toolkit for exploring and
deobfuscating Lua and Luau scripts.`</b>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<img src="https://img.shields.io/badge/Language-Lua%20%26%20Luau-00d4aa?style=for-the-badge&logo=lua&logoColor=white" alt="Lua and Luau">`{=html}
`<img src="https://img.shields.io/badge/Platform-Browser-171717?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Browser">`{=html}
`<img src="https://img.shields.io/badge/UI-Dark%20%2F%20Light-7c3aed?style=for-the-badge&logo=css3&logoColor=white" alt="Dark and light UI">`{=html}
`<img src="https://img.shields.io/badge/Status-Active%20Development-00b894?style=for-the-badge" alt="Active development">`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<i>`{=html}Decode smarter. Inspect carefully. Keep control of your
code.`</i>`{=html}
```{=html}
</p>
```

------------------------------------------------------------------------

## ✨ Overview

**MONKz DEOBF** brings multiple Lua and Luau deobfuscation engines and
script utilities together in one clean, responsive website.

Instead of jumping between separate tools, you can upload or paste a
script, choose the appropriate engine, inspect the output, and continue
cleaning or formatting it --- all from one interface.

> \[!NOTE\] Some engines are experimental. Results depend on the
> protection method and input script. Check the engine status below
> before relying on its output.

## 📑 Table of Contents

-   [Deobfuscation Engines](#-deobfuscation-engines)
-   [Built-in Utilities](#-built-in-utilities)
-   [Features](#-features)
-   [Quick Workflow](#-quick-workflow)
-   [Privacy and Security](#-privacy-and-security)
-   [Technology Stack](#-technology-stack)
-   [Troubleshooting](#-troubleshooting)
-   [Credits](#-credits)
-   [Responsible Use](#-responsible-use)

------------------------------------------------------------------------

## 🔓 Deobfuscation Engines

Tools for different Lua protection formats, collected in one workspace.

  ----------------------------------------------------------------------------------------------------------------------------------------------------
                                      Icon                                      Engine              Target                 Current status Execution
  ----------------------------------------------------------------------------- ------------------- ---------------------- -------------- ------------
      `<img src="logos/prometheus.svg" width="38" alt="Prometheus">`{=html}     **Prometheus**      Prometheus-protected   🧪             Browser
                                                                                                    scripts                Experimental   

   `<img src="logos/luaobfuscator.svg" width="38" alt="LuaObfuscator">`{=html}  **LuaObfuscator**   LuaObfuscator.com      🧪             Browser
                                                                                                    output                 Experimental   

           `<img src="logos/clyde.svg" width="38" alt="Clyde">`{=html}          **Clyde**           Clyde Protection       🧪             Browser
                                                                                                    output                 Experimental   

        `<img src="logos/ironveil.svg" width="38" alt="Ironveil">`{=html}       **Ironveil V1**     Ironveil V1 output     🧫 Tested with Browser
                                                                                                                           1 sample       

        `<img src="logos/hercules.svg" width="38" alt="Hercules">`{=html}       **Hercules**        Hercules VM and        ⚙️ Output      Browser
                                                                                                    BytecodeEncoder        returned for 7 (Pyodide),
                                                                                                    payloads               of 9 bundled   optional
                                                                                                                           samples in     Vercel
                                                                                                                           standard       Python
                                                                                                                           Python;        
                                                                                                                           browser mode   
                                                                                                                           not yet        
                                                                                                                           verified       
  ----------------------------------------------------------------------------------------------------------------------------------------------------

## 🧰 Built-in Utilities

Not every script needs a full deobfuscation engine. Use the included
utilities to inspect and clean code.

  ---------------------------------------------------------------------------------------------------------------
                                   Icon                                   Utility             What it does
  ----------------------------------------------------------------------- ------------------- -------------------
     `<img src="logos/detector.svg" width="38" alt="Detector">`{=html}    **Detector**        Checks for known
                                                                                              markers, suggests a
                                                                                              suitable tool, and
                                                                                              flags visible
                                                                                              loaders, network
                                                                                              calls, and Discord
                                                                                              webhooks.

   `<img src="logos/beautifier.svg" width="38" alt="Beautifier">`{=html}  **Beautifier**      Improves
                                                                                              readability with
                                                                                              indentation and
                                                                                              line breaks.

   `<img src="logos/cleaner.svg" width="38" alt="Basic Cleaner">`{=html}  **Basic Cleaner**   Decodes escaped
                                                                                              strings, numeric
                                                                                              `string.char`
                                                                                              calls, and simple
                                                                                              constant math.
  ---------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 🚀 Features

```{=html}
<table>
```
```{=html}
<tr>
```
```{=html}
<td width="50%">
```
```{=html}
<h3>
```
🧩 All-in-one workspace
```{=html}
</h3>
```
Separate pages for each engine, with swipeable tool tabs.
```{=html}
</td>
```
```{=html}
<td width="50%">
```
```{=html}
<h3>
```
📂 Flexible input
```{=html}
</h3>
```
Drag and drop files, use the file picker, or paste code directly.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
<tr>
```
```{=html}
<td>
```
```{=html}
<h3>
```
📋 Easy output handling
```{=html}
</h3>
```
Copy or download results, or send them directly to the Beautifier.
```{=html}
</td>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🔎 Smart detection
```{=html}
</h3>
```
Carry a script from Detector to its suggested tool.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
<tr>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🌗 Theme choices
```{=html}
</h3>
```
Switch between dark and light themes.
```{=html}
</td>
```
```{=html}
<td>
```
```{=html}
<h3>
```
📱 Responsive design
```{=html}
</h3>
```
Designed for phones and desktop screens.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
<tr>
```
```{=html}
<td>
```
```{=html}
<h3>
```
⚡ Background processing
```{=html}
</h3>
```
Browser engines run in background workers, with cancellation and a
60-second limit.
```{=html}
</td>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🎨 Motion and visual polish
```{=html}
</h3>
```
Decoding text effects, page and card transitions, and an engine progress
bar.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
</table>
```
```{=html}
<p align="center">
```
`<i>`{=html}Motion is reduced when the device requests reduced
motion.`</i>`{=html}
```{=html}
</p>
```
## 🧭 Quick Workflow

1.  **Open the tool** that matches the script's protection. If you're
    unsure, start with Detector.
2.  **Add your script** by dragging in a file, selecting one, or pasting
    the code.
3.  **Run the tool** and allow the engine to process the input.
4.  **Inspect the output** carefully. Deobfuscation may be incomplete.
5.  **Continue with Beautifier** if you want cleaner formatting.
6.  **Copy or download** the result for further review.

> **Tip:** Detection is a helper, not a guarantee. If the suggested
> engine does not work, the script may use an unsupported or modified
> protection method.

## 🔐 Privacy and Security

Your scripts deserve careful handling.

-   **Browser-side processing:** Browser tools process scripts on your
    device. The site does not upload those scripts for processing.
-   **Hercules browser mode:** Hercules runs in the browser using
    Pyodide loaded from `cdn.jsdelivr.net`.
-   **Optional server mode:** If you choose server mode for Hercules,
    your script is sent to the site's Python function. The application
    code does not save or log it, although the hosting provider may
    retain technical request logs.
-   **Review every result:** Decoded output can be incomplete or behave
    differently from the original.
-   **Warnings matter:** A script with no detected warnings is not
    necessarily safe.

> \[!WARNING\] Never run unknown or decoded code just because it looks
> readable. Inspect it first, especially for loaders, network requests,
> remote execution, and suspicious behavior.

## 🛠️ Technology Stack

  Technology                   Role
  ---------------------------- -------------------------------------------------
  **HTML**                     Page structure
  **CSS**                      Layout, themes, transitions, and visual styling
  **JavaScript**               Application logic and interactions
  **Web Workers**              Background browser processing
  **Pyodide**                  Python execution in the browser for Hercules
  **Vercel Python function**   Optional server-side Hercules mode

## 🧯 Troubleshooting

```{=html}
<details>
```
```{=html}
<summary>
```
`<b>`{=html}⚠️ A deobfuscator does not produce readable
output`</b>`{=html}
```{=html}
</summary>
```
The engine may not support that protection variant, or the input may be
incomplete. Try Detector to identify known markers and remember that
some engines are experimental.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<b>`{=html}⏳ Processing takes too long`</b>`{=html}
```{=html}
</summary>
```
Browser engine processing has a 60-second limit and can be cancelled.
Try a smaller input or another supported engine.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<b>`{=html}🧩 Hercules behaves differently in the browser`</b>`{=html}
```{=html}
</summary>
```
Browser mode has not yet been verified. The engine returned output for 7
of 9 bundled samples in standard Python. Optional Vercel Python server
mode is also available.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<b>`{=html}📄 The output looks messy`</b>`{=html}
```{=html}
</summary>
```
Send the result to the Beautifier to improve indentation and line
breaks.
```{=html}
</details>
```
## 🙌 Credits

MONKz DEOBF includes work from the following projects and contributors.
Please respect their licenses.

  ------------------------------------------------------------------------------------------
  Engine                  Author                  License
  ----------------------- ----------------------- ------------------------------------------
  Prometheus Deobfuscator LeakD                   [MIT](vendor/licenses/prometheus.txt)

  LuaObfuscator           LeakD / Prostone        [MIT](vendor/licenses/luaobfuscator.txt)
  Deobfuscator                                    

  ClydeDeobf              @_jmi. (OmniDBF)        [MIT](vendor/licenses/clyde.txt)

  Ironveil Deobfuscator   LeakD / prostone\_      [MIT](vendor/licenses/ironveil.txt)
  (unused eval helper                             
  removed)                                        

  deobfhercules           See license             [Apache 2.0](vendor/licenses/hercules.txt)
  ------------------------------------------------------------------------------------------

## ⚖️ Responsible Use

Use MONKz DEOBF only on code you own or have permission to analyze.

Respect the original authors, applicable licenses, and the terms of any
software you inspect.

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<img src="favicon.svg" width="54" alt="MONKz DEOBF">`{=html}
```{=html}
</p>
```
```{=html}
<h3 align="center">
```
MONKz DEOBF
```{=html}
</h3>
```
```{=html}
<p align="center">
```
`<b>`{=html}Decode. Understand. Take Control.`</b>`{=html} `<br>`{=html}
`<sub>`{=html}Built for curious minds and cleaner code.`</sub>`{=html}
```{=html}
</p>
```
