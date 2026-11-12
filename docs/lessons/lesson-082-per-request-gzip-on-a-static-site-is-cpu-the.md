---
id: "lesson-082-per-request-gzip-on-a-static-site-is-cpu-the"
type: lesson
status: active
title: "Per-request gzip on a static site is CPU the pod pays on every view"
created: "2026-11-06"
owner: manu
tags: [web, nginx, performance, capacity]
---

# Per-request gzip on a static site is CPU the pod pays on every view

**Context**: web#527 turned on `gzip on` at level 5 in `site/nginx.conf`, because
nothing upstream compressed and `/lab/` went out as 111 KB of HTML. The change was
right about bytes. kubelab's load test later reran against the new image.

**Problem**: nginx deflated the same static file on every request. With the same
image and only `Accept-Encoding` changed, `/` used 112m CPU at 25 req/s with gzip
against 14m with identity. At 800 req/s, gzip pinned the pod at its 500m limit,
delivered 331 req/s with 73% timeouts, while identity delivered 795 with none (#615;
kubelab `docs/load-test/2026-11-06-985dda03*.json`). Browsers always send
`Accept-Encoding: gzip`, so production paid it on every page view. No test noticed: the
gzip tests checked that the response was compressed, not what it cost.

**Solution**: compress once, at build. `scripts/precompress.mjs` runs as `postbuild`
and writes a level-9 `.gz` beside each text file nginx would compress. `gzip_static on`
sends those files, and `gzip on` stays as the fallback. Served from the real
`nginx:1.31-alpine` image, `/` with gzip answers with a `Content-Length` equal to
`dist/index.html.gz` byte for byte, so nginx read a file and compressed nothing.
`tests/nginx-gzip.test.mjs` fails if a built text file lacks a `.gz` that decompresses
to it, or if `gzip_static` is off.

**Rule**: a server that serves static files should not compress them per request.
Precompress at build and serve the copies (`gzip_static`, `brotli_static`), and give a
compression change a load measurement next to its size measurement.
