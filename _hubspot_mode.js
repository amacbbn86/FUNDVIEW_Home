/**
 * HubSpot dual-mode helper for home.html
 *
 * EDIT (default / local preview):
 *   node _hubspot_mode.js edit
 *   → home.html stays clean; HubL is only inside <template data-hubspot> (not painted on screen)
 *   → header/footer still load via fetch from local files (works with _preview_server.js)
 *
 * UPLOAD (Design Manager paste for draft/live HubSpot page):
 *   node _hubspot_mode.js upload
 *   → writes Home.hubspot.html with:
 *      - HubSpot page template metadata + HubL includes
 *      - header + footer INLINED (fetch of local files does not work on HubSpot)
 *
 * Usage: node _hubspot_mode.js [edit|upload|status]
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SOURCE = path.join(ROOT, "home.html");
const HEADER = path.join(ROOT, "fundview-header-local.html");
const FOOTER = path.join(ROOT, "fundview-footer-local.html");
const OUTPUT = path.join(ROOT, "Home.hubspot.html");
const MODE_FILE = path.join(ROOT, ".hubspot-mode");

function readSource() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error("home.html not found");
  }
  return fs.readFileSync(SOURCE, "utf8");
}

function extractTemplate(html, name) {
  const re = new RegExp(
    `<template\\s+data-hubspot="${name}"[^>]*>([\\s\\S]*?)<\\/template>`,
    "i"
  );
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function stripHubspotTemplates(html) {
  return html
    .replace(/<template\s+data-hubspot="[^"]*"[^>]*>[\s\S]*?<\/template>\s*/gi, "")
    .replace(/\s*<!--\s*HubSpot (?:head|footer) includes[\s\S]*?-->\s*/gi, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function extractPartial(filePath, tagName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(path.basename(filePath) + " not found");
  }
  const html = fs.readFileSync(filePath, "utf8");

  const styles = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html))) {
    styles.push(m[1].trim());
  }

  const tagRe = new RegExp(
    `<(${tagName})\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`,
    "i"
  );
  const tagMatch = html.match(tagRe);
  if (!tagMatch) {
    throw new Error("Could not find <" + tagName + "> in " + path.basename(filePath));
  }
  let markup = tagMatch[0];

  const scripts = [];
  // Only body scripts after the main landmark tag
  const afterTag = html.slice(html.indexOf(tagMatch[0]) + tagMatch[0].length);
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(afterTag))) {
    // Skip empty / external scripts
    if (m[1] && m[1].trim()) scripts.push(m[1].trim());
  }

  return { styles, markup, scripts };
}

function toDataUri(relativePath) {
  const abs = path.join(ROOT, relativePath);
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".svg"
          ? "image/svg+xml"
          : ext === ".webp"
            ? "image/webp"
            : "application/octet-stream";
  const b64 = fs.readFileSync(abs).toString("base64");
  return "data:" + mime + ";base64," + b64;
}

function rewriteLocalAssets(markup) {
  // Convert relative Assets_* paths to data URIs so HubSpot can render them
  return markup.replace(
    /((?:src|href)=["'])(Assets_[^"']+)(["'])/g,
    function (_, pre, rel, post) {
      const decoded = decodeURIComponent(rel);
      const dataUri = toDataUri(decoded);
      if (!dataUri) {
        console.warn("Warning: missing local asset for HubSpot inline:", decoded);
        return pre + rel + post;
      }
      return pre + dataUri + post;
    }
  );
}

function inlineHeaderFooter(html) {
  const header = extractPartial(HEADER, "header");
  const footer = extractPartial(FOOTER, "footer");

  header.markup = rewriteLocalAssets(header.markup);
  footer.markup = rewriteLocalAssets(footer.markup);

  const styleBlock =
    `<style data-shared-header>\n${header.styles.join("\n\n")}\n</style>\n` +
    `<style data-shared-footer>\n${footer.styles.join("\n\n")}\n</style>\n`;

  // Inject shared styles before </head>
  html = html.replace(/<\/head>/i, styleBlock + "</head>");

  const headerBlock =
    "  <!-- Header inlined for HubSpot (from fundview-header-local.html) -->\n" +
    "  " +
    header.markup +
    (header.scripts.length
      ? "\n  <script>\n" + header.scripts.join("\n\n") + "\n  </script>"
      : "");

  const footerBlock =
    "  <!-- Footer inlined for HubSpot (from fundview-footer-local.html) -->\n" +
    "  " +
    footer.markup +
    (footer.scripts.length
      ? "\n  <script>\n" + footer.scripts.join("\n\n") + "\n  </script>"
      : "");

  // Replace header mount + loader script
  html = html.replace(
    /\s*<!--\s*Header:[\s\S]*?<div id="header-mount"><\/div>\s*<script>[\s\S]*?loadSharedHeader[\s\S]*?<\/script>/i,
    "\n\n" + headerBlock + "\n"
  );

  // Replace footer mount + loader script
  html = html.replace(
    /\s*<!--\s*Footer:[\s\S]*?<div id="footer-mount"><\/div>\s*<script>[\s\S]*?loadSharedFooter[\s\S]*?<\/script>/i,
    "\n\n" + footerBlock + "\n"
  );

  if (/id="header-mount"|loadSharedHeader|id="footer-mount"|loadSharedFooter/i.test(html)) {
    throw new Error(
      "Failed to inline header/footer — mount markers not found or unexpected format in home.html"
    );
  }

  return html;
}

