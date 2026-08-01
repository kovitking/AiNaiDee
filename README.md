<div align="center">

<img src="public/favicon.svg" alt="AiNaiDee" width="80" height="80" />

# AiNaiDee — เอไอ ไหน ดี?

**เครื่องคุณรัน AI ตัวไหนได้บ้าง? — Find out which AI models your machine can run locally.**

Your browser detects your CPU, RAM and GPU automatically.\
No installs, no benchmarks, no guesswork. Nothing leaves your machine.

[**ainaidee.com**](https://ainaidee.com) · [Report Bug](https://github.com/kovitking/AiNaiDee/issues) · [Request Model](https://github.com/kovitking/AiNaiDee/issues)

</div>

---

> **A fork of [midudev/canirun.ai](https://github.com/midudev/canirun.ai)** (MIT), rebuilt for a
> Thai and Southeast Asian audience: Thai-first UI, a Thai/English bilingual site, a visual
> redesign, and a self-hosted Docker deployment in place of Vercel. All credit for the original
> compatibility engine and the idea goes to [midudev](https://midu.dev).

## Why

Cloud AI APIs are expensive, rate-limited, and send your data to third parties. Running models
locally gives you **privacy, speed, and zero cost per token** — but only if your hardware is up to
the job.

AiNaiDee answers that question instantly. Open the site, let it detect your hardware, and see a
personalized compatibility report for **83 open-weight models** graded from S to F.

## How It Works

```
Browser APIs → Hardware Detection → Model Matching → Personalized Grades
```

1. **Hardware detection** runs entirely client-side using WebGL, WebGPU, `navigator.deviceMemory`
   and a lightweight CPU micro-benchmark.
2. Each model's memory requirement is derived across **7 quantization levels** (Q2_K → F16) from its
   parameter count, then overridden with real measured GGUF sizes where available.
3. A scoring algorithm combines run status, estimated tokens/second, memory headroom and model size
   into a **letter grade (S–F)**.
4. Results are displayed instantly — **nothing is sent to any server**.

### Supported hardware

| Platform | Detection method |
|---|---|
| **NVIDIA** RTX 30xx / 40xx / 50xx, A100, H100 | WebGL renderer string + GPU database |
| **AMD** RX 6xxx / 7xxx / 9xxx | WebGL renderer string + GPU database |
| **Intel** Arc A-series | WebGL renderer string + GPU database |
| **Apple Silicon** M1–M4 (Pro, Max, Ultra) | WebGL + unified memory lookup |
| **Mobile** (iOS / Android) | Screen resolution, benchmark, Adreno/Mali/Immortalis DB |
| **Single-board computers** | Dedicated SBC database |

Hardware support lives in lookup tables, not in detection logic — see
[Contributing](#contributing).

## Features

- **Zero-install hardware detection** — CPU cores, RAM, GPU model, VRAM and memory bandwidth
  identified from the browser
- **83 AI models** — from TinyLlama 1.1B to Llama 4 Maverick 128E and Qwen3 Coder 480B
- **7 quantization levels per model** — Q2_K, Q3_K_M, Q4_K_M, Q5_K_M, Q6_K, Q8_0, F16
- **MoE-aware scoring** — mixture-of-experts models are scored on *active* rather than total
  parameters, without which speed estimates are badly wrong
- **S–F grading system** — instant letter grade based on your hardware vs. model requirements
- **Tokens/second estimates** — approximate inference speed derived from memory bandwidth
- **Bilingual** — Thai at `/`, English at `/en/`
- **Playground** — real in-browser inference via `@huggingface/transformers` in a web worker
- **Tier list** — shareable S–F tier list you can export as an image
- **Model detail pages** — per-quant compatibility table, one-click Ollama / LM Studio / llama.cpp
  install commands
- **Public JSON API** — CORS-enabled, see [API](#api)
- **OG images** — dynamically generated social preview images for every model

## Model Catalog

Models from **Meta, Google, Alibaba, DeepSeek, Mistral AI, Microsoft, NVIDIA, Liquid AI** and the
community:

| Family | Models |
|---|---|
| Llama | 3.1 8B, 3.1 405B, 3.2 1B/3B/11B-Vision, 3.3 70B, 4 Scout, 4 Maverick |
| Qwen | 2.5 7B–72B, 2.5 Coder, 3 1.7B–235B, 3.5 0.8B–397B, 3 Coder 480B |
| Gemma | 2 2B/9B/27B, 3 1B/4B/12B/27B |
| DeepSeek | R1 1.5B–32B, V3.1, V3.2 |
| Mistral | 7B, Nemo 12B, Small 24B, Mixtral 8x7B/8x22B, Devstral |
| Phi | 3.5 Mini, 4 14B, 4 Mini Reasoning |
| Others | Nemotron, GLM-4, OLMo 2, SmolLM3, LFM2, EXAONE, Kimi K2, GPT-OSS |

Thai and SEA models (Typhoon, OpenThaiGPT, SeaLLM, WangchanX) are a planned addition.

## API

AiNaiDee exposes the compatibility engine as a CORS-enabled JSON API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/models` | List models; accepts `provider` and `useCase` filters |
| `GET` | `/api/models/:id` | Get complete metadata for one model |
| `POST` | `/api/compatibility` | Evaluate one model against a hardware profile |
| `POST` | `/api/recommend` | Recommend compatible models for a hardware profile |

Example:

```bash
curl -X POST https://ainaidee.com/api/compatibility \
  -H 'content-type: application/json' \
  -d '{
    "hardware": {
      "ramGb": 32,
      "gpu": { "name": "NVIDIA RTX 3060" }
    },
    "modelId": "llama3.1-8b",
    "quantization": "Q4_K_M"
  }'
```

GPU names are enriched from the internal hardware database. You can also pass `vramGb` and
`memoryBandwidthGbps` explicitly. For Apple Silicon, provide the chip name and total unified memory
through `ramGb`. Omitting `quantization` selects the highest-quality option that fits.

The API deliberately uses different status names from the internal engine
(`comfortable` / `tight` / `cpu-offload` / `insufficient`) — that mapping is the public contract.

## Tech Stack

| | Technology | Purpose |
|---|---|---|
| 🚀 | [Astro 6](https://astro.build) | Site generation with islands architecture + native i18n routing |
| 🟢 | [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) | Standalone Node server (self-hosted via Docker) |
| 🎨 | [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| 🔤 | Chakra Petch · IBM Plex Sans Thai · IBM Plex Mono | Display, Thai body text, and monospace |
| 🖼️ | [Satori](https://github.com/vercel/satori) + [resvg](https://github.com/yisibl/resvg-js) | OG image generation (JSX → SVG → PNG) |
| 🤗 | [@huggingface/transformers](https://github.com/huggingface/transformers.js) | In-browser inference for the playground |
| 📸 | [@zumer/snapdom](https://github.com/zumerlab/snapdom) | Tier list export to image |
| ✍️ | [Ghost](https://ghost.org) | Headless CMS for the blog |

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org) 18+ and [pnpm](https://pnpm.io) (pinned via
`packageManager` — do not use npm or yarn)

```bash
git clone https://github.com/kovitking/AiNaiDee.git
cd AiNaiDee

pnpm install
pnpm dev
```

Open [localhost:4321](http://localhost:4321). No environment variables are required for local
development.

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start dev server at `localhost:4321` |
| `pnpm build` | Build to `dist/client` + `dist/server/entry.mjs` |
| `node dist/server/entry.mjs` | Run the built site (`HOST` / `PORT` env, defaults `:4321`) |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run the vitest suite |
| `pnpm packages:typecheck` | Typecheck both workspace packages |
| `pnpm packages:build` | Compile the workspace packages to `dist/` |

## Project Structure

The compatibility engine and model catalog live in **workspace packages**, not in `src/`. These
files in `src/` are one-line re-exports and contain no logic — editing them changes nothing:

| Shim in `src/` | Real implementation |
|---|---|
| `src/data/models.ts` | `packages/models/src/index.ts` |
| `src/lib/hardware.ts` | `packages/compatibility/src/index.ts` |
| `src/lib/device-slugs.ts` | `packages/compatibility/src/device-slugs.ts` |
| `src/lib/hardware-ui.ts` | `packages/compatibility/src/ui.ts` |

```
packages/
├── compatibility/    # Hardware databases + detection/scoring pipeline
├── models/           # Model catalog (sizes are derived, not hand-written)
└── runai/            # Separate CLI: local model runner (not part of the web build)
src/
├── i18n/ui.ts        # Thai/English dictionary + useTranslations(lang)
├── pages/
│   ├── index.astro   # Home (Thai)
│   ├── en/index.astro# Home (English)
│   ├── model/[id]    # Model detail
│   ├── playground    # In-browser inference
│   └── api/          # Public JSON API
├── components/       # NavHeader, Footer, ModelListContent
└── layouts/          # Base layout: SEO, hreflang, view transitions
```

> **Note:** `pnpm dev` and `vitest` resolve `packages/*/src` (edits are live), but `astro build`
> resolves `packages/*/dist`. Both `dev` and `build` chain `pnpm packages:build` first — but if you
> ever run `astro build` directly, run `pnpm packages:build` yourself or you will silently ship a
> stale package.

## Deployment

Self-hosted on a plain Node server via Docker — **not Vercel**. `pnpm build` emits a standalone
server; `docker compose build app && docker compose up -d app` runs it. `SITE_URL` is a **build
arg**, baked into the sitemap and every absolute OG image URL, so changing the public origin means
rebuilding rather than restarting.

## Contributing

Contributions are welcome:

- **Add a model** — add one entry to `STATIC_MODELS` in `packages/models/src/index.ts` with
  `paramsBillions` (and a `moe` block for mixture-of-experts). The quantization and RAM tables are
  derived automatically.
- **Improve hardware detection** — extend the `GPU_DB`, `APPLE_DB`, `MOBILE_GPU_DB` or `SBC_DB`
  lookup tables in `packages/compatibility/src/index.ts` rather than touching `detectHardware()`.
- **Help with Thai localization** — add strings to `src/i18n/ui.ts`. Technical terms (GPU, VRAM,
  WebGPU, grade letters, quant codes, MoE) intentionally stay in English.
- **Report inaccurate results** — open an issue with your hardware info and the model in question.

## Credits

Original project by [**midudev**](https://midu.dev) — [canirun.ai](https://canirun.ai).
Thai fork maintained by [kovitking](https://github.com/kovitking).

## License

MIT
