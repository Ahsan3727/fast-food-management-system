"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envInt = envInt;
exports.envFloat = envFloat;
/**
 * Read a number from an environment variable without ever returning NaN.
 *
 * `parseInt(process.env.X ?? '10000', 10)` returns NaN when X is set but not a
 * number (typo, stray quote, empty string). JSON turns NaN into `null`, so the
 * apps received `deliveryFeePaisa: null` and showed a broken free-delivery bar.
 * These fall back to the default instead.
 */
function envInt(raw, fallback) {
    const n = parseInt(raw ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
}
function envFloat(raw, fallback) {
    const n = parseFloat(raw ?? '');
    return Number.isFinite(n) ? n : fallback;
}
//# sourceMappingURL=env.js.map