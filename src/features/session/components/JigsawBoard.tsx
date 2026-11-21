import { useId } from 'react';
import { cn } from '@/lib/cn';
import { piecePath, pieceTotal } from '../puzzle';
import type { Grid } from '../puzzle';

/** slot 빈 자리, brand 내 조각 표시, photo 사진이 보이는 조각, dim 어둡고 흐린 조각, none 그리지 않음 */
export type PieceLook = 'slot' | 'brand' | 'photo' | 'dim' | 'none';

interface JigsawBoardProps {
  width: number;
  height: number;
  grid: Grid;
  photoUrl?: string;
  /** 조각마다 어떻게 보일지 */
  look: (index: number) => PieceLook;
  /** 조각 테두리의 색과 굵기를 정하는 클래스 */
  outlineClassName: (index: number) => string;
  /** photo 조각을 얼마나 흐리게 할지(px) */
  photoBlur?: number;
  className?: string;
}

/** 사진을 퍼즐 조각 모양으로 나눠 그리는 판 */
export const JigsawBoard = ({
  width,
  height,
  grid,
  photoUrl,
  look,
  outlineClassName,
  photoBlur = 0,
  className,
}: JigsawBoardProps) => {
  const id = useId().replace(/:/g, '');
  const cellW = width / grid.cols;
  const cellH = height / grid.rows;
  const pieces = Array.from({ length: pieceTotal(grid) }, (_, index) => ({
    index,
    look: look(index),
    d: piecePath(grid, index, cellW, cellH),
  }));
  const of = (kind: PieceLook) => pieces.filter((piece) => piece.look === kind);
  // 강조한 테두리가 다른 조각의 테두리에 덮이지 않게 사진 조각을 마지막에 그린다
  const outlined = [...pieces.filter((piece) => piece.look !== 'photo'), ...of('photo')].filter(
    (piece) => piece.look !== 'none',
  );

  if (width === 0 || height === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <clipPath id={`${id}-photo`}>
          {of('photo').map((piece) => (
            <path key={piece.index} d={piece.d} />
          ))}
        </clipPath>
        <clipPath id={`${id}-dim`}>
          {of('dim').map((piece) => (
            <path key={piece.index} d={piece.d} />
          ))}
        </clipPath>
        <filter id={`${id}-dim-blur`}>
          <feGaussianBlur stdDeviation='9' />
        </filter>
        <filter id={`${id}-photo-blur`}>
          <feGaussianBlur stdDeviation={photoBlur} />
        </filter>
      </defs>

      {photoUrl && (
        <g>
          <g clipPath={`url(#${id}-dim)`}>
            <image
              href={photoUrl}
              width={width}
              height={height}
              preserveAspectRatio='xMidYMid slice'
              filter={`url(#${id}-dim-blur)`}
            />
            <rect width={width} height={height} className='fill-overlay-dim' />
          </g>
          <g clipPath={`url(#${id}-photo)`}>
            <image
              href={photoUrl}
              width={width}
              height={height}
              preserveAspectRatio='xMidYMid slice'
              filter={photoBlur > 0 ? `url(#${id}-photo-blur)` : undefined}
            />
          </g>
        </g>
      )}

      {of('slot').map((piece) => (
        <path key={piece.index} d={piece.d} className='fill-brand-subtle' />
      ))}
      {of('brand').map((piece) => (
        <path key={piece.index} d={piece.d} className='fill-brand-primary' />
      ))}
      {outlined.map((piece) => (
        <path
          key={piece.index}
          d={piece.d}
          fill='none'
          strokeLinejoin='round'
          className={outlineClassName(piece.index)}
        />
      ))}
    </svg>
  );
};
