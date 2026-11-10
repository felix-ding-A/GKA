export const SITE_URL = 'https://ginkvora.com';
export const ALL_LOCALES = ['en', 'ru', 'ar', 'es'];
// Sitemaps are restricted to English ('en') to focus Googlebot crawl budget on primary high-quality content
export const LOCALES = ['en'];

export const staticPages = [
  '', 'about', 'about/mission', 'custom-formulation', 'calculator',
  'featured-formulas', 'anti-aging-philosophy', 'contact', 'quality',
  'products', 'insights', 'terms', 'privacy',
];

export function sitemapUrl(path: string, locale: string) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${SITE_URL}${prefix}${path ? `/${path}` : ''}`;
}

export function alternateLinks(path: string) {
  if (LOCALES.length <= 1) {
    return '';
  }
  return '\n    ' + [...LOCALES.map((locale) =>
    `<xhtml:link rel="alternate" hreflang="${locale}" href="${sitemapUrl(path, locale)}" />`,
  ), `<xhtml:link rel="alternate" hreflang="x-default" href="${sitemapUrl(path, 'en')}" />`]
    .join('\n    ');
}

export function xmlResponse(xml: string) {
  return new Response(xml.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
