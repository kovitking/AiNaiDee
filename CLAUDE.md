# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AiNaiDee.com ("เอไอ ไหน ดี?") — a fork of [midudev/canirun.ai](https://github.com/midudev/canirun.ai)
being rebranded for a Thai audience. It detects the visitor's hardware in the browser and grades
which open-weight LLMs that machine can run. All detection and scoring is client-side; there is no
server-side hardware processing.

Fork goals are recorded in `docs/idea.md` and `docs/draft-plan.md` (Thai): add Thai/SEA models
(Typhoon, OpenThaiGPT, SeaLLM, WangchanX), add a fine-tuning/LoRA feasibility mode alongside the
existing inference-only check, localize the UI to Thai, and add a blog. None of that is built yet —
every tracked file is still identical to upstream. The only fork work on disk is untracked: the
`/design` proposal page, the Docker/Caddy setup, and `docs/`.

## State of this checkout

The Vercel → Node migration described in `docs/STATUS.md` and `docs/deploy.md` **is now applied**
(2026-07-31): `astro.config.mjs` uses `node({ mode: 'standalone' })` and reads `SITE_URL`,
`package.json` pins `@astrojs/node@10.1.0`, `vercel.json` is deleted, and the lockfile matches.
`pnpm build` emits `dist/client` + `dist/server/entry.mjs`.

**Everything is still untracked on `main` and unpushed.** The Docker setup, `docs/`, the `/design`
page and these config edits exist only as files in a OneDrive folder. There is no `ainaidee/setup`
branch here. Committing is the outstanding risk.

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
filtering the name. The prefix is now `nd-`. Do not reintroduce `ad-` (or `ads-`, `banner-`,
`sponsor-`) when the design moves onto the real home page.

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

`SITE_URL` is read by `Dockerfile` and `docker-compose.yml` and passed as a build arg, but
`astro.config.mjs` **does not consume it yet** — wiring it up is part of the unfinished migration.
Once wired, it is baked into the build (sitemap + every absolute OG image URL), so changing the
domain means rebuilding, not restarting.

## Deployment

Targets a plain Node server, not Vercel: `@astrojs/node` in `standalone` mode, pinned to **10.1.0**.
Do not upgrade it casually — 10.1.4 and 11.x import Astro internals (`writeResponse`,
`getAbortControllerCleanup`) that do not exist in Astro 6.3.3, and the build fails.

### Currently deployed (phase 1, since 2026-07-31)

Live at **http://203.0.113.10:8587** on `deploy@203.0.113.10` (Ubuntu 24.04.2, x86_64, 12 GB,
Docker 29.3.0), source at `~/apps/ainaidee`, container `ainaidee-app-1`, `restart: unless-stopped`.
Plain HTTP on the LAN, no TLS yet. That box already runs ~11 other demo containers, several on
adjacent ports (8585, 8586) — check `docker ps` before claiming a port.

Deploy loop: rsync/scp the tree up, then `docker compose up -d --build`. The repo has no remote
carrying this work, so there is nothing to `git pull` on the server yet.

Caddy is still defined in `docker-compose.yml` but sits behind `profiles: ["tls"]`, so it does not
start. Phase 2, once DNS points at the box: put a real address in the `Caddyfile` `email` line, set
`SITE_URL` in `.env` on the server, **rebuild** (SITE_URL is baked in, not read at runtime), then
`docker compose --profile tls up -d`. Caddy reaches the app as `app:4321` over the compose network,
so it does not conflict with the 8587 publish.

See `docs/deploy.md` and `docs/deploy-architecture.md` — both still describe the phase-2 Caddy
layout as if it were current.

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
- Copy throughout `src/pages/` and `src/layouts/Layout.astro` is upstream English/branding.
- The new visual direction lives at `/design` only (untracked, standalone, deliberately not using
  `Layout.astro`); the real home page is untouched. Applying it means editing
  `src/components/ModelListContent.astro`, which is 2,279 lines — the big one. See
  `docs/design-direction.md`.

Current state, decisions and open questions: **`docs/STATUS.md`**.
