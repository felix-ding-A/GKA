type ProductTimingMetric = 'sanity' | 'related';

const roundDuration = (duration: number) => Math.max(0, Math.round(duration));

/**
 * Records only server-side page generation work. When an ISR/CDN cache serves a
 * page, this module does not run; the persisted X-GKV-Generated-At value then
 * identifies the generation that produced the cached response.
 */
export function createProductServerTiming() {
  const startedAt = performance.now();
  const durations = new Map<ProductTimingMetric, number>();

  return {
    async measure<T>(metric: ProductTimingMetric, task: () => Promise<T>) {
      const metricStartedAt = performance.now();
      try {
        return await task();
      } finally {
        durations.set(metric, roundDuration(performance.now() - metricStartedAt));
      }
    },

    finish(responseHeaders: Headers, pathname: string) {
      const sanityMs = durations.get('sanity') ?? 0;
      const relatedMs = durations.get('related') ?? 0;
      const dataMs = roundDuration(performance.now() - startedAt);
      const generatedAt = new Date().toISOString();

      responseHeaders.set(
        'Server-Timing',
        `sanity;dur=${sanityMs};desc="Sanity product query", related;dur=${relatedMs};desc="Related content queries", product-data;dur=${dataMs};desc="Product data preparation"`,
      );
      responseHeaders.set('X-GKV-Generated-At', generatedAt);
      responseHeaders.set('X-GKV-Product-Generation', '1');

      // This structured event appears only for a render/generation, not for a
      // pure edge cache hit. It is intentionally limited to public route and
      // duration data, with no visitor identifiers or request payload.
      console.info(JSON.stringify({
        level: 'info',
        message: 'Product page server timing',
        path: pathname,
        sanityMs,
        relatedMs,
        dataMs,
        generatedAt,
      }));
    },
  };
}
