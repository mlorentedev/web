---
id: lesson-014-a-subagent-finding-is-a-claim-to-verify-no
type: lesson
status: active
created: "2026-08-25"
owner: manu
tags: [web, verification, agents, process]
---

# A subagent's finding is a claim to verify, not a result to act on

**Context**: Eight parallel audits of the site and platform in one session. Their combined output drove
eleven pull requests, most of them corrections to things the audits found.

**Problem**: Two findings were wrong in opposite directions, and both would have shipped.

One reported `gitea.kubelab.live` as serving "the real Gitea UI, 200, unauthenticated" — read as a
credential-free exposure of a git forge. Checked directly: the instance answers 200 and renders its
login page, the Swagger index and its version, but `/explore/repos` lists **zero repositories**. Real
finding, wrong severity — hardening, not a breach. Reporting it as written would have raised an alarm
about a leak that does not exist.

The other marked the site's "token-bucket rate limiting" claim as unsourced, because it is absent from
the Go API's code. It is a **Traefik middleware** — `rate-limit@file`, applied in `deploy-vps.yml` and
the prod overlay. Acting on it would have deleted a true claim in a session whose entire purpose was
removing false ones.

The pattern in both: the agent looked in one plausible place, found nothing, and reported the absence
as a fact. Neither was careless — one checked an endpoint, the other read the source. Each simply
stopped at the first place the answer could have been.

**Solution**: Re-verify before acting, and verify the *specific claim* rather than the topic. For the
Gitea report that was one `curl` of `/explore/repos`; for the rate limiter, one `grep` across `infra/`
rather than `apps/api/`. Both took under a minute against changes that would have taken far longer to
undo.

**Rule**: Treat a subagent's report as evidence, not as a conclusion — especially a **negative** one.
"I did not find X" is a statement about where the agent looked, and it carries no information about
where X actually lives. Before deleting a claim on an agent's say-so, confirm the absence yourself in
at least one place the agent did not check. The cost is a minute; the failure mode is asserting the
opposite of the truth in the very change meant to correct the record.
