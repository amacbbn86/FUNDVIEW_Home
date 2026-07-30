// Minimal static file server for FundView local preview.
// Usage: node _preview_server.js [port]
// Serves the repo root with no-store + auto-reload when HTML/CSS/JS change.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5500;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Access-Control-Allow-Origin": "*",
};

const LIVE_RELOAD_SNIPPET = `
<script data-fv-preview-live-reload>
(function () {
  if (window.__fvPreviewLiveReload) return;
  window.__fvPreviewLiveReload = true;
  var path = location.pathname || "/";
  var last = null;
  function tick() {
    fetch("/__preview_stat?path=" + encodeURIComponent(path), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || typeof j.mtime !== "number") return;
        if (last !== null && j.mtime !== last) location.reload();
        last = j.mtime;
      })
      .catch(function () {});
  }
  setInterval(tick, 700);
  tick();
})();
</script>
`;

function safeJoin(urlPath) {
  const cleaned = path.normalize(decodeURIComponent(urlPath)).replace(/^([\\/])+/, "");
  const filePath = path.join(ROOT, cleaned);
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

function send(res, code, headers, body) {
  res.writeHead(code, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const rawUrl = req.url || "/";
    const qIndex = rawUrl.indexOf("?");
    const urlPath = decodeURIComponent((qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex)) || "/");
    const query = qIndex === -1 ? "" : rawUrl.slice(qIndex + 1);

    if (urlPath === "/__preview_stat") {
      const params = new URLSearchParams(query);
      let reqPath = params.get("path") || "/";
      if (reqPath === "/") reqPath = "/OurERP_1.html";
      const filePath = safeJoin(reqPath);
      if (!filePath) return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");
      fs.stat(filePath, (err, st) => {
        if (err || !st.isFile()) {
          return send(
            res,
            200,
            { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" },
            JSON.stringify({ mtime: 0, missing: true })
          );
        }
        return send(
          res,
          200,
          { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" },
          JSON.stringify({ mtime: st.mtimeMs })
        );
      });
      return;
    }

    let reqPath = urlPath;
    if (reqPath === "/") reqPath = "/OurERP_1.html";

    const filePath = safeJoin(reqPath);
    if (!filePath) return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");

    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) {
        return send(res, 404, { "Content-Type": "text/plain" }, "404 Not Found: " + reqPath);
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";

      // HTML: read fully so we can inject live-reload (keeps preview in sync with edits).
      if (ext === ".html") {
        fs.readFile(filePath, "utf8", (readErr, html) => {
          if (readErr) return send(res, 500, { "Content-Type": "text/plain" }, "500 Server Error");
          let out = html;
          if (out.indexOf("data-fv-preview-live-reload") === -1) {
            if (/<\/body>/i.test(out)) {
              out = out.replace(/<\/body>/i, LIVE_RELOAD_SNIPPET + "</body>");
            } else {
              out += LIVE_RELOAD_SNIPPET;
            }
          }
          send(res, 200, { ...NO_STORE, "Content-Type": type }, out);
        });
        return;
      }

      res.writeHead(200, { ...NO_STORE, "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    send(res, 500, { "Content-Type": "text/plain" }, "500 Server Error");
  }
});

// Bind IPv4-compatible. Prefer http://localhost:5500/OurERP_1.html in the browser.
server.listen(PORT, "0.0.0.0", () => {
  console.log("Preview server running at http://localhost:" + PORT + "/");
  console.log("OurERP preview:         http://localhost:" + PORT + "/OurERP_1.html");
  console.log("Live reload:            on (HTML auto-refreshes when you save)");
  console.log("Serving: " + ROOT);
});
