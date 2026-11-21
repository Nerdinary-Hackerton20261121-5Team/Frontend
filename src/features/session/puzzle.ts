// 퍼즐 판을 가로 cols, 세로 rows 로 나누고 조각 모양(SVG path)을 만든다.
// 한 줄이 한 사람 몫이다. 조각 번호는 왼쪽 위부터 오른쪽으로 센다.

export type Grid = { cols: number; rows: number };

/** 사람 수만큼 줄을 만들고, 고른 조각 수에 가장 가깝게 칸을 나눈다 */
export const gridFor = (pieceCount: number, people: number): Grid => ({
  rows: people,
  cols: Math.max(1, Math.round(pieceCount / people)),
});

export const pieceTotal = (grid: Grid) => grid.cols * grid.rows;

/** 이 조각을 맡은 줄(사람) 번호 */
export const ownerRow = (index: number, grid: Grid) => Math.floor(index / grid.cols);

export const piecesOfRow = (row: number, grid: Grid) =>
  Array.from({ length: grid.cols }, (_, col) => row * grid.cols + col);

/** 볼록 튀어나온 부분의 반지름 */
export const knobRadius = (cellW: number, cellH: number) => Math.min(cellW, cellH) * 0.16;

/** 손으로 옮기는 조각을 그릴 때, 튀어나온 부분이 잘리지 않게 둘레에 두는 여백 */
export const loosePadding = (cellW: number, cellH: number) => knobRadius(cellW, cellH) * 2;

// 맞닿은 두 조각이 같은 모양을 쓰도록, 경계마다 튀어나오는 방향을 번호로 정한다
const direction = (a: number, b: number) => ((a * 7 + b * 13) % 3 === 0 ? -1 : 1);

// (ax, ay) 에서 (bx, by) 로 가는 변. bulge 가 있으면 가운데에 그 방향으로 둥근 돌기를 만든다
const side = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  bulge: { x: number; y: number } | null,
  radius: number,
) => {
  if (!bulge) return `L${bx} ${by}`;
  const length = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / length;
  const uy = (by - ay) / length;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const neck = radius * 0.6;
  // 진행 방향 기준으로 돌기가 어느 쪽에 있는지에 따라 원호를 도는 방향이 바뀐다
  const sweep = ux * bulge.y - uy * bulge.x < 0 ? 1 : 0;
  return [
    `L${mx - ux * neck} ${my - uy * neck}`,
    `A${radius} ${radius} 0 1 ${sweep} ${mx + ux * neck} ${my + uy * neck}`,
    `L${bx} ${by}`,
  ].join(' ');
};

/** 조각 하나의 테두리. 좌표는 판 전체 기준이다 */
export const piecePath = (grid: Grid, index: number, cellW: number, cellH: number) => {
  const col = index % grid.cols;
  const row = Math.floor(index / grid.cols);
  const x0 = col * cellW;
  const y0 = row * cellH;
  const x1 = x0 + cellW;
  const y1 = y0 + cellH;
  const radius = knobRadius(cellW, cellH);

  const top = row > 0 ? { x: 0, y: direction(row, col) } : null;
  const right = col < grid.cols - 1 ? { x: direction(col + 1, row + 5), y: 0 } : null;
  const bottom = row < grid.rows - 1 ? { x: 0, y: direction(row + 1, col) } : null;
  const left = col > 0 ? { x: direction(col, row + 5), y: 0 } : null;

  return [
    `M${x0} ${y0}`,
    side(x0, y0, x1, y0, top, radius),
    side(x1, y0, x1, y1, right, radius),
    side(x1, y1, x0, y1, bottom, radius),
    side(x0, y1, x0, y0, left, radius),
    'Z',
  ].join(' ');
};
