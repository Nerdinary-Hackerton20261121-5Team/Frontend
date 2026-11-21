import { useRef, useState } from 'react';
import { Toast } from '@/shared/Toast';
import { MY_BLUR_RATIO } from '../limits';
import { pieceTotal } from '../puzzle';
import type { Grid } from '../puzzle';
import type { Session, Timeline } from '../types';
import { useElementSize } from '../useElementSize';
import { DoneActions } from './DoneActions';
import { PieceBlurFilter } from './PieceBlurFilter';
import { JigsawBoard } from './JigsawBoard';
import { PieceImages } from './PieceImages';
import { ResultSummary } from './ResultSummary';

interface DoneViewProps {
  session: Session;
  grid: Grid;
  timeline: Timeline;
  /** 서버가 오려 준 조각 그림(조각 번호별). 사람마다 채운 만큼만 선명하다 */
  pieceImages?: Record<number, string>;
  padRatio?: number;
  /** 판의 가로세로 비율(가로 ÷ 세로) */
  aspect?: number;
  /** 내 조각 번호와 내가 채운 정도(0 에서 1). 내 조각은 이만큼만 선명하게 보인다 */
  myPieces?: number[];
  myRestoration?: number;
  /** 방을 정리하는 중인지 */
  ending: boolean;
  onHome: () => void;
}

/** 09-B 완성. 다 맞춘 사진을 화면 가득 보여 주고, "내 기록" 을 누르면 요약이 올라온다. */
export const DoneView = ({
  session,
  grid,
  timeline,
  pieceImages,
  padRatio = 0.2,
  aspect,
  myPieces,
  myRestoration = 1,
  ending,
  onHome,
}: DoneViewProps) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(frameRef);
  const [recordOpen, setRecordOpen] = useState(false);
  // 서버 조각은 사진 비율을 지킨 채 화면을 가득 덮게 키우고, 넘치는 부분은 가운데를 맞춰 자른다
  const boardWidth = aspect ? Math.max(size.width, size.height * aspect) : size.width;
  const boardHeight = aspect ? boardWidth / aspect : size.height;
  const myBlur = (1 - myRestoration) * (boardWidth / grid.cols) * MY_BLUR_RATIO;
  const myFilter = pieceImages && myBlur > 0.5 ? 'url(#done-my-blur)' : undefined;

  return (
    <div ref={frameRef} className='relative min-h-0 flex-1 overflow-hidden bg-bg-inverse'>
      {myFilter && <PieceBlurFilter id='done-my-blur' radius={myBlur} />}
      {pieceImages ? (
        <div
          className='absolute'
          style={{
            left: (size.width - boardWidth) / 2,
            top: (size.height - boardHeight) / 2,
            width: boardWidth,
            height: boardHeight,
          }}
        >
          <PieceImages
            grid={grid}
            cellW={boardWidth / grid.cols}
            cellH={boardHeight / grid.rows}
            images={pieceImages}
            indexes={Array.from({ length: pieceTotal(grid) }, (_, index) => index)}
            padRatio={padRatio}
            filtered={myPieces}
            filter={myFilter}
          />
        </div>
      ) : (
        <JigsawBoard
          className='absolute inset-0'
          width={size.width}
          height={size.height}
          grid={grid}
          photoUrl={session.photoUrl}
          look={() => 'photo'}
          outlineClassName={() => 'stroke-white/70 stroke-[1.5]'}
        />
      )}
      <Toast
        variant='dark'
        className='absolute top-[calc(45px+env(safe-area-inset-top))] left-1/2 -translate-x-1/2'
      >
        완성! 사진이 공개됐어요
      </Toast>
      {recordOpen ? (
        <ResultSummary
          timeline={timeline}
          goalMinutes={session.goalMinutes}
          ending={ending}
          onHome={onHome}
          onClose={() => setRecordOpen(false)}
        />
      ) : (
        <DoneActions ending={ending} onHome={onHome} onOpenRecord={() => setRecordOpen(true)} />
      )}
    </div>
  );
};
