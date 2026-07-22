/**
 * isomorphic-git HTTP plugin (Node version).
 *
 * isomorphic-git wants an HTTP plugin that returns a body compatible with
 * its `GitHttpRequest` shape. We use Node's built-in `https`/`http` and
 * adapt the response to async-iterable chunks, which is what isomorphic-git
 * consumes to stream large pack responses.
 */
import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';

interface HttpResponse {
  statusCode: number;
  body: AsyncIterableIterator<Uint8Array>;
  headers: Record<string, string>;
}

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
    body?: any;
  }): Promise<any> {
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
          resolve({
            url,
            statusCode: res.statusCode ?? 0,
            statusMessage: res.statusMessage ?? '',
            body: (async function* () {
              for await (const chunk of res) {
                yield chunk as Uint8Array;
              }
            })(),
            headers: res.headers as Record<string, string>,
          });
        },
      );
      req.on('error', reject);
      if (body) {
        if (typeof body[Symbol.asyncIterator] === 'function') {
          (async () => {
            for await (const chunk of body) {
              req.write(chunk);
            }
            req.end();
          })();
        } else {
          req.write(Buffer.from(body));
          req.end();
        }
      } else {
        req.end();
      }
    });
  },
};

export default httpPlugin;
export type { HttpResponse };
