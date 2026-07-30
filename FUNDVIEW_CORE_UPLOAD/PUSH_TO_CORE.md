# Push these files to amacbbn86/FUNDVIEW_CORE

Cursor’s GitHub app currently has **write access to FUNDVIEW_Home only**.  
`git push` to `https://github.com/amacbbn86/FUNDVIEW_CORE` returns:

`Permission to amacbbn86/FUNDVIEW_CORE.git denied to cursor[bot]`

## Option A — Grant Cursor access (preferred)

1. Open https://github.com/amacbbn86/FUNDVIEW_CORE
2. Install / enable the **Cursor** GitHub App on this repo (same as FUNDVIEW_Home)
3. Tell the agent to upload again — it will push the prepared commit

## Option B — Push the git bundle locally

From a machine authenticated as `amacbbn86`:

```powershell
git clone https://github.com/amacbbn86/FUNDVIEW_CORE.git
cd FUNDVIEW_CORE
git pull ../path-to/FUNDVIEW_CORE-initial.bundle cursor/site-page-templates-3334
git checkout -B main cursor/site-page-templates-3334
git push -u origin main
```

Or copy everything from this `FUNDVIEW_CORE_UPLOAD/` folder into a fresh local clone of FUNDVIEW_CORE and push.

## What’s included

- All named `*_7.29_730pm.html` page templates
- `SITE_HEADER_7.29_730pm.html` + `SITE_FOOTER_7.29_730pm.html` (canonical chrome)
- Matching `*.hubspot.html` exports
- `_sync_site_chrome.js` + `_hubspot_mode.js` + `_preview_server.js`
