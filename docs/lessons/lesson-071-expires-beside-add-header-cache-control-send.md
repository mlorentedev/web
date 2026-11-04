---
id: lesson-071-expires-beside-add-header-cache-control-send
type: lesson
status: active
created: "2026-11-04"
owner: manu
tags: [web, nginx, caching, testing]
---

# expires beside add_header Cache-Control sends two headers, and immutable on a stable name keeps a new file away for a year

**Context**: #328 asked for one `Cache-Control` per response. The asset location in
`site/nginx.conf` read as one policy: `expires 1y;` and `add_header Cache-Control
"public, immutable" always;`.

**Problem**: `expires` emits a `Cache-Control: max-age=…` header of its own, so every
asset went out with two. `fetch` joins duplicate headers into one comma-separated value,
so a quick check showed `max-age=31536000, public, immutable`, which looks correct.
The regex also matched `/fonts/*.woff2` and `/images/*`. Their names never change, so
`immutable` promised a returning browser a year of the old bytes. HTML and 404s sent no
`Cache-Control` at all. The config file showed none of this.

**Solution**: one `map $uri $cache_control` at the `http` level and one server-level
`add_header Cache-Control $cache_control always;`. `immutable` applies only to
`/_astro/` and `/beoe/`, whose names are content hashes; other assets get one day, and
pages, `/version.json` and errors get `no-cache`. A 404 is answered under `/404.html`,
so a missing hashed asset is never cached as immutable. No location sets a header any
more, so none can drop the security set. `tests/nginx-cache-probe.mjs` reads
`res.rawHeaders` from the running image. Against the old config it failed 10 of 11
paths; against the new one it passes 11 of 11. CI runs it on every image.

**Rule**: count response headers from the raw list, against the container, never from
`fetch` or from the config. Put `immutable` only on a path whose name is a content
hash, and have a test assert that every file under that path carries one.
