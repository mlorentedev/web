/**
 * The brand package's banned register (vault `brand-package.md` §7), as patterns
 * in both languages. §7 names phrases; the pages carried their relatives
 * ("Zero-Debt Doctrine", "100% IaC", "deterministic containment"), so each entry
 * bans the word family, and the true technical uses were reworded rather than
 * excused.
 *
 * Certifications match the singular adjective only: "certificados TLS" is a TLS
 * certificate, not a credential Manu holds. §7 items a pattern cannot judge stay
 * out: France (only wrong when customer-facing), the em-dash as a tic (the page
 * title uses one as a separator), and node or service counts, which WEB-141
 * checks against `platform.json` instead.
 *
 * Shared here rather than kept in `retired-labels.test.mjs` for the reason
 * `audit.mjs` gives: a test file registers its tests on import, so another
 * suite could only copy the list, and two copies drift.
 */
export const banned = [
  /\bdeterminist\w*/i,
  /\bstochastic\b|\bestoc[aá]stic[oa]s?\b/i,
  /\bswarms?\b|\benjambres?\b/i,
  /\bsovereign\w*|\bsoberan[oíia]\w*/i,
  /\bzero\W{0,3}(technical\s+)?debt\b|\bcero\s+deuda\b|\bdeuda\s+t[eé]cnica\s+cero\b/i,
  /\b100\s?%\s*(IaC|automat\w*)/i,
  /\bcertified\b|\bcertificad[oa]\b|\bCKAD?\b|Terraform Associate|Solutions Architect/i,
  /service-as-a-software/i,
  /weekly readers|lectores semanales/i,
  /legacy C\+\+/i,
];
