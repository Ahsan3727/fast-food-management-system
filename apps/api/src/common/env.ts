/**
 * Read a number from an environment variable without ever returning NaN.
 *
 * `parseInt(process.env.X ?? '10000', 10)` returns NaN when X is set but not a
 * number (typo, stray quote, empty string). JSON turns NaN into `null`, so the
 * apps received `deliveryFeePaisa: null` and showed a broken free-delivery bar.
 * These fall back to the default instead.
 */
export function envInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export function envFloat(raw: string | undefined, fallback: number): number {
  const n = parseFloat(raw ?? '');
  return Number.isFinite(n) ? n : fallback;
}
