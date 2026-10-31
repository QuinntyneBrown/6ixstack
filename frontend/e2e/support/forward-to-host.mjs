// Inside the Linux baseline container, serves localhost:4200 and localhost:6007 from the host's servers, so the
// app runs on localhost there too (Chromium keeps Secure cookies only on HTTPS or localhost).
import net from 'node:net';

for (const port of [4200, 6007]) {
  net
    .createServer((client) => {
      const upstream = net.connect(port, 'host.docker.internal');
      client.pipe(upstream).pipe(client);
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
    })
    .listen(port, '127.0.0.1');
}
