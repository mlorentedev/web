#!/usr/bin/env python3
"""Registry hygiene for docker.io/mlorentedev/kubelab-web.

Two jobs that read the same registry listing:

  audit  — every published GitHub release must have a semver image behind it.
           A release with no artifact is a version nobody can pull or roll back
           to, and it has happened: v1.10.1 is a git tag with no image (#172).
           Nothing detected it, because the promote step was *skipped* rather
           than failed, and a skipped job is indistinguishable from one that
           had nothing to do.

  prune  — delete `sha-*` tags nothing references any more. Nothing has ever
           pruned this repository, so it grew to 49 tags and ~1 GB, 33 of them
           per-commit builds (#166).

The retention rule keeps anything that could still be needed:

  * every semver tag, forever — those are the releases;
  * `latest`;
  * any `sha-*` that shares a digest with a semver tag, **however old**. That
    pointer is the audit link proving build-once/promote-by-digest: the semver
    tag was re-tagged from that exact build, not rebuilt. Measured cost of this
    exemption: 4 tags out of 33;
  * the N most recent `sha-*`, so a rollback to a recent commit still works.

Everything else is a per-commit build that no release points at.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

REPO = "mlorentedev/kubelab-web"
HUB = "https://hub.docker.com/v2"

# Tags to delete by name whatever the rules above say. `dev` was last pushed
# 2026-06-15 — the same day the promote path stopped (#173) — and nothing
# references it. An alias nobody may use is a trap with upkeep.
DELETE_ALWAYS = {"dev"}

# Releases knowingly published without an image. Listed here rather than left to
# fail the audit forever, so the exception is visible in code and disappears
# when the underlying ticket lands.
#   1.10.1 — the arm64 build stalled under QEMU and was killed at the six-hour
#            ceiling, so promote-prod was skipped. Republishing is #172 AC2.
KNOWN_MISSING_IMAGES = {"1.10.1"}


def api(url: str, token: str | None = None, method: str = "GET") -> dict | None:
    req = urllib.request.Request(url, method=method)
    if token:
        req.add_header("Authorization", f"JWT {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
            return json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"{method} {url} -> {exc.code} {exc.reason}") from exc


def login() -> str:
    """Exchange the Docker Hub PAT for a JWT. Never print either."""
    user, pat = os.environ.get("DOCKERHUB_USERNAME"), os.environ.get("DOCKERHUB_TOKEN")
    if not user or not pat:
        raise SystemExit("DOCKERHUB_USERNAME and DOCKERHUB_TOKEN must be set")
    payload = json.dumps({"username": user, "password": pat}).encode()
    req = urllib.request.Request(
        f"{HUB}/users/login/", data=payload, method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)["token"]


def list_tags() -> list[dict]:
    tags, url = [], f"{HUB}/repositories/{REPO}/tags?page_size=100"
    while url:
        page = api(url)
        tags += page["results"]
        url = page.get("next")
    return tags


def is_semver(name: str) -> bool:
    parts = name.split(".")
    return len(parts) == 3 and all(p.isdigit() for p in parts)


def audit(tags: list[dict]) -> int:
    """Fail if a GitHub release has no image behind it."""
    releases = {
        r["tagName"].lstrip("v") for r in json.load(sys.stdin)
    } if not sys.stdin.isatty() else set()
    images = {t["name"] for t in tags if is_semver(t["name"])}

    missing = sorted(releases - images - KNOWN_MISSING_IMAGES)
    accepted = sorted((releases - images) & KNOWN_MISSING_IMAGES)

    print(f"releases: {len(releases)}  semver images: {len(images)}")
    for tag in accepted:
        print(f"  accepted gap: {tag} (see KNOWN_MISSING_IMAGES)")
    if missing:
        for tag in missing:
            print(f"  MISSING IMAGE: release v{tag} has no {REPO}:{tag}")
        print(
            "\nA published release with no image cannot be pulled, deployed or "
            "rolled back to. Build and promote it by digest, or record it in "
            "KNOWN_MISSING_IMAGES with a reason."
        )
        return 1
    print("every release has an image behind it")
    return 0


def prune(tags: list[dict], keep_recent: int, dry_run: bool) -> int:
    semver_digests = {t["digest"] for t in tags if is_semver(t["name"])}
    shas = sorted(
        (t for t in tags if t["name"].startswith("sha-")),
        key=lambda t: t["last_updated"],
        reverse=True,
    )

    keep_names = {t["name"] for t in shas[:keep_recent]}
    linked = {t["name"] for t in shas if t["digest"] in semver_digests}
    doomed = [t for t in shas if t["name"] not in keep_names | linked]
    doomed += [t for t in tags if t["name"] in DELETE_ALWAYS]

    freed = sum(t.get("full_size") or 0 for t in doomed)
    print(
        f"{len(tags)} tags | keeping {len(semver_digests)} semver, "
        f"{len(keep_names)} recent sha, {len(linked)} semver-linked sha "
        f"(the build-once audit trail)"
    )
    print(f"{'would delete' if dry_run else 'deleting'} {len(doomed)} tags, ~{freed // 1024 // 1024} MB")
    for t in doomed:
        print(f"  - {t['name']:<18} {t['last_updated'][:10]}")
    if dry_run or not doomed:
        return 0

    token = login()
    for t in doomed:
        api(f"{HUB}/repositories/{REPO}/tags/{t['name']}/", token, method="DELETE")
    print(f"deleted {len(doomed)} tags")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("audit", "prune"))
    parser.add_argument("--keep-recent", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    tags = list_tags()
    return audit(tags) if args.mode == "audit" else prune(tags, args.keep_recent, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
