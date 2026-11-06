---
id: lesson-081-a-node-modules-symlink-slips-past-a-trailing
type: lesson
status: active
created: "2026-11-06"
owner: manu
tags: [web, git, worktrees]
---

# A node_modules symlink slips past an ignore pattern with a trailing slash

**Context**: Worktrees share one install by making `site/node_modules` a symlink to
another worktree's `node_modules`. `.gitignore` listed `node_modules/` and
`site/node_modules/`.

**Problem**: In `.gitignore`, a pattern that ends in `/` matches only directories, and git
records a symlink as a link, not as a directory. `git status` showed `?? site/node_modules`,
which reads like build noise, and a `git add site` committed it to the WEB-176 PR as a
mode `120000` entry whose content is a path on one developer's machine. A checkout of that
branch gets a dangling link where `npm install` expects a directory.

**Solution**: The patterns drop the trailing slash (`node_modules`), so a directory and a
symlink are both ignored. `git check-ignore -v site/node_modules` now names the rule. The
link was removed from the index with `git rm --cached`.

**Rule**: Ignore a path that can be a symlink without a trailing slash. A `??` line is not
noise until `git check-ignore` agrees, and staging a whole directory needs a look at
`git status` first.
