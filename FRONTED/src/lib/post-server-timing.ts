const roundDuration = (duration: number) => Math.max(0, Math.round(duration));

/**
 * Records data-loading work performed when an insight-detail page is generated.
 * Cached responses retain the generation timestamp, allowing cache delivery to
 * be distinguished from a newly generated page.
 */
export function createPostServerTiming() {
  const startedAt = performance.now();

  return {
    async measure<T>(task: () => Promise<T>) {
      const queryStartedAt = performance.now();
      const value = await task();
      return {
        value,
        queryMs: roundDuration(performance.now() - queryStartedAt),
      };
    },

    finish(responseHeaders: Headers, pathname: string, postQueryMs: number) {
      const dataMs = roundDuration(performance.now() - startedAt);
      const generatedAt = new Date().toISOString();

      responseHeaders.set(
        'Server-Timing',
        `sanity;dur=${postQueryMs};desc="Sanity insight query", insight-data;dur=${dataMs};desc="Insight data preparation"`,
      );
      responseHeaders.set('X-GKV-Generated-At', generatedAt);
      responseHeaders.set('X-GKV-Insight-Generation', '1');

      console.info(JSON.stringify({
        level: 'info',
        message: 'Insight page server timing',
        path: pathname,
        sanityMs: postQueryMs,
        dataMs,
        generatedAt,
      }));
    },
  };
}
