import type { APIRoute } from 'astro';
import { get, list } from '@vercel/blob';

export const prerender = false;

const REPORT_SECRET_ENV = 'SPEED_INSIGHTS_REPORT_SECRET';
const MAX_BATCHES = 200;
const MAX_EVENTS = 50_000;
const SLOW_TTFB_MS = 1_800;
const MAX_SLOW_TTFB_EVENTS = 100;
const MAX_MATCHED_METRIC_EVENTS = 100;

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

function percentile75(values: number[]) {
  if (!values.length) return null;
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * 0.75) - 1];
}

type SpeedEvent = {
  timestamp?: string;
  metricType?: string;
  value?: number;
  path?: string;
};

function isSpeedEvent(value: unknown): value is SpeedEvent {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env[REPORT_SECRET_ENV];
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!secret || !supplied || !constantTimeEquals(secret, supplied)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  const days = Math.max(1, Math.min(30, Number(new URL(request.url).searchParams.get('days') || 7)));
  const requestUrl = new URL(request.url);
  const pathFilter = requestUrl.searchParams.get('path')?.trim() || null;
  const metricTypeFilter = requestUrl.searchParams.get('metricType')?.trim() || null;
  const after = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const { blobs } = await list({ prefix: 'speed-insights/', limit: MAX_BATCHES });
    const candidates = blobs
      .filter((blob) => blob.uploadedAt.getTime() >= after)
      .sort((left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime())
      .slice(0, MAX_BATCHES);

    const payloads = await Promise.all(candidates.map(async (blob) => {
      const result = await get(blob.url, { access: 'private', useCache: true });
      if (!result || result.statusCode !== 200) return [];
      const parsed = JSON.parse(await new Response(result.stream).text()) as { events?: unknown };
      return Array.isArray(parsed.events) ? parsed.events : [];
    }));

    const valuesByPathAndMetric = new Map<string, number[]>();
    const slowTtfbEvents: Array<{ timestamp: string | null; path: string; valueMs: number }> = [];
    const matchedMetricEvents: Array<{
      timestamp: string | null;
      path: string;
      metricType: string;
      value: number;
    }> = [];
    let eventCount = 0;

    for (const payload of payloads) {
      for (const event of payload) {
        if (!isSpeedEvent(event) || typeof event.value !== 'number' || !event.metricType || !event.path) continue;
        if (eventCount >= MAX_EVENTS) break;
        const timestamp = Date.parse(event.timestamp || '');
        if (Number.isFinite(timestamp) && timestamp < after) continue;
        const key = `${event.path}\u0000${event.metricType}`;
        const values = valuesByPathAndMetric.get(key) || [];
        values.push(event.value);
        valuesByPathAndMetric.set(key, values);
        if (pathFilter && event.path === pathFilter && (!metricTypeFilter || event.metricType === metricTypeFilter)
          && matchedMetricEvents.length < MAX_MATCHED_METRIC_EVENTS) {
          matchedMetricEvents.push({
            timestamp: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
            path: event.path,
            metricType: event.metricType,
            value: event.value,
          });
        }
        if (event.metricType === 'TTFB' && event.value > SLOW_TTFB_MS && slowTtfbEvents.length < MAX_SLOW_TTFB_EVENTS) {
          slowTtfbEvents.push({
            timestamp: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
            path: event.path,
            valueMs: event.value,
          });
        }
        eventCount += 1;
      }
    }

    const metrics = [...valuesByPathAndMetric.entries()]
      .map(([key, values]) => {
        const [path, metricType] = key.split('\u0000');
        return { path, metricType, samples: values.length, p75: percentile75(values) };
      })
      .sort((left, right) => right.samples - left.samples || left.path.localeCompare(right.path));

    return json({
      ok: true,
      periodDays: days,
      batchesRead: candidates.length,
      metricEventsRead: eventCount,
      metricUnit: 'milliseconds except CLS',
      metrics,
      slowTtfbEvents: slowTtfbEvents.sort((left, right) => right.valueMs - left.valueMs),
      ...(pathFilter ? {
        matchedMetricEvents: matchedMetricEvents.sort((left, right) =>
          (right.timestamp || '').localeCompare(left.timestamp || '')),
      } : {}),
      limitations: [
        'Speed Insights Drain exports normalized path values, not URL query strings.',
        'This report contains only aggregated metric values; no device IDs or visitor identifiers are returned.',
      ],
    });
  } catch (error) {
    console.error('[Speed Insights Report] Unable to read private drain batches.', error);
    return json({ ok: false, error: 'Unable to read Speed Insights data.' }, 502);
  }
};
