#!/usr/bin/env node
// Strips image tags from README.md before npm pack.
// Restored by postpack via the .README.backup.md file.

const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');
const content = fs.readFileSync(readmePath, 'utf-8');

const stripped = content
  // Remove markdown images: ![alt](src)
  .replace(/!\[.*?\]\(assets\/[^)]+\)\n?/g, '')
  // Remove <picture> blocks
  .replace(/<picture>[\s\S]*?<\/picture>\n?/g, '');

fs.writeFileSync(readmePath, stripped);
