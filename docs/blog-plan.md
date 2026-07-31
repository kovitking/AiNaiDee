# แผน Blog — Ghost CMS (headless) + Astro

**สถานะ (2026-07-31): 4 ข้อตัดสินใจตอบแล้ว, โค้ด Phase 1 เขียนแล้วและ build ผ่าน แต่ยังไม่ได้ deploy
ขึ้นเซิร์ฟเวอร์** — ดูหัวข้อ "สิ่งที่ทำแล้ว" กับ "บล็อกอยู่ที่คุณ" ด้านล่างสำหรับสถานะจริงล่าสุด
ส่วนที่เหลือของเอกสารนี้ (การวิเคราะห์, เหตุผล, phase 2/3) ยังใช้ได้เหมือนเดิม

**อัปเดตเดียวกันวันนี้: DB เปลี่ยนจาก SQLite เป็น MySQL แล้ว** (ดูหัวข้อ "1. Database" ด้านล่าง) —
เช็คแล้วว่าเซิร์ฟเวอร์มี Postgres container ของโปรเจกต์อื่นอยู่ (`homegrown-ai-app-demo-db-1`) แต่ใช้กับ
Ghost ไม่ได้ (Ghost ไม่รองรับ Postgres เลย) เลยเพิ่ม MySQL container ของตัวเองแยกต่างหาก

