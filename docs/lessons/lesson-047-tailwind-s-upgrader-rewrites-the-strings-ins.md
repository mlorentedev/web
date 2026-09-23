---
id: lesson-047-tailwind-s-upgrader-rewrites-the-strings-ins
type: lesson
status: active
created: "2026-09-22"
owner: manu
tags: [web, tailwind, testing, codemods]
---

# Tailwind's upgrader rewrites the strings inside tests, and a guard's inputs are strings

**Context**: WEB-022 PR4 (#384), moving the site to Tailwind 4 with the official upgrader, `npx @tailwindcss/upgrade`.

**Problem**: The upgrader migrates class names wherever it finds them, and it found them in `site/tests/`. `audit-helpers.test.mjs` holds the colour guard's **must-catch** list: the shapes of raw colour a page must never use. The upgrader "modernised" them. `text-[#fff]` became `text-white`, which removes a case the guard must catch and adds one it must let through. `bg-[color:rgb(1,2,3)]` lost the type hint, which is the exact shape the test's comment documents. The suite would have gone green with a weaker guard, and nothing would have said so.

**Solution**: Revert every upgrader edit under `tests/` (`git checkout -- site/tests/`) and review the rest by hand. The same pass showed the guard had a real gap. Tailwind 4 names a colour through a variable with no brackets (`bg-(--x)`) and moves `!` to the end, so both were added as must-catch cases, red before the change.

**Rule**: A codemod treats string fixtures as code. After running one, diff `tests/` on its own and revert anything that changes a test's *inputs* rather than its imports. A guard's must-catch list is a contract, and "updating" it is how a guard stops guarding.
