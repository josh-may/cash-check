const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [16, 32, 96, 128, 192, 512];
const outputDir = path.join(__dirname, "../public/favicons");

async function generateFavicons() {
  const svg = fs.readFileSync(path.join(outputDir, "favicon.svg"));
  // Render on the original pixel grid, then scale without smoothing.
  const pixels = await sharp(svg).resize(16, 16).png().toBuffer();
  const iconImages = [];

  for (const size of sizes) {
    const png = await sharp(pixels)
      .resize(size, size, { kernel: "nearest" })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outputDir, `favicon-${size}.png`), png);
    if (size <= 32) iconImages.push({ size, png });
  }

  await sharp(pixels)
    .resize(180, 180, { kernel: "nearest" })
    .png()
    .toFile(path.join(outputDir, "apple-touch-icon.png"));

  // ICO directory containing PNG images for both common browser tab sizes.
  const header = Buffer.alloc(6 + 16 * iconImages.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(iconImages.length, 4);
  let offset = header.length;
  iconImages.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  fs.writeFileSync(
    path.join(outputDir, "favicon.ico"),
    Buffer.concat([header, ...iconImages.map(({ png }) => png)])
  );
  fs.writeFileSync(path.join(__dirname, "../landing/icon.svg"), svg);
  console.log("Generated pixel favicons and landing icon.");
}

generateFavicons().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
