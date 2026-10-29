import { isOriginAllowed, parseCorsOrigins } from './cors';

describe('CORS origins (Phase 0)', () => {
  const prod = parseCorsOrigins('https://shop.vercel.app/, https://admin.vercel.app', true);

  it('allows listed origins, ignoring trailing slashes', () => {
    expect(isOriginAllowed('https://shop.vercel.app', prod)).toBe(true);
    expect(isOriginAllowed('https://admin.vercel.app', prod)).toBe(true);
  });

  it('rejects unknown origins, including other *.vercel.app sites', () => {
    expect(isOriginAllowed('https://evil.vercel.app', prod)).toBe(false);
    expect(isOriginAllowed('https://evil.example', prod)).toBe(false);
  });

  it('always allows the Capacitor origins', () => {
    for (const o of ['capacitor://localhost', 'http://localhost', 'https://localhost']) {
      expect(isOriginAllowed(o, parseCorsOrigins('', true))).toBe(true);
    }
  });

  it('allows requests with no Origin header', () => {
    expect(isOriginAllowed(undefined, prod)).toBe(true);
  });

  it('ignores "*" in production but honours it in development', () => {
    const p = parseCorsOrigins('*', true);
    expect(p.wildcardIgnored).toBe(true);
    expect(isOriginAllowed('https://evil.example', p)).toBe(false);
    expect(isOriginAllowed('https://evil.example', parseCorsOrigins('*', false))).toBe(true);
  });
});
