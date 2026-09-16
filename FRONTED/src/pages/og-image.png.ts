// src/pages/og-image.png.ts — Dynamic OG image generator using Satori
export const prerender = false;

import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Cache fonts in memory so we don't re-read them from disk on every request.
let cachedFonts: { regular: Buffer; semibold: Buffer } | null = null;

async function getFonts() {
  if (!cachedFonts) {
    const fontDirectory = join(process.cwd(), 'public', 'fonts');
    const [regular, semibold] = await Promise.all([
      readFile(join(fontDirectory, 'dm-sans-normal-400.ttf')),
      readFile(join(fontDirectory, 'dm-sans-normal-600.ttf')),
    ]);
    cachedFonts = { regular, semibold };
  }
  return cachedFonts;
}

function createSatoriCard(title: string, subtitle: string, tag: string) {
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 72px',
        backgroundColor: '#060503',
        backgroundImage: 'linear-gradient(135deg, #120e08 0%, #060503 70%)',
        fontFamily: 'DM Sans',
        position: 'relative',
      },
      children: [
        // Top: Brand
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundImage: 'linear-gradient(135deg, #d4a654, #e07830)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: { fontSize: '20px', fontWeight: '600', color: '#060503' },
                        children: 'G',
                      },
                    },
                  ],
                },
              },
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#d4a654',
                    letterSpacing: '0.06em',
                  },
                  children: 'GINKVORA',
                },
              },
            ],
          },
        },

        // Middle: Title
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              justifyContent: 'center',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignSelf: 'flex-start',
                    padding: '6px 16px',
                    backgroundColor: 'rgba(212,166,84,0.12)',
                    border: '1px solid rgba(212,166,84,0.3)',
                    borderRadius: '4px',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: '13px',
                          color: '#d4a654',
                          fontWeight: '600',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        },
                        children: tag,
                      },
                    },
                  ],
                },
              },
              {
                type: 'h1',
                props: {
                  style: {
                    fontSize: displayTitle.length > 40 ? '48px' : '60px',
                    fontWeight: '600',
                    color: '#f0e8d8',
                    lineHeight: '1.15',
                    margin: '0',
                  },
                  children: displayTitle,
                },
              },
              {
                type: 'p',
                props: {
                  style: {
                    fontSize: '22px',
                    color: '#9a8878',
                    margin: '0',
                    lineHeight: '1.4',
                  },
                  children: subtitle,
                },
              },
            ],
          },
        },

        // Bottom: Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(212,166,84,0.2)',
              paddingTop: '20px',
            },
            children: [
              {
                type: 'span',
                props: {
                  style: { fontSize: '16px', color: '#6a5e52' },
                  children: 'ginkvora.com',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: '12px' },
                  children: [
                    { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'ISO 9001' } },
                    { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'GMP' } },
                    { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'Halal' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const title = url.searchParams.get('title') || 'GINKVORA';
    const subtitle = url.searchParams.get('subtitle') || 'Botanical & Bioactive Ingredients for Formulators';
    const tag = url.searchParams.get('tag') || 'B2B Ingredients';

    const fonts = await getFonts();
    const fontConfig = [
      { name: 'DM Sans', data: fonts.regular, weight: 400 as const, style: 'normal' as const },
      { name: 'DM Sans', data: fonts.semibold, weight: 600 as const, style: 'normal' as const },
    ];

    let svg: string;
    try {
      // 1. Attempt rendering requested title and subtitle
      const template: any = createSatoriCard(title, subtitle, tag);
      svg = await satori(template, {
        width: 1200,
        height: 630,
        fonts: fontConfig,
      });
    } catch (renderError) {
      // 2. Fallback if requested text contains characters unsupported by DM Sans (e.g. Russian / Arabic)
      console.warn('[OG Image] Rendering with custom text failed (likely non-Latin glyphs), falling back to default brand card:', renderError);
      const fallbackTemplate: any = createSatoriCard(
        'GINKVORA',
        'Botanical & Bioactive Ingredients for Formulators',
        'B2B Ingredients'
      );
      svg = await satori(fallbackTemplate, {
        width: 1200,
        height: 630,
        fonts: fontConfig,
      });
    }

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });

    const png = resvg.render().asPng();

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[OG Image] Critical failure generating image:', error);
    return new Response('Failed to generate OG image', { status: 500 });
  }
};
