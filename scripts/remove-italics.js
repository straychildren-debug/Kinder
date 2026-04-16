const fs = require('fs');
const path = require('path');

function walk(dir) {
    let files = fs.readdirSync(dir);
    files.forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walk(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/\bitalic\b/g, '');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log('Updated:', fullPath);
            }
        }
    });
}

walk('src');
console.log('Finished removing italics.');
