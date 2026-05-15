export type ScoreLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// Model outputs integers 0 (low), 1 (medium), 2 (high)
export function normalizeScore(score: number): number {
  return (score / 2) * 100;
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
