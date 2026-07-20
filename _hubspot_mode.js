/**
 * HubSpot dual-mode helper for home.html
 *
 * EDIT (default / local preview):
 *   node _hubspot_mode.js edit
 *   → home.html stays clean; HubL is only inside <template data-hubspot> (not painted on screen)
 *
 * UPLOAD (Design Manager paste into SITE MAIN / Home.html):
 *   node _hubspot_mode.js upload
 *   → writes Home.hubspot.html with HubSpot page template metadata + HubL includes
 *
 * Usage: node _hubspot_mode.js [edit|upload|status]
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SOURCE = path.join(ROOT, "home.html");
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

function buildHubspotPage(sourceHtml) {
  const headHubL = extractTemplate(sourceHtml, "head");
  const footerHubL = extractTemplate(sourceHtml, "footer");
  let html = stripHubspotTemplates(sourceHtml);

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
  html = html.replace(
    /<\/body>/i,
    `  ${footerHubL}\n</body>`
  );

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

  console.log("Mode:           " + mode);
  console.log("home.html:      " + (hasHead && hasFooter ? "HubL stored in hidden <template> blocks" : "MISSING HubSpot templates"));
  console.log("Home.hubspot.html: " + (uploadExists ? "present (ready to paste into Design Manager)" : "not generated yet — run upload"));
  console.log("");
  console.log("Local preview uses home.html (HubSpot HubL is not visible on screen).");
  console.log("Upload file goes into HubSpot Design Manager → SITE MAIN → Home.html");
}

function edit() {
  setMode("edit");
  console.log("EDIT mode active.");
  console.log("Preview: http://localhost:5500/home.html");
  console.log("HubSpot HubL stays inside <template data-hubspot> and will not show on screen.");
  if (fs.existsSync(OUTPUT)) {
    console.log("Note: Home.hubspot.html still exists for reference; edit home.html only.");
  }
}

function upload() {
  const source = readSource();
  if (!/data-hubspot="head"/i.test(source) || !/data-hubspot="footer"/i.test(source)) {
    throw new Error("home.html is missing <template data-hubspot=\"head|footer\"> blocks");
  }

  const out = buildHubspotPage(source);
  fs.writeFileSync(OUTPUT, out, "utf8");
  setMode("upload");

  console.log("UPLOAD mode — wrote Home.hubspot.html");
  console.log("Paste that file into HubSpot Design Manager (SITE MAIN / Home.html).");
  console.log("Keep editing in home.html; re-run upload after changes to refresh the HubSpot file.");
  console.log("Local preview should still use http://localhost:5500/home.html (not the .hubspot file).");
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
