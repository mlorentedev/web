---
id: lesson-025-curl-il-reports-200-for-every-gated-host
type: lesson
status: active
created: "2026-09-01"
owner: manu
tags: [web, verification, networking, WEB-080]
---

# `curl -IL` reports 200 for every host behind a login, because a login page is a perfectly good 200

**Context**: WEB-080 PR5 migrated thirteen entries from kubelab's homepage
template onto the public `/lab`. Each carries a link. Before shipping them, a
script checked every one with `curl -IL` and reported **13 of 13 reachable**.

**Problem**: the report was false, and in the most convincing possible way.

`-L` follows redirects and reports the status of the *final* hop. Every
`*.kubelab.live` host behind Authelia answers `302 → auth.kubelab.live`, and the
login page returns `200 text/html`. So the check said 200 for hosts that a public
visitor cannot reach at all. Four of the thirteen were in that state. Re-run
without `-L`, recording both the first hop and the final one, the picture
inverted: **six of thirteen unreachable** — four gated, two pointing at the
private repo `mlorentedev/knowledge` — and a seventh returning a genuine 404
because the ADR behind it had been renamed.

Two smaller traps in the same check:

- **`status.kubelab.live` returned 200 and has no public status page.** The 200
  is Uptime Kuma's *admin* SPA shell; `/api/status-page/kubelab` is 404. A 200
  from a single-page app tells you a bundle was served, not that the thing you
  wanted exists.
- **The checking machine was lying about DNS.** This box is a tailnet node, so
  MagicDNS resolved internal names that no public visitor can resolve. Pinning
  `@1.1.1.1` was necessary before any of the numbers meant anything. **A
  reachability check run from inside the network being tested is not a
  reachability check.**

**Solution**: check the **first hop**, record both, and never let a redirect
count as success.

```sh
first=$(curl -s -o /dev/null -w '%{http_code}' -I --max-time 10 "$url")
final=$(curl -s -o /dev/null -w '%{http_code}' -IL --max-time 10 "$url")
# 302 -> 200 is a login wall, not a reachable page.
```

The consequence for the page was structural, not cosmetic: links are rendered
only where a public reader can follow them, and every entry pins its `sourceHref`
verbatim so the migration stays auditable. See `lesson-026`.

**Takeaway**: a status code answers "did something reply", never "did the thing I
asked for exist and did I get it". Any check whose success condition is a 2xx
after redirects will pass against a login page, a captive portal, a soft 404 and
an SPA shell. Decide what evidence would distinguish success from each of those,
and assert *that*. And before trusting any reachability number, ask what network
the measuring machine is on — because the answer is only interesting from where
the user stands.

**Related**: `lesson-026` (what the false result would have shipped),
`lesson-027` (a recorded command that asserts nothing), `lesson-016` (a test that
only ever runs against the fix).
