import { AppConfigController } from './app-config.module';

const KEYS = [
  'DELIVERY_FEE_PAISA', 'FREE_DELIVERY_OVER_PAISA', 'RESTAURANT_LAT', 'RESTAURANT_LNG', 'MAX_DELIVERY_RADIUS_KM',
] as const;

describe('GET /app-config numbers', () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => KEYS.forEach(k => { saved[k] = process.env[k]; delete process.env[k]; }));
  afterEach(() => KEYS.forEach(k => {
    if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
  }));

  const config = () => new AppConfigController().getConfig();

  it('returns the documented defaults when nothing is configured', () => {
    expect(config()).toMatchObject({
      deliveryFeePaisa: 10000,
      freeDeliveryOverPaisa: 100000,
      restaurantLat: 31.5204,
      restaurantLng: 74.3587,
      maxDeliveryRadiusKm: 25,
    });
  });

  it('passes valid values through', () => {
    process.env.DELIVERY_FEE_PAISA = '15000';
    process.env.FREE_DELIVERY_OVER_PAISA = '200000';
    expect(config()).toMatchObject({ deliveryFeePaisa: 15000, freeDeliveryOverPaisa: 200000 });
  });

  it('never sends NaN (which JSON turns into null) when a variable is malformed', () => {
    for (const k of KEYS) process.env[k] = 'not-a-number';
    const c = config();
    for (const key of ['deliveryFeePaisa', 'freeDeliveryOverPaisa', 'restaurantLat', 'restaurantLng', 'maxDeliveryRadiusKm'] as const) {
      expect(Number.isFinite(c[key])).toBe(true);
    }
    // ...and the numbers survive a JSON round trip, which is what the apps actually receive
    const wire = JSON.parse(JSON.stringify(c));
    expect(wire.deliveryFeePaisa).toBe(10000);
    expect(wire.freeDeliveryOverPaisa).toBe(100000);
  });
});
