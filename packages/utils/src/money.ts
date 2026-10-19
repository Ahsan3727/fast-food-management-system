/**
 * Money helpers — ALL money in the system is stored as integer paisa.
 * Never use floating-point for money. Never use toFixed() for storage.
 */

/** Convert rupees to paisa (multiply × 100) */
export const toP = (rupees: number): number => Math.round(rupees * 100);

/** Convert paisa to rupees (divide ÷ 100) */
export const toR = (paisa: number): number => paisa / 100;

/** Format paisa as human-readable "Rs. 1,234.00" */
export const formatMoney = (paisa: number): string =>
  `Rs. ${(paisa / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Format paisa as compact "Rs. 1,234" (no decimals) */
export const formatMoneyCompact = (paisa: number): string =>
  `Rs. ${Math.round(paisa / 100).toLocaleString('en-PK')}`;

/** Validate that a value is an integer paisa amount */
export const isValidPaisa = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;
