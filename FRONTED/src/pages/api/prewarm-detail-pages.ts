import type { APIRoute } from 'astro';

export const prerender = false;

const WEBHOOK_SECRET_ENV = 'VERCEL_PREWARM_WEBHOOK_SECRET';
const PROJECT_ID = 'prj_XmaLSOPPdqN12vZwCIaRHV0wcq0r';
const SITE_ORIGIN = 'https://ginkvora.com';
const MAX_CONCURRENCY = 3;

// First iteration: the English URLs with existing real-user evidence or direct
// commercial importance. Keep the warm set bounded so a deployment does not
// fan out into a full-catalog Sanity read.
const WARM_PATHS = [
  '/products/glabridin',
  '/products/pdrn',
  '/products/galactoarabinan',
  '/products/ghk-cu',
  '/insights/glabridin-complete-guide',
  '/insights/glabridin-b2b-sourcing-guide',
  '/insights/quercetin-food-sources',
  '/insights/pdrn-serum-cream-formulation-guide',
];

const json = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  },
);

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
  const expected = bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  return constantTimeEquals(expected, signature.replace(/^sha1=/i, '').trim().toLowerCase());
}

function getWarmOrigin(deploymentUrl?: string) {
  if (!deploymentUrl) return SITE_ORIGIN;

  try {
    const candidate = new URL(deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`);
    // A deployment URL bypasses Cloudflare's bot checks while remaining inside
    // this Vercel project. Reject arbitrary hosts from a webhook payload.
    return candidate.hostname.endsWith('.vercel.app') ? candidate.origin : SITE_ORIGIN;
  } catch {
    return SITE_ORIGIN;
  }
}

async function warmPath(origin: string, pathname: string) {
  const startedAt = performance.now();
  try {
    const response = await fetch(new URL(pathname, origin), {
      headers: { 'x-gkv-prewarm': '1' },
      signal: AbortSignal.timeout(20_000),
    });
    return {
      pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      pathname,
      status: 0,
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}

async function runWithConcurrency<T>(items: readonly string[], task: (item: string) => Promise<T>) {
  const results: T[] = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      results.push(await task(item));
    }
  });
  await Promise.all(workers);
  return results;
}

export const GET: APIRoute = async () => json({ ok: false, error: 'Method not allowed.' }, 405);

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env[WEBHOOK_SECRET_ENV];
  const rawBody = await request.text();
  const signature = request.headers.get('x-vercel-signature');

  if (!secret || !signature || !(await isValidSignature(rawBody, signature, secret))) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  let event: {
    type?: string;
    payload?: {
      id?: string;
      projectId?: string;
      project?: { id?: string };
      target?: string;
      url?: string;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: 'Invalid JSON.' }, 400);
  }

  // The Vercel dashboard calls the post-build event "Deployment Ready".
  // Keep the former name too so an existing webhook configuration remains
  // harmless if Vercel sends that variant.
  const isDeploymentReady = event.type === 'deployment.ready' || event.type === 'deployment.succeeded';
  const projectId = event.payload?.projectId ?? event.payload?.project?.id;
  if (!isDeploymentReady || projectId !== PROJECT_ID || event.payload?.target !== 'production') {
    console.info(JSON.stringify({
      level: 'info',
      message: 'Production detail-page prewarm skipped',
      eventType: event.type ?? null,
      projectId: projectId ?? null,
      target: event.payload?.target ?? null,
      isDeploymentReady,
    }));
    return json({ ok: true, skipped: true });
  }

  const warmOrigin = getWarmOrigin(event.payload?.url);
  const results = await runWithConcurrency(WARM_PATHS, (pathname) => warmPath(warmOrigin, pathname));
  const failed = results.filter((result) => result.status !== 200);
  console.info(JSON.stringify({
    level: failed.length ? 'warning' : 'info',
    message: 'Production detail-page prewarm complete',
    deploymentId: event.payload.id,
    warmOriginHost: new URL(warmOrigin).hostname,
    warmed: results.length,
    failed: failed.length,
    results,
  }));

  return json({ ok: failed.length === 0, warmed: results.length, failed: failed.length, results });
};
