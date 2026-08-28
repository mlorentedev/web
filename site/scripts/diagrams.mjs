#!/usr/bin/env node
/**
 * The Lab's diagram pipeline (WEB-080, AC2).
 *
 *   node scripts/diagrams.mjs generate        # authoring: render, theme, stamp
 *   node scripts/diagrams.mjs verify [file]   # build/CI: validate and check stamps
 *
 * ## Why there are two modes
 *
 * `generate` needs archify, which #242 installed as an authoring-time agent
 * skill under `.agents/` and deliberately kept out of git. `verify` must work
 * where archify is absent — the Docker build, CI — so it never renders. It
 * validates each IR against the vendored schema and checks that the committed
 * SVG's `ir-sha256` stamp matches the IR beside it. An IR that is malformed, or
 * edited without re-running `generate`, fails the build.
 *
 * ## Why the SVG needs work after extraction
 *
 * `extractArchitectureSvg` returns the diagram's geometry and nothing else:
 * 29 classes, no `<style>`, no `style=`, no `xmlns`. archify keeps theme in the
 * viewer's stylesheet so the viewer can switch themes live, which means the SVG
 * renders colourless once it leaves the viewer. So `generate`:
 *
 *   1. extracts the SVG;
 *   2. takes from archify's stylesheet only the rules targeting classes this
 *      SVG actually carries (35 rules, ~2.7 KB of the template's 791 rules /
 *      185 KB) — they are written against `var(--…)` and carry no colour;
 *   3. supplies those variables from THIS site's tokens rather than archify's
 *      palette, so the diagram speaks the page's design language (AC1);
 *   4. adds `xmlns`, stamps the IR's sha256, and writes the result.
 *
 * The measured cost of one diagram is 23 KB raw / 4.4 KB gzipped; see
 * `specs/WEB-080/verification.md`.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// archify's schemas declare draft 2020-12; ajv's default export only speaks
// draft-07 and rejects them with "no schema with key or ref …/2020-12/schema".
import Ajv from 'ajv/dist/2020.js';
import colors from 'tailwindcss/colors.js';

import { ACCENT, PROSE_BODY, PROSE_HEADING } from '../src/theme/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const diagramsDir = join(siteRoot, 'src/diagrams');
const generatedDir = join(diagramsDir, 'generated');
const schemasDir = join(siteRoot, 'vendor/archify-schemas');
const archifyRoot = resolve(siteRoot, '../.agents/skills/archify');

/**
 * The site's seven token families, as `tailwind.config.mjs` binds them.
 * Named here rather than inlined so a reader can check the mapping below
 * against the config without holding hex codes in their head.
 */
const token = {
  accent: colors.cyan,
  ink: colors.gray,
  panel: colors.slate,
  ok: colors.emerald,
  warn: colors.amber,
  danger: colors.rose,
  observe: colors.purple,
};

/** `rgb()` with an alpha, from a Tailwind hex. Fills are tinted, strokes are not. */
function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * archify's theme variables, supplied from the site's tokens.
 *
 * Structural variables (surfaces, hairlines, text, arrows) are settled: they map
 * onto `panel` and the prose inks the rest of the site already uses, and the one
 * emphasis colour is the brand accent.
 *
 * The semantic block below is NOT settled — see the note in the PR. archify
 * colours a component by its `type`, and the site's remaining families carry
 * status meaning (`warn`, `danger`) rather than category meaning.
 */
const themeVariables = {
  // Structure.
  '--bg': 'transparent',
  '--grid': token.panel[200],
  '--mask': '#ffffff',
  '--panel': '#ffffff',
  '--panel-border': token.panel[200],
  '--lane-fill': tint(token.panel[50], 0.65),
  '--lane-stroke': token.panel[300],
  // Text, from the same inks as the prose.
  '--text': PROSE_HEADING,
  '--text-muted': PROSE_BODY,
  '--text-dim': token.panel[400],
  '--text-faint': token.panel[500],
  // Relationships. The emphasised arrow is the one brand accent in the diagram.
  '--arrow': token.panel[400],
  '--arrow-emphasis': ACCENT,

  // ---------------------------------------------------------------------------
  // TODO(manu): the semantic mapping. See the PR note before changing.
  // ---------------------------------------------------------------------------
  '--frontend-fill': tint(token.accent[400], 0.15),
  '--frontend-stroke': token.accent[700],
  '--backend-fill': tint(token.ok[400], 0.18),
  '--backend-stroke': token.ok[600],
  '--database-fill': tint(token.observe[400], 0.2),
  '--database-stroke': token.observe[600],
  '--cloud-fill': tint(token.warn[400], 0.18),
  '--cloud-stroke': token.warn[600],
  '--security-fill': tint(token.danger[400], 0.15),
  '--security-stroke': token.danger[600],
  '--messagebus-fill': tint(token.observe[300], 0.15),
  '--messagebus-stroke': token.observe[500],
  '--external-fill': tint(token.panel[400], 0.18),
  '--external-stroke': token.panel[500],
};

