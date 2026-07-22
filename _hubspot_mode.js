/**
 * HubSpot dual-mode helper for home.html / home2.html / home3.html
 *
 * EDIT (default / local preview):
 *   node _hubspot_mode.js edit
 *   → source stays clean; HubL is only inside <template data-hubspot>
 *   → header/footer still load via fetch from local files
 *
 * UPLOAD (Design Manager paste):
 *   node _hubspot_mode.js upload          → Home.hubspot.html  (from home.html)
 *   node _hubspot_mode.js upload home2    → Home2.hubspot.html (from home2.html)
 *   node _hubspot_mode.js upload home3    → Home3.hubspot.html (from home3.html)
 *   → HubSpot page template metadata + HubL includes
 *   → header + footer INLINED (fetch of local files does not work on HubSpot)
 *   → for home2/home3: experience Tailwind CSS is also inlined
 *
 * Usage: node _hubspot_mode.js [edit|upload|status] [home|home2|home3]
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const HEADER = path.join(ROOT, "fundview-header-local.html");
const FOOTER = path.join(ROOT, "fundview-footer-local.html");
const MODE_FILE = path.join(ROOT, ".hubspot-mode");
const TAILWIND = path.join(
  ROOT,
  "HOME_Section_Explore FUNDVIEW2",
  "assets_experience",
  "tailwind-compiled.css"
);

function resolveTarget(name) {
  const key = (name || "home").toLowerCase();
  if (key === "home3" || key === "home3.html") {
    return {
      key: "home3",
      source: path.join(ROOT, "home3.html"),
      output: path.join(ROOT, "Home3.hubspot.html"),
      label: "FUNDVIEW Home 3 (Experience)",
      preview: "http://localhost:5500/home3.html",
    };
  }
  if (key === "home2" || key === "home2.html") {
    return {
      key: "home2",
      source: path.join(ROOT, "home2.html"),
      output: path.join(ROOT, "Home2.hubspot.html"),
      label: "FUNDVIEW Home 2 (Experience)",
      preview: "http://localhost:5500/home2.html",
    };
  }
  return {
    key: "home",
    source: path.join(ROOT, "home.html"),
    output: path.join(ROOT, "Home.hubspot.html"),
    label: "FUNDVIEW Home",
    preview: "http://localhost:5500/home.html",
  };
}

function readSource(target) {
  if (!fs.existsSync(target.source)) {
    throw new Error(path.basename(target.source) + " not found");
  }
  return fs.readFileSync(target.source, "utf8");
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
  const afterTag = html.slice(html.indexOf(tagMatch[0]) + tagMatch[0].length);
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(afterTag))) {
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

  html = html.replace(
    /\s*<!--\s*Header:[\s\S]*?<div id="header-mount"><\/div>\s*<script>[\s\S]*?loadSharedHeader[\s\S]*?<\/script>/i,
    "\n\n" + headerBlock + "\n"
  );

  html = html.replace(
    /\s*<!--\s*Footer:[\s\S]*?<div id="footer-mount"><\/div>\s*<script>[\s\S]*?loadSharedFooter[\s\S]*?<\/script>/i,
    "\n\n" + footerBlock + "\n"
  );

  if (/id="header-mount"|loadSharedHeader|id="footer-mount"|loadSharedFooter/i.test(html)) {
    throw new Error(
      "Failed to inline header/footer — mount markers not found or unexpected format"
    );
  }

  return html;
}

function inlineExperienceTailwind(html) {
  if (!/tailwind-compiled\.css/i.test(html)) return html;
  if (!fs.existsSync(TAILWIND)) {
    console.warn("Warning: tailwind-compiled.css not found — leaving local link");
    return html;
  }
  const css = fs.readFileSync(TAILWIND, "utf8");
  return html.replace(
    /<link[^>]*href=["'][^"']*tailwind-compiled\.css["'][^>]*>\s*/i,
    `<style data-experience-tailwind>\n${css}\n</style>\n`
  );
}

