// One-shot: pull the most recent N base64-encoded user-attached images
// out of the current Claude Code session jsonl and write them to disk.
//
// Usage: node scripts/extract-recent-images.mjs <jsonl> <outDir> [count]

import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

const [, , jsonlPath, outDirArg, countArg] = process.argv;
if (!jsonlPath || !outDirArg) {
  console.error('Usage: node extract-recent-images.mjs <jsonl> <outDir> [count]');
  process.exit(1);
}
const count = countArg ? parseInt(countArg, 10) : 2;
const outDir = path.resolve(outDirArg);
fs.mkdirSync(outDir, { recursive: true });

// Slurp the file and pull images. The jsonl can be huge — scan line by line.
const images = []; // { mime, dataB64, lineIndex }
const rl = readline.createInterface({
  input: fs.createReadStream(jsonlPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

let lineIndex = 0;
for await (const line of rl) {
  lineIndex++;
  if (!line.includes('"image"') || !line.includes('"base64"')) continue;
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    continue;
  }
  // Walk for any { type: 'image', source: { type: 'base64', media_type, data } }
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const it of node) visit(it);
      return;
    }
    if (
      node.type === 'image' &&
      node.source &&
      node.source.type === 'base64' &&
      typeof node.source.data === 'string'
    ) {
      images.push({
        mime: node.source.media_type || 'image/png',
        dataB64: node.source.data,
        lineIndex,
      });
    }
    for (const k of Object.keys(node)) visit(node[k]);
  };
  visit(parsed);
}

// Take the last `count` images, in original chronological order.
const last = images.slice(-count);
console.log(`Found ${images.length} image(s) total; writing last ${last.length}.`);

last.forEach((img, i) => {
  const ext = img.mime === 'image/png' ? 'png'
    : img.mime === 'image/jpeg' ? 'jpg'
    : img.mime === 'image/webp' ? 'webp'
    : 'bin';
  const name = `recent-${i + 1}.${ext}`;
  const filePath = path.join(outDir, name);
  fs.writeFileSync(filePath, Buffer.from(img.dataB64, 'base64'));
  const stat = fs.statSync(filePath);
  console.log(`  ${name}  (${img.mime}, ${stat.size} bytes, from line ${img.lineIndex})`);
});
