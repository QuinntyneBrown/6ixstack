/** Serves the built Storybook (dist/storybook/components) on port 6007 for the component acceptance tests. */
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve(__dirname, '../../dist/storybook/components');
if (!existsSync(join(root, 'iframe.html')) || process.argv.includes('--build')) {
  execSync('npm run build-storybook', { cwd: resolve(__dirname, '../..'), stdio: 'inherit' });
}

const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  const path = join(root, decodeURIComponent((req.url ?? '/').split('?')[0]));
  const file = existsSync(path) && statSync(path).isFile() ? path : join(root, 'index.html');
  res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}).listen(6007, () => console.log('Storybook on http://localhost:6007'));
