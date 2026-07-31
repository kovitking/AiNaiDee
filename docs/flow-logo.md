# flow-logo.md — Google Flow prompts for the AiNaiDee logo mark

## Read this first

**Generate the symbol only. Do not ask Flow for the words.** Generative image models
render Thai script badly — "เอไอ ไหน ดี?" will come back with broken or invented glyphs, and
the vowel and tone marks land in the wrong places. Set the wordmark yourself in **Chakra Petch
700**, which the project already ships (`@fontsource/chakra-petch`), and lock it up next to the
generated mark.

So the job here is one abstract mark that survives at 16 px.

## The mark

The product is one idea: your machine has a ceiling, and each model either fits under it or
doesn't. The whole interface is a bar measured against a line. That is the logo.

**A horizontal bone-coloured measure bar, cut by a single vertical saffron line at roughly
two-thirds along its length.** The bar continues past the line, but dimmer. Nothing else.

It reads as a threshold, a ruler, a limit — and it is literally the page's own device shrunk to
a glyph. At favicon size it stays legible because it is two rectangles and a stroke.

## Palette (give Flow these exact values)

| Role | Hex |
|---|---|
| Background | `#17162B` (violet-leaning indigo, Thai คราม) |
| Bar, the part that fits | `#E9E3D4` (warm bone) |
| Bar, the part past the limit | `#C25742` (clay) |
| The limit line | `#E8873C` (saffron) |

## Primary prompt

```
A minimal geometric logo mark on a deep violet-indigo background, hex #17162B.
One horizontal bar with hard square corners runs across the centre of the frame.
The left two-thirds of the bar is a warm bone off-white, hex #E9E3D4, solid and matte.
A single thin vertical line in saffron orange, hex #E8873C, crosses the bar cleanly at the
two-thirds point and extends slightly above and below it.
The remaining third of the bar, to the right of the orange line, is a muted clay red,
hex #C25742, and sits slightly darker.
Flat vector aesthetic, absolutely no gradient, no bevel, no drop shadow, no glow, no texture.
Precise, engineered, instrument-like. Generous empty space around the mark.
Centred, symmetrical framing, square 1:1.
```

Aspect: **1:1**. Ask for several variations and keep the one with the cleanest corners.

## Alternate concepts, if the primary feels too plain

**A — the stacked measure.** Closer to the real interface, more distinctive, slightly busier.

```
A minimal geometric logo mark on a deep violet-indigo background, hex #17162B.
Three horizontal bars of different lengths are stacked with even spacing, left-aligned.
The top bar is short, the middle bar medium, the bottom bar long.
The two shorter bars are a warm bone off-white, hex #E9E3D4.
A single thin vertical saffron orange line, hex #E8873C, runs down through all three bars at a
fixed position. The bottom bar is the only one that crosses past the orange line, and the part
past it is muted clay red, hex #C25742.
Flat vector, hard square corners, no gradient, no shadow, no glow, no texture.
Centred, square 1:1, generous margins.
```

**B — the question, built from the measure.** Ties to the name, which is a question. Riskier at
small sizes; try it, but judge it at 16 px before committing.

```
A minimal geometric logo mark on a deep violet-indigo background, hex #17162B.
An abstract question mark constructed entirely from short horizontal bars of varying length,
stacked like a bar chart, in warm bone off-white hex #E9E3D4.
A single thin vertical saffron orange line, hex #E8873C, cuts through the stack.
Flat vector, hard square corners, no outline, no gradient, no shadow, no glow.
Centred, square 1:1, generous margins.
```

## Avoid

Put these in the negative prompt or repeat them as "no …" in the prompt body:

- any lettering, Thai or Latin, and any numerals
- brain, robot, circuit board, neural network, chip, cyborg — the entire AI-cliché set
- gradients, glow, neon, lens flare, bloom, 3D render, glassmorphism
- rounded corners, drop shadows, outlines, bevels
- gauge needles, speedometers, dials (too literal, and they read as automotive)
- teal-and-orange, acid green, purple-to-pink — none of these are our palette

## After generation

1. Redraw it as SVG rather than shipping the raster. The mark is two rectangles and a line, so
   tracing it by hand takes minutes and gives crisp edges at every size.
2. Lock up the wordmark: mark on the left, **เอไอ ไหน ดี?** in Chakra Petch 700 to the right,
   with `AiNaiDee` in IBM Plex Mono uppercase, letter-spaced, underneath or trailing.
   Never letter-space the Thai — it smears the vowel and tone marks.
3. Export a monochrome bone-on-transparent version for places the indigo ground is unavailable.
4. Check it at 16 px. If the saffron line disappears, thicken it and move it closer to centre.
