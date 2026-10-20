/**
 * Money helpers — ALL money in the system is stored as integer paisa.
 * Never use floating-point for money. Never use toFixed() for storage.
 */
/** Convert rupees to paisa (multiply × 100) */
export declare const toP: (rupees: number) => number;
/** Convert paisa to rupees (divide ÷ 100) */
export declare const toR: (paisa: number) => number;
/** Format paisa as human-readable "Rs. 1,234.00" */
export declare const formatMoney: (paisa: number) => string;
/** Format paisa as compact "Rs. 1,234" (no decimals) */
export declare const formatMoneyCompact: (paisa: number) => string;
/** Validate that a value is an integer paisa amount */
export declare const isValidPaisa: (value: unknown) => value is number;
//# sourceMappingURL=money.d.ts.map