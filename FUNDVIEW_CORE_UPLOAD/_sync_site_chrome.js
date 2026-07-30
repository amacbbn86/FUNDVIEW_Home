/**
 * Keep FUNDVIEW site header/footer consistent across the CORE templates.
 *
 * Canonical sources:
 *   SITE_HEADER_7.29_730pm.html
 *   SITE_FOOTER_7.29_730pm.html
 *
 * Also maintains tooling aliases:
 *   fundview-header-local.html
 *   fundview-footer-local.html
 *
 * Usage:
 *   node _sync_site_chrome.js           # SITE_* → fundview-*-local.html
 *   node _sync_site_chrome.js --from-local  # fundview-*-local.html → SITE_*
 *   node _sync_site_chrome.js --check   # report whether copies match
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const HEADER_SITE = path.join(ROOT, "SITE_HEADER_7.29_730pm.html");
const FOOTER_SITE = path.join(ROOT, "SITE_FOOTER_7.29_730pm.html");
const HEADER_LOCAL = path.join(ROOT, "fundview-header-local.html");
const FOOTER_LOCAL = path.join(ROOT, "fundview-footer-local.html");

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function copy(from, to, label) {
  fs.copyFileSync(from, to);
  console.log("Synced " + label + ": " + path.basename(from) + " → " + path.basename(to));
}

function check() {
  const pairs = [
    ["header", HEADER_SITE, HEADER_LOCAL],
    ["footer", FOOTER_SITE, FOOTER_LOCAL],
  ];
  let ok = true;
  for (const [label, a, b] of pairs) {
    if (!fs.existsSync(a) || !fs.existsSync(b)) {
      console.log(label + ": missing file(s)");
      ok = false;
      continue;
    }
    const same = hash(a) === hash(b);
    console.log(label + ": " + (same ? "IN SYNC" : "OUT OF SYNC"));
    if (!same) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

const args = new Set(process.argv.slice(2));
if (args.has("--check")) {
  check();
} else if (args.has("--from-local")) {
  copy(HEADER_LOCAL, HEADER_SITE, "header");
  copy(FOOTER_LOCAL, FOOTER_SITE, "footer");
} else {
  copy(HEADER_SITE, HEADER_LOCAL, "header");
  copy(FOOTER_SITE, FOOTER_LOCAL, "footer");
}

console.log("All page templates fetch SITE_HEADER_7.29_730pm.html / SITE_FOOTER_7.29_730pm.html.");
console.log("Edit those SITE_* files, then re-run this script to refresh local aliases for HubSpot tooling.");
