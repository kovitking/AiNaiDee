# AiNaiDee — project status

**Last updated: 2026-07-31.** Start here when picking the project back up.

---

## สรุปสั้นๆ (อ่านตอนเช้า) — 2026-07-31

เว็บ**ขึ้นจริงแล้ว**: **http://203.0.113.10:8587** — Docker container รันอยู่บนเซิร์ฟเวอร์ Ubuntu ของคุณ
(`deploy@203.0.113.10`) ทั้ง `/` (หน้าเดิม) และ `/design` (ดีไซน์ใหม่) เข้าถึงได้ทั้งคู่

ทำเสร็จวันนี้:

1. **ต่อ Vercel → Node ให้จบ** — เมื่อวานไฟล์ config ยังค้างอยู่ครึ่งทาง (`astro.config.mjs` ยังเรียก
   `vercel()`) วันนี้แก้ให้ครบ, ลบ `vercel.json`, ล็อก `@astrojs/node@10.1.0`
2. **Build image ครั้งแรกสำเร็จ** — เจอบั๊ก 2 ตัวระหว่างทาง แก้แล้วทั้งคู่ (ดูหัวข้อ "Container build
   traps" ใน `CLAUDE.md`): `.dockerignore` ลบ `packages/runai/package.json` ที่ Dockerfile ต้องใช้,
   และ `design.astro` import ฟอนต์ที่ไม่เคยอยู่ใน `package.json`
3. **Deploy จริงที่พอร์ต 8587** — HTTP ธรรมดา ยังไม่มี TLS/DNS ตามที่คุณสั่งให้ขึ้นก่อนแบบง่ายๆ
   Caddy (TLS) เตรียมไว้แล้วแต่ปิดอยู่ (`--profile tls`) รอ DNS ชี้มาก่อน
4. **เจอบั๊กใหญ่ที่ `/design`: ตัวบล็อกโฆษณาซ่อนทั้งหน้า** — คลาส CSS ใช้ prefix `ad-` (`ad-row`,
   `ad-head`) ซึ่งตรงกับ filter ทั่วไปของ ad blocker พอดี ทำให้ทั้งหน้าที่ไม่ใช่หัว/ฟิลเตอร์หายไปหมด
   ทั้งที่โค้ดถูกต้อง 100% — เปลี่ยน prefix เป็น `nd-` ทั้งไฟล์ (220 จุด) แก้แล้ว build ใหม่ deploy ใหม่
   ยืนยันด้วยสกรีนช็อตว่าเห็นครบ 83 โมเดลพร้อมเส้น saffron limit line

**ยังติดอยู่ที่คุณ** (รายละเอียดข้างล่าง หัวข้อ "Blocked on you"): DNS + อีเมล TLS สำหรับเฟส 2, และว่า
จะเอาดีไซน์ใหม่ไปใช้กับหน้าแรกจริงเมื่อไหร่

---

## Where everything is

| File | What it holds |
|---|---|
| `CLAUDE.md` | How to work in this repo — commands, architecture, traps |
| `AGENTS.md` | Package-manager rule; defers to CLAUDE.md |
| `docs/STATUS.md` | This file |
| `docs/idea.md`, `docs/draft-plan.md` | Your original Thai planning notes |
| `docs/design-direction.md` | The visual direction and why each choice was made |
| `docs/deploy.md` | Deployment procedure + what I still need from you |
| `docs/deploy-architecture.md` | Mermaid diagrams of the server setup |
| `docs/flow-logo.md`, `docs/flow-banner.md` | Google Flow prompt briefs |
| `src/pages/design.astro` | The new design, standalone, live at `/design` |
| `Dockerfile`, `docker-compose.yml`, `Caddyfile` | The container setup |

Branch: **`main`**, pushed to `origin` (`github.com/kovitking/AiNaiDee`) as of 2026-07-31. Everything
below was untracked/local-only before today.

---

## 2026-07-31 session — deployed to the real server

### 1. Finished the Vercel → Node migration

Yesterday's session described this as done in `docs/deploy.md`, but only the new files (Dockerfile,
Caddyfile, docker-compose.yml) had actually landed — `astro.config.mjs` still called `vercel()`,
`package.json` still depended on `@astrojs/vercel`, and `vercel.json` was still present. Fixed all
three: `astro.config.mjs` now uses `node({ mode: 'standalone' })` and reads `SITE_URL`, lockfile
regenerated with `@astrojs/node@10.1.0` pinned, `vercel.json` deleted.

### 2. First-ever Docker build — two real bugs found and fixed

Two things broke a build that had never actually been run:

- **`.dockerignore` excluded `packages/runai` entirely**, but the Dockerfile copies
  `packages/runai/package.json` on purpose (so the workspace matches the lockfile for
  `--frozen-lockfile`). Fixed to exclude runai's *contents* while re-including that one file.
