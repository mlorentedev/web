/**
 * Feature flags — single source of truth (WEB-027).
 *
 * Each flag is a deliberate, build-time on/off switch. Flags default to `false`,
 * so a flag that is *off* reads as an explicit decision, not as missing config.
 * This keeps "intentionally hidden" distinct from "config absent" — the reason
 * we no longer overload empty strings (e.g. the old `youtube: ''` hack).
 *
 * Build-time only: flags are baked into the static output at `npm run build`.
 * Flipping a flag needs a rebuild + re-promote — there is no runtime/per-request
 * toggle (a true runtime switch would conflict with the immutable
 * promote-by-digest pipeline, ADR-055). Revisit only if that need is real.
 *
 * How to add a flag:
 *   1. Add `name: false` below with a one-line JSDoc note (what it is, why off).
 *   2. Consume it in a component/page as `features.name` (direct boolean access).
 *   3. Flip to `true` when the work behind it is ready to launch; rebuild to ship.
 */
export const features = {
  /** Footer YouTube social link. Off until the channel is active (WEB-027). */
  youtube: false,
} as const;

/** Shape of the flag SSOT — useful for typing helpers/consumers without `any`. */
export type Features = typeof features;
