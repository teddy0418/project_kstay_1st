const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function makeSvg(size, maskable) {
  const pad = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - pad * 2;
  const rx = Math.round(inner * 0.15);
  const fontSize = Math.round(inner * 0.35);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    maskable ? `<rect width="${size}" height="${size}" fill="#171717"/>` : "",
    `<rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${rx}" fill="#171717"/>`,
    `<text x="50%" y="52%" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-weight="700" font-size="${fontSize}" fill="white">K</text>`,
    `</svg>`,
  ].join("");
}

const files = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
];

files.forEach(({ name, size, maskable }) => {
  const svgName = name.replace(".png", ".svg");
  fs.writeFileSync(path.join(dir, svgName), makeSvg(size, maskable));
  console.log("Created", svgName);
});

console.log("\nNote: These are SVG placeholders. Convert to PNG for production:");
console.log("  npx sharp-cli -i public/icons/icon-192.svg -o public/icons/icon-192.png resize 192 192");
