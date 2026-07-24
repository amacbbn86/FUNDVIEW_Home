/**
 * Build SEC_ExperF_6.html — isolated Experience FUNDVIEW working copy from home5.html.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const source = fs.readFileSync(path.join(ROOT, "home5.html"), "utf8");
const lines = source.split(/\r?\n/);

function findIndex(pred, from = 0) {
  for (let i = from; i < lines.length; i++) if (pred(lines[i], i)) return i;
  return -1;
}

const cssStart = findIndex((l) =>
  l.includes("experience_fundview (from HOME_Section_Explore")
);
const cssEnd = findIndex(
  (l) => l.includes("Every FUNDVIEW Solution Delivers ———"),
  cssStart + 1
);
if (cssStart < 0 || cssEnd < 0) {
  throw new Error("Could not find experience CSS bounds: " + cssStart + " " + cssEnd);
}

let cssLast = cssEnd - 1;
while (cssLast > cssStart && lines[cssLast].trim() === "") cssLast--;

const secStart = findIndex((l) => l.includes('id="experience_fundview"'));
const secEndComment = findIndex(
  (l) => l.includes("Experience section end"),
  secStart + 1
);
let secEnd = secEndComment;
if (secEnd >= 0 && lines[secEnd + 1] && lines[secEnd + 1].includes("</section>")) {
  secEnd = secEnd + 1;
}
if (secStart < 0 || secEnd < 0) {
  throw new Error("Could not find section bounds: " + secStart + " " + secEnd);
}

const scrComment = findIndex((l) => l.includes("experience_fundview scripts"));
const scrOpen = findIndex(
  (l) => l.includes("<script") && l.includes("data-experience-fundview"),
  scrComment >= 0 ? scrComment : 0
);
const scrClose = findIndex((l) => l.trim() === "</script>", scrOpen + 1);
if (scrOpen < 0 || scrClose < 0) {
  throw new Error("Could not find script bounds: " + scrOpen + " " + scrClose);
}

const experienceCss = lines.slice(cssStart, cssLast + 1).join("\n");
const sectionHtml = lines.slice(secStart, secEnd + 1).join("\n");
const experienceScriptInner = lines.slice(scrOpen + 1, scrClose).join("\n");

const out = `<!DOCTYPE html>
<!--
  Experience FUNDVIEW — standalone working copy (SEC_ExperF_6).
  Source of truth while iterating: this file.
  When ready, copy the <section id="experience_fundview"> … </section> block
  back into home5.html (and keep CSS/JS in sync if those changed).

  Preview: http://localhost:5500/SEC_ExperF_6.html
  Built from home5.html experience CSS + markup + scripts.
-->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Experience FUNDVIEW — SEC_ExperF_6 preview</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap" rel="stylesheet" data-experience-fundview="">
  <link rel="stylesheet" href="HOME_Section_Explore FUNDVIEW2/assets_experience/tailwind-compiled.css" data-experience-fundview="">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" data-experience-fundview=""></script>

  <style>
    :root {
      --fv-navy: #0a2e57;
      --fv-navy-soft: #3a4756;
      --fv-teal: #00b7b3;
      --fv-teal-hover: #00a39f;
      --fv-cta: #f2b632;
      --fv-cta-hover: #e0a628;
      --fv-cta-text: #0a2e57;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--fv-navy-soft);
      background: #081426;
    }

    img {
      display: block;
      max-width: 100%;
    }

${experienceCss}
  </style>
</head>
<body>

${sectionHtml}

  <!-- experience_fundview scripts -->
  <script data-experience-fundview="">
${experienceScriptInner}
  </script>
</body>
</html>
`;

const outPath = path.join(ROOT, "SEC_ExperF_6.html");
fs.writeFileSync(outPath, out, "utf8");

console.log("Wrote", outPath);
console.log("CSS lines:", cssStart + 1, "–", cssLast + 1, "(" + (cssLast - cssStart + 1) + ")");
console.log("Section lines:", secStart + 1, "–", secEnd + 1, "(" + (secEnd - secStart + 1) + ")");
console.log("Script lines:", scrOpen + 2, "–", scrClose, "(" + (scrClose - scrOpen - 1) + ")");
console.log("Output bytes:", Buffer.byteLength(out, "utf8"));
console.log("Has id experience_fundview:", out.includes('id="experience_fundview"'));
console.log("Has MODULES:", out.includes("const MODULES"));
console.log("Has zoomClip:", out.includes('id="zoomClip"'));
console.log("Has demoOverlay:", out.includes('id="demoOverlay"'));
console.log("Has sideNav:", out.includes('id="sideNav"'));
console.log("Has Chart:", out.includes("chart.js"));
console.log("Has tailwind:", out.includes("tailwind-compiled.css"));
