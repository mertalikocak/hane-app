const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create a valid PNG with gradient background and house icon shape
function createPng(width, height) {
  // Create raw RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.46; // Rounded corner radius

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Rounded rect mask
      const dx = Math.max(0, Math.abs(x - cx) - (cx - r));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - r));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > r) {
        // Transparent outside
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Background gradient: Warm Amber to Deep Orange
      const t = (x + y) / (width + height);
      let red = Math.round(245 * (1 - t) + 234 * t);
      let green = Math.round(158 * (1 - t) + 88 * t);
      let blue = Math.round(11 * (1 - t) + 12 * t);

      // House drawing inside
      const scale = width / 192;
      const hx = (x - cx) / scale;
      const hy = (y - cy) / scale;

      // Roof (triangle)
      const inRoof = hy >= -40 && hy <= 5 && Math.abs(hx) <= (5 - hy) * 1.05;
      // Body (box)
      const inBody = hy > 5 && hy <= 45 && Math.abs(hx) <= 36;
      // Door (inner cutout)
      const inDoor = hy >= 20 && hy <= 45 && Math.abs(hx) <= 12;
      // Window (small square)
      const inWindow = hy >= -10 && hy <= 5 && Math.abs(hx) <= 10;

      if ((inRoof || inBody) && !inDoor && !inWindow) {
        // White house body
        red = 255;
        green = 255;
        blue = 255;
      } else if (inDoor || inWindow) {
        // Dark cutout for door / window
        red = Math.round(red * 0.75);
        green = Math.round(green * 0.65);
        blue = Math.round(blue * 0.6);
      }

      buffer[idx] = red;
      buffer[idx + 1] = green;
      buffer[idx + 2] = blue;
      buffer[idx + 3] = 255;
    }
  }

  // Encode as uncompressed / raw deflate PNG
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    rawData[y * (rowBytes + 1)] = 0; // Filter type 0 (None)
    buffer.copy(rawData, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(len + 12);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, len + 8));
    buf.writeUInt32BE(crc, len + 8);
    return buf;
  }

  // Simple CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
const png192 = createPng(192, 192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
console.log('✓ Generated public/icon-192.png');

// Generate 512x512
const png512 = createPng(512, 512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
console.log('✓ Generated public/icon-512.png');

// Generate apple-touch-icon
const appleIcon = createPng(180, 180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('✓ Generated public/apple-touch-icon.png');
