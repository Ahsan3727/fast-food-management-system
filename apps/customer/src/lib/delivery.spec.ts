import { describe, it, expect } from 'vitest';
import {
  computeDelivery,
  deliveryStripKind,
  FALLBACK_FEE_PAISA,
  FALLBACK_FREE_OVER_PAISA,
} from './delivery';

/** The formula CartScreen used before M1, verbatim. */
function oldCartFee(subtotal: number, cfg?: { deliveryFeePaisa?: number; freeDeliveryOverPaisa?: number } | null) {
  const freeThreshold = cfg?.freeDeliveryOverPaisa ?? 100000;
  const standardFee = cfg?.deliveryFeePaisa ?? 10000;
  return subtotal >= freeThreshold ? 0 : standardFee;
}

describe('computeDelivery matches the old cart math (totals must not change)', () => {
  const subtotals = [0, 1, 49_999, 99_999, 100_000, 100_001, 250_000];
  const configs = [
    { deliveryFeePaisa: 10_000, freeDeliveryOverPaisa: 100_000 },
    { deliveryFeePaisa: 15_000, freeDeliveryOverPaisa: 200_000 },
    { deliveryFeePaisa: 0,      freeDeliveryOverPaisa: 100_000 }, // free delivery for everyone is a valid choice
    undefined,                                                     // config not loaded yet
    null,
  ];

  for (const cfg of configs) {
    for (const subtotal of subtotals) {
      it(`subtotal ${subtotal}, config ${JSON.stringify(cfg)}`, () => {
        expect(computeDelivery(subtotal, cfg).feePaisa).toBe(oldCartFee(subtotal, cfg));
      });
    }
  }
});

describe('computeDelivery', () => {
  const cfg = { deliveryFeePaisa: 10_000, freeDeliveryOverPaisa: 100_000 };

  it('is free at exactly the threshold (server uses >=)', () => {
    expect(computeDelivery(100_000, cfg).isFree).toBe(true);
    expect(computeDelivery(99_999, cfg).isFree).toBe(false);
  });

  it('reports how much more to spend, never negative', () => {
    expect(computeDelivery(56_000, cfg).remainingPaisa).toBe(44_000);
    expect(computeDelivery(100_000, cfg).remainingPaisa).toBe(0);
    expect(computeDelivery(500_000, cfg).remainingPaisa).toBe(0);
  });

  it('progress runs 0..1 and stops at 1', () => {
    expect(computeDelivery(0, cfg).progress).toBe(0);
    expect(computeDelivery(50_000, cfg).progress).toBe(0.5);
    expect(computeDelivery(400_000, cfg).progress).toBe(1);
  });

  it('uses the CONFIG threshold for progress, not a hard-coded 100000', () => {
    // CartScreen's bar used (subtotal / 100000) even when the server said 200000
    expect(computeDelivery(100_000, { ...cfg, freeDeliveryOverPaisa: 200_000 }).progress).toBe(0.5);
  });

  it('is configured only when BOTH numbers are valid', () => {
    expect(computeDelivery(0, cfg).configured).toBe(true);
    expect(computeDelivery(0, { deliveryFeePaisa: 10_000 }).configured).toBe(false);
    expect(computeDelivery(0, { freeDeliveryOverPaisa: 100_000 }).configured).toBe(false);
    expect(computeDelivery(0, undefined).configured).toBe(false);
    expect(computeDelivery(0, null).configured).toBe(false);
  });
});

describe('computeDelivery with bad config (JSON turns NaN into null)', () => {
  it('null values fall back and are not "configured"', () => {
    const d = computeDelivery(0, { deliveryFeePaisa: null, freeDeliveryOverPaisa: null });
    expect(d.configured).toBe(false);
    expect(d.thresholdPaisa).toBe(FALLBACK_FREE_OVER_PAISA);
    expect(d.standardFeePaisa).toBe(FALLBACK_FEE_PAISA);
  });

  it('NaN, Infinity, negative and string values are rejected', () => {
    for (const bad of [NaN, Infinity, -Infinity, -5, '1000' as unknown as number]) {
      const d = computeDelivery(0, { deliveryFeePaisa: bad, freeDeliveryOverPaisa: bad });
      expect(d.configured).toBe(false);
      expect(Number.isFinite(d.thresholdPaisa)).toBe(true);
      expect(Number.isFinite(d.feePaisa)).toBe(true);
    }
  });

  it('never produces a zero threshold or NaN anywhere in the result', () => {
    const d = computeDelivery(5_000, { deliveryFeePaisa: 0, freeDeliveryOverPaisa: 0 });
    expect(d.thresholdPaisa).toBe(FALLBACK_FREE_OVER_PAISA);
    expect(d.configured).toBe(false);
    for (const v of Object.values(d)) {
      if (typeof v === 'number') expect(Number.isNaN(v)).toBe(false);
    }
  });

  it('survives a NaN or negative subtotal', () => {
    const cfg = { deliveryFeePaisa: 10_000, freeDeliveryOverPaisa: 100_000 };
    for (const subtotal of [NaN, -100]) {
      const d = computeDelivery(subtotal, cfg);
      expect(d.progress).toBe(0);
      expect(d.remainingPaisa).toBe(100_000);
      expect(d.isFree).toBe(false);
    }
  });

  it('keeps a valid half: a good fee with a bad threshold still uses the good fee', () => {
    const d = computeDelivery(0, { deliveryFeePaisa: 15_000, freeDeliveryOverPaisa: null });
    expect(d.standardFeePaisa).toBe(15_000);
    expect(d.thresholdPaisa).toBe(FALLBACK_FREE_OVER_PAISA);
    expect(d.configured).toBe(false);
  });
});

describe('deliveryStripKind (the three strip messages)', () => {
  const cfg = { deliveryFeePaisa: 10_000, freeDeliveryOverPaisa: 100_000 };
  const kind = (subtotal: number) => deliveryStripKind(subtotal, computeDelivery(subtotal, cfg));

  it('empty cart', () => expect(kind(0)).toBe('empty'));
  it('below the threshold', () => expect(kind(56_000)).toBe('progress'));
  it('just below the threshold', () => expect(kind(99_999)).toBe('progress'));
  it('at the threshold', () => expect(kind(100_000)).toBe('unlocked'));
  it('above the threshold', () => expect(kind(300_000)).toBe('unlocked'));
});
