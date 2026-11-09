import { envInt, envFloat } from './env';

describe('envInt', () => {
  it('parses a normal integer', () => expect(envInt('15000', 10000)).toBe(15000));
  it('falls back when the variable is not set', () => expect(envInt(undefined, 10000)).toBe(10000));
  it('falls back on an empty string', () => expect(envInt('', 10000)).toBe(10000));
  it('falls back on text that is not a number', () => {
    expect(envInt('abc', 10000)).toBe(10000);
    expect(envInt('"10000"', 10000)).toBe(10000);
  });
  it('keeps zero (free delivery for everyone is a valid choice)', () => expect(envInt('0', 10000)).toBe(0));
  it('never returns NaN or Infinity', () => {
    for (const raw of ['NaN', 'Infinity', '-', ' ', 'undefined']) {
      expect(Number.isFinite(envInt(raw, 7))).toBe(true);
    }
  });
});

describe('envFloat', () => {
  it('parses decimals', () => expect(envFloat('31.5204', 0)).toBe(31.5204));
  it('falls back when unset, empty or junk', () => {
    expect(envFloat(undefined, 25)).toBe(25);
    expect(envFloat('', 25)).toBe(25);
    expect(envFloat('far', 25)).toBe(25);
  });
});
