import type { APIRoute } from 'astro';
import { renderOgImage } from '@/lib/og';

const TIERS: { letter: string; color: string }[] = [
  { letter: 'S', color: '#22c55e' },
  { letter: 'A', color: '#4ade80' },
  { letter: 'B', color: '#a3e635' },
  { letter: 'C', color: '#f59e0b' },
  { letter: 'D', color: '#f97316' },
  { letter: 'F', color: '#ef4444' },
];

export const GET: APIRoute = async () => {
  const tierChips = TIERS.map(({ letter, color }) => ({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        borderRadius: '10px',
        border: `2px solid ${color}`,
        backgroundColor: `${color}1a`,
        fontSize: 32,
        fontWeight: 700,
        color,
      },
      children: letter,
    },
  }));

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
                  style: { fontSize: 64, fontWeight: 700, color: '#ededef', marginTop: '10px' },
                  children: 'Tier List',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 26, color: '#8a8a97', lineHeight: 1.5 },
                  children: 'Every AI model, ranked by whether your hardware can run it.',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: '12px', marginTop: '18px' },
                  children: tierChips,
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
