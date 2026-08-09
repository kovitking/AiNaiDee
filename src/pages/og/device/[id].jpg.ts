import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllDeviceSlugs } from '@/lib/device-slugs';
import { renderOgImage } from '@/lib/og';

export const getStaticPaths: GetStaticPaths = () =>
  getAllDeviceSlugs().map((d) => ({
    params: { id: d.slug },
    props: { deviceName: d.name },
  }));

export const GET: APIRoute = async ({ props }) => {
  const { deviceName } = props as { deviceName: string };

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
                  style: { fontSize: 58, fontWeight: 700, color: '#ededef', lineHeight: 1.15, marginTop: '10px' },
                  children: deviceName,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 26, color: '#8a8a97', lineHeight: 1.5 },
                  children: 'Which AI models can this run locally?',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, color: '#56565f', marginTop: '18px' },
                  children: 'ainaidee.com — VRAM requirements and performance estimates',
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
