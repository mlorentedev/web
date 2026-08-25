# ---------- Build Stage — Static site (Astro output: 'static') ----------
# CI context: ./apps/web — files copied from site/ subdirectory
#
# Debian rather than Alpine: the build renders the notes' mermaid diagrams to
# SVG through a headless browser, and Playwright ships no musl build. Nothing
# from this stage is published — the runtime image below is still Alpine, and
# only dist/ crosses over — so the larger base costs layer cache, not registry
# size or attack surface.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build

ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

# Astro build arguments (injected by CI from values/*.yaml)
ARG PUBLIC_SITE_TITLE
ARG PUBLIC_SITE_DESCRIPTION
ARG PUBLIC_SITE_DOMAIN
ARG PUBLIC_SITE_URL
ARG PUBLIC_SITE_MAIL
ARG PUBLIC_SITE_AUTHOR
ARG PUBLIC_SITE_KEYWORDS
ARG PUBLIC_TWITTER_URL
ARG PUBLIC_YOUTUBE_URL
ARG PUBLIC_GITHUB_URL
ARG PUBLIC_CALENDLY_URL
ARG PUBLIC_BUY_ME_A_COFFEE_URL
ARG PUBLIC_GOOGLE_ANALYTICS_ID
ARG PUBLIC_GOOGLE_TAG_MANAGER_ID
ARG BACKEND_URL

WORKDIR /app
RUN chown node:node /app

# Make build arguments available as env vars for Astro static build
ENV PUBLIC_SITE_TITLE=${PUBLIC_SITE_TITLE} \
    PUBLIC_SITE_DESCRIPTION=${PUBLIC_SITE_DESCRIPTION} \
    PUBLIC_SITE_DOMAIN=${PUBLIC_SITE_DOMAIN} \
    PUBLIC_SITE_URL=${PUBLIC_SITE_URL} \
    PUBLIC_SITE_MAIL=${PUBLIC_SITE_MAIL} \
    PUBLIC_SITE_AUTHOR=${PUBLIC_SITE_AUTHOR} \
    PUBLIC_SITE_KEYWORDS=${PUBLIC_SITE_KEYWORDS} \
    PUBLIC_TWITTER_URL=${PUBLIC_TWITTER_URL} \
    PUBLIC_YOUTUBE_URL=${PUBLIC_YOUTUBE_URL} \
    PUBLIC_GITHUB_URL=${PUBLIC_GITHUB_URL} \
    PUBLIC_CALENDLY_URL=${PUBLIC_CALENDLY_URL} \
    PUBLIC_BUY_ME_A_COFFEE_URL=${PUBLIC_BUY_ME_A_COFFEE_URL} \
    PUBLIC_GOOGLE_ANALYTICS_ID=${PUBLIC_GOOGLE_ANALYTICS_ID} \
    PUBLIC_GOOGLE_TAG_MANAGER_ID=${PUBLIC_GOOGLE_TAG_MANAGER_ID} \
    BACKEND_URL=${BACKEND_URL}

# Chromium's shared libraries, as root and before dropping privileges. Their
# own layer so they survive every source edit in the cache.
RUN npx --yes playwright@1.62.1 install-deps chromium \
 && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node site/package.json site/package-lock.json ./

USER 1000:1000

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --include=dev

# The browser itself, unprivileged, after the dependency install so it is
# refetched only when Playwright's version moves.
RUN npx playwright install chromium

COPY --chown=node:node site/ ./

RUN npm run build

# ---------- Runtime Stage — Nginx static serving ----------
FROM nginx:1.27-alpine

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run && \
    touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid

COPY --from=build /app/dist /usr/share/nginx/html
COPY site/nginx.conf /etc/nginx/conf.d/default.conf

USER 1001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-qO-", "http://localhost:8080/"]
