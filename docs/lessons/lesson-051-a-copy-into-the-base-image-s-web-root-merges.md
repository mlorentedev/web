---
id: lesson-051-a-copy-into-the-base-image-s-web-root-merges
type: lesson
status: active
created: "2026-09-23"
owner: manu
tags: [web, docker, nginx, delivery]
---

# A COPY into the base image's web root merges with what is already there

**Context**: #376 moved the test suite from a runner build of `dist/` to the tree the published image serves, extracted from `/usr/share/nginx/html` by digest.

**Problem**: The first run against a real image (`sha-641b26a`) failed in `tailwind-wiring.test.mjs`: `50x.html: no Tailwind preflight in the CSS it ships`. No build produces a `50x.html`. `nginx:1.27-alpine` ships `index.html` and `50x.html` in its web root, and `COPY --from=build /app/dist /usr/share/nginx/html` adds files to that directory rather than replacing it. `index.html` was overwritten; `50x.html` survived. `nginx.conf` defines only `error_page 404`, so nothing used it, but prod answered it: `curl https://mlorente.dev/50x.html` returned 200 with nginx's stock error page. Every test that read the runner's `dist/` passed, because that tree never had the file.

**Solution**: The runtime stage empties the root before the COPY (`rm -rf /usr/share/nginx/html/*`), so the served tree is exactly `dist/`. `served-tree.test.mjs` asserts the wipe comes before the COPY, and reads the root from `nginx.conf` rather than restating it.

**Rule**: `COPY` into a directory the base image already populates is a merge. When the directory is meant to hold only your output, empty it first. The test for "the image serves what we built" has to read the image, because a build output cannot contain a file the base image added.
