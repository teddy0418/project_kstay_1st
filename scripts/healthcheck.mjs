import fs from "fs";
import path from "path";

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

const root = process.cwd();
const report = [];
const now = new Date().toISOString();

report.push(`# KSTAY Health Report`);
report.push(`- generatedAt: ${now}`);
report.push(`- cwd: ${root}`);
report.push("");

const policyPath = path.join(root, "src", "lib", "policy.ts");
const policy = read(policyPath);

function grabConst(name) {
  const re = new RegExp(`${name}\\s*=\\s*([^;\\n]+)`);
  const m = policy.match(re);
  return m ? m[1].trim() : "(not found)";
}

report.push(`## Pricing Policy`);
report.push(`- GUEST_SERVICE_FEE_RATE: ${grabConst("export const GUEST_SERVICE_FEE_RATE")}`);
report.push(`- GUEST_SERVICE_FEE_NET_RATE: ${grabConst("export const GUEST_SERVICE_FEE_NET_RATE")}`);
report.push(`- VAT_RATE: ${grabConst("export const VAT_RATE")}`);
report.push(`- DISPLAY_PRICE_INCLUDES_VAT: ${grabConst("export const DISPLAY_PRICE_INCLUDES_VAT")}`);
report.push("");

const destPath = path.join(root, "src", "lib", "destinations.ts");
const destFile = read(destPath);
const slugMatches = [...destFile.matchAll(/slug:\s*"([a-z0-9_-]+)"/g)].map((m) => m[1]);
const slugs = Array.from(new Set(slugMatches));

report.push(`## Destinations`);
report.push(`- destinations.ts found: ${exists(destPath)}`);
report.push(`- slug count: ${slugs.length}`);
report.push("");

const pubDir = path.join(root, "public", "destinations");
const exts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".JPG", ".JPEG", ".PNG", ".WEBP"];

report.push(`## public/destinations asset check`);
report.push(`- dir exists: ${exists(pubDir)} (${pubDir})`);
report.push("");

const missing = [];
for (const slug of slugs) {
  const found = exts.find((ext) => exists(path.join(pubDir, slug + ext)));
  if (!found) missing.push(slug);
  report.push(`- ${slug}: ${found ? "OK (" + slug + found + ")" : "MISSING"}`);
}

report.push("");
if (missing.length) {
  report.push(`Fix: add files like public/destinations/{slug}.jpg`);
  report.push(`Missing slugs: ${missing.join(", ")}`);
} else {
  report.push(`All destination images look good.`);
}

const outPath = path.join(root, "KSTAY_HEALTH_REPORT.md");
fs.writeFileSync(outPath, report.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
