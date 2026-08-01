# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AiNaiDee.com ("เอไอ ไหน ดี?") — a fork of [midudev/canirun.ai](https://github.com/midudev/canirun.ai)
being rebranded for a Thai audience. It detects the visitor's hardware in the browser and grades
which open-weight LLMs that machine can run. All detection and scoring is client-side; there is no
server-side hardware processing.

Fork goals are recorded in `docs/idea.md` and `docs/draft-plan.md` (Thai): add Thai/SEA models
(Typhoon, OpenThaiGPT, SeaLLM, WangchanX — not yet added), add a fine-tuning/LoRA feasibility mode
alongside the existing inference-only check, localize the UI to Thai, and add a blog. The `/design`
direction has been applied to the real home page (`ModelListContent.astro` rewritten on its
row+ruler layout, `src/styles/global.css` re-themed site-wide) and deployed — see "Rebranding still
to do" for what's left. Thai localization is **partial**: the home page, `NavHeader`, `Footer`, and
`playground.astro`'s welcome copy are translated (technical terms kept in English — GPU, VRAM, RAM,
WebGPU, grade letters, quant codes, MoE); `why`/`compare`/`tier`/`docs`/`license`/`blog` pages,
`model/[id]`/`device/[id]`, and the playground chat UI's own microcopy are still English.

## State of this checkout

The Vercel → Node migration described in `docs/deploy.md` is applied: `astro.config.mjs` uses
`node({ mode: 'standalone' })` and reads `SITE_URL`, `package.json` pins `@astrojs/node@10.1.0`,
`vercel.json` is deleted, and the lockfile matches. `pnpm build` emits `dist/client` +
`dist/server/entry.mjs`.

**This is committed and pushed.** The repo lives at `github.com/kovitking/AiNaiDee` (origin), branch
`main`, and is deployed — see "Currently deployed" under Deployment. Before assuming otherwise, run
`git status`; uncommitted changes at any given moment are normal in-progress work, not a sign the
fork work itself is unlanded. Read `docs/STATUS.md` for the current session's state and open
questions — it is updated more often than this file and is the better source for "what's true right
now."

### Windows toolchain notes

This folder syncs over OneDrive between a Mac and a Windows box, so `node_modules/` can arrive from
the wrong OS — Unix `.bin` shims with no `.cmd` wrappers, and contents that disagree with the
lockfile. If anything looks impossible, delete `node_modules/` and reinstall.

`pnpm` is not on PATH on the Windows machine; `node`, `npm` and `corepack` are. Use `corepack pnpm`.
Two consequences:

- `corepack enable pnpm` fails with `EPERM` writing into `D:\Program Files\nodejs` unless elevated.
- Scripts that shell out to `pnpm` recursively (`packages:typecheck`, `dev`, `build` all chain
  `pnpm ...`) fail with *'pnpm' is not recognized* even under `corepack pnpm`. Put a `pnpm.cmd`
  shim containing `@echo off` + `corepack pnpm %*` on PATH, or install pnpm globally.
