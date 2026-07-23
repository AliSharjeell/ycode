// Copy templates/ into dist/electron/templates so the packaged build can
// find templates without depending on the repo root.
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'templates');
const dst = path.resolve(__dirname, '..', 'dist', 'electron', 'templates');

if (!fs.existsSync(src)) {
  console.warn('No templates/ folder at', src, '- skipping copy');
  process.exit(0);
}

function copyDir(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, entry.name);
    const dp = path.join(d, entry.name);
    if (entry.isDirectory()) copyDir(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
}

copyDir(src, dst);
console.log('Templates copied to', dst);
