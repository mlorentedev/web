# ADR-059: `kubelab.live` consolidates into `mlorente.dev` and stays a 308

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-049, ADR-053 (this repo builds one site; kubelab is the platform that serves it)
- **Scope:** DNS and edge for `kubelab.live` (Cloudflare, kubelab repo), and this repo's SEO surface

> Closes SEO-001 (#224) AC1. AC2 is void by construction — it applied only to the
> option not taken. The redirect has been in place since before the issue was
> filed; what was missing was the sentence saying it is deliberate.

## Context

Google Search Console for the `kubelab.live` property reports five URLs it will
not index (`kubelab.live-Coverage-2026-08-17`):

- **Page with redirect (4):** `http://kubelab.live/`, `https://kubelab.live/`,
  `http://www.kubelab.live/`, `https://www.kubelab.live/`.
- **Blocked by robots.txt (1):** the apex forwarding to `mlorente.dev/robots.txt`.

Measured again 2026-09-07:

```text
$ curl -sI https://kubelab.live/
HTTP/2 308
location: https://mlorente.dev/
```

#224 framed this as an open question with two options: keep the 308, or stand up
an independently indexed landing page on `kubelab.live` with its own `robots.txt`
and canonical.

## Decision

**Option 1. `kubelab.live` is a platform-internal domain. Its public root stays a permanent 308 to `https://mlorente.dev/`, and all domain authority consolidates into `mlorente.dev`.**

The site has one public identity, and it is `mlorente.dev` (ADR-053: this repo
builds that site; kubelab operates the platform under it). `kubelab.live` names
the platform for the people and services inside it — Argo CD, Grafana, the
mesh — not a second audience to acquire.

Splitting authority across two apexes to serve one body of content is the
opposite of what the site is optimised for: #127, #128 and #305 are all about
concentrating a single citable surface for LLM retrieval. A second indexed
landing would dilute exactly that, for a domain with no distinct content.

## Consequences

- **The GSC notices are expected and correct, permanently.** "Page with
  redirect" is the intended state of those four URLs, and "Blocked by
  robots.txt" is what a `robots.txt` that redirects to another origin produces.
  They are not a defect queue and should not be re-triaged each time GSC mails
  about them. Anyone reading a future alert can be pointed here.
- No `robots.txt`, `sitemap.xml` or canonical tag is ever published *on*
  `kubelab.live`; SEO work for this site happens once, on `mlorente.dev`.
- If a public platform landing is ever wanted, it is a new decision superseding
  this one, and it lands as a page under `mlorente.dev` first — the domain is
  the question, not the content.
- The 308 (not 301/302) is deliberate: it preserves the method and is
  unambiguously permanent to crawlers.

## Alternatives considered

- **Dedicated public landing on `kubelab.live` (#224 option 2).** Rejected:
  there is no content that belongs to that domain and not to `/lab`, and the
  cost is a permanent split of the authority the rest of the SEO backlog exists
  to concentrate.
- **Remove `kubelab.live` from GSC to silence the alerts.** Rejected: the
  property is how the redirect is verified as still working. Silence is not
  evidence.

## Related

- #224 (SEO-001), #127, #128, #109/#336 (canonical and hreflang hygiene).
- ADR-049, ADR-053.

## Noted, out of scope

`www.mlorente.dev` does not resolve (`curl` exit with no HTTP status,
2026-09-07); `http → https` on the apex does redirect. That is a missing DNS
record in kubelab, not a decision, and it is tracked with the SEO batch rather
than here.
