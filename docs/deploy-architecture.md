# AiNaiDee — server deployment architecture

Low-level view of what runs on the Ubuntu box. Procedure and open questions are in
[`deploy.md`](./deploy.md). The blog (Ghost, planned, not built) has its own diagram set in
[`blog-architecture.md`](./blog-architecture.md) — it isn't in the diagrams below.

**This diagram set originally described a single day-one deploy with TLS from the start. What's
actually running (2026-07-31) is phase 1 only — plain HTTP on `172.16.57.192:8587`, no Caddy, no
domain.** Diagram 1 below is marked up to show current-vs-planned. Diagrams 2–3 (build pipeline,
request routing) describe the app itself and are accurate as-is. Diagram 4 (deploy flow) is split
into what actually happened and what phase 2 will add.

---

## 1. Runtime topology

**Current (phase 1):** everything in this diagram except the `caddyc` subgraph and its edges is
running. The app container publishes directly on `0.0.0.0:8587`, not the loopback `127.0.0.1:4321`
described below — there is no reverse proxy in front of it yet, by design, so it can be reached
straight from the LAN while DNS and TLS are still pending. `dns` and `le` are aspirational: the
site is reached by bare IP, not `ainaidee.com`.

**Planned (phase 2):** once DNS points at the box, `docker compose --profile tls up -d` starts
Caddy. At that point `app` should go back to publishing on loopback only (`127.0.0.1:4321`) and
`8587` can be dropped, since Caddy reaches `app` over the compose network regardless.

```mermaid
flowchart TB
    user["Visitor browser<br/>runs WebGL / WebGPU detection<br/>and the whole grading engine"]
    dns["DNS: ainaidee.com<br/>NOT YET POINTED — phase 2"]
    le["Let's Encrypt<br/>ACME HTTP-01 — phase 2"]
    turso["Turso / libSQL<br/>OPTIONAL, telemetry only — currently off"]

    subgraph host["Ubuntu host — 172.16.57.192, Docker 29.3.0<br/>shared box, ~11 other containers also running"]
        direction TB

        subgraph net["docker network: web (bridge)"]
            direction TB

            subgraph caddyc["container: caddy:2-alpine<br/>NOT RUNNING YET — profiles: [tls]"]
                caddy["Caddy<br/>TLS termination + ACME renewal<br/>gzip / zstd<br/>redirect /og/*.png to .jpg<br/>immutable cache on /_astro/*<br/>security headers"]
            end

            subgraph appc["container: ainaidee-app-1, image ainaidee:latest<br/>RUNNING since 2026-07-31"]
                app["node dist/server/entry.mjs<br/>@astrojs/node standalone<br/>HOST=0.0.0.0 PORT=4321<br/>runs as user 'node'"]
                static["dist/client — 215 MB<br/>prerendered HTML, hashed assets,<br/>83 OG jpgs, sitemap"]
                server["dist/server — 1 MB<br/>5 API routes"]
                dep["node_modules<br/>@libsql/client ONLY, 12 MB"]
            end
        end

        vol1[("volume: caddy_data<br/>certs + access.log — phase 2")]
        vol2[("volume: caddy_config — phase 2")]
        envf["/.env on host<br/>TURSO_DATABASE_URL<br/>TURSO_AUTH_TOKEN — unset, telemetry off"]
    end

    user -->|"resolve — phase 2 only"| dns
    dns -.->|"points at — phase 2 only"| host
    user -->|"CURRENT: HTTP :8587 direct, no TLS"| app
    user -.->|"PLANNED: HTTPS :443<br/>HTTP :80 redirected"| caddy
    caddy <-.->|"ACME challenge — phase 2"| le
    caddy -.->|"reverse_proxy<br/>http://app:4321<br/>over the web network — phase 2"| app
    app --- static
    app --- server
    server --- dep
    caddy -.- vol1
    caddy -.- vol2
    envf -.->|"injected as env"| app
    server -.->|"only /api/runai/metrics, currently unreachable — no tokens set"| turso

    appPort["host 0.0.0.0:8587<br/>CURRENT: open to the LAN directly"]
    appPort -->|"published today"| app
```

