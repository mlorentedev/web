---
id: lesson-063-a-drafted-claim-about-the-author-s-career-is
type: lesson
status: active
created: "2026-09-27"
owner: manu
tags: [web, content, copy, verification]
---

# A drafted claim about the author's career is a question, not a fact

**Context**: Most of this site is about one person's career: the timeline in
`site/src/data/experience.ts`, the bio in `site/src/content/pages/{en,es}-bio.mdx`, and
the home story drafted for WEB-140. Agents write much of that copy from the CV, the vault
and earlier pages.

**Problem**: It went wrong twice in one week, both times without any test noticing.

- 2026-09-22: a positioning review called the 2019 entry in `experience.ts` a
  misattribution. It read the platform, the per-camera SDK and the onboarding result as
  three unrelated claims. They were one chain, and the entry was wrong only because it
  compressed that chain and used an outdated figure. The fix came from asking, not from
  the diagnosis: onboarding went from 120 to 20–30 days, not from 60 to 14.
- 2026-09-25: the home-story draft read well and passed its tests (length, links, one
  `<h1>`). It still carried five statements nobody had confirmed: hours saved a week at
  a past job, the geography of a role, a current job title, integration time per
  camera, and a location that disagrees with `experience.ts`. Each was plausible and
  inferred from nearby facts.

Tests hold the shape of the copy: word counts, links, locale, banned register. They
cannot hold whether a sentence about someone's life is true, and a plausible inference
passes all of them.

**Solution**: the draft PR lists every inferred claim for the author to confirm before
it is marked ready (the comment on web#418), and the rewrite waits for the answers. A
figure that already appears elsewhere on the site is checked against that source, so
the two cannot disagree.

**Rule**: In copy about the author, a claim not taken from a confirmed source is a
question. Write it into the PR as a question, not into the page as a fact. Where
sources disagree, ask which is right; do not decide which one is wrong.