function fail(message) {
  process.stderr.write(`diagrams: ${message}\n`);
  process.exit(1);
}

/** archify's schemas `$ref` each other by bare filename, so both are registered. */
function schemaValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(JSON.parse(readFileSync(join(schemasDir, 'common.schema.json'), 'utf8')), 'common.schema.json');
  return ajv.compile(JSON.parse(readFileSync(join(schemasDir, 'architecture.schema.json'), 'utf8')));
}

/**
 * What the schema cannot say.
 *
 * `common.schema.json#/$defs/id` constrains an identifier's *shape* — it cannot
 * say that the identifier resolves, because referential integrity is a relation
 * between parts of the document rather than a property of one value. So an IR
 * with a connection to a component that does not exist, or with two components
 * sharing an id, validates cleanly and then renders a diagram that lies.
 *
 * Four places reference a component id: `connections[].from` and `.to`,
 * `boundaries[].wraps[]`, and `meta.views[].focus[]`.
 */
function topologyErrors(ir) {
  const errors = [];
  const declared = new Set();

  for (const [index, component] of (ir.components ?? []).entries()) {
    if (component?.id === undefined) continue; // the schema already reported this
    if (declared.has(component.id)) {
      errors.push(`components[${index}].id "${component.id}" is declared more than once`);
    }
    declared.add(component.id);
  }

  const checkRef = (value, where) => {
    if (value !== undefined && !declared.has(value)) {
      errors.push(`${where} references "${value}", which is not a component id`);
    }
  };

  for (const [index, connection] of (ir.connections ?? []).entries()) {
    checkRef(connection?.from, `connections[${index}].from`);
    checkRef(connection?.to, `connections[${index}].to`);
  }
  for (const [index, boundary] of (ir.boundaries ?? []).entries()) {
    for (const [wrapIndex, id] of (boundary?.wraps ?? []).entries()) {
      checkRef(id, `boundaries[${index}].wraps[${wrapIndex}]`);
    }
  }
  for (const [index, view] of (ir.meta?.views ?? []).entries()) {
    for (const [focusIndex, id] of (view?.focus ?? []).entries()) {
      checkRef(id, `meta.views[${index}].focus[${focusIndex}]`);
    }
  }
  return errors;
}

/** Schema first, then the references the schema cannot check. */
function architectureValidator() {
  const validateSchema = schemaValidator();
  return (ir, label) => {
    if (!validateSchema(ir)) {
      fail(`${label} does not validate:\n${JSON.stringify(validateSchema.errors, null, 2)}`);
    }
    const errors = topologyErrors(ir);
    if (errors.length > 0) {
      fail(`${label} has broken references:\n  ${errors.join('\n  ')}`);
    }
  };
}

const irFileNames = () =>
  (existsSync(diagramsDir) ? readdirSync(diagramsDir) : []).filter((f) => f.endsWith('.architecture.json'));

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const svgPathFor = (irFile) => join(generatedDir, `${irFile.replace('.architecture.json', '')}.svg`);

