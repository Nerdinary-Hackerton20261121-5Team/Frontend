import type { Grid } from '../puzzle';

interface PieceImagesProps {
  grid: Grid;
  cellW: number;
  cellH: number;
  /** 조각 번호별 그림 */
  images: Record<number, string>;
  /** 그릴 조각 번호 */
  indexes: number[];
  /** 그림이 칸보다 사방으로 얼마나 큰지(칸 크기에 대한 비율) */
  padRatio: number;
}

/** 서버가 직소 모양으로 오려 준 조각 그림을 제자리에 놓는다. 튀어나온 부분이 옆 칸의 홈에 들어가 맞물린다. */
export const PieceImages = ({ grid, cellW, cellH, images, indexes, padRatio }: PieceImagesProps) =>
  indexes.map(
    (index) =>
      images[index] && (
        <img
          key={index}
          src={images[index]}
          alt=''
          draggable={false}
          className='absolute max-w-none'
          style={{
            left: (index % grid.cols) * cellW - cellW * padRatio,
            top: Math.floor(index / grid.cols) * cellH - cellH * padRatio,
            width: cellW * (1 + padRatio * 2),
            height: cellH * (1 + padRatio * 2),
          }}
        />
      ),
  );
