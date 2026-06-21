const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "..", "rajlaxmi-homepage (1).html");
const outDir = path.join(__dirname, "..", "public", "images", "legacy");

if (!fs.existsSync(htmlPath)) {
  console.error("HTML file not found:");
  console.error(htmlPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(htmlPath, "utf8");

const regex = /IMGS\["([^"]+)"\]\s*=\s*"(data:image\/[^;]+;base64,[^"]+)"/g;

function detectExtension(buffer, mime) {
  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") return "webp";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "GIF") {
    return "gif";
  }

  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";

  return "bin";
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

let match;
let count = 0;
const map = {};

while ((match = regex.exec(html)) !== null) {
  const key = safeName(match[1]);
  const dataUrl = match[2];

  const [meta, base64] = dataUrl.split(",");
  const mime = meta.replace("data:", "").replace(";base64", "");
  const buffer = Buffer.from(base64, "base64");
  const ext = detectExtension(buffer, mime);

  const filename = `${key}.${ext}`;
  const filePath = path.join(outDir, filename);

  fs.writeFileSync(filePath, buffer);

  map[key] = `/images/legacy/${filename}`;
  count++;
}

fs.writeFileSync(
  path.join(outDir, "images.json"),
  JSON.stringify(map, null, 2)
);

console.log(`Done. Extracted ${count} images.`);
console.log(`Saved in: ${outDir}`);
console.log("Image map saved as: public/images/legacy/images.json");