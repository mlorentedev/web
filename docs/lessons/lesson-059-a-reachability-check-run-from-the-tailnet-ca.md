---
id: lesson-059-a-reachability-check-run-from-the-tailnet-ca
type: lesson
status: active
created: "2026-09-26"
owner: manu
tags: [web, lab, networking, testing]
---

# A reachability check run from the tailnet cannot see the mesh boundary

**Context**: #292 replaced the Lab's hand-typed "Mesh only" labels with a committed
access table and a live check (`npm run test:access`). The first measurements were
taken with `curl` from the maintainer's laptop, which is a Headscale node.

**Problem**: From that laptop, `pihole.kubelab.live` answered HTTP 403. That looks like
a public service with a gate. It is not: public DNS returns `100.64.0.11`, a tailnet
CGNAT address (kubelab#1549), which only a mesh member can reach. Any HTTP result for a
mesh host measured from a mesh member describes the maintainer's view, not a visitor's.
A classifier that trusted the HTTP answer would have called Pi-hole reachable, and a
runner off the mesh would have disagreed every week.

**Solution**: `tests/lib/access.mjs` decides `mesh` from public DNS alone, before any
HTTP request: no A record from `1.1.1.1`, or only CGNAT (100.64.0.0/10), RFC 1918,
loopback or link-local addresses. HTTP only classifies hosts that resolve publicly
(`authelia` when the root redirects to `auth.kubelab.live`; `app-login` when the row's
probe path answers its recorded status; otherwise `public`). A redirect to any other
host is `elsewhere`, which matches no row, so the check goes red instead of passing a gate
it has no word for as `public` (PR-Agent on #426, `7f040cf`). The weekly check runs on a
GitHub runner, which is off the mesh. A pure unit test pins each rule to the responses
recorded on 2026-09-26, the Pi-hole case included.

**Rule**: When you measure what a visitor can reach, decide the private side from what
the visitor's resolver says, never from a request your own machine completed. Run the
recurring check from a machine outside every private network you are classifying.
