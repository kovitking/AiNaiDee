# Deploying AiNaiDee to your own Ubuntu server

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

Verified locally without Docker by running the built server against a minimal tree containing
only `dist/` and `@libsql/client`: pages, model pages, OG images, sitemap, and both the GET and
POST API routes all responded correctly.

## What I still need from you

**Blocking — I cannot finish without these:**

1. **The server's public IP or hostname**, its Ubuntu version, and its architecture
   (`amd64` or `arm64` — it changes the base image behaviour).
2. **Whether anything already listens on ports 80 and 443.** If you run another nginx, Traefik,
   or Caddy on that box, do **not** use the `caddy` service in `docker-compose.yml` — it will
   fail to bind. Delete that service and point your existing proxy at `127.0.0.1:4321`, which
   the `app` service already publishes. Tell me which situation you are in and I will adjust
   the compose file.
3. **DNS control for ainaidee.com.** Before the first `docker compose up`, point an `A` record
   (and `AAAA` if the box has IPv6) at the server. Caddy requests the certificate on startup
   and will fail loudly if DNS has not propagated. Confirm whether you want `www` as well —
   the Caddyfile currently claims both.
4. **An email address for Let's Encrypt**, to replace `admin@ainaidee.com` in the Caddyfile.

**Decisions I need from you:**

5. **Turso telemetry — on or off?** Off by default and the site is fully functional without it;
   only `/api/runai/metrics` fails. If you want it on, put `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN` in a `.env` file next to `docker-compose.yml` **on the server**. Do not
   paste those tokens into chat — I do not need to see them, and I should not.
6. **Deploy style:** manual (`git pull && docker compose up -d --build`) or automatic on push
   via a GitHub Actions runner or a webhook. Manual is fine to start.

**How I run it, if you want me to:**

7. I have no access to your server from here and no Docker on this machine, so **the image has
   never actually been built.** Either paste me the output of the first build and I will fix
   whatever breaks, or give me SSH access and I will run it myself. Your call — the commands
   below are complete either way.

**Worth knowing:**

8. The build is the memory-hungry part; it renders an OG image per model. Give the build at
   least **2 GB of free RAM**. If the box is small, build the image elsewhere and push it to a
   registry instead of building in place.

## Deploying

```bash
git clone https://github.com/kovitking/AiNaiDee.git
cd AiNaiDee

# only if you want telemetry
printf 'TURSO_DATABASE_URL=…\nTURSO_AUTH_TOKEN=…\n' > .env

docker compose up -d --build
docker compose logs -f app
```

Then check it:

```bash
curl -sI https://ainaidee.com | head -1
curl -s https://ainaidee.com/api/models | head -c 200
curl -s -X POST https://ainaidee.com/api/compatibility \
  -H 'content-type: application/json' \
  -d '{"hardware":{"ramGb":32,"gpu":{"name":"NVIDIA RTX 3060"}},"modelId":"llama3.1-8b"}'
```

Updating later:

```bash
git pull && docker compose up -d --build && docker image prune -f
```

## Gotchas

- **`SITE_URL` is baked in at build time**, not read at runtime — it goes into the sitemap and
  into absolute OG image URLs. Changing the domain means rebuilding the image, not restarting
  the container.
- **If you ever add a server-side dependency**, `docker/runtime-package.json` must be updated
  or the container will crash on that code path. Re-derive the list with:
  `grep -rhoE "from *[\"'][@a-z][^\"'./][^\"']*[\"']" dist/server/*.mjs | sort -u`
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
