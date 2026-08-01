import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

let fontsCache: SatoriOptions["fonts"] | null = null;

async function loadGoogleFont(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+',
      },
    }
  ).then((r) => r.text());

  const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts: no URL found for Inter weight ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

async function getFonts() {
  if (fontsCache) return fontsCache;
  const [regular, bold] = await Promise.all([loadGoogleFont(400), loadGoogleFont(700)]);
  // `as const` keeps weight/style as satori's literal unions rather than
  // widening to number/string, which does not satisfy FontOptions.
  fontsCache = [
    { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
  ];
  return fontsCache;
}

export async function renderOgImage(element: any): Promise<Buffer> {
  const fonts = await getFonts();
  const svg = await satori(element, { width: 1200, height: 630, fonts });
  const resvg = new Resvg(svg);
  const png = Buffer.from(resvg.render().asPng());
  return sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

export function badge(label: string, color: string, bg: string, border: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '6px',
        border: `1px solid ${border}`,
        backgroundColor: bg,
        fontSize: 14,
        fontWeight: 700,
        color,
      },
      children: label,
    },
  };
}
