---
id: lesson-040-a-link-safety-check-that-only-filters-pr
type: lesson
status: active
created: "2026-09-05"
owner: manu
tags: [web, verification, security, adr]
---

# A link safety check that only filters private subnets leaks public IP addresses

**Context**: Migrating the KubeLab IDP catalog (`bookmarks.yaml` from gethomepage) into `mlorente.dev/lab/idp` (PR #318 / #319), where external links are rendered for public visitors.

**Problem**: The provenance test guarded link safety by checking for known internal prefixes (`!url.includes('100.64.')` and `!url.includes('172.16.')`). However, Shodan's perimeter link targeted the bare IPv4 address of the production Hetzner host (`https://www.shodan.io/host/162.55.57.175`). The substring check passed, but the link leaked the public infrastructure IP address in the static HTML bundle, violating the zero-addressing doctrine of ADR-056 §3 ("No addressing. No public IPs, no mesh/CGNAT addresses, no LAN subnets, in any field or diagram").

**Solution**: Sanitized the Shodan entry to query by domain (`https://www.shodan.io/domain/kubelab.live`) with a clarifying `urlNote`, and upgraded the link safety test in `site/tests/lab-idp-data.test.mjs` from specific subnet filters to a fail-closed regex:

```javascript
assert.ok(
  !/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(item.url),
  `item ${item.id} leaked raw IP address in public url: ${item.url}`
);
```

**Rule**: Do not guard against addressing leakage with an enumeration of private CIDRs. If a field is public, assert fail-closed against any IP address pattern.
