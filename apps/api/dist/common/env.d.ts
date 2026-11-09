/**
 * Read a number from an environment variable without ever returning NaN.
 *
 * `parseInt(process.env.X ?? '10000', 10)` returns NaN when X is set but not a
 * number (typo, stray quote, empty string). JSON turns NaN into `null`, so the
 * apps received `deliveryFeePaisa: null` and showed a broken free-delivery bar.
 * These fall back to the default instead.
 */
export declare function envInt(raw: string | undefined, fallback: number): number;
export declare function envFloat(raw: string | undefined, fallback: number): number;
//# sourceMappingURL=env.d.ts.map