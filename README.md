# MONKz DEOBF

Lua and Luau deobfuscation website.

## Deploy on Vercel
1. Upload everything in this folder (including `api/` and `vendor/`) to the root of your GitHub repository.
2. Import the repository in Vercel. Framework Preset: Other. Leave the build command empty.
3. Vercel is expected to serve `api/hercules.py` as a Python function. After deploying, test the Hercules page.

## Local use
`python3 -m http.server` serves every page. The Hercules tool needs the API, so test it on Vercel (or with `vercel dev`).

## Third-party code
Licenses are in `vendor/licenses/`. Keep them. `build.js` is only needed to rebuild the JavaScript engine bundles.
