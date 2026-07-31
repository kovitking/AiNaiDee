# Deploying AiNaiDee to your own Ubuntu server

## Current state (2026-07-31)

**Phase 1 is live:** http://172.16.57.192:8587, plain HTTP, no domain yet. Container
`ainaidee-app-1` on `imperva@172.16.57.192` (Ubuntu 24.04.2, x86_64, Docker 29.3.0, 12 GB RAM — a
shared box already running about a dozen other demo containers). `restart: unless-stopped`.

What's *not* true yet, that the rest of this document originally assumed as day-one steps:

- **No TLS, no domain.** The `caddy` service exists in `docker-compose.yml` but is gated behind
  `profiles: ["tls"]`, so `docker compose up -d` does not start it. Turning it on is the whole
  of "Phase 2" below.
- **The app is published on `0.0.0.0:8587`, not `127.0.0.1:4321`.** Phase 1 was asked for as
  direct-HTTP-on-the-LAN with no reverse proxy in front, so the loopback-only publish this
  document describes further down does not reflect what's running. That changes when Caddy
  comes online — see "Enabling phase 2" below.
- **Deploy is manual scp, not `git clone`/`git pull` on the server.** The source didn't exist on
  GitHub until this repo's first push (2026-07-31), so the initial deploy copied a tarball over
  SSH instead. The repo is now pushed to `main` on `github.com/kovitking/AiNaiDee`, so a
  git-based flow is possible going forward — it just hasn't been switched over.
- **The first real build hit two bugs**, both now fixed and on `main`: `.dockerignore` excluded
  `packages/runai/package.json`, which the Dockerfile needs even though it excludes the rest of
  that package; and `src/pages/design.astro` imported three `@fontsource` packages that were
  never declared in `package.json`. Details in `CLAUDE.md` under "Container build traps".

Everything below that isn't about TLS/domain describes the app and build correctly — the two-stage
build, the runtime image contents, `SITE_URL` baking, and the "no server needed" section are all
unchanged from what was verified in phase 1.

## What changed and why

The project shipped configured for Vercel. It now targets a plain Node server so it can run
anywhere, including a Docker host you control:

- `@astrojs/vercel` → `@astrojs/node` in `mode: 'standalone'` (pinned to **10.1.0** — 10.1.4
  and 11.x import Astro internals that do not exist in Astro 6.3.3 and fail the build)
- `site:` is now `https://ainaidee.com`, overridable at build time with `SITE_URL`
- `vercel.json` is gone; its two OG redirects moved into the `Caddyfile`

Nothing about the app itself changed. All 83 models, the compatibility engine, the OG images
and the JSON API behave exactly as before.

## Why Docker rather than installing Node on the host

Not for isolation — for the build. Building this site needs Node 24, pnpm 11.1.3, and native
`sharp` and `@resvg/resvg-js` to render 80-odd OG images. Installing that toolchain on the host
means maintaining it there forever.

The multi-stage build keeps all of it inside the builder image and throws it away. The runtime
image is `dist/` plus **one** dependency — `@libsql/client`, about 12 MB, used only by
`/api/runai/metrics`. Everything else is either bundled into `dist/server` or was build-time
only. Your host needs Docker and nothing else, and the runtime image contains no compiler and
no native modules to patch.

First verified locally without Docker, by running the built server against a minimal tree
containing only `dist/` and `@libsql/client`. Since then, the actual container has been built and
deployed (phase 1, above) and the same routes — pages, model pages, OG images, sitemap, both GET
and POST API routes — were smoke-tested against the real running container.

## What's left — enabling phase 2 (TLS + real domain)

Server details, architecture, and the first build are done — see "Current state" above. What's
still open:

1. **DNS control for ainaidee.com.** Point an `A` record (and `AAAA` if the box has IPv6) at
   `172.16.57.192` before flipping Caddy on. It requests the certificate on startup and fails
   loudly if DNS hasn't propagated. Confirm whether you want `www` too — the Caddyfile currently
   claims both.
2. **An email address for Let's Encrypt**, to replace `admin@ainaidee.com` in the Caddyfile.
3. **Whether anything else on that box already listens on ports 80 and 443.** It's a shared
   server running about a dozen other containers. If something already holds those ports, don't
   enable the `caddy` service — keep pointing traffic at `172.16.57.192:8587` directly, or put
   your existing proxy in front of it instead.
