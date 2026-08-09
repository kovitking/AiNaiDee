import type { APIRoute, GetStaticPaths } from 'astro';
import { ALL_LICENSES, type LicenseInfo } from '@/data/licenses';
import { renderOgImage, badge } from '@/lib/og';

export const getStaticPaths: GetStaticPaths = () =>
  ALL_LICENSES.map((license) => ({
    params: { id: license.id },
    props: { license },
  }));

const TIER_COLOR: Record<LicenseInfo['tier'], string> = {
  open: '#34d399',
  partial: '#fbbf24',
  restricted: '#fb923c',
};

const TIER_LABEL: Record<LicenseInfo['tier'], string> = {
  open: 'Open',
  partial: 'Partial',
  restricted: 'Restricted',
};

export const GET: APIRoute = async ({ props }) => {
  const { license } = props as { license: LicenseInfo };
  const tierColor = TIER_COLOR[license.tier];

  const jpeg = await renderOgImage({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { width: '100%', height: '4px', backgroundColor: '#22c55e' },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '50px 60px',
              justifyContent: 'center',
              gap: '20px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '12px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: { fontSize: 28, color: '#22c55e', fontWeight: 700 },
                        children: 'AiNaiDee',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 58, fontWeight: 700, color: '#ededef', lineHeight: 1.15 },
                        children: `${license.name} License`,
                      },
                    },
                    badge(TIER_LABEL[license.tier], tierColor, `${tierColor}1a`, `${tierColor}4d`),
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 26, color: '#8a8a97', lineHeight: 1.5, maxWidth: '900px' },
                  children: license.summary,
                },
              },
            ],
          },
        },
      ],
    },
  });

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
