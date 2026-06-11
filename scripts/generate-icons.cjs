/* Generates icon-192.png and icon-512.png — dark deck background, brass double diamond. */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const BG = [11, 16, 28]; // #0b101c
const BRASS = [201, 169, 97]; // #c9a961

function makePng(size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  const c = size / 2;
  const outer = size * 0.32;
  const ring = size * 0.045;
  const inner = size * 0.16;
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const d = Math.abs(x - c) + Math.abs(y - c); // diamond (L1) distance
      let px = BG;
      if (d <= inner) px = BRASS;
      else if (d >= outer - ring && d <= outer + ring) px = BRASS;
      const o = y * stride + 1 + x * 4;
      raw[o] = px[0];
      raw[o + 1] = px[1];
      raw[o + 2] = px[2];
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const pub = path.join(__dirname, '..', 'public');
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(pub, `icon-${size}.png`), makePng(size));
  console.log(`wrote public/icon-${size}.png`);
}