/** A syntax error in an IR is a diagram problem, not a crash. */
function parseIr(bytes, label) {
  try {
    return JSON.parse(bytes);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

/** Split a stylesheet into top-level rules, tracking depth so at-rules stay whole. */
function topLevelRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) rules.push({ raw: css.slice(start, i), bodyStart: i });
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        const rule = rules[rules.length - 1];
        rule.body = css.slice(rule.bodyStart + 1, i);
        start = i + 1;
      }
    }
  }
  return rules
    .filter((r) => r.body !== undefined)
    .map((r) => ({ selector: r.raw.replace(/\/\*[\s\S]*?\*\//g, '').trim(), body: r.body }));
}

/**
 * Whitespace-only minification. Safe for what archify emits — colours, lengths
 * and class selectors — but it would corrupt a `url(data:…)` or a quoted
 * `content` value, neither of which appears in the rules this pipeline keeps.
 * If one ever does, stop trimming around `:` rather than papering over it.
 */
const minify = (css) =>
  css
    .replace(/\s*\n\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([:;{},>])\s*/g, '$1')
    .replace(/;\}/g, '}');

/** Only the rules whose selector targets a class the SVG carries. */
function stylesheetFor(svg, templateCss) {
  const used = new Set(
    [...svg.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean),
  );
  const matched = topLevelRules(templateCss).filter((rule) => {
    if (rule.selector.startsWith('@')) return false;
    const classes = [...rule.selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    return classes.length > 0 && classes.some((c) => used.has(c));
  });
  if (matched.length === 0) fail('no stylesheet rules matched the SVG — did archify change its class names?');

  const variables = Object.entries(themeVariables)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
  const rules = matched.map((r) => `${r.selector}{${r.body.trim()}}`).join('\n');
  return minify(`svg{${variables}}\n${rules}`);
}

async function generate() {
  if (!existsSync(archifyRoot)) {
    fail(
      `archify is not installed at ${archifyRoot}.\n` +
        '  `generate` renders diagrams and needs it; run `npx skills add tt-a1i/archify`.\n' +
        '  CI does not run `generate` — it runs `verify`, which needs no renderer.',
    );
  }
  const { extractArchitectureSvg, extractArtifactCss } = await import(
    join(archifyRoot, 'delta/architecture-delta.mjs')
  );

  mkdirSync(generatedDir, { recursive: true });
  const validate = architectureValidator();

  for (const file of irFileNames()) {
    const irPath = join(diagramsDir, file);
    const irBytes = readFileSync(irPath);
    validate(parseIr(irBytes, file), file);

    const html = await renderToHtml(irPath);
    const rawSvg = extractArchitectureSvg(html);
    const stylesheet = stylesheetFor(rawSvg, extractArtifactCss(html));

    const svg = rawSvg
      // Absent from what archify extracts. Harmless inline in HTML5, fatal for a
      // standalone .svg file or an <img src>.
      .replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(/(<title\b)/, `<style>${stylesheet}</style>$1`)
      .concat(`\n<!-- ir-sha256: ${sha256(irBytes)} -->\n`);

    writeFileSync(svgPathFor(file), svg);
    process.stdout.write(`diagrams: ${file} -> ${Buffer.byteLength(svg)} bytes\n`);
  }
}

/** archify's own CLI is the supported path; shelling out keeps us off its internals. */
async function renderToHtml(irPath) {
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');

  // The artifact is ~700 KB and only its SVG is wanted, so it goes to a
  // directory that is removed even when archify exits non-zero.
  const scratch = mkdtempSync(join(tmpdir(), 'archify-'));
  try {
    const out = join(scratch, 'artifact.html');
    execFileSync(
      process.execPath,
      [join(archifyRoot, 'bin/archify.mjs'), 'deliver', 'architecture', irPath, out, '--quality', 'showcase'],
      { stdio: 'pipe' },
    );
    return readFileSync(out, 'utf8');
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function verify(explicitFile) {
  const validate = architectureValidator();

  if (explicitFile) {
    const path = resolve(explicitFile);
    if (!existsSync(path)) fail(`${explicitFile} does not exist`);
    validate(parseIr(readFileSync(path), explicitFile), explicitFile);
    process.stdout.write(`diagrams: ${explicitFile} validates\n`);
    return;
  }

  const files = irFileNames();
  if (files.length === 0) fail(`no *.architecture.json found in ${diagramsDir}`);

  for (const file of files) {
    const irBytes = readFileSync(join(diagramsDir, file));
    validate(parseIr(irBytes, file), file);

    const svgPath = svgPathFor(file);
    if (!existsSync(svgPath)) fail(`${file} has no generated SVG — run \`npm run diagrams\``);

    const stamp = readFileSync(svgPath, 'utf8').match(/<!-- ir-sha256: ([0-9a-f]{64}) -->/);
    if (!stamp) fail(`${svgPath} carries no ir-sha256 stamp — run \`npm run diagrams\``);
    if (stamp[1] !== sha256(irBytes)) {
      fail(`${file} changed since its SVG was generated — run \`npm run diagrams\``);
    }
  }
  process.stdout.write(`diagrams: ${files.length} diagram(s) validated and in sync\n`);
}

const [mode, file] = process.argv.slice(2);
if (mode === 'generate') await generate();
else if (mode === 'verify') verify(file);
else fail('usage: diagrams.mjs generate | verify [file]');