**Why the app is on `0.0.0.0:8587` right now instead of loopback.** Phase 1 was explicitly asked
for as plain HTTP, no reverse proxy, reachable immediately — so the app is exposed directly rather
than waiting on Caddy/TLS. This is the thing to revisit at phase 2: either rebind `app` to
loopback once Caddy takes the public ports, or keep `8587` open as a secondary plain-HTTP entry
point. Not yet decided.

---

## 2. Image build pipeline

Two stages. Everything heavy is discarded with the builder. **This build has now actually run**
(2026-07-31) — image `ainaidee:latest`, ~608 MB, all 83 OG images rendered, ~80s on the server.

```mermaid
flowchart TB
    ctx["Build context<br/>filtered by .dockerignore:<br/>no node_modules, no dist,<br/>no packages/runai source, no docs"]

    subgraph b["STAGE 1 — builder: node:24-bookworm-slim"]
        direction TB
        b1["npm i -g pnpm@11.1.3"]
        b2["COPY manifests only<br/>root + compatibility + models + runai/package.json<br/>runai manifest needed or --frozen-lockfile refuses —<br/>BUG HIT HERE: .dockerignore originally excluded<br/>this file too, fixed 2026-07-31"]
        b3["pnpm install --frozen-lockfile<br/>--filter 'canirun-ai...'<br/>excludes runai and its node-llama-cpp toolchain"]
        b4["COPY . ."]
        b5["ARG SITE_URL=http://172.16.57.192:8587<br/>baked into sitemap + absolute OG urls<br/>(phase 1 default — becomes the real domain at phase 2)"]
        b6["pnpm build<br/>= packages:build then astro build<br/>renders 83 OG jpgs via sharp + resvg<br/>needs glibc — BUG ALSO HIT HERE: design.astro imported<br/>3 @fontsource packages missing from package.json,<br/>fixed same day"]
        b1 --> b2 --> b3 --> b4 --> b5 --> b6
    end

    subgraph r["STAGE 2 — runtime: node:24-bookworm-slim"]
        direction TB
        r1["COPY docker/runtime-package.json as package.json"]
        r2["npm install --omit=dev<br/>installs @libsql/client only, about 12 MB"]
        r3["COPY --from=builder /app/dist"]
        r4["USER node · EXPOSE 4321<br/>HEALTHCHECK fetches /api/models"]
        r5["CMD node dist/server/entry.mjs"]
        r1 --> r2 --> r3 --> r4 --> r5
    end

    disc["DISCARDED with the builder:<br/>pnpm, sharp, @resvg/resvg-js, satori,<br/>typescript, vitest, the full 975 MB node_modules"]

    ctx --> b
    b6 -->|"dist/ only"| r3
    b -.->|"not in the final image"| disc
```

**The rule that keeps this working:** the runtime image contains only what
`dist/server/entry.mjs` actually imports. Today that is one package. Add a server-side
dependency and you must add it to `docker/runtime-package.json`, or the container starts fine
and then crashes the first time that code path runs. Confirmed against the real build output —
`@libsql/client` is the only non-builtin import.

---

## 3. Request routing — what needs the server and what does not

**Currently (phase 1), Caddy isn't running, so requests hit `app:4321` (published as
`172.16.57.192:8587`) directly — no TLS, no `/og/*.png` → `.jpg` redirect yet.** The routing
logic below is unchanged; only the Caddy hop at the top is inactive for now.

```mermaid
flowchart LR
    req["Request"] --> caddy["Caddy :443<br/>NOT RUNNING YET — phase 2"]

    caddy -.->|"phase 2"| ogr{"path matches<br/>/og/*.png ?"}
    ogr -.->|yes, phase 2| redir["301 to /og/*.jpg<br/>ported from the old vercel.json"]
    ogr -.->|no, phase 2| proxy["reverse_proxy app:4321"]
    req -->|"CURRENT: direct, :8587"| proxy

    proxy --> kind{"route type"}

    kind -->|"prerendered — the vast majority"| st["Served from dist/client<br/>/  /design  /tier  /compare  /why  /docs<br/>/model/:id  /device/:id  /license/:id<br/>/og/*.jpg  /sitemap-index.xml  /_astro/*<br/>NO server work, NO external calls"]

    kind -->|"prerender = false — 5 routes"| dyn["Handled by dist/server"]

    dyn --> g1["GET /api/models<br/>GET /api/models/:id<br/>pure JS over the catalog"]
    dyn --> p1["POST /api/compatibility<br/>POST /api/recommend<br/>runs the compatibility engine server-side"]
    dyn --> p2["POST /api/runai/metrics<br/>writes to Turso<br/>THROWS if TURSO_* unset"]

    p2 --> turso[("Turso / libSQL")]
```

