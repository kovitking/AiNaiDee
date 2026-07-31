# AiNaiDee — design direction

Proposal built at `/design` (`src/pages/design.astro`). Standalone: it does not import
`Layout.astro`, so it cannot collide with the upstream stylesheet while the direction is
being decided.

## Brief

Subject: AiNaiDee.com, a Thai tool for finding which open-weight LLMs your machine can run.
Audience: Thai PC owners — developers, but explicitly also non-experts (`docs/idea.md`).
Job of the page: answer the question in the domain name, immediately, for *your* machine.

## What this departs from

Upstream canirun.ai is light background, monospace everywhere, green accent, English,
centered marketing headline, dense table. That reads as a developer terminal tool. The fork's
audience is wider, so the identity here reads as an instrument anyone can read.

## Tokens

Color — คราม (Thai indigo) ground rather than navy, bone rather than white, saffron used once.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#17162B` | violet-leaning indigo ground |
| `--raised` | `#201F3A` | tracks and panels |
| `--bone` | `#E9E3D4` | text, capacity bar |
| `--saffron` | `#E8873C` | the limit line — the only hot accent |
| `--jade` | `#57A894` | fits |
| `--clay` | `#C25742` | does not fit |

Type — both Thai faces are by Cadson Demak, a Thai foundry, so the pairing is native.

- Display: **Chakra Petch** 500/700 — angular, machined. Headline and wordmark only.
- Body: **IBM Plex Sans Thai** 400/600 — humanist, legible for the non-expert copy.
- Data: **IBM Plex Mono** 400/500 — figures only.

Upstream set *everything* in mono, which is the dev-tool tell. Mono here is numbers only.

Thai typography note: do not apply Latin letter-spacing or `text-transform: uppercase` to Thai
runs — tracking smears the mark clusters and uppercase does nothing. `.ad-eyebrow` and
`.ad-verdict-machine` both had to drop it once they carried Thai strings.

## Signature: one ruler down the whole page

Every model bar is drawn on the same 0–48 GB scale as the hero capacity bar, and a single
saffron limit line sits at the machine's memory ceiling and runs unbroken through every row.
The answer becomes spatial: everything stopping short of the line runs, everything crossing
it does not.

The one elaboration that earns its complexity: for models that fit only by spilling into
system RAM, the bar splits at the limit line — saffron for the part that fits in VRAM, clay
for the part that spills. CPU offload made literal. The split is computed as `usable / need`
of the bar's own width, which lands exactly on the limit line.

## Risk taken

No marketing `<h1>`. The page opens with the reading, and the `<h1>` is the answer itself
("รันได้ลื่น N จาก M โมเดลที่วัดไว้"). The domain is already the question; restating it in
the hero spends the best space on words the visitor has already agreed with.

## Deliberately cut

No gradients, no glow, no ambient background motion, no 01/02/03 numbering (the content is
not a sequence). Motion is one orchestrated moment: bars grow and the limit line lands on
load, disabled under `prefers-reduced-motion`.

## Honesty fix worth keeping

A CPU-only machine first reported "รันได้ 0", which is false — small models run on CPU, just
slowly. The headline now counts only models that run properly, with a second line for the
ones that run via RAM offload.

## Still open

- Applying the direction to the real home page (`ModelListContent.astro`, ~80 KB) and
  `Layout.astro`.
- Thai/SEA models (Typhoon, OpenThaiGPT, SeaLLM, WangchanX) — not yet in the catalog.
- The fine-tuning/LoRA feasibility mode from `docs/idea.md`.
- Blog.
