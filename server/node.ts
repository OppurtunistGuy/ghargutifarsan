// Node http <-> fetch Request/Response, shared by the Vercel function and the
// local dev server so both run the exact same handler.

import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_BODY = 1_000_000;

export async function toRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const headers = new Headers();
  for (let i = 0; i + 1 < req.rawHeaders.length; i += 2) headers.append(req.rawHeaders[i] ?? '', req.rawHeaders[i + 1] ?? '');
  const method = req.method ?? 'GET';
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY) throw new Error('body too large');
      chunks.push(chunk as Buffer);
    }
    body = new Uint8Array(Buffer.concat(chunks));
  }
  return new Request(new URL(req.url ?? '/', origin), { method, headers, body });
}

export async function sendResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export function nodeHandler(handle: (req: Request) => Promise<Response>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await sendResponse(res, await handle(await toRequest(req, `https://${req.headers.host ?? 'localhost'}`)));
    } catch (err) {
      console.error('request failed', err);
      res.statusCode = 400;
      res.end('bad request');
    }
  };
}