อ้างอิงจาก [case study 30 เว็บ Ghost](https://electronthemes.com/blog/case-study-top-30-successful-ghost-websites)
ที่คุณส่งมา — จุดที่บทความนั้นเน้นคือ **membership/newsletter เป็นตัวขับรายได้หลัก** ไม่ใช่แค่บล็อกอ่านฟรี
เรื่องนี้กระทบสถาปัตยกรรมโดยตรง เลยแยกเป็น phase ให้ตัดสินใจทีหลังได้ว่าจะทำแค่ไหน

---

## สิ่งที่ทำแล้ว (2026-07-31)

- `src/lib/ghost.ts` — wrapper รอบ `@tryghost/content-api`, อ่าน `GHOST_URL` /
  `GHOST_CONTENT_API_KEY` จาก `process.env` (ตามคอนเวนชันเดียวกับ `TURSO_*` ใน
  `src/lib/runai-metrics-store.ts`) ถ้าไม่ตั้งค่า จะ return ค่าว่างเสมอ ไม่ throw
- `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro` — ดึงโพสต์ตอน build, ดีไซน์เข้าชุด
  เว็บหลัก (การ์ด `bg-surface-card`, หัวข้อ `font-pixel`) ตอนนี้ยังไม่มี Ghost จริง เลยแสดงข้อความ
  "blog isn't wired up yet" แทน
- `src/pages/og/blog/[slug].jpg.ts` — OG image fallback (satori) สำหรับโพสต์ที่ไม่มี feature image
- Schema.org `BlogPosting` JSON-LD ต่อโพสต์, ต่อเข้า `<Layout>` เดิม (sitemap/OG/meta ได้อัตโนมัติ)
- เพิ่มลิงก์ `[blog]` ใน `NavHeader.astro`
- `package.json`: `@tryghost/content-api@1.12.10` + `@types/tryghost__content-api@1.3.17`
- `Dockerfile`: เพิ่ม `ARG GHOST_URL` / `ARG GHOST_CONTENT_API_KEY` (build-time เท่านั้น เหมือน
  `SITE_URL` — ปล่อยว่างได้ปลอดภัย ไม่ทำให้ build พัง)
- `docker-compose.yml`: เพิ่ม service `ghost` **และ `ghost-db` (MySQL 8) อยู่หลัง `profiles: ["blog"]`
  — ปิดอยู่ ไม่รันจนกว่าจะสั่ง `docker compose --profile blog up -d` เอง** เหมือนที่ `caddy` อยู่หลัง
  `profiles: ["tls"]`. รหัสผ่าน DB (`GHOST_DB_PASSWORD`) ไม่มีค่า default ในไฟล์ — บังคับให้ต้องตั้งใน
  `.env` บนเซิร์ฟเวอร์ก่อน ไม่งั้น `docker compose` จะฟ้อง error ชัดเจนตอนสั่ง (ทดสอบแล้วว่า error message
  ขึ้นถูกต้องจริง)
- ยืนยันแล้ว: `pnpm build` ผ่าน (30s), `pnpm test` ผ่านครบ 200, `@tryghost/content-api` **ไม่รั่วเข้า
  runtime image** — เช็คจาก `dist/server/` แล้วว่า import แค่ `@libsql/client` เหมือนเดิม (เพราะบล็อก
  fetch ข้อมูลตอน build เท่านั้น ไม่ query ตอน request)
- ยืนยัน syntax `docker-compose.yml` ผ่าน `docker compose config --quiet` บนเซิร์ฟเวอร์จริงแล้ว ทั้งกรณี
  ไม่มี `GHOST_DB_PASSWORD` (ฟ้อง error ตามที่ตั้งใจ) และมี (resolve ผ่านสะอาด) — แค่ validate ไม่ได้สั่ง
  `up` container ยังไม่ถูกสร้างสักตัว

**สิ่งที่เจอระหว่างเขียนโค้ด ที่กระทบข้อตัดสินใจของคุณ** — ดูหัวข้อ "SQLite" กับ "blog.ainaidee.com"
ด้านล่าง ทั้งสองข้อมีรายละเอียดที่ตอนถามคำถามยังไม่รู้

---

## ทำไมถึงเลือก Ghost แบบ headless (ไม่ใช้ theme ของ Ghost เอง)

Ghost ทำหน้าที่แค่ "ที่เก็บ+เขียนเนื้อหา" (CMS) ส่งข้อมูลออกมาเป็น JSON ผ่าน **Content API**
ส่วนหน้าเว็บที่ user เห็นจริงยังคงเป็น Astro เหมือนเดิม เหตุผล:

- เว็บทั้งเว็บใช้ดีไซน์ระบบเดียว (คราม/bone/saffron, ฟอนต์ Chakra Petch + IBM Plex ตาม
  `docs/design-direction.md`) ถ้าใช้ theme ของ Ghost เอง จะเป็นเว็บคนละหน้าตาแปะต่อกัน
- SEO ของเว็บหลักใช้ `@astrojs/sitemap` + Schema.org ที่ทำไว้แล้ว บล็อกควรอยู่ใน sitemap เดียวกัน
  ไม่ใช่ sitemap แยกจาก Ghost
- OG image ของเว็บหลักสร้างเองด้วย satori (`src/lib/og.ts`) บล็อกก็ควรใช้ pipeline เดียวกัน
  หรืออย่างน้อยหน้าตาต้องเข้าชุดกัน ไม่ใช้ default OG image ของ Ghost
- ผู้เชี่ยวชาญด้าน Astro+Ghost ยืนยันว่านี่เป็นแพทเทิร์นมาตรฐาน — official
  [Astro CMS guide สำหรับ Ghost](https://docs.astro.build/en/guides/cms/ghost/) รองรับโดยตรง

Ghost ตัวมันเองแค่เป็นแอดมินหลังบ้านสำหรับเขียน/จัดการโพสต์ ไม่มีใครเข้าหน้า Ghost โดยตรงนอกจากทีมเขียน

---

## ต้องเพิ่มอะไรบ้าง (ภาพรวม)

| ส่วน | ของใหม่ที่ต้องเพิ่ม |
|---|---|
| Container | `ghost` (official image) — เก็บเนื้อหา จัดการผ่านหน้าแอดมิน + `ghost-db` (MySQL 8) แยก container |
| Storage | Content volume (รูป/ไฟล์แนบ) + MySQL volume (โพสต์/ผู้ใช้/ตั้งค่า) — คนละ volume กัน |
| Astro | route ใหม่ `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro` — ดึงโพสต์จาก Content API ตอน build |
| Package | `@tryghost/content-api` ใน `package.json` ของเว็บหลัก (ไม่ใช่ dependency รันไทม์ฝั่ง server — ดึงข้อมูลตอน build เท่านั้น) |
| Rebuild trigger | Ghost ยิง webhook ตอนกด publish → ต้องมีอะไรสักอย่างรับ webhook แล้วสั่ง `docker compose up -d --build` ใหม่ (ดูหัวข้อ deploy ด้านล่าง — ตอนนี้ deploy ยังเป็น manual scp อยู่แล้ว จุดนี้จะช้ากว่า workflow ปกติของ Ghost ถ้าไม่มี CI) |
| Caddy (phase 2) | site block ใหม่สำหรับหน้าแอดมิน Ghost — ต้องปิดไม่ให้คนนอกเข้าได้ (ดูหัวข้อความปลอดภัย) |
| SEO | ต่อ sitemap ของ Astro ให้รวม URL บล็อก, เพิ่ม Schema.org `BlogPosting` ต่อโพสต์, ต่อ OG image pipeline |

---

## ตัดสินใจแล้ว (2026-07-31)

### 1. Database — SQLite → **เปลี่ยนเป็น MySQL แล้ว (ตัดสินใจสุดท้าย 2026-07-31)**

ตอนถามคำถาม ผมเข้าใจว่า Ghost "รองรับ SQLite สำหรับเว็บขนาดเล็ก" เฉยๆ — ไปเช็ค
[official Docker docs ของ Ghost](https://github.com/docker-library/docs/tree/master/ghost) ตอนเขียน
compose file จริงแล้วพบว่าแคบกว่านั้น: `database__connection__filename` ใช้ได้เฉพาะ
`NODE_ENV=development` เท่านั้น production ต้องใช้ MySQL ตามที่ image กำหนดไว้ตรงๆ มี workaround ที่
คนอื่นใช้จริง แต่มาพร้อมคำเตือนซ้ำๆ ในแอดมินและความเสี่ยงพังตอน Ghost อัปเดตใหญ่

คุณถามต่อว่าเปลี่ยนไปใช้ DB ตัวอื่นได้ไหม เพราะจำได้ว่าเซิร์ฟเวอร์มี DB อยู่แล้ว — เช็คแล้วพบ
`homegrown-ai-app-demo-db-1` เป็น **PostgreSQL 16** ของ stack คนละโปรเจกต์ (`homegrown-ai-app-demo`)
ใช้กับ Ghost ไม่ได้เลย เพราะ **Ghost ไม่มี adapter สำหรับ Postgres** (รองรับแค่ mysql2 กับ sqlite3 ผ่าน
Knex) แถมต่อให้รองรับก็ไม่ควรแชร์ DB กับโปรเจกต์อื่นอยู่ดี — ความเสี่ยงข้ามโปรเจกต์ไม่คุ้ม

**ผลสรุป: เพิ่ม `ghost-db` (MySQL 8, official image) เป็น container แยกของตัวเอง** ตาม
[official docker-compose ของ Ghost](https://hub.docker.com/_/ghost) พอดี — ใช้ user `ghost` แยกจาก
root, รหัสผ่านตั้งผ่าน `GHOST_DB_PASSWORD` ใน `.env` บนเซิร์ฟเวอร์เท่านั้น (ไม่มีค่า default ในไฟล์ที่
commit) ข้อดี: official support เต็มรูปแบบ ไม่มีคำเตือน ไม่เสี่ยงพังตอนอัปเดต และแยกจากทุก container
อื่นบนเครื่องรวมถึง Postgres ตัวที่มีอยู่แล้ว ข้อเสีย: เพิ่ม container ตัวที่ 2 บนเครื่องที่แชร์กับ
โปรเจกต์อื่นอยู่แล้ว ~11 ตัว — RAM/backup ต้องคิดเพิ่ม (ดูหัวข้อ "เรื่องที่ต้องระวังเรื่องเซิร์ฟเวอร์")

### 2. ไม่เอา Membership/Newsletter — ตัดสินใจแล้ว

Phase 1 เป็นบล็อกอ่านฟรีล้วนๆ ตามที่ตกลง ไม่ต่อ Mailgun/Stripe ไว้ก่อน — อยู่ใน Phase 3 ถ้าต้องการทีหลัง

### 3. `blog.ainaidee.com` — ตัดสินใจแล้ว, มีเรื่อง sequencing ที่ต้องรู้

เลือก subdomain แทน `/blog` แล้ว — **แต่ subdomain ทำงานได้ก็ต่อเมื่อมี host-based routing เท่านั้น
ซึ่งหมายถึง Caddy (phase 2 ของ `docs/deploy.md`) ที่ตอนนี้ยังไม่ได้เปิด** ตอนนี้เว็บหลักรันแบบ IP:port
ตรงๆ ไม่มี reverse proxy ที่แยกทราฟฟิกตามชื่อโดเมนได้เลย

วิธีแก้ที่วางไว้ (ยังไม่ได้เขียน Caddy config จริง อยู่ใน `docs/blog-architecture.md`): route ของบล็อก
ในโค้ดยังเป็น `/blog/*` เหมือนเดิม (`src/pages/blog/`) — Caddy จะเป็นตัวแมป `blog.ainaidee.com` →
`app:4321` พร้อม rewrite path ให้ไปที่ `/blog{path}` ข้างในเดียวกัน ไม่ต้องแยก Astro build เป็นสองชุด
วิธีนี้ทำให้ **ต้องรอ Caddy/DNS phase 2 มาก่อน `blog.ainaidee.com` ถึงจะเข้าได้จริง** — ระหว่างนี้ทดสอบ
ผ่าน `203.0.113.10:8587/blog` ไปพลางๆ ได้ (route เดียวกัน แค่คนละ host)

### 4. เขียนหลายคน — ตัดสินใจแล้ว

วางแผนไว้สำหรับหลายคนตั้งแต่แรก Ghost มีระบบ role (Author / Editor / Administrator) ในตัวอยู่แล้ว
ไม่ต้องเขียนโค้ดเพิ่ม — แต่ **การสร้าง Ghost owner account ครั้งแรก และเชิญคนเขียนคนอื่นเข้ามา ต้องทำเอง
ผ่านหน้าแอดมิน Ghost** เป็นการสร้างบัญชี/ตั้งรหัสผ่าน ซึ่งเป็นสิ่งที่ผมทำแทนไม่ได้

---

## แผนเป็น phase

### Phase 1 — บล็อกอ่านฟรี, MySQL, rebuild มือ
1. ~~เพิ่ม `ghost` container ใน `docker-compose.yml`~~ **เขียนแล้ว** — `ghost` + `ghost-db` (MySQL 8)
   อยู่หลัง `profiles: ["blog"]`, ยังไม่ได้สั่ง `up`, ต้องตั้ง `GHOST_DB_PASSWORD` ใน `.env` ก่อน
2. **สร้าง Content API key จากหน้าแอดมิน Ghost** — ยังไม่ได้ทำ, บล็อกอยู่ที่คุณ (ต้องมี Ghost รันอยู่
   ก่อนถึงจะเข้าหน้าแอดมินได้ — ดู "บล็อกอยู่ที่คุณ" ด้านล่างสำหรับลำดับที่แนะนำ)
3. ~~เพิ่ม `@tryghost/content-api` ใน `package.json`, สร้าง `src/pages/blog/index.astro` +
   `src/pages/blog/[slug].astro` ดึงโพสต์ตอน build~~ **เขียนแล้ว, build ผ่าน, แสดง "coming soon"
   เพราะยังไม่มี key**
4. ~~ต่อเข้า sitemap ที่มีอยู่แล้ว~~ **อัตโนมัติแล้ว** ผ่าน `@astrojs/sitemap` เดิม เพราะเป็น static
   route ปกติ (จะเห็น URL จริงในไซต์แมปก็ต่อเมื่อมีโพสต์จริงและ build ใหม่)
5. ~~เพิ่ม Schema.org `BlogPosting` ต่อโพสต์ และดีไซน์การ์ด OG image ให้เข้าชุดเว็บหลัก~~ **เขียนแล้ว**
   (`src/pages/og/blog/[slug].jpg.ts`)
6. **Deploy** — ยังไม่ได้ทำ บล็อกอยู่ที่ DNS + การสร้างบัญชี Ghost (ดูด้านล่าง)

### Phase 2 — ต่อเข้า Caddy/TLS, auto-rebuild
1. เมื่อ Caddy/TLS (phase 2 ของ `docs/deploy.md`) พร้อมแล้ว เพิ่ม site block ให้หน้าแอดมิน Ghost
   เข้าถึงได้แบบปลอดภัย (ทางเลือก: subdomain ส่วนตัว + Caddy basic auth, หรือ SSH tunnel ไม่เปิด public เลย)
2. ตั้ง webhook จาก Ghost (`post.published`, `post.updated`) ไปหา endpoint เล็กๆ บนเซิร์ฟเวอร์ที่สั่ง
   `docker compose up -d --build` ให้อัตโนมัติ — ตอนนี้ยังไม่มี CI ในโปรเจกต์เลย จุดนี้คือจุดแรกที่จะ
   ต้องมี "อะไรสักอย่างที่รันโค้ดตามคำสั่งจากอินเทอร์เน็ต" บนเซิร์ฟเวอร์ ต้องคิดเรื่องความปลอดภัย
   (ยืนยัน webhook signature ของ Ghost) ให้ดีก่อนเปิด

### Phase 3 — Membership/Newsletter (ถ้าต้องการ ตามไอเดียจาก case study)
1. ต่อ Mailgun (หรือเทียบเท่า) เข้า Ghost สำหรับส่งอีเมล
2. ถ้าจะมีจ่ายเงิน ต่อ Stripe
3. ทำหน้า portal/login ฝั่ง Astro ให้เข้าธีมเดียวกับเว็บหลัก
4. ~~ย้าย SQLite → MySQL~~ ไม่ต้องแล้ว เพราะเริ่มด้วย MySQL ตั้งแต่ Phase 1 — traffic เขียนสูงจาก
   สมาชิกสมัคร/ยกเลิกไม่ใช่ปัญหาที่ต้องย้าย DB อีก

---

## เรื่องที่ต้องระวังเรื่องเซิร์ฟเวอร์

- **RAM**: Ghost เองกิน ~200–500 MB ตามโหลด, เพิ่ม MySQL เข้ามาอีก container กินฐาน ~300–400 MB สำหรับ
  DB ขนาดเล็ก — รวมสองตัว ~1 GB เผื่อพอสมควร เซิร์ฟเวอร์ตอนนี้มี 12 GB รวม เหลือ available ~7.6 GB
  ตอนที่เช็คล่าสุด น่าจะพอสบายๆ แต่ควรเช็ค `free -m` อีกครั้งตอนจะ deploy จริง เพราะเป็นเครื่องแชร์กับ
  container อื่นอยู่ ~12 ตัว (รวม MySQL ใหม่นี้)
- **Backup**: ตอนนี้ทั้งโปรเจกต์ยังไม่มีแผน backup เลยแม้แต่สำหรับตัวเว็บหลัก จุดนี้ยิ่งสำคัญขึ้นเมื่อมี Ghost
  เพราะมี **2 volume ที่ต้อง backup แยกกัน**: `ghost_content` (รูป/ไฟล์แนบ) และ `ghost_db_data` (โพสต์/
  ผู้ใช้/ตั้งค่า ใน MySQL) ไม่มีตัวไหนอยู่ใน git ถ้า volume หายเนื้อหาหายจริง MySQL ต้อง backup ด้วย
  `mysqldump` เป็นระยะ (ไม่ใช่แค่ copy ไฟล์เหมือน SQLite ที่เคยวางแผนไว้ตอนแรก) ควรมีแผนนี้ก่อนเริ่มเขียน
  เนื้อหาจริงจัง
- **ความปลอดภัยหน้าแอดมิน**: Ghost admin ไม่ควรเปิด public โดยไม่มีการป้องกันชั้นเพิ่ม (Caddy basic auth
  หรือ IP allowlist หรือ SSH tunnel เท่านั้น) — เป็นจุดเดียวในระบบทั้งหมดที่มี login เขียนข้อมูลได้

---

## บล็อกอยู่ที่คุณ (ทำต่อไม่ได้จนกว่าจะมีสิ่งเหล่านี้)

โค้ดฝั่ง Astro/build เสร็จหมดแล้ว สิ่งที่เหลือเป็นสิ่งที่ผมทำแทนไม่ได้จริงๆ (ต้องใช้บัญชี/DNS/secret ของคุณ):

1. **ตั้ง `GHOST_DB_PASSWORD` ใน `.env` บนเซิร์ฟเวอร์** — คิดรหัสผ่านเอง ตั้งบนเซิร์ฟเวอร์โดยตรง (SSH
   เข้าไปแก้ `.env` เอง หรือบอกผมให้ generate ค่าสุ่มมาใส่ให้ก็ได้ แต่ตัวรหัสผ่านเองไม่ควรผ่านแชทนี้)
   ไม่ตั้งแล้ว `docker compose --profile blog up` จะ error ทันทีตามที่ตั้งใจไว้
2. **ตั้งค่า DNS**: `blog.ainaidee.com` → `203.0.113.10` (A record) — จำเป็นสำหรับให้ Ghost ตั้ง
   `url` ถูกต้องตอน first-run และให้ Caddy ออกใบรับรอง TLS ได้ในอนาคต (phase 2)
3. **ยืนยันว่าจะเปิด Ghost ยังไงในระหว่างที่ยังไม่มี Caddy** — เสนอ: `docker compose --profile blog up -d`
   แล้วเข้าผ่าน `203.0.113.10:<port>/ghost` ชั่วคราว (ต้องเพิ่ม port publish ให้ ghost service ก่อน
   เหมือนที่ทำกับ `app` ตอน phase 1 ของเว็บหลัก — ตอนนี้ยังไม่ได้เพิ่มเพราะรอคุณ confirm) แล้วค่อยปิด
   พอร์ตนั้นทิ้งตอน Caddy พร้อม
4. **สร้างบัญชี Ghost owner + Content API key เอง** ผ่านหน้าแอดมิน (ผมสร้างบัญชี/ตั้งรหัสผ่านแทนไม่ได้)
   ได้ key แล้วส่ง `GHOST_URL` + `GHOST_CONTENT_API_KEY` มา ผมจะใส่เป็น build arg แล้ว rebuild
   เว็บหลักให้ทันที — เมื่อนั้นหน้า `/blog` จะเลิกโชว์ "coming soon"
5. **เชิญคนเขียนคนอื่นเข้า Ghost** (ตามข้อ 4 ที่ตัดสินใจไว้ว่าจะมีหลายคน) — ทำผ่านหน้าแอดมินเช่นกัน

ตอบคำถามข้อ 3 (จะเปิด Ghost ชั่วคราวยังไง) แล้วผมทำต่อได้เลย

---

## อ้างอิง

- [Case study 30 เว็บ Ghost ที่สำเร็จ](https://electronthemes.com/blog/case-study-top-30-successful-ghost-websites) — บทความที่คุณส่งมา จุดเน้นคือ membership/newsletter เป็นตัวขับรายได้
- [Astro official docs — Ghost CMS guide](https://docs.astro.build/en/guides/cms/ghost/)
- [Ghost self-hosting — DreamHost guide](https://www.dreamhost.com/blog/ghost-self-hosted/)
- [Ghost self-hosted บน Docker](https://oneuptime.com/blog/post/2026-02-08-how-to-run-ghost-blog-in-docker/view)
- [รัน Ghost บน RAM จำกัด — Ghost forum](https://forum.ghost.org/t/running-ghost-on-1gb-ram-mysql-fix/34582)
- [Official Ghost Docker image docs — SQLite เป็น development-only](https://github.com/docker-library/docs/tree/master/ghost)
- [Workaround ใช้ SQLite ใน production — blog.rabu.me](https://blog.rabu.me/getting-sqlite-to-work-with-ghost-5-x-on-docker/)
- [Official Ghost + MySQL docker-compose.yml — Docker Hub](https://hub.docker.com/_/ghost)
- [Ghost Content API — JavaScript client docs](https://docs.ghost.org/content-api/javascript)
- [@tryghost/content-api บน npm](https://www.npmjs.com/package/@tryghost/content-api)
