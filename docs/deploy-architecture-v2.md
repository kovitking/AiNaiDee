# AiNaiDee — server deployment architecture

Low-level view of what runs on the Ubuntu box. Procedure and open questions are in
[`deploy.md`](./deploy.md).

---

## 1. Runtime topology

What exists on the server once `docker compose up -d` has run.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TB
    user["Visitor browser<br/>runs WebGL / WebGPU detection<br/>and the whole grading engine"]
    dns["DNS: ainaidee.com<br/>A record to server IP"]
    le["Let's Encrypt<br/>ACME HTTP-01"]
    turso["Turso / libSQL<br/>OPTIONAL, telemetry only"]

    subgraph host["Ubuntu host — only Docker installed"]
        direction TB

        subgraph net["docker network: web (bridge)"]
            direction TB

            subgraph caddyc["container: caddy:2-alpine"]
                caddy["Caddy<br/>TLS termination + ACME renewal<br/>gzip / zstd<br/>redirect /og/*.png to .jpg<br/>immutable cache on /_astro/*<br/>security headers"]
            end

            subgraph appc["container: ainaidee:latest"]
                app["node dist/server/entry.mjs<br/>@astrojs/node standalone<br/>HOST=0.0.0.0 PORT=4321<br/>runs as user 'node'"]
                static["dist/client — 215 MB<br/>prerendered HTML, hashed assets,<br/>83 OG jpgs, sitemap"]
                server["dist/server — 1 MB<br/>5 API routes"]
                dep["node_modules<br/>@libsql/client ONLY, 12 MB"]
            end
        end

        vol1[("volume: caddy_data<br/>certs + access.log")]
        vol2[("volume: caddy_config")]
        envf["/.env on host<br/>TURSO_DATABASE_URL<br/>TURSO_AUTH_TOKEN"]
    end

    user -->|"resolve"| dns
    dns -.->|"points at"| host
    user -->|"HTTPS :443<br/>HTTP :80 redirected"| caddy
    caddy <-->|"ACME challenge"| le
    caddy -->|"reverse_proxy<br/>http://app:4321<br/>over the web network"| app
    app --- static
    app --- server
    server --- dep
    caddy --- vol1
    caddy --- vol2
    envf -.->|"injected as env"| app
    server -.->|"only /api/runai/metrics"| turso

    appPort["host 127.0.0.1:4321<br/>loopback only, never 0.0.0.0"]
    appPort -.->|"published for an existing<br/>host reverse proxy, if any"| app
```

**Why the app publishes on loopback.** Caddy reaches it over the compose network, so the port
does not need to face the internet. Publishing it on `127.0.0.1` anyway means that if the box
already runs nginx or Traefik on 80/443, you delete the `caddy` service and point the existing
proxy at `127.0.0.1:4321` with no other change.

---

## 2. Image build pipeline

Two stages. Everything heavy is discarded with the builder.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TB
    ctx["Build context<br/>filtered by .dockerignore:<br/>no node_modules, no dist,<br/>no packages/runai source, no docs"]

    subgraph b["STAGE 1 — builder: node:24-bookworm-slim"]
        direction TB
        b1["npm i -g pnpm@11.1.3"]
        b2["COPY manifests only<br/>root + compatibility + models + runai/package.json<br/>(runai manifest needed or --frozen-lockfile refuses)"]
        b3["pnpm install --frozen-lockfile<br/>--filter 'ainaidee...'<br/>excludes runai and its node-llama-cpp toolchain"]
        b4["COPY . ."]
        b5["ARG SITE_URL=https://ainaidee.com<br/>baked into sitemap + absolute OG urls"]
        b6["pnpm build<br/>= packages:build then astro build<br/>renders 83 OG jpgs via sharp + resvg<br/>needs glibc, needs about 2 GB RAM"]
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
and then crashes the first time that code path runs.

---

## 3. Request routing — what needs the server and what does not

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    req["Request"] --> caddy["Caddy :443"]

    caddy --> ogr{"path matches<br/>/og/*.png ?"}
    ogr -->|yes| redir["301 to /og/*.jpg<br/>ported from the old vercel.json"]
    ogr -->|no| proxy["reverse_proxy app:4321"]

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

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    autonumber
    participant Dev as You on the server
    participant Git as github.com/kovitking/AiNaiDee
    participant BK as docker build
    participant DC as docker compose
    participant CD as caddy container
    participant LE as Let's Encrypt

    Note over Dev,LE: FIRST DEPLOY — DNS must already point at the box
    Dev->>Git: git clone
    Dev->>Dev: write .env only if telemetry is wanted
    Dev->>DC: docker compose up -d --build
    DC->>BK: build stage 1 then stage 2
    BK-->>DC: image ainaidee:latest
    DC->>CD: start caddy, bind 80 / 443
    CD->>LE: ACME HTTP-01 for ainaidee.com
    LE-->>CD: certificate, stored in caddy_data
    CD-->>Dev: site live over HTTPS

    Note over Dev,LE: UPDATES
    Dev->>Git: git pull
    Dev->>DC: docker compose up -d --build
    DC->>BK: rebuild, dependency layers reused unless manifests changed
    DC->>DC: recreate app container, caddy untouched, certs survive
    Dev->>Dev: docker image prune -f
```

---

## Failure modes to check first

| Symptom | Almost certainly |
|---|---|
| Caddy exits immediately on start | Something else already owns :80/:443 — drop the caddy service, use the existing proxy |
| Certificate never issued | DNS not propagated yet, or :80 blocked by a firewall — ACME needs it |
| Build killed partway through | Out of RAM during OG rendering — needs about 2 GB |
| Build fails on an Astro internal import | The adapter was upgraded past **10.1.0** |
| Site up but a POST API 500s | `TURSO_*` unset, or a new server dep missing from `docker/runtime-package.json` |
| Links and OG images point at the wrong domain | `SITE_URL` is baked in at build time — rebuild, do not just restart |
