---
id: lesson-002-feature-flag-grep-verify-the-precise-signal
type: lesson
status: active
created: "2026-06-28"
owner: manu
tags: [web, verification, feature-flags]
---

# Feature-flag grep: verify the precise signal, not a broad token

**Context**: Verifying WEB-027 feature flags — ensuring the footer YouTube link was gated off correctly.

**Problem**: The acceptance criterion said `grep -r "youtube" dist/` should find nothing when the flag is off, but the site has a content tag literally named `youtube` (`/tags/youtube/`), so a bare grep always hits — false positive.

**Solution**: Narrowed the executable check to grep for the specific footer URL `youtube.com/@mlorentedev` — the precise signal for "is the footer anchor present".

**Rule**: When verifying a feature toggle by grepping build output, grep for the *specific rendered content* (URL, class, text node), not a broad token that could match unrelated content taxonomy.
