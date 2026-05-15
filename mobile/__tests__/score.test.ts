import { normalizeScore, getScoreLevel } from '../utils/score';

describe('normalizeScore', () => {
  it('returns score as-is when > 1', () => {
    expect(normalizeScore(85)).toBe(85);
  });
  it('multiplies by 100 when <= 1', () => {
    expect(normalizeScore(1)).toBe(100);
    expect(normalizeScore(0)).toBe(0);
  });
});

describe('getScoreLevel', () => {
  it('returns HIGH for score >= 70', () => {
    expect(getScoreLevel(70)).toBe('HIGH');
    expect(getScoreLevel(95)).toBe('HIGH');
  });
  it('returns MEDIUM for 40-69', () => {
    expect(getScoreLevel(40)).toBe('MEDIUM');
    expect(getScoreLevel(69)).toBe('MEDIUM');
  });
  it('returns LOW for < 40', () => {
    expect(getScoreLevel(39)).toBe('LOW');
    expect(getScoreLevel(0)).toBe('LOW');
  });
});
