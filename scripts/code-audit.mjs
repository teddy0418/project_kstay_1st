import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src");

const exts = new Set([".ts", ".tsx"]);
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else {
      const ext = path.extname(ent.name);
      if (exts.has(ext)) files.push(p);
    }
  }
}
walk(srcDir);

const report = [];
report.push("# KSTAY Code Audit");
report.push("- generatedAt: " + new Date().toISOString());
report.push("- files scanned: " + files.length);
report.push("");

function countLines(s) {
  return s.split(/\r\n|\n/).length;
}

const bigFiles = [];
const anyHits = [];
const consoleHits = [];
const hexHits = [];
const imgHits = [];

for (const f of files) {
  const rel = path.relative(root, f).replaceAll("\\", "/");
  const txt = fs.readFileSync(f, "utf8");
  const lines = countLines(txt);
  if (lines >= 300) bigFiles.push({ rel, lines });

  const anyRe = /\b(as any|: any\b|any\[\]|Array<any>|\bany\b)/g;
  let m;
  while ((m = anyRe.exec(txt))) anyHits.push({ rel, idx: m.index, snippet: m[0] });

  const consRe = /\bconsole\.(log|warn|error)\b|debugger\b/g;
  while ((m = consRe.exec(txt))) consoleHits.push({ rel, idx: m.index, snippet: m[0] });

  const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
  while ((m = hexRe.exec(txt))) hexHits.push({ rel, idx: m.index, snippet: m[0] });

  const imgRe = /<img\b/g;
  while ((m = imgRe.exec(txt))) imgHits.push({ rel, idx: m.index, snippet: "<img" });
}

report.push("## 1) Files over 300 lines");
if (!bigFiles.length) report.push("- ✅ None");
else {
  for (const x of bigFiles.sort((a, b) => b.lines - a.lines).slice(0, 30)) {
    report.push("- " + x.rel + " (" + x.lines + " lines)");
  }
}
report.push("");

report.push("## 2) \"any\" usage (top 40)");
if (!anyHits.length) report.push("- ✅ None");
else {
  for (const x of anyHits.slice(0, 40)) report.push("- " + x.rel + ": " + x.snippet);
}
report.push("");

report.push("## 3) console/debugger usage (top 40)");
if (!consoleHits.length) report.push("- ✅ None");
else {
  for (const x of consoleHits.slice(0, 40)) report.push("- " + x.rel + ": " + x.snippet);
}
report.push("");

report.push("## 4) Hex colors usage (top 40)");
if (!hexHits.length) report.push("- ✅ None");
else {
  for (const x of hexHits.slice(0, 40)) report.push("- " + x.rel + ": " + x.snippet);
}
report.push("");

report.push("## 5) <img> usage (top 40)");
if (!imgHits.length) report.push("- ✅ None");
else {
  for (const x of imgHits.slice(0, 40)) report.push("- " + x.rel + ": " + x.snippet);
}
report.push("");

const checks = [
  { name: "src/app/not-found.tsx", ok: fs.existsSync(path.join(root, "src", "app", "not-found.tsx")) },
  { name: "src/app/error.tsx", ok: fs.existsSync(path.join(root, "src", "app", "error.tsx")) },
];
report.push("## 6) Robustness pages");
for (const c of checks) report.push("- " + c.name + ": " + (c.ok ? "✅ OK" : "❌ MISSING"));

report.push("");
report.push("## Next recommended steps");
report.push("- Replace 'any' with proper types in src/types and feature-level types.");
report.push("- Replace hard-coded hex colors with design tokens (tailwind.config or CSS variables).");
report.push("- Convert critical <img> to next/image when you start optimizing LCP.");
report.push("- Add not-found.tsx and error.tsx if missing.");
report.push("");

const out = path.join(root, "KSTAY_CODE_AUDIT.md");
fs.writeFileSync(out, report.join("\n"), "utf8");
console.log("✅ Wrote " + out);
