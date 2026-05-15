import { getCurrentSeason, getSeasonLabel } from '../utils/season';

describe('getCurrentSeason', () => {
  it('returns A for September', () => {
    expect(getCurrentSeason(new Date('2024-09-15'))).toBe('A');
  });
  it('returns A for February', () => {
    expect(getCurrentSeason(new Date('2024-02-10'))).toBe('A');
  });
  it('returns B for March', () => {
    expect(getCurrentSeason(new Date('2024-03-01'))).toBe('B');
  });
  it('returns B for June', () => {
    expect(getCurrentSeason(new Date('2024-06-30'))).toBe('B');
  });
  it('returns C for July', () => {
    expect(getCurrentSeason(new Date('2024-07-01'))).toBe('C');
  });
  it('returns C for August', () => {
    expect(getCurrentSeason(new Date('2024-08-31'))).toBe('C');
  });
  it('getSeasonLabel returns formatted string', () => {
    expect(getSeasonLabel('B')).toBe('Season B — Mar to Jun');
  });
});
