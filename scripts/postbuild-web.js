const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('[postbuild-web] dist/index.html not found.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const routes = ['apresentacao', 'slides'];

for (const route of routes) {
  // 1. dist/<route>.html
  const flatFile = path.join(distDir, `${route}.html`);
  fs.writeFileSync(flatFile, indexHtml, 'utf8');

  // 2. dist/<route>/index.html
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml, 'utf8');
}

// 3. Fallback SPA dist/404.html
fs.writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf8');

console.log('[postbuild-web] Generated static SPA entrypoints for /apresentacao, /slides and 404.html');
