const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.html') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('./platform');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/(href|src)="\/(platform\/[^"]+)"/g, '$1="/KalaaKart_TRIAL_1.1.1/$2"');
  content = content.replace(/'\/platform\//g, "'/KalaaKart_TRIAL_1.1.1/platform/");
  content = content.replace(/"\/platform\//g, '"/KalaaKart_TRIAL_1.1.1/platform/');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated paths in ${file}`);
  }
});