function buildHubspotPage(sourceHtml, target) {
  const headHubL = extractTemplate(sourceHtml, "head");
  const footerHubL = extractTemplate(sourceHtml, "footer");
  let html = stripHubspotTemplates(sourceHtml);

  html = inlineHeaderFooter(html);
  html = inlineExperienceTailwind(html);

  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");

  html = html.replace(/^[\s\S]*?<!DOCTYPE html>\s*/i, "");
  html = html.replace(/^<!--[\s\S]*?-->\s*/i, "");

  if (/<meta\s+charset=/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["']?utf-8["']?\s*\/?>)/i,
      `$1\n  ${headHubL}`
    );
  } else {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n  ${headHubL}`);
  }

  html = html.replace(/<\/body>/i, `  ${footerHubL}\n</body>`);

  const banner = `<!--
  templateType: page
  isAvailableForNewContent: true
  label: ${target.label}
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

function status(targetName) {
  const target = resolveTarget(targetName);
  const source = readSource(target);
  const hasHead = /data-hubspot="head"/i.test(source);
  const hasFooter = /data-hubspot="footer"/i.test(source);
  const mode = getMode();
  const uploadExists = fs.existsSync(target.output);
  let inlined = false;
  if (uploadExists) {
    const out = fs.readFileSync(target.output, "utf8");
    inlined =
      /class="site-header"/i.test(out) &&
      /class="site-footer"/i.test(out) &&
      !/loadSharedHeader|loadSharedFooter/i.test(out);
  }

  console.log("Target:         " + target.key);
  console.log("Mode:           " + mode);
  console.log(
    path.basename(target.source) +
      ":  " +
      (hasHead && hasFooter
        ? "HubL in hidden <template> blocks; header/footer via local fetch (edit preview)"
        : "MISSING HubSpot templates")
  );
  console.log(
    path.basename(target.output) +
      ": " +
      (uploadExists
        ? inlined
          ? "present — header + footer INLINED (ready for HubSpot paste)"
          : "present — run upload again to inline header/footer"
        : "not generated yet — run upload")
  );
  console.log("");
  console.log("Local preview:  " + target.preview);
  console.log(
    "HubSpot paste:  " + path.basename(target.output) + " into your coded page template"
  );
}

function edit(targetName) {
  const target = resolveTarget(targetName);
  setMode("edit");
  console.log("EDIT mode active for " + target.key + ".");
  console.log("Preview: " + target.preview);
  console.log("HubSpot HubL stays inside <template data-hubspot> and will not show on screen.");
  console.log("Header/footer load from local files via fetch (edit only).");
  if (fs.existsSync(target.output)) {
    console.log(
      "Note: " +
        path.basename(target.output) +
        " still exists for HubSpot paste; edit " +
        path.basename(target.source) +
        " + fundview-*-local.html."
    );
  }
}

function upload(targetName) {
  const target = resolveTarget(targetName);
  const source = readSource(target);
  if (!/data-hubspot="head"/i.test(source) || !/data-hubspot="footer"/i.test(source)) {
    throw new Error(
      path.basename(target.source) +
        ' is missing <template data-hubspot="head|footer"> blocks'
    );
  }

  const out = buildHubspotPage(source, target);
  fs.writeFileSync(target.output, out, "utf8");
  setMode("upload");

  const bytes = Buffer.byteLength(out, "utf8");
  console.log("UPLOAD mode — wrote " + path.basename(target.output));
  console.log(
    "Includes: HubSpot HubL + INLINED header + INLINED footer" +
      (target.key === "home2" || target.key === "home3" ? " + inlined Experience Tailwind CSS" : "") +
      "."
  );
  console.log("Size: " + (bytes / 1024).toFixed(1) + " KB");
  console.log("Paste " + path.basename(target.output) + " into your HubSpot coded template.");
  console.log(
    "Keep editing in " +
      path.basename(target.source) +
      " / fundview-*-local.html; re-run upload after changes."
  );
  console.log("Local preview should still use " + target.preview);
}

const cmd = (process.argv[2] || "status").toLowerCase();
const targetArg = process.argv[3];

try {
  if (cmd === "edit") edit(targetArg);
  else if (cmd === "upload") upload(targetArg);
  else if (cmd === "status") status(targetArg);
  else {
    console.error("Usage: node _hubspot_mode.js [edit|upload|status] [home|home2|home3]");
    process.exit(1);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
