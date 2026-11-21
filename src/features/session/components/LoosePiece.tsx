import { useId } from 'react';
import { loosePadding, piecePath } from '../puzzle';
import type { Grid } from '../puzzle';

interface LoosePieceProps {
  grid: Grid;
  index: number;
  cellW: number;
  cellH: number;
  photoUrl: string;
}

/** 판에 끼우기 전에 손으로 옮기는 조각 하나 */
export const LoosePiece = ({ grid, index, cellW, cellH, photoUrl }: LoosePieceProps) => {
  const id = useId().replace(/:/g, '');
  const padding = loosePadding(cellW, cellH);
  const x0 = (index % grid.cols) * cellW;
  const y0 = Math.floor(index / grid.cols) * cellH;
  const d = piecePath(grid, index, cellW, cellH);
  const width = cellW + padding * 2;
  const height = cellH + padding * 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${x0 - padding} ${y0 - padding} ${width} ${height}`}
      className='block overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]'
      aria-hidden
    >
      <defs>
        <clipPath id={`${id}-shape`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-shape)`}>
        <image
          href={photoUrl}
          width={cellW * grid.cols}
          height={cellH * grid.rows}
          preserveAspectRatio='xMidYMid slice'
        />
      </g>
      <path
        d={d}
        fill='none'
        strokeWidth='2'
        strokeLinejoin='round'
        className='stroke-brand-primary'
      />
    </svg>
  );
};
