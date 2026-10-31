import { startApi } from './api-server';

/** Starts the API on a freshly seeded SQLite database for the whole run, and stops it afterwards. */
export default async function globalSetup() {
  const api = await startApi();
  return async () => {
    api.kill();
  };
}
