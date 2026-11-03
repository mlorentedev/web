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
| Skill version at copy time | `2.16.0` |
| Upstream tag at copy time | `v2.16.0` (`c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`) |
| Files | `architecture.schema.json`, `common.schema.json` |

`skills-lock.json` pins that tag, and `npx skills add` needs the same ref on its
command line: without one it fetches the default branch, which moves.

## Updating

1. Refresh the skill (`npx skills add tt-a1i/archify#v2.16.0`, with the new tag)
   and note the new version and upstream SHA.
2. Copy both files back over the ones here.
3. Re-run `npm run diagrams` — the SVGs are regenerated and re-stamped.
4. `npm test` — if an IR stops validating, the schema changed under it; fix the
   IR, do not loosen the check.
5. Update the table above in the same commit.

Only `architecture.schema.json` is used today. The other four diagram types
(`workflow`, `sequence`, `dataflow`, `lifecycle`) are not vendored until a
diagram needs one.
