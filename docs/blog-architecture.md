# AiNaiDee — blog architecture

**อัปเดต 2026-07-31: โค้ดฝั่ง Astro (route, OG image, Schema.org) เขียนแล้วและ build ผ่านจริง —
ดูรายละเอียดใน [`blog-plan.md`](./blog-plan.md) หัวข้อ "สิ่งที่ทำแล้ว"** สิ่งที่ diagram นี้ยังทำเครื่องหมาย
"PLANNED"/เส้นประไว้คือส่วนที่ยังไม่ได้ deploy จริง: container `ghost` (เขียนใน `docker-compose.yml`
แล้ว แต่อยู่หลัง `profiles: ["blog"]` ไม่ได้สั่ง `up`), DNS `blog.ainaidee.com`, Ghost admin account,
Caddy site block สำหรับ subdomain, และ webhook auto-rebuild ทั้งหมดนี้บล็อกอยู่ที่การกระทำที่ต้องทำเอง
(สร้างบัญชี, ตั้ง DNS) ไม่ใช่โค้ดที่ยังไม่ได้เขียน

---

## 1. Topology ที่จะเพิ่มเข้าไปในของเดิม

ของเดิม (ตามจริงตอนนี้, phase 1 ของ deploy) คือ `ainaidee-app-1` ตัวเดียว เผยแพร่ตรงที่
`203.0.113.10:8587` ไม่มี Caddy ยังไม่มีอะไรในไดอะแกรมนี้ถูกสร้างเลยสักส่วน — เส้นประ + ป้าย
"PLANNED" ทั้งหมด

```mermaid
flowchart TB
    writer["คนเขียนบล็อก<br/>เข้าหน้าแอดมิน Ghost"]
    reader["ผู้อ่าน<br/>เข้า ainaidee.com/blog"]

    subgraph host["Ubuntu host — 203.0.113.10<br/>เครื่องเดิมที่มี ainaidee-app-1 รันอยู่แล้ว"]
        direction TB

        subgraph net["docker network: web (bridge) — เครือข่ายเดิม"]
            direction TB

            subgraph appc["container: ainaidee-app-1 — มีอยู่แล้ว, รันจริง"]
                app["Astro server<br/>ดึงโพสต์จาก Ghost Content API<br/>ตอน build เท่านั้น ไม่ query รันไทม์"]
            end

            subgraph ghostc["container: ghost — เขียนใน docker-compose.yml แล้ว<br/>profiles: [blog], ยังไม่ได้สั่ง up"]
                ghost["Ghost admin + Content API<br/>headless — ไม่มีใครเห็น theme ของ Ghost เอง"]
            end

            subgraph dbc["container: ghost-db — เขียนใน docker-compose.yml แล้ว<br/>profiles: [blog], ยังไม่ได้สั่ง up<br/>MySQL 8, official image, แยกจาก Postgres ตัวที่มีอยู่แล้ว"]
                db["MySQL — user 'ghost', ไม่ใช่ root<br/>รหัสผ่านจาก GHOST_DB_PASSWORD ใน .env"]
            end
        end

        vol[("volume: ghost_content — PLANNED<br/>โพสต์ + รูปที่อัปโหลด")]
        dbvol[("volume: ghost_db_data — PLANNED<br/>ต้อง backup ด้วย mysqldump แยกจาก ghost_content")]

        subgraph otherdb["container: homegrown-ai-app-demo-db-1 — มีอยู่แล้ว, รันจริง<br/>คนละโปรเจกต์ ไม่เกี่ยวกับบล็อก"]
            pg["PostgreSQL 16 — เช็คแล้วว่า Ghost ใช้ไม่ได้<br/>(ไม่มี adapter สำหรับ Postgres) เลยไม่แชร์กัน"]
        end
    end

    writer -->|"login — PLANNED, ต้องปิดไม่ให้ public เข้าได้อิสระ"| ghost
    ghost --- vol
    ghost --- db
    db --- dbvol
    app -.->|"Content API — build time — PLANNED"| ghost
    reader -->|"GET /blog/* — เหมือน route อื่นๆ ในเว็บเดิม"| app

    webhook["Ghost webhook<br/>post.published / post.updated"]
    rebuild["ตัวรับ webhook + สั่ง<br/>docker compose up -d --build — PLANNED, phase 2<br/>phase 1 ใช้มือสั่งเหมือน deploy loop ปัจจุบัน"]
    ghost -.->|"phase 2 เท่านั้น"| webhook
    webhook -.-> rebuild
    rebuild -.-> appc
```

