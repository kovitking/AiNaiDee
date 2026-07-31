# flow-banner.md — Google Flow prompts for the AiNaiDee banner

## Read this first

**Two things this banner is not.**

It is not the site's OG images. Those are generated per model at build time by satori
(`src/lib/og.ts`, `src/pages/og/[id].jpg.ts`) and should stay that way — they carry real model
data and stay correct as the catalog changes. This banner is for the places a human picks the
image: the Facebook or X page header, a launch post, a Pantip thread, a slide.

It is also not a text plate. **Do not ask Flow to render "เอไอ ไหน ดี?"** — generative models
mangle Thai script, particularly the vowel and tone marks. Generate the field, then set the
headline over it yourself in Chakra Petch. The prompts below deliberately leave empty space on
one side for exactly that.

## What it should show

The site's one memorable device is a shared ruler: every model drawn to the same scale, with a
single saffron line marking your machine's memory ceiling. Bars that stop short of the line
run; bars that cross it don't. The banner is that, made cinematic — a wall of precise
horizontal bars with one bright vertical line falling through them.

## Palette (give Flow these exact values)

| Role | Hex |
|---|---|
| Ground | `#17162B` (violet-leaning indigo, Thai คราม) |
| Raised surface | `#201F3A` |
| Bars that fit | `#57A894` (jade) |
| Bars at the limit | `#E8873C` (saffron) |
| Bars that overflow | `#C25742` (clay) |
| The limit line | `#E8873C` (saffron) |

## Still banner — prompt

Use for the OG/social card. Aspect **16:9**, then crop to 1200×630. Keep the right third quiet
so the headline can sit there.

```
A wide abstract data visualisation on a deep violet-indigo background, hex #17162B.
Roughly twenty thin horizontal bars are stacked in even rows, all starting from the same left
edge, each a different length, sorted so they form a smooth staircase from short at the top to
long at the bottom.
The shorter bars are a muted jade green, hex #57A894. The bars near the middle are saffron
orange, hex #E8873C. The longest bars at the bottom are a muted clay red, hex #C25742, and
slightly dimmer than the rest.
One single crisp vertical saffron orange line, hex #E8873C, runs from the top of the frame to
the bottom, positioned about one third from the left, cutting cleanly through every bar it
crosses.
The left half of the frame holds the bars. The right third is nearly empty negative space,
just the flat indigo background.
Flat vector aesthetic, matte surfaces, hard square corners, precise and engineered.
No gradient, no glow, no bloom, no 3D, no perspective, no texture, no lettering.
Wide cinematic 16:9 framing, calm and disciplined.
```

## Animated banner — prompt

For a launch post or the top of a landing page. Aspect **16:9**, 5–8 seconds, and it should
loop cleanly. The whole point is one orchestrated move, not constant motion.

```
A wide abstract data visualisation on a deep violet-indigo background, hex #17162B.
Twenty thin horizontal bars are stacked in even rows, all anchored to the same left edge.
The shot opens on an empty indigo field. The bars grow from zero width outward to the right,
one after another in a quick staggered cascade from top to bottom, easing to a stop so they
form a smooth staircase from short to long.
Short bars are muted jade green hex #57A894, middle bars saffron orange hex #E8873C, the
longest bars muted clay red hex #C25742.
Once the bars have settled, a single crisp vertical saffron orange line, hex #E8873C, drops
from the top of the frame to the bottom about one third from the left, and locks into place
with no bounce.
Everything then holds perfectly still.
The camera does not move at all. No zoom, no pan, no parallax, no drift.
Flat vector aesthetic, matte, hard square corners. No gradient, no glow, no bloom, no particles,
no light rays, no 3D, no lettering.
Calm, precise, instrument-like. Wide cinematic 16:9.
```

If Flow adds camera drift anyway, generate a still with the first prompt and animate the bars
and line in After Effects or CSS instead — the motion is simple enough that hand-animating it
will be cleaner and will actually loop.

## Avoid

- any lettering, Thai or Latin, and any numerals or axis labels
- brain, robot, circuit board, neural network, glowing chip, server rack, cyborg
- glow, bloom, neon, lens flare, light rays, particles, bokeh
- 3D bars, isometric charts, perspective, depth of field
- camera movement of any kind on the animated version
- teal-and-orange grading, acid green, purple-to-pink gradients
- stock "AI dashboard" look: dark navy with cyan HUD elements

## After generation

1. Set the headline over the empty right third in **Chakra Petch 500**, bone `#E9E3D4`. Keep it
   short — "เอไอ ไหน ดี?" alone, or the plain claim: **เครื่องคุณรันโมเดลไหนไหว วัดให้ดูใน 3 วินาที**.
   Never letter-space the Thai.
2. Check contrast of the headline against the indigo, and check the crop at 1200×630 — social
   platforms crop the top and bottom, so keep the line and the staircase vertically centred.
3. Export a 1:1 crop too; several Thai platforms prefer square.
