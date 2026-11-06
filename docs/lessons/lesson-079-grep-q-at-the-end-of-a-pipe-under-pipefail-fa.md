---
id: lesson-079-grep-q-at-the-end-of-a-pipe-under-pipefail-fa
type: lesson
status: active
created: "2026-11-05"
owner: manu
tags: [web, bash, ci, testing]
---

# grep -q at the end of a pipe under pipefail fails at random once its input outgrows one pipe write

**Context**: `scripts/check-lessons.sh` runs under `set -euo pipefail`. For each lesson file
it checked membership with `printf '%s\n' "$targets" | grep -qxF -- "$name"`, where
`$targets` is every link target in `docs/lessons/_index.md`.

**Problem**: `grep -q` exits on its first match and closes the pipe. If `printf` is still
writing, it dies of SIGPIPE (status 141), and `pipefail` makes the whole pipeline fail, so
the script reported a listed lesson as "not in docs/lessons/_index.md". A write of up to
4 KiB to a pipe is atomic; the targets passed that size (4465 bytes at 77 lessons), so the
write could split and the race opened. It failed some CI runs and no local one, and an
early name (`lesson-002`) was the one reported, since grep finds it first. With 64 KiB of
targets, past the pipe buffer, it fails on every run.

**Solution**: `grep -qxF -- "$name" <<< "$targets"`. A here-string has no writer process to
kill. The test builds an index of 700 long names (69 KB of targets) and fails on every run
with the old line. The replay test's assertions now report the run they asserted on, with
stderr.

**Rule**: Under `pipefail`, never put a reader that stops early (`grep -q`, `grep -m`,
`head`) after a writer whose output can grow. Feed it from a here-string or a file, or let
it read everything.