**จุดสำคัญ**: `app` ดึงเนื้อหาจาก Ghost **ตอน build** ไม่ใช่ตอนมีคนเข้าเว็บ — เหมือนกับที่ตอนนี้
`ainaidee-app-1` render หน้า static ไว้ล่วงหน้าอยู่แล้ว (ดู diagram 3 ใน `deploy-architecture.md`)
บล็อกโพสต์ก็จะกลายเป็นหน้า static เหมือนหน้าโมเดล ไม่ใช่ query สดทุกครั้ง

---

## 2. เนื้อหาไหลจาก Ghost เข้าเว็บยังไง — PLANNED

```mermaid
sequenceDiagram
    autonumber
    participant W as คนเขียน
    participant G as Ghost admin — PLANNED
    participant API as Content API — PLANNED
    participant A as Astro build — ของเดิม, จะแก้เพิ่ม

    Note over W,A: PHASE 1 — rebuild มือ ไม่มี webhook
    W->>G: เขียนโพสต์ + กด Publish
    Note over W,A: คนเขียนบอกให้ rebuild เว็บ (เหมือน deploy loop ปัจจุบัน)
    A->>API: ดึงโพสต์ทั้งหมดตอน pnpm build
    API-->>A: JSON — title, html, feature_image, tags, ฯลฯ
    A->>A: render src/pages/blog/[slug].astro<br/>ด้วยดีไซน์ระบบเดียวกับเว็บหลัก
    A->>A: เพิ่ม URL บล็อกเข้า sitemap ที่มีอยู่แล้ว<br/>สร้าง OG image ด้วย satori pipeline เดิม

    Note over W,A: PHASE 2 — webhook auto-rebuild
    W->>G: กด Publish
    G->>A: webhook post.published — PLANNED
    A->>API: ดึงโพสต์ใหม่ + rebuild อัตโนมัติ
```

---

## 3. Request routing ที่จะเปลี่ยน — เทียบกับ diagram เดิม

`deploy-architecture.md` diagram 3 อธิบาย routing ปัจจุบันไว้แล้ว (prerendered vs 5 API route)
บล็อกเพิ่มกลุ่มที่ 3: **prerendered แต่ข้อมูลมาจากนอกโปรเจกต์**

```mermaid
flowchart LR
    req["Request"] --> kind{"path?"}

    kind -->|"เดิม — prerendered จาก packages/models"| existing["/  /model/:id  /tier  /compare ฯลฯ<br/>ข้อมูลอยู่ใน repo เอง (STATIC_MODELS)"]

    kind -->|"เดิม — 5 API route, prerender=false"| api["/api/models  /api/compatibility ฯลฯ<br/>รันจริงตอน request"]

    kind -->|"ใหม่ — PLANNED — prerendered จาก Ghost"| blog["/blog  /blog/:slug<br/>ข้อมูลดึงจาก Ghost ตอน build<br/>ไม่ได้ query Ghost ตอน request เหมือนกับกลุ่มแรก"]
```

**บล็อกไม่ได้เพิ่ม route ที่ต้องมีเซิร์ฟเวอร์รันตอน request** — ยังคงเป็น static เหมือนหน้าโมเดล
ต่างกันแค่ "ข้อมูลต้นทาง" มาจาก Ghost แทนที่จะมาจากไฟล์ในโปรเจกต์ ผลคือ **ถ้าไม่มี webhook (phase 1)
เนื้อหาบล็อกจะไม่อัปเดตจนกว่าจะ build ใหม่** — เหมือนการแก้โมเดลใน `packages/models/src/index.ts`
ที่ต้อง build ใหม่ถึงจะขึ้นเว็บ

---

## สิ่งที่ตัดสินใจแล้ว vs สิ่งที่ยังต้องตัดสินใจ

ตัดสินใจแล้ว (2026-07-31, รายละเอียดเหตุผลใน [`blog-plan.md`](./blog-plan.md)):
**MySQL** (เปลี่ยนจาก SQLite ตอนแรก, และไม่ใช่ Postgres ตัวที่มีอยู่แล้วบนเครื่อง — คนละ adapter),
ไม่เอา membership/newsletter ใน phase 1, `blog.ainaidee.com` (ต้องรอ Caddy phase 2 ถึงจะใช้งานได้จริง),
เขียนหลายคน (Ghost role ในตัว)

ยังต้องตัดสินใจ:
- **จะเปิด Ghost ให้เข้าตั้งค่าครั้งแรกยังไงระหว่างที่ยังไม่มี Caddy** — ต้อง publish พอร์ตชั่วคราวไหม
  (ดู `blog-plan.md` หัวข้อ "บล็อกอยู่ที่คุณ" ข้อ 3)
- Webhook รับจากอินเทอร์เน็ตยังไงให้ปลอดภัย (phase 2)
- Caddy site block ที่แมป `blog.ainaidee.com` → `app:4321/blog/*` — ยังไม่ได้เขียนจริงใน `Caddyfile`