**The consequence worth remembering:** hardware detection and grading run in the visitor's
browser, not here. The five API routes above are the only reason a server process exists at
all. Drop the public JSON API and this becomes a static site that any web server can host with
no Node at runtime — see the last section of `deploy.md`.

---

## 4. Deploy and update flow

**What actually happened (phase 1, 2026-07-31)** — no git access from the server yet, no Caddy:

```mermaid
sequenceDiagram
    autonumber
    participant Loc as Local machine
    participant Srv as imperva@172.16.57.192
    participant BK as docker build
    participant DC as docker compose

    Note over Loc,DC: PHASE 1 — plain HTTP, port 8587, no TLS, no domain
    Loc->>Srv: scp -r . (source not on GitHub yet at this point)
    Loc->>Srv: fix .dockerignore (packages/runai/package.json), add missing @fontsource deps
    Loc->>Srv: scp corrected files
    Srv->>DC: docker compose build
    DC->>BK: build stage 1 then stage 2
    BK-->>DC: image ainaidee:latest (~608 MB)
    Srv->>DC: docker compose up -d
    DC-->>Srv: ainaidee-app-1 running, published 0.0.0.0:8587
    Note over Loc,DC: smoke-tested from local machine over the LAN — all routes 200
```

**What phase 2 will add** — once DNS and an email address are ready:

```mermaid
sequenceDiagram
    autonumber
    participant Dev as You
    participant Srv as Server
    participant DC as docker compose
    participant CD as caddy container
    participant LE as Let's Encrypt

    Note over Dev,LE: PHASE 2 — DNS must already point at the box
    Dev->>Srv: point A record at 172.16.57.192, set real email in Caddyfile
    Dev->>Srv: set SITE_URL=https://ainaidee.com in .env
    Srv->>DC: docker compose up -d --build (SITE_URL change forces a rebuild)
    Srv->>DC: docker compose --profile tls up -d
    DC->>CD: start caddy, bind 80 / 443
    CD->>LE: ACME HTTP-01 for ainaidee.com
    LE-->>CD: certificate, stored in caddy_data
    CD-->>Dev: site live over HTTPS
    Note over Dev,LE: decide then whether app keeps publishing :8587 or drops back to loopback

    Note over Dev,LE: UPDATES, once this flow is live
    Dev->>Srv: git pull (repo is on GitHub now — main, pushed 2026-07-31)
    Dev->>DC: docker compose up -d --build
    DC->>DC: recreate app container, caddy untouched, certs survive
    Dev->>Dev: docker image prune -f
```

---

## Failure modes to check first

| Symptom | Almost certainly |
|---|---|
| `COPY packages/runai/package.json` fails during build | `.dockerignore` excludes that file — it needs `packages/runai/*` + `!packages/runai/package.json`, not a blanket `packages/runai` entry. Hit and fixed 2026-07-31. |
| Rollup `failed to resolve import` for a page-level import | Something a page imports isn't a declared dependency in `package.json` — hit for `design.astro`'s `@fontsource/*` imports, fixed 2026-07-31 |
| Caddy exits immediately on start | Not applicable yet — Caddy isn't running in phase 1. Once enabled: something else already owns :80/:443 — check `docker ps` on the shared box first, drop the caddy service if so |
| Certificate never issued (phase 2) | DNS not propagated yet, or :80 blocked by a firewall — ACME needs it |
| Build killed partway through | Out of RAM during OG rendering — needs about 2 GB. Not observed on this box (12 GB, build completed in ~80s) |
| Build fails on an Astro internal import | The adapter was upgraded past **10.1.0** |
| Site up but a POST API 500s | `TURSO_*` unset, or a new server dep missing from `docker/runtime-package.json` — currently expected for `/api/runai/metrics` since telemetry is off |
| Links and OG images point at the wrong domain | `SITE_URL` is baked in at build time — rebuild, do not just restart. Currently baked as `http://172.16.57.192:8587`, by design, until phase 2 |