- `pnpm install` aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` when it wants to purge a
  foreign `node_modules` and has no TTY. Set `CI=true` for that run.

**Never edit a Thai-containing file with PowerShell 5.1 `Get-Content -Raw` / `Set-Content`.**
`Get-Content` reads as ANSI, so a read-modify-write round trip double-encodes every Thai character
into mojibake (`design.astro` went 36,390 → 42,462 bytes this way). Use the Edit tool, or
`[System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)` with
`WriteAllText($p, $s, (New-Object System.Text.UTF8Encoding($false)))`.

## Commands

Package manager is **pnpm**, pinned to `11.1.3` via `packageManager`. Do not use npm or yarn.
(`packages/runai` targets the Bun *runtime* in its source, but is still installed with pnpm.)

| Command | Notes |
|---|---|
| `pnpm install` | ~30s cold |
| `pnpm dev` | `localhost:4321`, ready in ~1s |
| `pnpm build` | ~30s; emits `dist/client` + `dist/server/entry.mjs` |
| `node dist/server/entry.mjs` | run the built site; `HOST` and `PORT` env, defaults `:4321` |
| `pnpm preview` | serve the production build |
| `pnpm test` | vitest, 200 tests across 7 files, ~1.5s |
| `pnpm packages:typecheck` | tsc on both workspace packages, <1s |
| `pnpm packages:build` | compiles `packages/compatibility` + `packages/models` to `dist/`, ~1.5s (not `runai`) |

Confirmed on Windows 2026-07-31: 200 tests / 7 files in 688ms, typecheck ~2s, build 30s.

Run a single test file or case:

```bash
pnpm exec vitest run tests/hardware.test.ts
pnpm exec vitest run tests/hardware.test.ts -t "scoreToGrade"
pnpm exec vitest list          # every test id, root + packages/runai
```

The root `vitest run` sweeps `tests/` (2 files) *and* `packages/runai/tests/` (5 files) — there is
no vitest config, so the default include pattern picks up both. Run runai's own scripts through the
workspace filter: `pnpm --filter runai <script>`.

Verification is cheap here — tests and typecheck both finish in about a second. Run them.
(The upstream Spanish `AGENTS.md` told agents *not* to, on the grounds that these commands are
slow. That is not true of this repo; see `AGENTS.md` for what still applies.)

Data refresh scripts hit external APIs and rewrite committed JSON, so run them only when asked:

```bash
pnpm scrape                          # HuggingFace model stats -> src/data/hf-stats.json
pnpm fetch:readmes                   # Ollama readmes -> src/data/ollama-readmes.json
pnpm exec tsx scripts/fetch-gguf-sizes.ts   # real GGUF sizes -> packages/models/src/gguf-sizes.json
pnpm exec tsx scripts/fetch-hf-stats.ts
pnpm exec tsx scripts/fetch-licenses.ts
```

## Architecture

### The `src/` files you want are one-line re-exports

These four files are each a single `export * from …` and contain no logic:

| Shim | Real code |
|---|---|
| `src/data/models.ts` | `packages/models/src/index.ts` |
| `src/lib/hardware.ts` | `packages/compatibility/src/index.ts` |
| `src/lib/device-slugs.ts` | `packages/compatibility/src/device-slugs.ts` |
| `src/lib/hardware-ui.ts` | `packages/compatibility/src/ui.ts` |

The README's project tree predates this split and still describes them as the implementation. Editing
the shim changes nothing. Edit the package.

### Dev reads package source; build reads package `dist/`

The packages declare a `development` export condition pointing at `src/`, and an `import` condition
pointing at `dist/`. The consequence, verified by patching a package and building without rebuilding:

- `astro dev` and `vitest` resolve **`packages/*/src`** — edits are live, no rebuild needed.
- `astro build` resolves **`packages/*/dist`** — a stale `dist/` is silently shipped.

This is why `pnpm dev` and `pnpm build` both chain `pnpm packages:build` first. **A package change
appearing correctly in dev does not mean it will appear in the build.** If you ever invoke
`astro build` directly, run `pnpm packages:build` yourself.

### Compatibility engine — `packages/compatibility/src/index.ts`

One large module holding both the hardware databases and the scoring pipeline:

```
detectHardware()          WebGL renderer string, WebGPU, navigator.deviceMemory, CPU micro-benchmark
  → evaluateModel()       "can-run" | "tight" | "can-run-slow" | "cannot-run" | "unknown"
  → estimateTokensPerSecond()   derived from memory bandwidth
  → computeScore()        combines status, tok/s, params, memory headroom
  → scoreToGrade()        S | A | B | C | D | F | ?
