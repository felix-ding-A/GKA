import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';

export const prerender = false;

const MAX_BODY_BYTES = 1_000_000;
const SIGNATURE_HEADER = 'x-vercel-signature';
const DRAIN_SECRET_ENV = 'VERCEL_SPEED_INSIGHTS_DRAIN_SECRET';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function isValidSignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const expected = bytesToHex(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)),
  );
  const supplied = signature.replace(/^sha1=/i, '').trim().toLowerCase();
  return constantTimeEquals(expected, supplied);
}

function isValidPayload(payload: unknown): payload is Record<string, unknown>[] {
  return Array.isArray(payload)
    && payload.length > 0
    && payload.every((event) => event && typeof event === 'object' && !Array.isArray(event));
}

export const GET: APIRoute = async () =>
  json({ ok: false, error: 'Method not allowed.' }, 405);

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env[ DRAIN_SECRET_ENV ];
  const blobToken = import.meta.env.BLOB_READ_WRITE_TOKEN;
  const blobStoreId = import.meta.env.BLOB_STORE_ID;

  if (!secret || (!blobToken && !blobStoreId)) {
    console.error('[Speed Insights Drain] Missing drain secret or Blob credentials.');
    return json({ ok: false, error: 'Drain storage is not configured.' }, 503);
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Payload is too large.' }, 413);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Payload is too large.' }, 413);
  }

  const signature = request.headers.get(SIGNATURE_HEADER);
  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    console.warn('[Speed Insights Drain] Rejected a request with an invalid signature.');
    return json({ ok: false, error: 'Invalid signature.' }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
  }

  if (!isValidPayload(payload)) {
    return json({ ok: false, error: 'Expected a non-empty JSON event array.' }, 422);
  }

  const receivedAt = new Date();
  const key = [
    'speed-insights',
    String(receivedAt.getUTCFullYear()),
    String(receivedAt.getUTCMonth() + 1).padStart(2, '0'),
    String(receivedAt.getUTCDate()).padStart(2, '0'),
    `${receivedAt.toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`,
  ].join('/');

  try {
    await put(key, JSON.stringify({ receivedAt: receivedAt.toISOString(), events: payload }), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
      // New Vercel Blob stores authenticate through the deployment's short-lived
      // OIDC credential plus BLOB_STORE_ID. Older stores still use this token.
      ...(blobToken ? { token: blobToken } : {}),
    });
  } catch (error) {
    console.error('[Speed Insights Drain] Unable to persist signed events.', error);
    return json({ ok: false, error: 'Unable to persist drain payload.' }, 502);
  }

  console.info(`[Speed Insights Drain] Persisted ${payload.length} signed event(s).`);
  return json({ ok: true, received: payload.length }, 202);
};
