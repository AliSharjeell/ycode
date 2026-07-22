/**
 * In-app preview server.
 *
 * Boots a tiny HTTP server that serves the project's out/ folder so the
 * editor can preview the built site in a <webview> or a popped-out window.
 * Listens on a random free port on localhost.
 */
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as net from 'node:net';

export class PreviewServer {
  private server: http.Server | null = null;
  private url: string | null = null;

  async start(projectPath: string): Promise<string> {
    await this.stop();
    const outDir = path.join(projectPath, 'out');
    if (!fs.existsSync(outDir)) {
      throw new Error('No built site found. Click "Build Site" first.');
    }

    const port = await freePort();
    this.server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/index.html';
      const file = path.join(outDir, pathname);
      if (!file.startsWith(outDir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        const html = path.join(outDir, '404.html');
        if (fs.existsSync(html)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(html).pipe(res);
          return;
        }
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', contentType(file));
      fs.createReadStream(file).pipe(res);
    });

    await new Promise<void>((resolve) => this.server!.listen(port, '127.0.0.1', resolve));
    this.url = `http://localhost:${port}`;
    return this.url;
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
      this.server = null;
      this.url = null;
    }
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr !== null) {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Could not get free port'));
      }
    });
  });
}

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    case '.json':
      return 'application/json';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    case '.otf':
      return 'font/otf';
    case '.xml':
      return 'application/xml';
    case '.txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}