```

`evaluateModelComplete()` runs the whole chain and is what callers should use.

Hardware support lives in lookup tables, not in detection logic — extend `GPU_DB` (discrete GPUs),
`APPLE_DB` (Apple Silicon unified memory), `MOBILE_GPU_DB` (Adreno/Mali/Immortalis) or `SBC_DB`
(single-board computers) rather than touching `detectHardware()`. Users can override detection;
`getHardwareOverrides()` / `applyOverrides()` persist to localStorage.

### Model catalog — `packages/models/src/index.ts`

83 models, each a one-line entry in the `STATIC_MODELS` array (the README's "68+" is stale). The
whole module is 228 lines because sizes are **derived, not hand-written**:

- `makeQuants(paramsB)` generates all 7 quantization levels (Q2_K → F16) from the parameter count,
  applying a 1.1 factor plus `RUNTIME_OVERHEAD_GB = 0.5` for KV cache and runtime.
- `ram(paramsB)` derives min/recommended system RAM the same way.
- `applyRealSizes()` then overrides those estimates with measured sizes from `gguf-sizes.json`
  wherever a real measurement exists.
- `getActiveParamsBillions()` is what makes MoE models score on *active* rather than total
  parameters — speed estimates are wrong for MoE without it.

So adding a model means adding one entry with `paramsBillions` and (for MoE) a `moe` block; the
quantization table follows automatically.

### Public API — `src/pages/api/`

`compatibility.ts`, `models.ts`, `models/[id].ts` and `recommend.ts` are thin CORS-enabled wrappers
over `src/lib/compatibility-api.ts`. That file deliberately renames internal statuses for the public
contract via `STATUS_MAP`:

```
can-run → comfortable    tight → tight    can-run-slow → cpu-offload    cannot-run → insufficient
```

Renaming a `ModelStatus` without updating `STATUS_MAP` breaks the public API silently — it type-checks
and returns wrong strings.

### Write inline `<script>` blocks in plain JavaScript, not TypeScript

In dev, Astro emits page scripts as `<script type="module" src="…?astro&type=script&index=0&lang.ts">`.
The HTML parser expands the `&lang` character reference in that attribute, so Vite never sees the
`.ts` hint, serves the file untransformed, and the browser dies on the first TypeScript-only token
(`!`, a generic, a type annotation). The failure is quiet — the module 200s, nothing appears in the
console, and the page just sits there inert with none of its scripted behaviour applied.

Production is unaffected (the script is bundled to a hashed `.js`), so this only bites in dev.
Keep client blocks in plain JS, or move the logic into a `src/lib/*.ts` module and import it.

### Never prefix CSS classes with `ad-`

`design.astro` originally used `ad-` (`ad-row`, `ad-head`, `ad-page`, …) as its class prefix. Ad
blockers apply generic cosmetic filters to `ad-*` class names, injecting `display: none !important`
from a **user-origin** stylesheet. That is invisible to normal debugging:

- the rule does not appear in `document.styleSheets`, so scanning stylesheets finds nothing;
- user-origin `!important` beats even an inline `style="display:grid"`, so forcing the style fails;
- no console error, HTTP 200 everywhere, CSS and fonts all correct.

The page rendered as a headerless shell with 83 rows present in the DOM at zero height. Diagnose it
by renaming the class at runtime — if `display` flips from `none` to its real value, a blocker is
filtering the name. The prefix is `nd-` everywhere now, including the real home page
(`ModelListContent.astro` was rewritten onto this layout — see "Rebranding still to do"). Do not
reintroduce `ad-` (or `ads-`, `banner-`, `sponsor-`) anywhere in the site.

### Blog — live, Ghost deployed and wired to the site

`src/lib/ghost.ts` wraps `@tryghost/content-api`. It reads `GHOST_URL` and `GHOST_CONTENT_API_KEY`
**at build time** (not runtime — see `getPosts`/`getPost`); if either is unset, `api` stays `null`
and every exported function returns an empty result instead of throwing, so `/blog` and
`/blog/[slug].astro` render a "coming soon" state and the rest of the site's build is unaffected.
`blogConfigured` is the flag pages check to decide which state to render. Both are now set as build
args on the deployed image, so `/blog` renders real Ghost content — currently just Ghost's own
default "Coming soon" sample post, since no real post has been published yet. **Publishing a new
post in Ghost admin requires a rebuild+redeploy of the site** to show up; it does not appear on its
own. `src/pages/og/blog/[slug].jpg.ts` generates a satori OG image fallback for posts without a
`feature_image`.

`docker-compose.yml` defines `ghost` (image `ghost:6-alpine`) and `ghost-db` (MySQL 8, not SQLite —
Ghost's Docker image restricts SQLite to `NODE_ENV=development`) behind `profiles: ["blog"]`, so
they don't start with a normal `docker compose up`; both are running on the deployed server.
`GHOST_DB_PASSWORD` has no default and fails compose validation if unset. Ghost admin is served at
`blog.ainaidee.com/ghost` through Caddy (`admin__url` matches the public site url; Caddy forces
`X-Forwarded-Proto: https` since Imperva terminates TLS and forwards plain HTTP — Ghost otherwise
marks its session cookie `Secure` and every authenticated request 403s). `staffDeviceVerification`
is disabled because no SMTP is configured, so the emailed 2FA code Ghost 6 requires at login can
never arrive; re-enable it if SMTP is ever set up. Details in `docs/blog-plan.md` and
`docs/blog-architecture.md`.

### Other pieces

- **Playground** (`src/pages/playground.astro`) runs real inference in-browser via
  `@huggingface/transformers` inside a web worker, bridged with Comlink
  (`src/lib/playground-worker.ts`, `playground.ts`).
- **OG images** are generated at build time with satori + resvg (`src/lib/og.ts`,
  `src/pages/og/[id].jpg.ts`) — one per model, which is most of the 27s build.
- **`packages/runai/`** is a separate CLI (local model runner with an OpenAI-compatible API), managed
  with pnpm but still calling Bun runtime APIs (`Bun.spawn`, `bun:sqlite`) in its implementation —
  keep them unless the task is explicitly to migrate off Bun. It is not part of the web build and has
  its own `CLAUDE.md`. Its tests do run under the root `pnpm test`.

### Other instruction files, and where they conflict

- `AGENTS.md` (Spanish, upstream) says to skip typecheck, lint and tests as "too slow". That is
  measurably false here and **this file overrides it**. Its package-manager rule still stands, with
  one correction: it says to use `bun` where a subpackage has a `bun.lock`; none does, and
  `packages/runai/CLAUDE.md` explicitly requires pnpm there.
- `.agents/skills/` holds a vendored skill bundle (Astro, Tailwind, a11y, SEO, `deploy-to-vercel`).
  It is reference material, not repo policy — `deploy-to-vercel` in particular contradicts the
  direction this fork is taking.

## Environment

Everything works with no environment variables except telemetry: `/api/runai/metrics` writes to Turso
via `@libsql/client` and **throws** unless `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set. Schema
is in `scripts/sql/runai-metrics.sql`.

`SITE_URL` is read by `Dockerfile`/`docker-compose.yml` as a build arg and consumed by
`astro.config.mjs` (`site: process.env.SITE_URL || 'https://ainaidee.com'`). It is baked into the
build (sitemap + every absolute OG image URL), so changing the domain means rebuilding, not
restarting. `GHOST_URL` and `GHOST_CONTENT_API_KEY` are build args the same way (see "Blog" below).

## Deployment

Targets a plain Node server, not Vercel: `@astrojs/node` in `standalone` mode, pinned to **10.1.0**.
Do not upgrade it casually — 10.1.4 and 11.x import Astro internals (`writeResponse`,
`getAbortControllerCleanup`) that do not exist in Astro 6.3.3, and the build fails.

### Currently deployed — live at ainaidee.com

Real domains work now: **`ainaidee.com`**, **`www.ainaidee.com`**, **`blog.ainaidee.com`** — all
sit behind **Imperva Incapsula (CWAF)**, which terminates TLS and forwards plain HTTP to the origin
at `203.0.113.10:8587` for every hostname alike. `Caddy` (container `ainaidee-caddy-1`, no
`profiles` gate — it always starts) is the only thing listening on `:8587`; its one job is
Host-header routing, not certificates (`auto_https off` in the `Caddyfile` — Imperva does TLS, not
Caddy). It sends `ainaidee.com`/`www` to `app:4321`, and splits `blog.ainaidee.com` between the
`ghost` container (`/ghost*`, `/content/*`) and `app:4321` (everything else, rewritten to `/blog*`).

Origin box: `deploy@203.0.113.10` (Ubuntu 24.04.2, x86_64, 12 GB, Docker 29.3.0), source at
`~/apps/ainaidee`, app container `ainaidee-app-1`, `restart: unless-stopped`. That box already runs
~11 other demo containers on adjacent ports (8585, 8586) — check `docker ps` before claiming a
port. **Do not assume `203.0.113.10:8587` reflects `main`** — it's the deploy target, updated only
when someone deploys, same as any server.

Deploy loop: `git archive HEAD | ssh deploy@203.0.113.10 'tar -x -C ~/apps/ainaidee_new'` into a
**fresh directory** (never `rsync`/scp over the live one — line-ending mismatches from this repo's
Mac/Windows OneDrive sync make in-place diffs meaningless), copy `.env` over, swap the directory in
(keep the old one as a timestamped backup, don't delete it), then
`docker compose build app && docker compose up -d app`. `main` is pushed to `origin`
(`github.com/kovitking/AiNaiDee`), but the server deploy is this manual archive-and-swap, not
`git pull` — the box hasn't been given pull access to the repo. Switching to `git pull`-based
deploys is an open option, not yet adopted (see `docs/STATUS.md`, "Blocked on you").

`docs/deploy.md` and `docs/deploy-architecture.md` still describe an older phase-2-Caddy-behind-a-
profile plan that is no longer how this works — Imperva replaced Caddy's TLS role entirely.

### Container build traps

The builder stage installs with `--filter "canirun-ai..."`, which deliberately excludes
`packages/runai` — its `node-llama-cpp` dependency drags in a native toolchain the website never
uses. But the Dockerfile still copies `packages/runai/package.json`, because `--frozen-lockfile`
refuses to install a workspace that doesn't match the lockfile. `.dockerignore` must therefore
exclude runai's *contents* while re-including that one file:

```
packages/runai/*
!packages/runai/package.json
```

A plain `packages/runai` entry there fails the build at `COPY packages/runai/package.json`.

Anything imported by a page must be a real declared dependency — `src/pages/design.astro` imports
`@fontsource/{chakra-petch,ibm-plex-sans-thai,ibm-plex-mono}`, which were missing from
`package.json` and broke the build with a Rollup *failed to resolve import*.

The one non-obvious property: the built server imports exactly **one** package from `node_modules`
(`@libsql/client`). Everything else is bundled into `dist/server` or was build-time only, which is why
the runtime image needs no compiler and no native modules. If you add a server-side dependency you
must add it to `docker/runtime-package.json` or the container crashes on that code path. Re-derive
the list with:

```bash
grep -rhoE "from *[\"'][@a-z][^\"'./][^\"']*[\"']" dist/server/ | sort -u
```

(Recurse over `dist/server/`, not `dist/server/*.mjs` as this file used to say — the imports live in
`dist/server/chunks/`, so the globbed form matches nothing and looks falsely clean.)

## Rebranding still to do

- `package.json` is still named `canirun-ai`; the workspace packages are still `@canirun/*`, and both
  package manifests still point `homepage`/`repository` at canirun.ai and midudev's repo. The
  Dockerfile's `--filter "canirun-ai..."` depends on that root name — rename both together.
- The `/design` visual direction (indigo/bone/saffron palette, Chakra Petch/IBM Plex fonts,
  row+ruler layout) **is applied to the real home page** — `src/styles/global.css` theme tokens,
  `ModelListContent.astro`, `NavHeader.astro`, `Footer.astro`, `Layout.astro` were all rewritten
  onto it and deployed. `src/pages/design.astro` itself is now a stale standalone demo, superseded
  by the real thing — safe to delete once nobody needs it as a reference. `why.astro`,
  `compare.astro`, `tier.astro`, `docs.astro`, `license/[id].astro`, `blog/*`, `model/[id].astro`
  and `device/[id].astro` inherit the new color/font tokens automatically (same Tailwind utility
  classes) but haven't been individually reviewed for leftover hardcoded old-palette colors the way
  `tier.astro`/`why.astro`/`docs.astro` were during the rollout.
- **Thai localization is partial.** Done: home page, `NavHeader`, `Footer`,
  `playground.astro`'s welcome/instructions panel — technical terms (GPU, VRAM, RAM, WebGPU, grade
  letters S–F, quant codes like `Q4_K_M`, MoE) stay English on purpose. Not done: `why`, `compare`,
  `tier`, `docs`, `license/*`, `blog/*` page copy, `model/[id]`/`device/[id]` detail pages, and the
  playground chat UI's own microcopy (New chat, Search chats, Settings panel, model picker, etc).
  Reuse the `USE_CASE_TH` map (task-category labels) already duplicated in `design.astro` and
  `ModelListContent.astro` rather than inventing new translations for the same terms.
- **The GitHub icon/link was removed from `NavHeader`/`Footer`**, because the public
  `kovitking/AiNaiDee` repo has internal deployment IP/SSH-username comments committed in several
  docs (`docker-compose.yml`, `CLAUDE.md` — yes, this file, `docs/STATUS.md`, `docs/deploy.md`,
  `docs/deploy-architecture.md`, `docs/blog-plan.md`, `docs/blog-architecture.md`). Removing the
  site's link to the repo does **not** fix this — the repo is still public and `git log` still has
  the IP in every one of those files' history. Scrubbing it (or making the repo private) is
  unresolved; see `docs/STATUS.md` → "Blocked on you".

Current state, decisions and open questions: **`docs/STATUS.md`**.
