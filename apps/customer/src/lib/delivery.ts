/**
 * delivery — the free-delivery rule in ONE place (pure, no React, no imports).
 *
 * The server decides the real fee (orders.service: free when subtotal >=
 * FREE_DELIVERY_OVER_PAISA). This mirrors it for DISPLAY only, so the cart,
 * the menu strip and the laptop cart panel can never disagree with each other.
 *
 * "Over" in the design copy is really "from": the server uses >=, so a subtotal
 * of exactly the threshold already ships free.
 */

/** Used by the cart when /app-config is unreachable (matches the server defaults). */
export const FALLBACK_FEE_PAISA = 10_000;
export const FALLBACK_FREE_OVER_PAISA = 100_000;

/** What /app-config returns. JSON turns NaN into null, so every field may be null. */
export interface DeliveryConfigInput {
  deliveryFeePaisa?: number | null;
  freeDeliveryOverPaisa?: number | null;
}

export interface DeliveryInfo {
  /** Fee that applies to THIS subtotal (0 when free). */
  feePaisa: number;
  /** Fee charged below the threshold. */
  standardFeePaisa: number;
  thresholdPaisa: number;
  isFree: boolean;
  /** How much more to spend to unlock free delivery (0 once unlocked). */
  remainingPaisa: number;
  /** 0..1, for the progress bar. */
  progress: number;
  /**
   * True only when BOTH numbers came from a valid config. When false the
   * numbers above are the fallbacks: the cart still works, but the menu strip
   * hides rather than show made-up figures.
   */
  configured: boolean;
}

/** A fee may be 0 (free for everyone); a threshold must be above 0 to mean anything. */
const validFee = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const validThreshold = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

export function computeDelivery(
  subtotalPaisa: number,
  cfg?: DeliveryConfigInput | null,
): DeliveryInfo {
  const feeOk = validFee(cfg?.deliveryFeePaisa);
  const thresholdOk = validThreshold(cfg?.freeDeliveryOverPaisa);

  const standardFeePaisa = feeOk ? (cfg!.deliveryFeePaisa as number) : FALLBACK_FEE_PAISA;
  const thresholdPaisa = thresholdOk ? (cfg!.freeDeliveryOverPaisa as number) : FALLBACK_FREE_OVER_PAISA;

  const subtotal = Number.isFinite(subtotalPaisa) && subtotalPaisa > 0 ? subtotalPaisa : 0;
  const isFree = subtotal >= thresholdPaisa;

  return {
    feePaisa: isFree ? 0 : standardFeePaisa,
    standardFeePaisa,
    thresholdPaisa,
    isFree,
    remainingPaisa: Math.max(0, thresholdPaisa - subtotal),
    progress: Math.min(1, subtotal / thresholdPaisa),
    configured: feeOk && thresholdOk,
  };
}

export type DeliveryStripKind = 'empty' | 'progress' | 'unlocked';

/** Which of the three strip messages applies. The component turns it into words. */
export function deliveryStripKind(subtotalPaisa: number, info: DeliveryInfo): DeliveryStripKind {
  if (info.isFree) return 'unlocked';
  return subtotalPaisa > 0 ? 'progress' : 'empty';
}
