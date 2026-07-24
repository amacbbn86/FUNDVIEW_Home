/**
 * Build home6.html from home5.html + SEC_ExperF_6.html experience section.
 * Run: node _build_home6.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const home5 = fs.readFileSync(path.join(ROOT, 'home5.html'), 'utf8').replace(/\r\n/g, '\n');
const sec = fs.readFileSync(path.join(ROOT, 'SEC_ExperF_6.html'), 'utf8').replace(/\r\n/g, '\n');

function sliceBetween(src, startMarker, endMarker, { includeStart = true, includeEnd = false } = {}) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error('Start marker not found: ' + startMarker.slice(0, 80));
  const from = includeStart ? start : start + startMarker.length;
  const end = src.indexOf(endMarker, from);
  if (end < 0) throw new Error('End marker not found: ' + endMarker.slice(0, 80));
  return src.slice(from, includeEnd ? end + endMarker.length : end);
}

// --- Extract from SEC_ExperF_6 ---
const EXP_CSS_START = '    /* ——— experience_fundview (from HOME_Section_Explore FUNDVIEW2) ——— */';
const secCss = sliceBetween(sec, EXP_CSS_START, '\n  </style>\n</head>', { includeStart: true, includeEnd: false }).trimEnd() + '\n\n';

const EXP_HTML_START = '  <section class="experience_fundview antialiased text-white overflow-x-hidden" id="experience_fundview" aria-label="Experience FUNDVIEW">';
const EXP_HTML_END = '<!-- Experience section end -->\n  </section>';
const secHtml = sliceBetween(sec, EXP_HTML_START, EXP_HTML_END, { includeStart: true, includeEnd: true });

const SCRIPTS_START = '  <!-- experience_fundview scripts -->';
// Include main experience script + ticker script; drop standalone Watch Overview (no button on home6)
const secScriptsFull = sliceBetween(sec, SCRIPTS_START, '\n</body>', { includeStart: true, includeEnd: false });
const watchOverviewMarker = "\n  /* Watch Overview — open overview video (standalone section has no full modal) */";
const watchIdx = secScriptsFull.indexOf(watchOverviewMarker);
const secScripts =
  watchIdx >= 0
    ? secScriptsFull.slice(0, watchIdx).replace(/\n  <\/script>\s*$/, '') +
      '\n\n  </script>\n'
    : secScriptsFull;

// --- Build home6 from home5 ---
let out = home5;

// Header comment → home6
out = out.replace(
  /FUNDVIEW home5 — dual mode[\s\S]*?Tell the agent "working on edits" or "ready to upload to HubSpot" to switch\./,
  `FUNDVIEW home6 — dual mode
  • EDIT (default): preview http://localhost:5500/home6.html locally.
    HubSpot HubL lives in <template data-hubspot> blocks and does not render on screen.
    Header/footer load from fundview-header-local.html / fundview-footer-local.html via fetch (local preview only).
  • UPLOAD (when ready for HubSpot): run \`node _hubspot_mode.js upload home6\`
    → regenerates Home6.hubspot.html from this file (inlines header + footer + Experience Tailwind).
    Paste Home6.hubspot.html into your HubSpot coded page template.
    Tell the agent "working on edits" or "ready to upload to HubSpot" to switch.
  • Top section is Experience FUNDVIEW (from SEC_ExperF_6.html), replacing hero_intro.`
);
out = out.replace(/`node _hubspot_mode\.js upload home5`/g, '`node _hubspot_mode.js upload home6`');
out = out.replace(/Home5\.hubspot\.html/g, 'Home6.hubspot.html');
out = out.replace(/home5\.html/g, 'home6.html');

// Replace experience CSS (home5 block → SEC block)
const homeCssStart = out.indexOf(EXP_CSS_START);
const homeCssEnd = out.indexOf('    /* ——— Every FUNDVIEW Solution Delivers ——— */');
if (homeCssStart < 0 || homeCssEnd < 0) {
  throw new Error('Could not locate experience CSS bounds in home5');
}
out = out.slice(0, homeCssStart) + secCss + '    ' + out.slice(homeCssEnd);

// Replace hero_intro with Experience + keep id="top" anchor for scroll/home links
const heroStart = out.indexOf('  <!-- Hero from swiss.html -->');
const heroAlt = out.indexOf('  <section class="hero_intro" id="top">');
const startHero = heroStart >= 0 ? heroStart : heroAlt;
if (startHero < 0) throw new Error('hero_intro not found');

