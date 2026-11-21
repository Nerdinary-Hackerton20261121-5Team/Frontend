import type { Grid } from './puzzle';

// 06 공부 화면의 판. Figma 처럼 세로로 긴 사진을 네모 칸으로 나눈다. 12조각이면 2×6, 24조각이면 3×8.
export const studyGrid = (total: number): Grid => {
  const preferred = total >= 24 ? 3 : 2;
  const cols = [preferred, 2, 3, 4, 5].find((count) => total % count === 0) ?? 1;
  return { cols, rows: total / cols };
};
