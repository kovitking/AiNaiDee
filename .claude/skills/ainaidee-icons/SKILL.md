---
name: ainaidee-icons
description: Add or change icons and brand marks on AiNaiDee — pulling glyphs from Google Material Symbols, matching the existing stroke set, and avoiding the SVG traps specific to this Astro + Tailwind setup. Use when a task involves icons, logos, or visual design work in src/icons, src/components, or the model list UI.
---

# Icons and brand marks on AiNaiDee

Two separate icon systems live in this repo. Do not mix them up.

| | Where | Style | Source |
|---|---|---|---|
| **UI icons** | `src/icons/*.svg` (34) | stroke, `stroke-width="2"`, `viewBox="0 0 24 24"` | hand-picked, Feather/Lucide-like |
| **Brand marks** | `src/icons/companies/*.svg` (20) | filled, official brand art, varied viewBox | upstream `midudev/canirun.ai` |

Brand marks are rendered through `src/components/ProviderLogo.astro`, never imported directly.
Adding a company means adding to that component's `LOGOS` map — see `CLAUDE.md` for why its CSS has
to live inside that component.

## Adding a UI icon

Icons come from **Google Material Symbols** (`google/material-design-icons`, **Apache 2.0** — no
attribution required in the UI, and the licence is already compatible with this repo).

```bash
.claude/skills/ainaidee-icons/scripts/add-icon.sh <material-name> [local-name]
```

Find the name at <https://fonts.google.com/icons>. It is the lowercase, underscored label under the
glyph (`data_object`, not "Data Object"). The script writes `src/icons/<local-name>.svg`, refuses to
overwrite an existing file, and prints the import line.

Options, all environment variables:

- `STYLE` — `outlined` (default), `rounded`, `sharp`. **Stay on `outlined`.** The other two are a
  different visual language from the existing set.
- `WEIGHT` — default **300**. Do not change this without a reason. Material's own default is 400,
  which reads visibly heavier than this repo's 2px strokes at 24px; 200 is too thin. 300 was chosen
  by rendering both side by side, not by taste.
- `OPSZ` — `24` (default), `20`, `40`, `48`. Only matters if the icon renders larger than ~32px.

Then use it exactly like the existing icons:

```astro
import IconMemory from "@/icons/memory.svg"
...
<IconMemory class="h-4 w-4" />
```

## Traps — every one of these has actually bitten this repo

**A Material Symbol has no `fill` attribute, so it defaults to black and is invisible on the dark
theme.** It is not caught by grepping for `#000`, because the attribute is simply absent. The script
adds `fill="currentColor"`. If you add an SVG by hand, do this yourself.

**Material Symbols use `viewBox="0 -960 960 960"` — a negative Y origin.** That is valid and Astro
renders it fine; do not "fix" it to `0 0 24 24`, which would blank the icon. Size always comes from
the class, so the script strips `width`/`height` from the file.

**Tailwind preflight sets `svg { display: block }`.** An icon dropped inline next to text lands on
its own line and silently grows the row. Either make the parent a flex container, or give the icon
`display: inline-block` plus a `vertical-align` nudge.

**Astro scopes styles to the component that renders the element.** A rule written in the *caller*
never reaches an SVG emitted by a child component — this is what made the preflight bug above
invisible for a debug cycle. Style an icon from inside the component that renders it, or use
`:global()`.

**Never prefix a class with `ad-`, `ads-`, `banner-` or `sponsor-`.** Ad blockers apply cosmetic
filters to those names from a user-origin stylesheet, which beats even inline `!important` and
produces no console error. The prefix here is `nd-`. `CLAUDE.md` has the full incident.

## Before adding anything

1. **Check `src/icons/` first.** 34 icons already exist; a near-duplicate at a slightly different
   weight is worse than reusing one.
2. **Match the row budget.** Model rows are 59.89px and that number was fought for — an icon that
   grows a row is a regression, not a detail. Measure with `getBoundingClientRect()` before and
   after rather than eyeballing.
3. **Verify on the dark theme**, which is the only theme this site ships.

## Design tokens

Colours and fonts are CSS custom properties in `src/styles/global.css` (`--color-accent`,
`--color-muted`, `--color-edge`, `--font-mono`, `--font-pixel`, …). Use the tokens; never hardcode a
hex value in a component. Icons should inherit colour through `currentColor` rather than setting
their own.