- **`design.astro` imports three `@fontsource` packages that were never added to `package.json`**
  (`chakra-petch`, `ibm-plex-sans-thai`, `ibm-plex-mono`) — Rollup failed to resolve them. Added,
  pinned to `5.3.0` to match the rest of the manifest's exact-pin convention.

Build now succeeds in ~30s locally, ~80s on the server (renders all 83 OG images). Confirmed the
runtime image's only non-builtin import is still `@libsql/client`.

### 3. Deployed — phase 1, plain HTTP, no TLS

Live at **http://203.0.113.10:8587**, container `ainaidee-app-1`, `restart: unless-stopped`, on
`deploy@203.0.113.10` (Ubuntu 24.04.2, x86_64, 12 GB RAM, Docker 29.3.0 — a shared demo box
already running ~11 other containers; 8587 was free, next to their 8585/8586). Smoke-tested every
route type: static pages, model pages, OG images, sitemap, and both GET and POST API routes.

Caddy is defined in `docker-compose.yml` but parked behind `profiles: ["tls"]` so it stays off until
DNS is ready — see "Blocked on you". `SITE_URL` is currently baked in as the bare IP:port; it has to
be rebuilt (not just restarted) once the real domain is live.

### 4. Found and fixed a serious bug at `/design`: ad blockers were hiding the whole page

The design page used `ad-` as its CSS class prefix (`ad-row`, `ad-head`, `ad-page`, …). That collides
with the generic cosmetic filters most ad blockers ship — they inject `display: none !important`
from a **user-origin** stylesheet that never shows up in `document.styleSheets`, so nothing about it
looked wrong: no console errors, correct CSS served, correct fonts loaded, correct HTML rendered.
Every element after the header/filter bar was present in the DOM at zero height.

Confirmed the cause by renaming a class at runtime in the browser (`ad-row` → `zz-row` immediately
un-hid the row), then renamed the prefix to `nd-` across all 220 occurrences in `design.astro`,
rebuilt, and redeployed. Verified with the same ad blocker still enabled: header, machine chips,
Thai hero copy, all 83 rows, S–F grade chips, and the saffron limit line all render correctly.
Documented in `CLAUDE.md` under "Never prefix CSS classes with `ad-`" so it doesn't recur when this
design moves onto the real home page.

This was never a deployment problem — it would have hit any real visitor running an ad blocker.

---

## What was done on 2026-07-30, and what is actually verified

### 1. Repo brought local, CLAUDE.md written

The folder held only `idea.md` and `draft-plan.md`; the code was only on GitHub. Cloned the fork
in, moved the planning docs to `docs/`, installed pnpm 11.1.3 (was not on this machine).

Every command in CLAUDE.md was run before being written down. Two findings worth keeping:

- **The README's project tree is now wrong.** `src/data/models.ts`, `src/lib/hardware.ts` and
  `src/lib/device-slugs.ts` are one-line re-exports; the real code is in `packages/models` and
  `packages/compatibility`. Editing the shim does nothing.
- **Dev and build resolve packages differently.** `astro dev` and `vitest` read package *source*;
  `astro build` reads package *dist*. A change that looks right in dev can ship stale. Both
  `pnpm dev` and `pnpm build` chain `packages:build` for this reason.

Also replaced the upstream Spanish `AGENTS.md`, which told agents to skip typecheck and tests as
"too slow". Measured here: 200 tests in ~1.5s, typecheck under 1s. That rule was costing quality
for nothing.

### 2. Design direction at `/design`

Upstream is light, all-monospace, green — a developer terminal tool. Your audience per `idea.md`
explicitly includes non-experts, so this reads as an instrument instead: คราม indigo ground, bone
surfaces, saffron used exactly once as the limit line, Thai type from Cadson Demak (Chakra Petch
display, IBM Plex Sans Thai body), monospace for figures only.

**The signature** is one shared 0–48 GB ruler running down the whole page with a continuous
saffron line at your machine's ceiling. Bars stopping short of it run; bars crossing it don't.
Models that fit only by spilling into RAM split *at* the line — saffron for the VRAM part, clay
for the overflow.

First version was a 13-model mockup with thresholds I invented. **You correctly called that too
thin, and it was rebuilt**: all 83 models scored by the project's real `evaluateModelComplete`,
plus search, five filters, five sort modes, S–F grade chips, capability badges, and
provider/params/context/license/age per row. Using the real engine immediately showed things the
mock could not — GPT-OSS 20B grades A at 104 t/s while a dense 24B grades C at 16 t/s, because
MoE active parameters drive speed.

