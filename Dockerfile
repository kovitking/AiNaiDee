# syntax=docker/dockerfile:1

# ─── builder ──────────────────────────────────────────────────────────────
# Needs glibc: sharp and @resvg/resvg-js are native and generate the OG images
# at build time. Do not move this stage to Alpine.
FROM node:24-bookworm-slim AS builder

WORKDIR /app
RUN npm install -g pnpm@11.1.3

# Manifests first so dependency layers cache across source changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/compatibility/package.json packages/compatibility/
COPY packages/models/package.json packages/models/
# runai's manifest is copied but its source is not (see .dockerignore). The
# workspace has to match the lockfile or --frozen-lockfile refuses to install.
COPY packages/runai/package.json packages/runai/

# `canirun-ai...` = the site plus the workspace packages it depends on. This
# deliberately excludes packages/runai, whose node-llama-cpp dependency pulls a
# large native toolchain the website never uses.
RUN pnpm install --frozen-lockfile --filter "canirun-ai..."

COPY . .

# Baked into the sitemap and the absolute OG image URLs, so it must be the real
# public origin at build time, not at run time.
ARG SITE_URL=https://ainaidee.com
ENV SITE_URL=$SITE_URL

# Blog (Ghost), planned — see docs/blog-plan.md. Posts are fetched at build
# time only (src/lib/ghost.ts), never at runtime, so these are build ARGs, not
# runtime environment. Left unset, the blog routes build a "coming soon" page
# instead of failing — safe to leave both empty until Ghost is actually live.
ARG GHOST_URL=""
ARG GHOST_CONTENT_API_KEY=""
ENV GHOST_URL=$GHOST_URL
ENV GHOST_CONTENT_API_KEY=$GHOST_CONTENT_API_KEY

RUN pnpm build

# ─── runtime ──────────────────────────────────────────────────────────────
# The built server imports exactly one package from node_modules
# (@libsql/client, for the /api/runai/metrics endpoint). Everything else is
# either bundled into dist/server or was only needed at build time. Verify with:
#   grep -rhoE "from *[\"'][@a-z][^\"'./][^\"']*[\"']" dist/server/*.mjs
FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY docker/runtime-package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/api/models').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server/entry.mjs"]
