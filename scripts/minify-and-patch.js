'use strict';

const fs = require('fs');
const path = require('path');
const terser = require('terser');
const csso = require('csso');

async function minifyAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  const cssFiles = ['styles.css'];
  const jsFiles = ['script.js'];

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    throw new Error('Public directory not found: ' + publicDir);
  }

  // Minify CSS files
  for (const css of cssFiles) {
    const srcPath = path.join(publicDir, css);
    if (!fs.existsSync(srcPath)) {
      console.warn('[Skip CSS] Not found:', css);
      continue;
    }
    const cssContent = fs.readFileSync(srcPath, 'utf8');
    const minified = csso.minify(cssContent).css;
    const outPath = path.join(publicDir, css.replace(/\.css$/, '.min.css'));
    fs.writeFileSync(outPath, minified);
    console.log('[CSS] Minified ->', path.relative(process.cwd(), outPath));
  }

  // Minify JS files
  for (const js of jsFiles) {
    const srcPath = path.join(publicDir, js);
    if (!fs.existsSync(srcPath)) {
      console.warn('[Skip JS] Not found:', js);
      continue;
    }
    const jsContent = fs.readFileSync(srcPath, 'utf8');
    const result = await terser.minify(jsContent, {
      compress: true,
      mangle: false, // keep names for safety
      format: { comments: false }
    });
    if (!result.code) {
      throw new Error('Terser failed for ' + js);
    }
    const outPath = path.join(publicDir, js.replace(/\.js$/, '.min.js'));
    fs.writeFileSync(outPath, result.code);
    console.log('[JS] Minified ->', path.relative(process.cwd(), outPath));
  }

  // Patch HTML references to .min files
  const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // styles.css -> styles.min.css (absolute or relative)
    content = content.replace(/href=("|')\/?styles\.css\1/g, 'href=$1/styles.min.css$1');
    // preload styles.css -> styles.min.css
    content = content.replace(/href=("|')styles\.css\1/g, 'href=$1styles.min.css$1');

    // script.js -> script.min.js
    content = content.replace(/src=("|')\/?script\.js\1/g, 'src=$1/script.min.js$1');
    content = content.replace(/src=("|')script\.js\1/g, 'src=$1script.min.js$1');

    // config.js 已移除，不进行替换

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('[HTML] Patched ->', path.relative(process.cwd(), filePath));
    }
  }

  // Update Service Worker cache list and bump version
  const swPath = path.join(publicDir, 'sw.js');
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, 'utf8');
    const originalSw = sw;

    // bump cache name version
    sw = sw.replace(/const\s+CACHE_NAME\s*=\s*'(.*?)';/, "const CACHE_NAME = 'free-invoice-v2';");

    // replace cached filenames
    sw = sw.replace(/\/styles\.css/g, '/styles.min.css')
           .replace(/\/script\.js/g, '/script.min.js')
           ;

    if (sw !== originalSw) {
      fs.writeFileSync(swPath, sw);
      console.log('[SW] Updated ->', path.relative(process.cwd(), swPath));
    }
  }

  console.log('\n✅ Minify & Patch complete.');
}

minifyAssets().catch(err => {
  console.error('❌ Minify & Patch failed:', err);
  process.exit(1);
});