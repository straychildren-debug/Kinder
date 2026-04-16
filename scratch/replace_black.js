import fs from 'fs';
import path from 'path';

const searchDir = './src';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

const replacements = [
  { from: /border-black\/5/g, to: 'border-on-surface/5' },
  { from: /shadow-black\/10/g, to: 'shadow-on-surface/10' },
  { from: /shadow-black\/20/g, to: 'shadow-on-surface/20' },
  { from: /bg-black\/5/g, to: 'bg-on-surface/5' },
  { from: /ring-black\/5/g, to: 'ring-on-surface/5' },
  { from: /group-hover:border-black/g, to: 'group-hover:border-on-surface' },
  { from: /border-black/g, to: 'border-on-surface' },
  { from: /shadow-black/g, to: 'shadow-on-surface' }
];

walk(searchDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
