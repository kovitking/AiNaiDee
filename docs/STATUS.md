# AiNaiDee — project status

**Last updated: 2026-08-09.** Start here when picking the project back up.

---

## SEO pass — 2026-08-09

STATUS.md previously said "SEO work for the rest of the site — still unstarted," which overstated
the gap: per-page titles/descriptions, canonical URLs, OG/Twitter tags, and a configured sitemap
(`@astrojs/sitemap`, `astro.config.mjs`) already covered every page. Audited before touching
anything (see "What's next" below for what's genuinely still open); this pass covered three
concrete gaps found during that audit, plus one bug:

- **`public/robots.txt` pointed at the wrong domain** (`https://canirun.ai/sitemap-index.xml` —
  a fork leftover the 2026-08-01 de-branding sweep missed, since it's a static file copied as-is
  rather than built HTML). Replaced with `src/pages/robots.txt.ts`, a dynamic endpoint deriving the
  sitemap URL from `Astro.site` — same "derive from `Astro.site`, never hardcode" convention already
  used for JSON-LD/OG elsewhere in this repo, so it survives future `SITE_URL` changes automatically.
- **`<html lang="th">` on 8 English-only templates.** `Layout.astro` always accepted a `lang`/`locale`
  prop, these pages just never passed one, so they inherited the Thai default despite English visible
  content: `why`, `compare`, `tier`, `docs`, `license/[id]`, `blog/index`, `blog/[slug]`,
  `device/[id]`. Fixed by passing `lang="en" locale="en_US"` explicitly on each. **`playground.astro`
  was deliberately left alone** — its title/description are genuinely Thai (per the localization
  work already tracked below), so `lang="th"` there is correct, not a bug.
- **JSON-LD added to the 7 templates that had none**: `why`/`docs` → `WebPage`/`DefinedTermSet`,
  `compare`/`tier`/`playground` → `WebApplication` (matching the pattern home/model/device pages
  already use), `license/[id]` → `WebPage` + `BreadcrumbList` (matching `model/[id]`'s `@graph`
  pattern), `blog/index` → `Blog` with a `blogPost` list (skipped when no real posts are published
  yet, so it doesn't emit an empty schema during the Ghost "coming soon" state).
- **Per-page OG images for `tier`, `device/[id]`, `license/[id]`** — previously these silently fell
  back to the homepage's share card, so sharing a license page or a device page looked identical to
  sharing `/`. New satori endpoints: `src/pages/og/tier.jpg.ts` (static, S–F grade chips),
  `src/pages/og/device/[id].jpg.ts` (per-device name, from `getAllDeviceSlugs()`),
  `src/pages/og/license/[id].jpg.ts` (per-license name + open/partial/restricted tier badge) — all
  follow the existing `src/lib/og.ts` satori+resvg+sharp pattern from `og/[id].jpg.ts`/`og/home.jpg.ts`.
  Verified in the actual build output (`dist/client/og/tier.jpg`, `.../og/license/apache-2-0.jpg`,
  275 device images), not just that the build didn't error.
- **Follow-up, same day**: `og/home.jpg`'s stale "Can I Run AI locally?" tagline (flagged above) was
  confirmed and fixed. `src/lib/og.ts`'s font loader was `Inter`-only, which has no Thai glyphs — so
  fixing the Thai homepage's OG image needed a Thai-capable font, not just new copy. Extended
  `getFonts()`/`renderOgImage()` to accept a `lang: "th" | "en"` (defaults `"en"`, so every existing
  caller is unchanged) and fetch **IBM Plex Sans Thai** for `"th"` — the same Thai body font already
  used elsewhere on the site (`design.astro`, `playground.astro`), not a new typeface — via the same
  Google Fonts CSS2 + spoofed-UA-for-TTF trick `loadGoogleFont` already used for Inter. `og/home.jpg.ts`
  now renders the real Thai brand line ("เครื่องคุณรัน AI ตัวไหนได้บ้าง?", matching `Layout.astro`'s
  actual default title) with `renderOgImage(el, "th")`. Since `/` and `/en/` previously both silently
  shared one English-only image, split it: **`og/home-en.jpg.ts`** is new (the old English content,
  headline reworded to match `en/index.astro`'s real title "Which AI can your machine run?"), and
  `en/index.astro` now passes `image="/og/home-en.jpg"` explicitly instead of falling through to the
  Thai-default image prop. Verified by rendering both and reading the actual JPEGs — Thai tone marks
  and vowels render correctly, no tofu/missing-glyph boxes.
- **Still not done**: `why`/`compare`/`docs`/`playground` still use the default home OG image (lower
  priority than tier/device/license were — they're not per-entity pages, so a custom image
  differentiates less). `blog/[slug].astro`'s feature image still uses `alt=""` unconditionally
  instead of `post.title`/`post.excerpt`.

---

## Fine-tuning feasibility mode (LoRA/QLoRA/Full) — 2026-08-09

First cut of `idea.md`'s differentiator: "if I fine-tune this with LoRA, does my hardware hold up?"
Landed on the model detail page only (`/model/[id]`), not yet the home page's full model list.

- **`packages/compatibility/src/training.ts`** (new file, re-exported via `index.ts`'s `export *`,
  same pattern as `ui.ts`/`device-slugs.ts` already being separate files in that package): three
  `bytesPerParam` + `baseOverheadGB` profiles for `qlora`/`lora`/`full`, fitted to published/commonly-
  cited reference points rather than invented — QLoRA constants match Dettmers et al. 2023 (QLoRA
  paper, Table 9: 7B≈5.4GB, 13B≈9GB, 33B≈21GB, 65B≈41GB); LoRA and full-fine-tune constants match the
  standard mixed-precision memory breakdown (fp16 weights+grads, fp32 master+AdamW moments) and the
  commonly cited "~16GB to LoRA a 7B" / "~120GB to fully fine-tune a 7B" figures. `estimateTrainingVRAM()`
  scales the overhead term (not the base term) by context length and batch size — activation memory is
  the part that actually grows with those. `evaluateTrainingComplete()` reuses the existing
  `evaluateModel`/`computeScore`/`scoreToGrade` fit pipeline (same S–F grading inference already uses)
  rather than inventing a parallel one — training has no tok/s-equivalent metric, so `computeScore`
  gets `toksPerSec: null` and falls back to its existing status-based default. 10 new tests in
  `tests/training.test.ts`, anchored to the same published numbers as the formula comments.
- **UI**: `model/[id].astro` gained a "Fine-tuning" sidebar section (icon: new `src/icons/sliders.svg`,
  no existing icon fit) with a QLoRA/LoRA/Full toggle, wired into the page's existing client-side
  hardware-detection lifecycle (`detectedHW`/`currentHW`, the same state the "Your Hardware" section
  and quant-row grading already update from) — so switching device/RAM/bandwidth overrides updates
  both sections together. Verified live in-browser: an Apple M4 (16GB unified) shows QLoRA on
  Llama 3.1 8B as 6GB/feasible, LoRA as 18GB/too heavy, Full as 132GB/too heavy — matches the formulas
  by hand.
- **Deliberately out of scope for this pass** (see `docs/idea.md`'s "Next up" item 4, still open):
  no toggle on the home page's model list/grid, no training-mode entry in `compare`/`tier`, no
  dataset-size or GPU-count guidance beyond a single-device VRAM number. The model detail page was
  the smallest surface that answers the actual question idea.md asks ("can my machine train this
  model") without redesigning the list/grid pages, which is a separate, larger piece of work.

---

## Dev/deploy loop sped up — 2026-08-02

Three separate speed problems, addressed separately (see `CLAUDE.md` "Commands"/"Deployment" for the
lasting reference; this entry is just the changelog):

1. **Local iteration never needed Docker** — `pnpm dev` (HMR, ready ~1s) was always the right loop;
   Docker in this repo exists only to keep the build toolchain out of the runtime image, not for dev
   isolation. Documented explicitly in `CLAUDE.md` so it doesn't get reached for by habit. No code
   changed — the capability already existed.
2. **Deploy loop replaced, cutover done on production**: the old 5-step manual `git archive | ssh
   ... tar -x` → copy `.env` by hand → swap directory → `docker compose build/up` is gone. You ran
   the new clone-build-smoke-test-swap flow by hand on the real server: **~23s of downtime, every
   check passed.** `~/apps/ainaidee` is now a real `git clone`, kept that way by every future deploy
   re-cloning fresh — not the old tarball checkout.

   The scripts have been rewritten to match that validated flow exactly (`scripts/deploy-server.sh`:
   clone into a staging dir → `docker compose build app` → smoke-test on an isolated port `18587`,
   never the public one → only then swap directories and `docker compose up -d app`, touching nothing
   else). Trigger from a dev machine with `scripts/deploy.sh`.

   **Rollback bug found and fixed**: the first draft of `rollback-server.sh` just `cd`ed into the
   backup directory and ran `docker compose up -d app` there — wrong, because Compose derives the
   network name from the *directory* name. Running in place from a differently-named directory starts
   a container on a different network than Caddy expects, so it comes up but Caddy can't reach it.
   Fixed: rollback now `mv`s the backup directory back to the live path first, mirroring the deploy
   swap in reverse, before rebuilding and starting it.

   **Host/IP no longer lives in any committed script.** `scripts/deploy.sh`/`rollback.sh` (dev-machine
   side, the ones that need to know where to SSH) read `DEPLOY_USER`/`DEPLOY_HOST` from env or a
   gitignored `scripts/deploy.local.env` (template: `scripts/deploy.local.env.example`) — nothing
   server-specific is hardcoded in a file that gets committed. `scripts/deploy-server.sh`/
   `rollback-server.sh` (server side) never needed the server's own address to begin with. Given the
   IP leak this repo already had once (see "แก้ IP leak แล้ว" below), new scripts don't get a pass on
   this just because the value would "only" be the safe placeholder.

   `docs/deploy.md` and this file's "Blocked on you" #5 updated to match. Old archive-based directory
   kept as a timestamped backup on the server rather than deleted, per the new script's own behavior.

   Self-hosted Docker on this same server is the settled choice going forward — not moving to Vercel
   or another PaaS. This work was about making that loop better, not about re-opening that decision.
3. **OneDrive I/O overhead** — separate root cause, not fixed by either of the above. Measured `pnpm
   test` at 28s (normally ~1.5s) and `pnpm packages:build` hanging 2+ minutes at near-zero CPU, on
   the Mac this time (previously only seen as a Windows issue). Recommended fix documented in
   `CLAUDE.md`'s "Windows toolchain notes": move the working copy out of the OneDrive-synced tree on
   both machines, use `git push`/`pull` between them instead of file sync. **Not yet done** — this is
   a filesystem action on each machine, outside what a repo change can do.

---

## Deploy สำเร็จ + เจอบั๊ก SITE_URL เดิม — 2026-08-01 ดึกมาก

Push `main` ขึ้น `origin` แล้ว, deploy ขึ้น production จริงแล้วด้วย archive-and-swap ตามขั้นตอนเดิม
(`~/apps/ainaidee` เดิม → backup `ainaidee_backup_20260801_153151`, ของใหม่สลับเข้าแทน) ยืนยันแล้วว่า
`ainaidee.com`, `ainaidee.com/en/`, `www.ainaidee.com`, `blog.ainaidee.com`, `/why` (หน้าที่ไม่ได้แตะ)
ตอบ 200 ปกติหมด

**เจอบั๊กเดิมที่มีอยู่ก่อนหน้านี้แล้ว (ไม่เกี่ยวกับงานวันนี้โดยตรง แต่เจอระหว่างตรวจ deploy)**:
`SITE_URL` ไม่เคยถูกตั้งค่าจริงใน `.env` บน server เลยตั้งแต่แรก (เช็คแล้วว่า `.env` เดิมก่อน deploy
วันนี้ก็ไม่มีเหมือนกัน) เว็บเลยพึ่ง fallback default ใน `docker-compose.yml` (`${SITE_URL:-...}`)
มาตลอด ซึ่งก่อนหน้านี้ค่า fallback เป็น IP ภายในจริง (`172.16.57.192:8587`) — sitemap/canonical/OG
image/hreflang เลยชี้ผิดเป็น IP แทนโดเมนจริงมาตลอด ไม่มีใครสังเกตเห็น พอ session เช้านี้แก้ IP leak
(เปลี่ยนค่า fallback เป็น placeholder `203.0.113.10`) บั๊กเดิมนี้เลยโผล่ชัดขึ้น (sitemap ชี้ไป IP
ปลอมแทน) ตรวจเจอตอน verify deploy วันนี้ แก้แล้วโดยเพิ่ม `SITE_URL=https://ainaidee.com` ใน `.env`
บน server จริง แล้ว rebuild+redeploy ใหม่อีกรอบ (`SITE_URL` bake ตอน build ไม่ใช่ runtime เปลี่ยนแล้ว
ต้อง rebuild เสมอ) ยืนยันแล้วว่า sitemap/canonical/OG ทั้งหมดชี้ `https://ainaidee.com` ถูกต้องแล้ว

**บทเรียน**: `docker-compose.yml`'s fallback default ควรเป็นแค่ safety net เท่านั้น ไม่ควรพึ่งมันจริงจัง
— `.env` บน productionควรตั้ง `SITE_URL` ให้ชัดเจนเสมอ ไม่งั้นจะเงียบๆ พังแบบนี้อีกได้ถ้า
`docker-compose.yml`'s fallback เปลี่ยนอีกในอนาคต

---

## เว็บสองภาษาแล้ว (infra + หน้าแรก) — 2026-08-01 เซสชันดึก

**หน้าแรกเป็นสองภาษาจริงแล้ว**: `/` = ไทย (default, ไม่มี prefix), `/en/` = อังกฤษ, สลับได้ผ่านปุ่ม
`[English]`/`[ไทย]` ใน nav (บนสุดขวา, ทั้ง desktop และ mobile menu) เลือกแนวทาง Astro native i18n
routing + dictionary object ต่อ component (ไม่ใช่ client-side toggle เพราะ SEO แย่กว่า, ไม่ใช่
duplicate ไฟล์เต็มเพราะโค้ดซ้ำเยอะเกิน) คุณเลือกให้ไทยเป็น default ไม่มี `/th/` prefix เพราะเน้น
คนไทยเป็นหลักแต่อยากได้ traffic ต่างประเทศด้วย

**ขอบเขตรอบนี้ (ตั้งใจทำแค่ pilot)**: infra (i18n config, dictionary, language switcher) + หน้าแรก
เต็มรูปแบบ (`index.astro`, `NavHeader`, `Footer`, `ModelListContent` ทั้งไฟล์ 2,269 บรรทัด ทั้ง
template และ inline `<script>`) — หน้าอื่นทั้งหมด (`why`, `compare`, `tier`, `docs`, `license/*`,
`blog/*`, `model/[id]`, `device/[id]`, playground UI) **ยังไม่แตะ** ยังเป็นแบบเดิมทุกอย่าง (ส่วนใหญ่
ไทยแล้วจาก session ก่อน ยกเว้นหน้าที่ระบุไว้ใน CLAUDE.md ว่ายังไม่แปล) — ทำต่อ session หน้าได้เลย
โดยใช้ pattern เดียวกัน (ดู "ไฟล์ที่เกี่ยวข้อง" ด้านล่าง)

ไฟล์ใหม่/แก้ที่สำคัญ:

- `astro.config.mjs` — เพิ่ม `i18n` block (`defaultLocale: 'th'`, `locales: ['th','en']`,
  `prefixDefaultLocale: false`) และ `sitemap()` i18n options (ให้ sitemap ออก `hreflang` alternate
  คู่ `/` กับ `/en/` อัตโนมัติ — ตรวจแล้วว่าคู่อื่นไม่ได้ alternate มั่วเพราะยังไม่มีคู่อื่นจริง)
- `src/i18n/ui.ts` (ใหม่) — dictionary หลัก `ui.th.*` / `ui.en.*` แบ่ง namespace ตาม component
  (`nav`, `footer`, `home`, `modelList`) + `useTranslations(lang)` helper คืนฟังก์ชัน `t(key)`
  แบบ dotted-path พร้อม fallback กลับไทยถ้า key หาย
- `src/i18n/useCases.ts` (ใหม่) — ย้าย `USE_CASE_TH` เดิมมาเป็น `USE_CASE_LABELS.th`/`.en` +
  `useCaseLabel()` **หมายเหตุ**: `src/pages/design.astro` (หน้า demo เก่าที่ไม่ใช้แล้ว) ยังมี
  `USE_CASE_TH` สำเนาของตัวเองแยกอยู่ ตั้งใจไม่แตะเพราะหน้านั้น stale อยู่แล้ว
- `src/layouts/Layout.astro` — `lang`/`locale` prop เปลี่ยนจาก hardcode `"en"` เป็น derive จาก
  `Astro.currentLocale` (fallback `"th"`) ผลข้างเคียงที่ตั้งใจ: หน้าที่ยังไม่แปล (why/compare/ฯลฯ)
  เคยส่ง `<html lang="en">` ทั้งที่เนื้อหาเป็นไทยมาตลอด ตอนนี้ถูกต้องแล้วโดยไม่ต้องแตะเนื้อหาเลย
  เพิ่ม `hasTranslation` prop คุม `hreflang` link (th/en/x-default) — false เป็นค่าเริ่มต้น มีแค่
  `/` กับ `/en/` ที่ส่ง `true`
- `src/components/NavHeader.astro` / `Footer.astro` — เพิ่ม `lang` prop, ดึงข้อความผ่าน `t()`,
  NavHeader เพิ่ม language switcher (คำนวณ URL ด้วย `astro:i18n`'s `getRelativeLocaleUrl`) ที่โชว์
  เฉพาะหน้าที่ `hasTranslation` เป็น true เท่านั้น (กันไม่ให้กดแล้วไป 404)
- `src/components/ModelListContent.astro` — แปลครบทั้งไฟล์ ~162 string ใน template +
  ~19 string ใน inline script เจอบั๊กเดิม 2 ตัวระหว่างทาง แก้ไปด้วย: (1) tooltip RAM ระบบฝั่ง
  non-Apple เคยลืมแปลเป็นไทยตั้งแต่รอบแปลก่อน (มันเป็นอังกฤษอยู่แม้บนหน้าไทย), (2) badge ดาว
  "ยอดนิยม" ไม่เคย render เลยเพราะ JSX tag พัง (`<i ... title="ยอดนิยม"` ขาด `>` ปิด ทำให้
  `<IconStar>` โดนกลืนเป็น attribute แทนที่จะเป็น element) — แก้ทั้งคู่แล้ว ยืนยันด้วยสกรีนช็อตว่า
  badge ดาวโชว์ถูกต้องทั้งสองภาษา
- `src/pages/index.astro` — ส่ง `lang="th"` + `hasTranslation={true}` ชัดเจนแทนการพึ่ง default
- `src/pages/en/index.astro` (ใหม่) — หน้า `/en/` เอง English hero copy กู้คืนจาก git history
  commit `4e5fa9f` (ก่อนแปลไทยรอบแรก, branding ถูกต้องอยู่แล้วไม่ต้องแก้)

**บั๊กที่เจอระหว่าง verify ในเบราว์เซอร์จริง (ไม่ใช่แค่ build ผ่าน)**: ตอนแรก inline `<script>` ใน
`ModelListContent.astro` อ่าน `data-i18n` JSON แค่ครั้งเดียวตอน module โหลด (`const I18N = ...`
ที่ top level) — ใช้งานได้ตอนโหลดหน้าตรงๆ แต่พอกด switcher เปลี่ยนภาษาผ่าน Astro ClientRouter
(SPA-style view transition) สคริปต์ตัวเดิมไม่ได้ reload ใหม่ ค่า label เกรด/tooltip เลยค้างเป็น
ภาษาเดิม (เช่น กด `/` → `/en/` แล้ว badge เกรดยังโชว์ "พอใช้" แทน "OK") แก้โดยย้าย parsing เข้าไปใน
`astro:page-load` handler ที่มีอยู่แล้ว (re-run ทุกครั้งที่เปลี่ยนหน้าแบบ SPA) เปลี่ยน `I18N`/`GRADES`
จาก `const` เป็น `let` ที่ reassign ใหม่ทุกรอบ — ยืนยันแก้แล้วด้วยการกด switcher สลับไปมาจริงในเบราว์เซอร์
**บทเรียนสำหรับหน้าอื่นที่จะทำต่อ**: ถ้าหน้าไหนมี inline script ที่ต้องรู้ภาษา ต้องเช็ค pattern นี้ด้วย
ไม่ใช่แค่เช็คว่า build ผ่าน/หน้าแรกโหลดถูก

ยืนยันแล้ว: `pnpm build` สำเร็จ, `dist/client/en/index.html` ถูกสร้างจริง, sitemap มี `hreflang`
alternate คู่ `/` กับ `/en/` ถูกต้อง (หน้าอื่นไม่มี alternate มั่ว), `pnpm packages:typecheck` และ
`pnpm test` (200 tests) ผ่านหมด, เปิดเบราว์เซอร์จริงทดสอบ hardware detection (Apple M4) ทั้งสองภาษา
กด switcher สลับไปมาทั้งสองทิศทาง เนื้อหาถูกต้องครบ (nav, footer, hero, hardware panel, grade
summary, model rows, ปุ่ม/tooltip แบบ dynamic ที่มาจาก script) ตรวจ `/why` (หน้าที่ไม่ได้แตะ) ว่ายัง
ทำงานปกติและไม่มี switcher โผล่มา (ตามที่ตั้งใจ)

---

## แก้ IP leak แล้ว — 2026-08-01 เซสชันค่ำ

**เลือกทางเลือก (ข) rewrite git history** จาก 3 ทางเลือกที่ค้างไว้ (ดูหัวข้อถัดไปสำหรับบริบทเดิม).
เหตุผล: scrub ไฟล์ปัจจุบันอย่างเดียวยังเห็น IP จริงผ่าน `git log -p`/`git blame` ได้, private repo
ปิดโอกาส contribute — rewrite แก้ที่ต้นตอสุด ยอมรับ trade-off ว่าทุกคนที่เคย clone ต้อง clone ใหม่
(repo ใหม่พอสมควร โอกาสมีคนอื่น clone ไปแล้วต่ำ).

ขั้นตอนที่ทำ:

1. แก้ไฟล์ปัจจุบันทั้ง 7 ไฟล์ที่มี IP/username จริง แทนที่ด้วย `203.0.113.10`
   (RFC 5737 TEST-NET-3, IP ตัวอย่างมาตรฐานสำหรับเอกสาร) และ `deploy@` ทั่วทั้ง repo
2. ใช้ `git-filter-repo --replace-text` (ติดตั้งผ่าน `brew install git-filter-repo`) รัน replace
   เดียวกันย้อนไปทุก commit ทุก branch (`main`, `design-visual-direction-rollout`, `ainaidee/setup`)
3. Force-push ทับ `origin/main` และทุก branch ที่เคย push ไว้

**ผลที่ตามมาที่ต้องรู้**: ทุก commit hash ในประวัติเปลี่ยนหมด (เพราะ filter-repo เขียน tree/commit
object ใหม่ทั้งสายตั้งแต่จุดแรกที่มี string โดนแทนที่) — clone เก่าที่มีอยู่ (ถ้ามี) จะ diverge จาก
`origin` ทันที ต้อง `git clone` ใหม่ ไม่ใช่ `git pull`/`fetch` ต่อยอดของเดิม เครื่อง server deploy
เองก็ deploy จาก `git archive` ไม่ใช่ `git pull` อยู่แล้วตาม "Deploy loop" ใน `CLAUDE.md` เลยไม่กระทบ

---

## สรุปสั้นๆ (อ่านก่อน) — 2026-08-01 เซสชันช่วงบ่าย/เย็น

**ดีไซน์ใหม่ขึ้นเว็บจริงแล้วครับ** หน้าแรกทั้งเว็บเปลี่ยนจากธีมเขียว/ดำเดิม (upstream CanIRun.ai)
เป็นดีไซน์ indigo/saffron ตาม `/design` ที่อนุมัติไว้แล้ว — เลย์เอาต์เปลี่ยนจาก card grid เป็น
row+ruler เส้น saffron บอกขีดจำกัดเครื่อง ผ่าน PR #1 บน GitHub, merge แล้ว, deploy ขึ้น
`ainaidee.com` จริงแล้ว ยืนยันด้วยการเปิดเบราว์เซอร์ทดสอบเอง: ค้นหา, ตัวกรองครบ 5 ตัว, แก้
hardware override ผ่าน dropdown, quant switch ต่อแถว, `/device/:slug` routing ทำงานถูกต้อง

ทำเสร็จรอบนี้:

1. **Apply `/design` ทั้งเว็บ** — งานใหญ่สุดของวัน ส่งผ่าน Ultraplan (cloud Claude Code session)
   ทำตาม plan ที่เขียนไว้ก่อน แล้ว merge เข้า `main` เจอ edge case ระหว่างทาง: cloud session ไม่มี
   สิทธิ์ push ขึ้น GitHub เอง (token ติด scope ไม่ครบ) แก้ด้วยการให้มัน `git bundle` โค้ดที่ทำเสร็จ
   ออกมา แล้วเครื่องนี้ดึงเข้ามา verify ซ้ำเอง (test/typecheck/build/smoke-test) ก่อน push+เปิด PR
   จริง งานครอบคลุม: เปลี่ยน theme tokens ทั้งเว็บ (`src/styles/global.css`, ดรอป light mode),
   เขียน `ModelListContent.astro` ใหม่เป็น row+ruler พร้อมคง feature เดิมครบ (hardware override
   editor, `/device/:slug` routing, quant switch, keyboard nav, speed-preview popup, URL-synced
   filters/sort), ไล่แก้สี hardcode ที่เหลือใน `tier.astro`/`why.astro`/`docs.astro`
2. **แก้ branding ค้าง "CanIRun.ai"** ที่ title ของ `/model/[id]` และ `/device/[id]` (หลุดมาตั้งแต่
   ก่อน fork นี้ ไม่เกี่ยวกับ design rollout — เจอระหว่างเปิดเบราว์เซอร์ตรวจ PR)
3. **แก้ Ghost admin login พังถาวร** — สาเหตุจริงคือ browser ทิ้ง session cookie เพราะตั้ง `Secure`
   ตาม site url ที่เป็น https แต่เปิด admin ผ่าน `http://localhost` (SSH tunnel) คนละ origin กัน
   ไม่ใช่เรื่อง credential ผิด แก้โดยเปลี่ยนมา route `/ghost*` ผ่าน `blog.ainaidee.com` ด้วย Caddy
   แทน (บังคับ header `X-Forwarded-Proto: https` เพราะ Imperva forward มาเป็น http ธรรมดา) และปิด
   `staffDeviceVerification` เพราะไม่มี SMTP ให้ส่งโค้ด 2FA ทางเมล ต่อ Ghost Content API key ให้
   `/blog` ดึงโพสต์จริงจาก Ghost แล้ว (เลิกโชว์ "coming soon") — ตอนนี้มีแค่โพสต์ตัวอย่างของ Ghost
   เอง ("Coming soon") ยังไม่มีโพสต์จริงที่คุณเขียน **จำไว้**: โพสต์ถูก fetch ตอน build time ไม่ใช่
   runtime เขียน/แก้โพสต์ใหม่ทีไรต้อง rebuild image ใหม่เสมอ ไม่ใช่แค่ restart
4. **เริ่มแปลเว็บเป็นไทย** — คงศัพท์เทคนิคเป็นอังกฤษตามที่สั่ง (GPU/VRAM/RAM/WebGPU/เกรด S-F/
   Q4_K_M/MoE) แปลครบแล้ว: หน้าแรกทั้งหมด (hero, hardware panel, ตัวกรอง, สรุปเกรด, meta ของแต่ละ
   โมเดล, วันที่แบบสัมพัทธ์), NavHeader, Footer, หน้า Playground (คำอธิบายการใช้งาน 3 ขั้นตอน) —
   **ยังไม่แปล**: `/why`, `/compare`, `/tier`, `/docs`, `/license/*`, `/blog/*`, หน้า
   `/model/[id]` และ `/device/[id]`, และ UI ลึกของหน้า Playground เอง (ปุ่ม New chat, Settings ฯลฯ)
   — ยังเป็นภาษาอังกฤษทั้งหมด รอทำต่อ
5. **เอาไอคอน GitHub ออกจาก nav กับ footer** — ดูหัวข้อถัดไป **ยังไม่ได้แก้ที่ต้นตอ**
6. **คุณแก้ nginx เองสำเร็จ** — apex domain (`ainaidee.com` ไม่มี `www`) เคย fallback ไปเจอไซต์
   Netpoleon เพราะ `server_name` เดิมไม่ครอบ apex คุณเพิ่ม `ainaidee.com` เข้า `server_name` เอง
   แล้วได้ผลจริง ยืนยันแล้วว่า `ainaidee.com` กับ `www.ainaidee.com` เนื้อหาตรงกันไบต์ต่อไบต์

**แก้ปัญหาความปลอดภัยนี้แล้ว** (ดูหัวข้อ "แก้ IP leak แล้ว" ด้านบน): repo `kovitking/AiNaiDee` เคย
เป็น public พร้อม IP วง LAN ภายในจริงกับ SSH username จริง ฝังอยู่ใน 7 ไฟล์ที่ commit ไว้แล้ว:
`docker-compose.yml`, `CLAUDE.md`, `docs/STATUS.md` (ไฟล์นี้เองด้วย), `docs/deploy.md`,
`docs/deploy-architecture.md`, `docs/blog-plan.md`, `docs/blog-architecture.md` — ใครก็เห็นได้ ไม่
จำกัดแค่คนในองค์กร แม้ IP นี้เป็น private/เข้าจากอินเทอร์เน็ตตรงๆ ไม่ได้ แต่ก็เปิดเผย network
topology ภายในให้คนนอกเห็น (การเอาไอคอน GitHub ออกจากหน้าเว็บก่อนหน้านี้ไม่ได้แก้ปัญหานี้ — เป็นแค่
การซ่อนลิงก์ ไม่ได้แตะที่ repo เอง) แก้แล้วด้วย git-filter-repo rewrite ทั้ง history ทุก branch แล้ว
force-push ทับ ค่าจริงถูกแทนที่ด้วย placeholder (`203.0.113.10`, `deploy@`) ทั้งในไฟล์ปัจจุบันและ
ย้อนหลังทุก commit

---

## สรุปสั้นๆ (อ่านตอนเช้า) — 2026-08-01

**บล็อกขึ้นจริงแล้ว**: `ghost` + `ghost-db` รันอยู่บนเซิร์ฟเวอร์, `blog.ainaidee.com` ตอบ 200 ผ่าน
Caddy แล้ว (ยังโชว์ "coming soon" เพราะยังไม่มี Ghost owner account/Content API key) หน้าแรก
`ainaidee.com` เปลี่ยน branding จาก "CanIRun.ai" เป็น "AiNaiDee" แล้วด้วย ทุก commit push ขึ้น
`origin/main` เรียบร้อย (`924b82f`, `ec89261`, `f958b88`)

ทำเสร็จวันนี้:

1. **ตั้ง `GHOST_DB_PASSWORD`** ใน `.env` บนเซิร์ฟเวอร์ (คุณตั้งเอง ไม่ผ่านแชท) แล้วเปิด `ghost` +
   `ghost-db` (MySQL 8) — เจอ error ชั่วคราวตอน MySQL ยัง init ไม่เสร็จ (ghost ต่อไม่ติดรอบแรก) แต่
   Docker restart policy จัดการเองจนติด ไม่ต้องทำอะไรเพิ่ม
2. **เจอว่า `docker-compose.yml` บนเซิร์ฟเวอร์เก่ากว่า commit `c9a5f87`** (deploy เดิมเป็น scp ไฟล์
   เดี่ยวๆ ไม่ใช่ git pull) เลย sync ใหม่ทั้ง repo ผ่าน `git archive HEAD` + rebuild image
3. **ค้นพบว่า domain อยู่หลัง Imperva Incapsula (CWAF)** — ตอนแรกพยายามให้ Caddy ขอใบรับรอง TLS เอง
   จาก Let's Encrypt แต่ทำไม่ได้เลย เพราะ Imperva ดัก request ไว้ก่อนถึงเซิร์ฟเวอร์เราเสมอ (ACME
   challenge เลยไปไม่ถึง) — เปลี่ยนแผน: Caddy ไม่ทำ TLS อีกต่อไป (`auto_https off`) แค่ทำหน้าที่แยก
   traffic ตาม Host header บนพอร์ต `8587` เดียว (Imperva เป็นคนทำ TLS ให้อยู่แล้ว และ forward มาที่
   origin `:8587` เหมือนกันทั้ง `ainaidee.com`, `www`, `blog`)
4. **เขียน routing ให้ `blog.ainaidee.com`** — rewrite path เป็น `/blog{uri}` ให้ตรงกับ
   `src/pages/blog/*` พร้อม passthrough สำหรับ `/_astro/*`, `/og/*`, `/blog`, `/favicon.svg` (ไม่งั้น
   ลิงก์/รูป/asset ที่เป็น root-relative path จะ 404 เพราะโดน rewrite ซ้อน)
5. **ปิดไม่ให้ Ghost admin (`/ghost*`) เข้าถึงจากอินเทอร์เน็ตได้เลย** — bind แค่
   `127.0.0.1:2368` เข้าถึงผ่าน SSH tunnel เท่านั้น (`ssh -L 2368:localhost:2368
   deploy@203.0.113.10` แล้วเปิด `http://localhost:2368/ghost`) กันไม่ให้คนอื่นแย่งสร้าง owner
   account ก่อนคุณ
6. **เอา "CanIRun.ai" ออกจากหน้าแรก** — เปลี่ยนเป็น "AiNaiDee" ใน nav logo, `<title>`, og:site_name,
   structured data, และ heading หลัก ยังเหลือแค่ลิงก์ GitHub (`github.com/midudev/canirun.ai`) ที่
   ยังไม่เปลี่ยน เพราะยังไม่มี public repo ของ fork นี้ให้ชี้ไป

**ยังติดอยู่ที่คุณ**:

1. เปิด SSH tunnel แล้วสร้าง Ghost owner account + Content API key เอง (ข้อ 5 ด้านบน) — ส่ง
   `GHOST_URL` + `GHOST_CONTENT_API_KEY` มาแล้วจะ rebuild ให้ `/blog` เลิกโชว์ "coming soon"
2. อยากให้ลิงก์ GitHub เปลี่ยนไปชี้ repo ของ fork นี้ (`github.com/kovitking/AiNaiDee`) แทน
   `midudev/canirun.ai` ไหม
3. รายการเดิมจาก 2026-07-31 ที่ยังไม่ตัดสินใจ (DNS/email TLS กลายเป็นไม่เกี่ยวแล้วเพราะใช้ Imperva
   แทน Caddy ทำ TLS — แต่ข้ออื่นในหัวข้อ "Blocked on you" ด้านล่างยังตรงอยู่)

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

1. **The public-repo internal-IP leak (see above)** — pick a remediation: scrub current files only,
   rewrite git history, or make the repo private. Nothing done here yet beyond removing the GitHub
   link from the site's own nav/footer, which doesn't touch the repo itself.
2. **Write and publish a real first blog post** — `/blog` now pulls live from Ghost, but the only
   post live is Ghost's own default "Coming soon" sample. Remember: posts are fetched at **build
   time**, so publishing in Ghost admin needs a rebuild+redeploy here afterward, not just a Ghost-side
   save.
3. **Is anything else on that server already using ports 80/443?** It's a shared box running ~11
   other containers. If something's already there, keep Caddy off and point your existing proxy at
   `127.0.0.1:8587` instead.
4. **Turso telemetry on or off?** Off by default; everything works without it. If on, put the
   tokens in `.env` **on the server** — do not paste them into chat.
5. ~~**Manual or automatic deploys?**~~ Resolved 2026-08-02: server now runs `scripts/deploy-server.sh`
   — clones `main` fresh into a staging directory, builds and smoke-tests it on an isolated port, and
   only then swaps it in for the live directory and restarts `app` (see "Dev/deploy loop sped up"
   above for the full flow) — instead of the old archive-and-swap. Still triggered by hand from a dev
   machine with `scripts/deploy.sh`, not on every push — full CI/CD auto-deploy is a deliberately
   separate next step, once there's a test/build gate in front of it (see `CLAUDE.md`, "Deployment").
6. **Continue the Thai localization to the rest of the site, or pause here?** See "Next up" below
   for exactly what's left.

---

## Next up, roughly in order

1. **Decide + act on the internal-IP leak** in the public repo (see "Blocked on you" #1). ~~Resolved
   2026-08-01: git history rewritten with `git-filter-repo`, real IP/SSH-username replaced with
   placeholders everywhere, force-pushed to `origin`.~~
2. **Extend bilingual support to the rest of the site**: `/` and `/en/` are done (home page, nav,
   footer — see "เว็บสองภาษาแล้ว" above for the pattern: `src/i18n/ui.ts` dictionary +
   `useTranslations(lang)` + a thin `src/pages/en/<page>.astro` wrapper per page). Still
   English-or-Thai-only, not yet bilingual: `why.astro`, `compare.astro`, `tier.astro`,
   `docs.astro`, `license/[id].astro`, `blog/index.astro` + `blog/[slug].astro` chrome,
   `model/[id].astro`, `device/[id].astro`, and the playground chat UI's own microcopy (New chat,
   Search chats, Settings panel, model picker, etc). Keep the established convention: technical
   terms (GPU, VRAM, RAM, WebGPU, grade letters, quant codes, MoE) stay English in both locales;
   reuse `src/i18n/useCases.ts`'s `USE_CASE_LABELS`/`useCaseLabel()` for task-category labels
   instead of inventing new translations. **Watch for the inline-`<script>` staleness bug** documented
   above — any page whose client-side script needs locale-aware strings must re-read them inside
   the `astro:page-load` handler, not at module top-level, or they'll go stale after a SPA
   navigation between locales.
3. Add Thai/SEA models: Typhoon, OpenThaiGPT, SeaLLM, WangchanX. One entry each in
   `packages/models/src/index.ts`; quantisation sizes derive automatically from the parameter count.
4. ~~The fine-tuning / LoRA feasibility mode from `idea.md`~~ Landed 2026-08-09 on the model detail
   page (see "Fine-tuning feasibility mode" above). Still open: the same toggle on the home page's
   model list/grid, and in `compare`/`tier`.
5. ~~SEO work for the rest of the site~~ First pass landed 2026-08-09 (see "SEO pass" above):
   robots.txt domain bug, `lang` attribute fix on 8 pages, JSON-LD on 7 templates, per-page OG images
   for tier/device/license, home OG image's stale upstream tagline (fixed same day, including adding
   Thai font support to the OG renderer). Still open: OG images for why/compare/docs/playground,
   blog feature-image alt text.
6. Rename `canirun-ai` / `@canirun/*` to AiNaiDee.

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
