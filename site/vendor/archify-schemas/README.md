# archify schemas, vendored

Two JSON Schema files copied from [tt-a1i/archify](https://github.com/tt-a1i/archify),
MIT. They are the contract the Lab's diagram IRs are validated against by
`scripts/diagrams.mjs` and `tests/lab-diagrams.test.mjs`.

## Why these are here and the renderer is not

`#242` installed archify as an authoring-time agent skill and kept its 6.7 MB
payload out of git on purpose: *"Vendoring somebody else's renderer into this
repository buys nothing the lock file does not already give."* That still holds —
the renderer lives in `.agents/`, restored from `skills-lock.json`, and only a
person authoring a diagram needs it.

What CI needs is narrower: the ability to reject an IR that is malformed, without
being able to render one. That is 12 KB of declarative JSON, not a renderer, and
`ajv` validates it as an ordinary pinned npm dependency. Vendoring the *data
contract* is what lets `npm run build` fail on a bad diagram in an environment
where archify is absent.

## Provenance

| | |
|---|---|
| Source | `tt-a1i/archify` |
| Skill version at copy time | `2.16.0-dev.0` |
| Upstream `HEAD` at copy time | `9a5060566c832832fb843e457e58c8ee6bac82fd` (2026-08-27) |
| Files | `architecture.schema.json`, `common.schema.json` |

`2.16.0-dev.0` is an unreleased development build — the latest upstream release
is `v2.15.0`. `skills-lock.json` pins no ref, so `npx skills add` fetches the
default branch, which moves. Recorded here so a future mismatch is diagnosable
rather than mysterious.

## Updating

1. Refresh the skill (`npx skills add tt-a1i/archify`) and note the new version
   and upstream SHA.
2. Copy both files back over the ones here.
3. Re-run `npm run diagrams` — the SVGs are regenerated and re-stamped.
4. `npm test` — if an IR stops validating, the schema changed under it; fix the
   IR, do not loosen the check.
5. Update the table above in the same commit.

Only `architecture.schema.json` is used today. The other four diagram types
(`workflow`, `sequence`, `dataflow`, `lifecycle`) are not vendored until a
diagram needs one.
