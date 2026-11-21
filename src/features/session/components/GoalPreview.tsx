import { previewGrid, previewPieces } from '../goalPreview';
import { gridFor, pieceTotal } from '../puzzle';
import { JigsawBoard } from './JigsawBoard';

interface GoalPreviewProps {
  pieceCount: number;
  memberCount: number;
  /** 내가 몇 번째 사람인지 */
  myRow: number;
  /** 내 조각 자리를 정하는 값. 같은 세션에서는 늘 같은 자리가 나오게 세션 코드를 넣는다 */
  seed: string;
  goalMinutes: number;
}

/** 내가 맡을 조각을 색으로 보여 주고 그 아래에 목표 시간을 크게 적는다 */
export const GoalPreview = ({
  pieceCount,
  memberCount,
  myRow,
  seed,
  goalMinutes,
}: GoalPreviewProps) => {
  const grid = gridFor(pieceCount, memberCount);
  // 미리보기는 Figma 처럼 정사각형에 가까운 판에 내 조각을 흩어 보여 준다
  const board = previewGrid(pieceTotal(grid));
  const myPieces = previewPieces(seed, board, grid.cols, myRow);
  return (
    <>
      <div className='flex flex-col items-center gap-[10px]'>
        <div className='relative overflow-hidden rounded-[8px]'>
          <JigsawBoard
            width={220}
            height={220}
            grid={board}
            look={(index) => (myPieces.includes(index) ? 'brand' : 'slot')}
            outlineClassName={() => 'stroke-brand-primary stroke-[1.5]'}
          />
          {/* 둥글게 잘린 판의 바깥 테두리를 다시 그려 모서리에서도 선이 끊기지 않게 한다 */}
          <span
            aria-hidden
            className='pointer-events-none absolute inset-0 rounded-[8px] border-[1.5px] border-brand-primary'
          />
        </div>
        <p className='flex items-center gap-[6px] text-body-m-medium text-text-body'>
          <span className='rounded-full bg-brand-primary px-2 py-[3px] text-caption-medium text-text-on-brand'>
            내 조각 {grid.cols}개
          </span>
          {pieceTotal(grid)}조각 중 내가 채울 조각이에요
        </p>
      </div>
      <p className='mt-7 flex items-end justify-center gap-0.5 text-text-primary'>
        <span className='text-display'>{goalMinutes}</span>
        <span className='pb-[5px] text-title-l'>분</span>
      </p>
    </>
  );
};
