// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://ginkvora.com',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({
    includeFiles: [
      'public/fonts/dm-sans-normal-400.ttf',
      'public/fonts/dm-sans-normal-600.ttf',
    ],
    isr: {
      // Detail pages are generated on demand and refreshed through the signed
      // Sanity webhook. Keep listing, utility, and API routes out of ISR.
      // Sanity's signed webhook performs the actual refresh. Avoid periodic
      // full-page rewrites that consume ISR Write Units even when content did
      // not change.
      expiration: false,
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      exclude: [
        '/products', '/es/products', '/ru/products', '/ar/products',
        '/insights', '/es/insights', '/ru/insights', '/ar/insights',
        '/contact', '/es/contact', '/ru/contact', '/ar/contact',
        '/thank-you', '/es/thank-you', '/ru/thank-you', '/ar/thank-you',
        '/404',
        '/sitemap.xml', '/sitemap-index.xml', '/sitemap-static.xml',
        '/sitemap-products.xml', '/sitemap-posts.xml',
        '/og-image.png',
        /^\/api\/.+/,
      ],
    },
  }),

  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },

  integrations: [
    vue(),
    mdx(),
  ],

  // i18n routing
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'ar', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Image optimization
  image: {
    domains: ['cdn.sanity.io'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },

  // Vite config — Tailwind 4 uses Vite plugin
  vite: {
    plugins: [tailwindcss()],
    build: {
      modulePreload: {
        polyfill: true
      }
    },
    optimizeDeps: {
      include: ['vue'],
    },
    ssr: {
      external: ['@resvg/resvg-js', 'sharp'],
    },
  },
});
