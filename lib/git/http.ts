/**
 * isomorphic-git HTTP plugin (Node version).
 *
 * isomorphic-git expects an `@isomorphic-git/lightning-fs` http plugin, but
 * we are in Node, so we use the built-in `https` module instead.
 */
import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';

const httpPlugin = {
  async request({
    url,
    method = 'GET',
    headers = {},
    body,
  }: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: Uint8Array;
  }): Promise<{ statusCode: number; body: Uint8Array; headers: Record<string, string> }> {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
      const req = lib.request(
        {
          method,
          hostname: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
          headers,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode ?? 0,
              body: new Uint8Array(Buffer.concat(chunks)),
              headers: res.headers as Record<string, string>,
            });
          });
          res.on('error', reject);
        },
      );
      req.on('error', reject);
      if (body) {
        req.write(Buffer.from(body));
      }
      req.end();
    });
  },
};

export default httpPlugin;
