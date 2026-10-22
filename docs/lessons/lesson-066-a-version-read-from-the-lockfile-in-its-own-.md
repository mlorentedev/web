---
id: lesson-066-a-version-read-from-the-lockfile-in-its-own-
type: lesson
status: active
created: "2026-10-22"
owner: manu
tags: [web, docker, dependencies, ci]
---

# A version read from the lockfile in its own stage keeps the cache a pinned literal bought

**Context**: WEB-163. The Dockerfile installs Chromium's system libraries with
`npx playwright install-deps chromium` as root, before `npm ci`, so that root-owned layer
survives source edits. Before `npm ci` there is no installed Playwright to ask, so the
version was written into the Dockerfile by hand: `playwright@1.62.1`.

**Problem**: Dependabot bumps `site/package-lock.json` and never the literal. The image
installed the libraries 1.62.1 asks for and the browser 1.64.1 ships, and nothing compared
the two. The literal looked like the price of the cache: reading the lockfile in the build
stage means copying it in before `install-deps`, and then every lockfile edit, of any
package, reruns the apt layer.

**Solution**: A first stage, `playwright-version`, copies the lockfile and writes the one
version string to a file. The build stage copies only that file with
`COPY --from=playwright-version`, then installs `playwright@$(cat …)`. BuildKit keys a
`COPY` on the content of what it copies, so the extra stage reruns on every lockfile edit,
but its one-line output only changes with Playwright. Measured with two builds, the second
after editing a field in the lockfile that is not Playwright: the stage reran, and
`COPY --from` and `install-deps` both reported `CACHED`. A test bans `playwright@<digits>`
in the Dockerfile and keeps `install-deps` ahead of `npm ci`.

**Rule**: A version that must exist before the dependency install is a second copy of the
lockfile, and Dependabot only updates the first. Derive it in a small stage that reduces
the lockfile to the one value, and copy only that value forward: the cache follows the
value, not the file. Then ban the literal in a test, because the next hand edit is the most
likely way it comes back.
