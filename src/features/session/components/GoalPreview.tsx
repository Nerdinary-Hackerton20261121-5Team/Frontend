import { gridFor, ownerRow, pieceTotal } from '../puzzle';
import { JigsawBoard } from './JigsawBoard';

interface GoalPreviewProps {
  pieceCount: number;
  memberCount: number;
  /** 내가 맡을 줄 */
  myRow: number;
  goalMinutes: number;
}

/** 내가 맡을 조각을 색으로 보여 주고 그 아래에 목표 시간을 크게 적는다 */
export const GoalPreview = ({ pieceCount, memberCount, myRow, goalMinutes }: GoalPreviewProps) => {
  const grid = gridFor(pieceCount, memberCount);
  return (
    <>
      <div className='flex flex-col items-center gap-[10px]'>
        <div className='overflow-hidden rounded-[8px]'>
          <JigsawBoard
            width={220}
            height={220}
            grid={grid}
            look={(index) => (ownerRow(index, grid) === myRow ? 'brand' : 'slot')}
            outlineClassName={() => 'stroke-brand-primary stroke-[1.5]'}
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
