import type { APIRoute } from 'astro';
import { renderOgImage } from '@/lib/og';

// Thai homepage's OG image — kept in sync with Layout.astro's default
// title/description (the copy actually shown when this image is used).
export const GET: APIRoute = async () => {
  const jpeg = await renderOgImage(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          fontFamily: 'IBM Plex Sans Thai',
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
                    style: { display: 'flex', flexDirection: 'column', marginTop: '16px' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 64, fontWeight: 700, color: '#ededef', lineHeight: 1.3 },
                          children: 'เครื่องคุณรัน AI',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 64, fontWeight: 700, color: '#22c55e', lineHeight: 1.3 },
                          children: 'ตัวไหนได้บ้าง?',
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 28, color: '#8a8a97', lineHeight: 1.6, marginTop: '8px' },
                    children: 'ตรวจฮาร์ดแวร์ของคุณและดูว่ารันโมเดล AI ตัวไหนได้บ้าง',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 20, color: '#56565f', marginTop: '24px' },
                    children: 'ainaidee.com — วิเคราะห์ GPU, CPU และ RAM ในเบราว์เซอร์',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    'th',
  );

  // Buffer satisfies BodyInit at runtime but not in TS lib types; wrap it.
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
