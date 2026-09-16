import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const url = new URL(context.request.url);
  const isApi = url.pathname.startsWith('/api/');
  const isCacheableSearch = context.request.method === 'GET' && url.pathname === '/api/search';

  // Search responses contain only public, published CMS fields. Preserve the
  // endpoint's bounded CDN cache instead of applying the private API policy.
  if (isCacheableSearch) {
    return response;
  }

  // Other API responses may contain validation outcomes or webhook results. They must
  // never be stored by a browser, Cloudflare, or Vercel's CDN.
  if (isApi) {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const isHtml = response.headers.get('content-type')?.includes('text/html');
  const isGet = context.request.method === 'GET';

  if (isGet && isHtml) {
    const isPersonalizedPage = /^(?:\/(?:ar|es|ru))?\/(?:contact|thank-you)$/.test(url.pathname);
    const isDetailPage = /^(?:\/(?:ar|es|ru))?\/(?:products|insights)\/[^/]+$/.test(url.pathname);

    if (isPersonalizedPage) {
      response.headers.set('Cache-Control', 'private, no-store');
    } else if (isDetailPage) {
      // Keep Astro/Vercel's ISR Cache-Control intact while allowing Cloudflare,
      // when its narrow detail-page cache rule is enabled, to retain successful
      // HTML for five minutes. Explicitly reject non-200 responses so a missing
      // CMS document can never become a cached Cloudflare 404.
      response.headers.set(
        'Cloudflare-CDN-Cache-Control',
        response.status === 200
          ? 'public, max-age=300, stale-while-revalidate=60'
          : 'no-store'
      );
    } else if (!isDetailPage) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400');
    }

    return response;
  }

  return response;
});
