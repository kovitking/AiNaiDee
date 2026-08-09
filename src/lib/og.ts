import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

// OG copy is Thai on the default (Thai) homepage, so its font needs real Thai
// glyph coverage — Inter has none. IBM Plex Sans Thai is already this site's
// Thai body font (see design.astro/playground.astro), so reuse it here too
// rather than introducing a third typeface just for OG images.
type OgLang = "th" | "en";
const OG_FONT_FAMILY: Record<OgLang, string> = { th: "IBM Plex Sans Thai", en: "Inter" };

const fontsCache: Partial<Record<OgLang, SatoriOptions["fonts"]>> = {};

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+',
      },
    }
  ).then((r) => r.text());

  const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts: no URL found for ${family} weight ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

async function getFonts(lang: OgLang) {
  const cached = fontsCache[lang];
  if (cached) return cached;
  const family = OG_FONT_FAMILY[lang];
  const [regular, bold] = await Promise.all([
    loadGoogleFont(family, 400),
    loadGoogleFont(family, 700),
  ]);
  // `as const` keeps weight/style as satori's literal unions rather than
  // widening to number/string, which does not satisfy FontOptions.
  const fonts: SatoriOptions["fonts"] = [
    { name: family, data: regular, weight: 400 as const, style: 'normal' as const },
    { name: family, data: bold, weight: 700 as const, style: 'normal' as const },
  ];
  fontsCache[lang] = fonts;
  return fonts;
}

export async function renderOgImage(element: any, lang: OgLang = "en"): Promise<Buffer> {
  const fonts = await getFonts(lang);
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
