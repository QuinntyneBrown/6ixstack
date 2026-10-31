/** Starts the API (seeded SQLite) and `ng serve` and keeps them running until Ctrl+C: npm run e2e:serve */
import { spawn } from 'node:child_process';
import { startApi } from './api-server';

async function main() {
  const api = await startApi('serve');
  const web = spawn('npx', ['ng', 'serve', 'sixstack', '--port', '4200', '--host', '0.0.0.0'], {
    stdio: 'inherit',
  });
  const stop = () => {
    api.kill();
    web.kill();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  console.log('API on http://localhost:5100, app on http://localhost:4200');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