const quicklinksComment = '  <!-- Quick links CTA bar (Highlands-style) — gives prime real estate to the three primary CTAs -->';
const quickIdx = out.indexOf(quicklinksComment, startHero);
if (quickIdx < 0) throw new Error('quicklinks marker not found after hero');

const experienceBlock =
  '  <!-- Experience FUNDVIEW (from SEC_ExperF_6) — page top / replaces hero_intro -->\n' +
  '  <span id="top" hidden></span>\n' +
  secHtml +
  '\n\n';

out = out.slice(0, startHero) + experienceBlock + out.slice(quickIdx);

// Remove the OLD mid-page experience section (after stats)
const oldExpStart = out.indexOf(
  '\n  <section class="experience_fundview antialiased text-white overflow-x-hidden" id="experience_fundview"'
);
// Prefer the second occurrence if first is our new top section — find after stats
const statsEnd = out.indexOf('  <section class="stats" id="stats"');
if (statsEnd < 0) throw new Error('stats section not found');
const oldExpAfterStats = out.indexOf(
  '\n  <section class="experience_fundview antialiased text-white overflow-x-hidden" id="experience_fundview"',
  statsEnd
);
if (oldExpAfterStats < 0) {
  console.warn('No mid-page experience section found after stats (may already be removed).');
} else {
  const oldExpEndMarker = '<!-- Experience section end -->\n  </section>';
  const oldExpEnd = out.indexOf(oldExpEndMarker, oldExpAfterStats);
  if (oldExpEnd < 0) throw new Error('Old experience end marker not found');
  const afterOld = oldExpEnd + oldExpEndMarker.length;
  // Keep a blank line before solution_delivers
  out = out.slice(0, oldExpAfterStats) + '\n' + out.slice(afterOld);
}

// Scroll guide: experience first, drop hero_intro; include quicklinks
out = out.replace(
  '".hero_intro, .news_and_updates, .stats, .experience_fundview, .solution_delivers, .see_in_action, .helping_local_testimonial, .customer_story, .listening_evolving, .ready_to_see_fundview, .site-footer"',
  '".experience_fundview, .quicklinks, .news_and_updates, .stats, .solution_delivers, .see_in_action, .helping_local_testimonial, .customer_story, .listening_evolving, .ready_to_see_fundview, .site-footer"'
);
out = out.replace(/\n\s*hero_intro: true,/, '');

// Neutralize mid-page heroTicker (ticker now driven by experience scripts at end)
out = out.replace(
  /\/\* Hero logo ticker — seamless auto-scroll \+ drag scrub \*\/\r?\n\s*\(function heroTicker\(\) \{[\s\S]*?\}\)\(\);\r?\n/,
  '/* Hero logo ticker — moved to experience_fundview scripts (end of page) */\n\n'
);

// Replace experience scripts at end of body
const scriptsIdx = out.lastIndexOf('  <!-- experience_fundview scripts -->');
if (scriptsIdx < 0) throw new Error('experience scripts marker not found');
const bodyClose = out.lastIndexOf('\n</body>');
if (bodyClose < 0 || bodyClose < scriptsIdx) throw new Error('</body> not found after scripts');
out = out.slice(0, scriptsIdx) + secScripts.trimEnd() + '\n' + out.slice(bodyClose);

const outPath = path.join(ROOT, 'home6.html');
fs.writeFileSync(outPath, out, 'utf8');

// Sanity checks
const checks = {
  hasExperience: (out.match(/id="experience_fundview"/g) || []).length,
  hasHeroIntro: /class="hero_intro"/.test(out),
  hasQuicklinks: /id="quicklinks"/.test(out),
  hasFvStatDuo: /fv-stat-duo/.test(out),
  hasSyncFloating: /syncFloatingPageCta/.test(out),
  hasHeroTickerScript: /function heroTicker/.test(out),
  experienceBeforeQuicklinks:
    out.indexOf('id="experience_fundview"') < out.indexOf('id="quicklinks"') &&
    out.indexOf('id="quicklinks"') < out.indexOf('id="stats"'),
};
console.log('Wrote', outPath);
console.log('Checks:', checks);
if (checks.hasExperience !== 1) console.error('FAIL: expected exactly 1 experience_fundview id, got', checks.hasExperience);
if (checks.hasHeroIntro) console.error('FAIL: hero_intro still present');
if (!checks.experienceBeforeQuicklinks) console.error('FAIL: section order wrong');
if (!checks.hasFvStatDuo) console.error('FAIL: missing fv-stat-duo from SEC');
if (!checks.hasSyncFloating) console.error('FAIL: missing syncFloatingPageCta');
