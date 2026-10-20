"use strict";
/**
 * Money helpers — ALL money in the system is stored as integer paisa.
 * Never use floating-point for money. Never use toFixed() for storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPaisa = exports.formatMoneyCompact = exports.formatMoney = exports.toR = exports.toP = void 0;
/** Convert rupees to paisa (multiply × 100) */
const toP = (rupees) => Math.round(rupees * 100);
exports.toP = toP;
/** Convert paisa to rupees (divide ÷ 100) */
const toR = (paisa) => paisa / 100;
exports.toR = toR;
/** Format paisa as human-readable "Rs. 1,234.00" */
const formatMoney = (paisa) => `Rs. ${(paisa / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;
exports.formatMoney = formatMoney;
/** Format paisa as compact "Rs. 1,234" (no decimals) */
const formatMoneyCompact = (paisa) => `Rs. ${Math.round(paisa / 100).toLocaleString('en-PK')}`;
exports.formatMoneyCompact = formatMoneyCompact;
/** Validate that a value is an integer paisa amount */
const isValidPaisa = (value) => typeof value === 'number' && Number.isInteger(value) && value >= 0;
exports.isValidPaisa = isValidPaisa;
//# sourceMappingURL=money.js.map