4. **Turso telemetry — on or off?** Off by default and the site is fully functional without it;
   only `/api/runai/metrics` fails. If you want it on, put `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN` in a `.env` file next to `docker-compose.yml` **on the server**. Do not
   paste those tokens into chat.
5. **Deploy style going forward:** the repo is now on GitHub (`main`, pushed 2026-07-31), so
   `git clone`/`git pull` on the server is possible. Phase 1 used `scp` because the repo wasn't
   pushed yet at the time. Decide whether the server should pull from GitHub directly, or stay
   on the current scp-then-build loop.

## Deploying (what actually ran for phase 1)

```bash
# from a machine with the repo, not on the server — the server didn't have git access to this
# repo yet when phase 1 deployed. This can become `git clone` now that main is pushed.
scp -r . imperva@172.16.57.192:~/apps/ainaidee/
ssh imperva@172.16.57.192 "cd ~/apps/ainaidee && docker compose build"
ssh imperva@172.16.57.192 "cd ~/apps/ainaidee && docker compose up -d"
ssh imperva@172.16.57.192 "docker compose logs -f app"
```

Then check it (no domain yet, so the bare IP:port):

```bash
curl -sI http://172.16.57.192:8587 | head -1
curl -s http://172.16.57.192:8587/api/models | head -c 200
curl -s -X POST http://172.16.57.192:8587/api/compatibility \
  -H 'content-type: application/json' \
  -d '{"hardware":{"ramGb":32,"gpu":{"name":"NVIDIA RTX 3060"}},"modelId":"llama3.1-8b"}'
```

Once phase 2 is enabled (Caddy + real domain), these become `https://ainaidee.com/...` and Caddy
takes over TLS termination in front of the same `app` container.

Updating later, with the current scp-based flow:

```bash
scp -r . imperva@172.16.57.192:~/apps/ainaidee/
ssh imperva@172.16.57.192 "cd ~/apps/ainaidee && docker compose up -d --build && docker image prune -f"
```

Or, once switched to git on the server:

```bash
ssh imperva@172.16.57.192 "cd ~/apps/ainaidee && git pull && docker compose up -d --build && docker image prune -f"
```

## Gotchas

- **`SITE_URL` is baked in at build time**, not read at runtime — it goes into the sitemap and
  into absolute OG image URLs. Changing the domain means rebuilding the image, not restarting
  the container. Right now it's baked as `http://172.16.57.192:8587` (the `docker-compose.yml`
  default); switching to the real domain for phase 2 means setting `SITE_URL` in `.env` on the
  server **and rebuilding**.
- **`.dockerignore` must exclude `packages/runai`'s contents but keep its `package.json`.** A
  plain `packages/runai` entry breaks the build at `COPY packages/runai/package.json`, because
  `--frozen-lockfile` needs that manifest to match the lockfile even though the rest of the
  package is deliberately excluded. Hit this on the first real build; see `CLAUDE.md`.
- **Anything a page imports must be a real dependency in `package.json`.** `src/pages/design.astro`
  imported three `@fontsource` packages that weren't declared, and Rollup failed to resolve them.
  Also hit on the first real build.
- **If you ever add a server-side dependency**, `docker/runtime-package.json` must be updated
  or the container will crash on that code path. Re-derive the list with:
  `grep -rhoE "from *[\"'][@a-z][^\"'./][^\"']*[\"']" dist/server/ | sort -u`
  (recurse over the whole `dist/server/` directory, not just `*.mjs` — the imports live in
  `dist/server/chunks/`).
- **Do not move the builder stage to Alpine.** `sharp` and `@resvg/resvg-js` need glibc; musl
  builds of these are a recurring source of breakage. The runtime stage could be Alpine since
  it has no native deps, but the saving is small next to the 215 MB of static assets.
- **Going back to Vercel** is `git revert` on the adapter commit plus `pnpm add @astrojs/vercel`.

## If you would rather not run a server at all

Every page on this site is prerendered. Only five routes need a server, and they are all API
endpoints: `GET /api/models`, `GET /api/models/[id]`, and `POST /api/compatibility`,
`/api/recommend`, `/api/runai/metrics`. The hardware detection and grading that is the actual
product runs entirely in the visitor's browser.

So if you drop the public JSON API, this becomes a static site that any web server can host and
the container needs no Node at all. Say the word and I will cut that version instead.
