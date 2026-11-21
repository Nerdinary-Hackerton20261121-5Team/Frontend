import type { Grid } from './puzzle';

// 04 화면의 퍼즐 미리보기는 Figma 처럼 정사각형에 가까운 판(12조각이면 4×3)에 내 조각을 흩어 보여 준다.
// 공부·결과 화면의 줄 단위 판(gridFor)과는 따로 쓰는 보기 전용 배치다.

/** 조각 수를 가로가 같거나 조금 긴 격자로 나눈다. 6 → 3×2, 12 → 4×3, 24 → 6×4 */
export const previewGrid = (pieceCount: number): Grid => {
  let rows = Math.floor(Math.sqrt(pieceCount));
  while (rows > 1 && pieceCount % rows !== 0) rows -= 1;
  return { rows, cols: pieceCount / rows };
};

// 같은 세션에서는 늘 같은 자리가 나오도록 세션 코드로 섞는다
const seededOrder = (seed: string, total: number) => {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const order = Array.from({ length: total }, (_, index) => index);
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

/** 미리보기 판에서 이 사람이 맡을 조각 번호들 */
export const previewPieces = (seed: string, total: number, perPerson: number, member: number) => {
  if (member < 0) return [];
  return seededOrder(seed, total).slice(member * perPerson, (member + 1) * perPerson);
};
