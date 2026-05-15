type Season = 'A' | 'B' | 'C';

const LABELS: Record<Season, string> = {
  A: 'Season A — Sep to Feb',
  B: 'Season B — Mar to Jun',
  C: 'Season C — Jul to Aug',
};

export function getCurrentSeason(date = new Date()): Season {
  const m = date.getMonth() + 1; // 1-12
  if (m >= 3 && m <= 6) return 'B';
  if (m >= 7 && m <= 8) return 'C';
  return 'A';
}

export function getSeasonLabel(season: Season): string {
  return LABELS[season];
}
