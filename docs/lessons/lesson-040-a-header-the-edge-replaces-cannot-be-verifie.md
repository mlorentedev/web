---
id: lesson-040-a-header-the-edge-replaces-cannot-be-verifie
type: lesson
status: active
created: "2026-09-05"
owner: manu
tags: [web, security, verification, nginx]
---

# A header the edge replaces cannot be verified end-to-end

**Context**: `#308` (WEB-111). While checking `/version.json` on staging, the
security headers a client receives turned out not to be the ones
`site/nginx.conf` declares. The pod said `X-Frame-Options: SAMEORIGIN` and a
Permissions-Policy without `payment=()`; the wire said `DENY`, with it.

**Problem**: Neither layer was broken, and that is the whole difficulty. The
mlorente.dev IngressRoute carries Traefik's `secure-headers` middleware, whose
values *replace* the origin's. So the origin's weaker set never reaches a
browser through the ingress — and the check anyone reaches for, `curl` against
the public URL, measures the layer that hides it. The divergence was
simultaneously invisible from outside and completely real: the origin is what
serves whenever the middleware is absent, which is `docker run`, a
`kubectl port-forward`, or any future route that omits it.

This is the exact inverse of kubelab `lesson-193` (*"security headers must be
verified end-to-end, not just at origin"*). Both are true. End-to-end is
necessary because the edge can fail to add a header; it is **not sufficient**,
because a passing edge masks whatever the origin declares. A green end-to-end
check says nothing at all about the value underneath it.

**Solution**: Verify the origin *as the origin* — run the image without the
edge, in the image family and at the config path the Dockerfile uses:

```bash
docker run --rm -d -p 8099:8080 \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine
curl -sSI http://127.0.0.1:8099/ | grep -iE '^(x-frame|permissions)'
# X-Frame-Options: DENY
# Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Then pin it with a test that reads the conf, because a container check is not
something CI will repeat on every edit. Two details earned their place:

- The trigger is *"this block sets any header"*, not *"sets a security
  header"*. `add_header` **replaces** the inherited set rather than adding to it
  (kubelab `lesson-107`), so the dangerous edit is a `location` that gains a
  `Cache-Control` and silently drops four security headers.
- Compare only the platform's own keys. The first draft compared the `server`
  block exhaustively and every `location` filtered — two copies of one rule,
  already drifting, which is precisely what the file exists to catch. Adding
  `X-XSS-Protection` (which the middleware also sends) would have failed with a
  message saying the origin *disagreed* when it agreed more.

**Rule**: When one layer overrides another, an observation taken past the
override is evidence about the override and nothing else. Test the layer you
are making a claim about, in isolation, and where the authoritative value lives
in another repository, copy it with its provenance named and state plainly that
drift originating there fails nothing here. A copy whose limits are written
down is honest; a copy presented as a check is not.

See also
[a black-box probe tells you what happens, never why](lesson-036-a-black-box-probe-tells-you-what-happens-nev.md)
— the same boundary from the other side — and
[a mutation you did not verify mutated is not evidence](lesson-037-a-mutation-you-did-not-verify-mutated-is-not.md),
which is why both directions were mutated here rather than only the failing one.