Verified: 44 comfortable / 16 tight / 6 offload / 17 won't run on an RTX 4060 Ti, filters return
exactly those sets, mobile layout reflows, build and tests pass.

**Note:** this is a proposal page only. The real home page is untouched.

### 3. Google Flow briefs

Both files instruct generating **artwork only, never the text** — generative models mangle Thai
vowel and tone marks. You set the wordmark in Chakra Petch afterwards. The logo is the limit line
cutting a measure bar; the banner is the ruler as a staircase.

### 4. Deployment moved off Vercel

`@astrojs/vercel` → `@astrojs/node` standalone, `site:` now ainaidee.com (overridable via
`SITE_URL`), `vercel.json` removed with its redirects ported to the Caddyfile.

**Verified:** the built site runs under plain Node — pages, model pages, OG images, sitemap, and
both GET and POST API routes all respond. Also verified against a *minimal* tree containing only
`dist/` and `@libsql/client`, which is exactly what the runtime image will contain.

**Not verified at the time:** the Docker image itself. No Docker on this Mac. That build happened
2026-07-31 — see the session above.

---

## Decisions made, and why

| Decision | Reason |
|---|---|
| Docker rather than installing Node on the host | The *build* needs Node 24 + pnpm + native sharp/resvg to render 83 OG images. Multi-stage keeps all of it out of the runtime and off your host. |
| `@astrojs/node`, not a static-only build | Keeps all five API routes working. Static would have meant deleting three POST endpoints. |
| Adapter pinned to **10.1.0** | 10.1.4 and 11.x import Astro internals absent from Astro 6.3.3 and fail the build, despite claiming compatibility. |
| `bookworm-slim`, not Alpine, for the builder | `sharp` and `@resvg/resvg-js` need glibc; musl builds break repeatedly. |
| App published on `127.0.0.1:4321`, not `0.0.0.0` | Caddy reaches it over the compose network. Loopback also lets an existing host proxy take over if you already run one. |
| Runtime image carries one dependency | The built server imports only `@libsql/client`. Everything else is bundled or build-time only. |
| Design page is standalone, no `Layout.astro` | So it cannot collide with the upstream stylesheet before you have approved the direction. |

---

## Blocked on you

1. **DNS pointed at `203.0.113.10`** before Caddy/TLS can go on — it requests the certificate on
   startup and fails if the A record hasn't propagated. Confirm whether you want `www` too.
2. **A real email for Let's Encrypt** to replace `admin@ainaidee.com` in the `Caddyfile`.
3. **Is anything else on that server already using ports 80/443?** It's a shared box running ~11
   other containers. If something's already there, keep Caddy off and point your existing proxy at
   `127.0.0.1:8587` instead.
4. **Turso telemetry on or off?** Off by default; everything works without it. If on, put the
   tokens in `.env` **on the server** — do not paste them into chat.
5. **Manual or automatic deploys?** Right now it's manual: edit locally, scp the changed files up,
   `docker compose up -d --build` over SSH. `git pull` on the server is an option once you're
   comfortable giving that box pull access to the repo.
6. **Do you want the design applied to the real home page?** `/design` is still a proposal, now
   confirmed working (including with an ad blocker on) at http://203.0.113.10:8587/design.

---

## Next up, roughly in order

1. Point DNS at the server, put a real email in the `Caddyfile`, set `SITE_URL` to the real domain
   in `.env` **and rebuild** (it's baked in, not read at runtime), then
   `docker compose --profile tls up -d`.
2. Apply the design direction to the real home page (`ModelListContent.astro` is 2,279 lines — this
   is the big one) and `Layout.astro`. Keep the `nd-` class prefix convention, not `ad-`.
3. Add Thai/SEA models: Typhoon, OpenThaiGPT, SeaLLM, WangchanX. One entry each in
   `packages/models/src/index.ts`; quantisation sizes derive automatically from the parameter count.
4. Localise the site copy to Thai.
5. The fine-tuning / LoRA feasibility mode from `idea.md` — "can my machine *train* this?", which
   is the differentiator upstream does not have.
6. Blog + the SEO work.
7. Rename `canirun-ai` / `@canirun/*` to AiNaiDee.

---

## Quick sanity check when resuming

```bash
pnpm install
pnpm test                  # 200 tests, ~1.5s
pnpm dev                   # localhost:4321 — then open /design
pnpm build && node dist/server/entry.mjs   # production server on :4321
```

---

## Rendered version

The same status plus the deployment diagrams, rendered and readable on a phone:
**https://claude.ai/code/artifact/04b81247-aa93-4d9a-9da0-fd017ca76ab5**

(Private to your account unless you share it. Mermaid needs rendering to be useful, which is why
this exists alongside the markdown.)