function buildHubspotPage(sourceHtml) {
  const headHubL = extractTemplate(sourceHtml, "head");
  const footerHubL = extractTemplate(sourceHtml, "footer");
  let html = stripHubspotTemplates(sourceHtml);

  // Inline header + footer so the HubSpot draft URL is self-contained
  html = inlineHeaderFooter(html);

  // Drop local <title> — HubSpot HubL title takes over when present
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");

  // Normalize doctype for HubSpot coded templates
  html = html.replace(/^[\s\S]*?<!DOCTYPE html>\s*/i, "");
  html = html.replace(/^<!--[\s\S]*?-->\s*/i, ""); // drop dual-mode comment banner

  // Inject HubSpot head includes after charset (or at start of head)
  if (/<meta\s+charset=/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["']?utf-8["']?\s*\/?>)/i,
      `$1\n  ${headHubL}`
    );
  } else {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n  ${headHubL}`);
  }

  // Inject HubSpot footer includes before </body>
  html = html.replace(/<\/body>/i, `  ${footerHubL}\n</body>`);

  const banner = `<!--
  templateType: page
  isAvailableForNewContent: true
  label: FUNDVIEW Home
-->
`;

  return `${banner}<!doctype html>
${html.trim()}
`;
}

function setMode(mode) {
  fs.writeFileSync(MODE_FILE, mode + "\n", "utf8");
}

function getMode() {
  if (!fs.existsSync(MODE_FILE)) return "edit";
  return fs.readFileSync(MODE_FILE, "utf8").trim() || "edit";
}

function status() {
  const source = readSource();
  const hasHead = /data-hubspot="head"/i.test(source);
  const hasFooter = /data-hubspot="footer"/i.test(source);
  const mode = getMode();
  const uploadExists = fs.existsSync(OUTPUT);
  let inlined = false;
  if (uploadExists) {
    const out = fs.readFileSync(OUTPUT, "utf8");
    inlined =
      /class="site-header"/i.test(out) &&
      /class="site-footer"/i.test(out) &&
      !/loadSharedHeader|loadSharedFooter/i.test(out);
  }

  console.log("Mode:           " + mode);
  console.log(
    "home.html:      " +
      (hasHead && hasFooter
        ? "HubL in hidden <template> blocks; header/footer via local fetch (edit preview)"
        : "MISSING HubSpot templates")
  );
  console.log(
    "Home.hubspot.html: " +
      (uploadExists
        ? inlined
          ? "present — header + footer INLINED (ready for draft URL)"
          : "present — run upload again to inline header/footer"
        : "not generated yet — run upload")
  );
  console.log("");
  console.log("Local preview:  http://localhost:5500/home.html");
  console.log("HubSpot draft:  paste Home.hubspot.html into the page template used by /home_draft-alex");
}

function edit() {
  setMode("edit");
  console.log("EDIT mode active.");
  console.log("Preview: http://localhost:5500/home.html");
  console.log("HubSpot HubL stays inside <template data-hubspot> and will not show on screen.");
  console.log("Header/footer load from local files via fetch (edit only).");
  if (fs.existsSync(OUTPUT)) {
    console.log("Note: Home.hubspot.html still exists for HubSpot paste; edit home.html + header/footer locals.");
  }
}

function upload() {
  const source = readSource();
  if (!/data-hubspot="head"/i.test(source) || !/data-hubspot="footer"/i.test(source)) {
    throw new Error('home.html is missing <template data-hubspot="head|footer"> blocks');
  }

  const out = buildHubspotPage(source);
  fs.writeFileSync(OUTPUT, out, "utf8");
  setMode("upload");

  console.log("UPLOAD mode — wrote Home.hubspot.html");
  console.log("Includes: HubSpot HubL + INLINED header + INLINED footer (self-contained).");
  console.log("Paste Home.hubspot.html into the HubSpot template for:");
  console.log("  https://245865092.hs-sites-na2.com/home_draft-alex");
  console.log("Keep editing in home.html / fundview-*-local.html; re-run upload after changes.");
  console.log("Local preview should still use http://localhost:5500/home.html");
}

const cmd = (process.argv[2] || "status").toLowerCase();

try {
  if (cmd === "edit") edit();
  else if (cmd === "upload") upload();
  else if (cmd === "status") status();
  else {
    console.error("Usage: node _hubspot_mode.js [edit|upload|status]");
    process.exit(1);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
