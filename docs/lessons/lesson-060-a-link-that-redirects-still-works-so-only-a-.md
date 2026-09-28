---
id: lesson-060-a-link-that-redirects-still-works-so-only-a-
type: lesson
status: active
created: "2026-09-27"
owner: manu
tags: [web, lab, testing, links]
---

# A link that redirects still works, so only a check that refuses redirects can see it

**Context**: WEB-141 AC3 (#429) asked that no card in the `/lab/idp` catalog target
`kubelab.live` or a redirect. Every card had been clicked when the catalog was written,
and every one still opened.

**Problem**: Three of them opened through a redirect (measured 2026-09-27): Claude's
status page (301 to `status.claude.com`), the Kubernetes docs (301 to `/docs/home/`) and
the Argo CD docs (302 to `/en/stable/`). A browser follows a redirect without a word, so
clicking a card proves nothing, and neither does any check built on `fetch` with its
default `redirect: 'follow'`. A redirect is the first sign that a target has moved; the
next step is usually a 404. It is the blindness of
[lesson 025](lesson-025-curl-il-reports-200-for-every-gated-host.md), where following a
redirect turned a login wall into a 200. A second trap sat on the other side: securityheaders.com
answers 403 to any client that is not a browser, so a check that demanded 200 would have
failed a link that works.

**Solution**: `site/tests/catalog.live.mjs` (`npm run test:links`) fetches every linked
card with `redirect: 'manual'` and fails only on a 3xx, printing the `Location` so the fix
is to paste it into `idp-catalog.json`. Any other status is not a verdict, because a page
that refuses bots says nothing about the link. It is network-bound, so it runs in
`access-check.yml` weekly and on dispatch, not in `npm test`. Whether a card targets
`kubelab.live` is decided offline in `lab-idp-data.test.mjs`, from the host and from the
decoded query string, because a scanner card carries the scanned domain in `?d=`.

**Rule**: To keep outbound links current, fetch them with redirects disabled and fail on
the 3xx; that is the one answer a third party cannot fake by refusing bots. Check a
domain rule offline, and parse the query string as well as the host.
