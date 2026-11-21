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
const seededShuffle = (seed: string, total: number) => {
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

/** 위·아래·왼쪽·오른쪽으로 맞닿은 조각 번호들. 대각선은 맞닿은 것으로 보지 않는다 */
const neighbors = (index: number, grid: Grid) => {
  const row = Math.floor(index / grid.cols);
  const col = index % grid.cols;
  const result: number[] = [];
  if (row > 0) result.push(index - grid.cols);
  if (row < grid.rows - 1) result.push(index + grid.cols);
  if (col > 0) result.push(index - 1);
  if (col < grid.cols - 1) result.push(index + 1);
  return result;
};

/**
 * 조각마다 맡을 사람을 정한다. 한 사람의 조각끼리는 가로·세로로 붙지 않게 한다.
 * 섞은 순서대로 조각을 하나씩 사람에게 주고, 막히면 되돌아가 다른 사람에게 준다.
 * 판이 너무 좁아 떨어뜨릴 수 없으면 null 을 돌려준다.
 */
const assignOwners = (order: number[], grid: Grid, people: number, perPerson: number) => {
  const owners = new Array<number>(order.length).fill(-1);
  const counts = new Array<number>(people).fill(0);

  const place = (step: number): boolean => {
    if (step === order.length) return true;
    const piece = order[step];
    for (let offset = 0; offset < people; offset += 1) {
      // 사람을 돌아가며 먼저 시도해서 한 사람에게 조각이 몰리지 않게 한다
      const person = (step + offset) % people;
      if (counts[person] >= perPerson) continue;
      if (neighbors(piece, grid).some((other) => owners[other] === person)) continue;
      owners[piece] = person;
      counts[person] += 1;
      if (place(step + 1)) return true;
      owners[piece] = -1;
      counts[person] -= 1;
    }
    return false;
  };

  return place(0) ? owners : null;
};

/** 미리보기 판에서 이 사람이 맡을 조각 번호들. 서로 가로·세로로 붙지 않는다 */
export const previewPieces = (seed: string, grid: Grid, perPerson: number, member: number) => {
  if (member < 0) return [];
  const total = grid.rows * grid.cols;
  const people = Math.round(total / perPerson);
  const order = seededShuffle(seed, total);
  const owners = assignOwners(order, grid, people, perPerson);
  // 떨어뜨릴 수 없는 판이면 섞은 순서대로 나눈다
  if (!owners) return order.slice(member * perPerson, (member + 1) * perPerson);
  return order.filter((piece) => owners[piece] === member);
};
