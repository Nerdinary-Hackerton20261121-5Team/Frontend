import { useRef } from 'react';
import { Toast } from '@/shared/Toast';
import type { Grid } from '../puzzle';
import type { Session, Timeline } from '../types';
import { useElementSize } from '../useElementSize';
import { JigsawBoard } from './JigsawBoard';
import { ResultSummary } from './ResultSummary';

interface DoneViewProps {
  session: Session;
  grid: Grid;
  timeline: Timeline;
  onHome: () => void;
}

/** 09-B 완성. 다 맞춘 사진을 화면 가득 보여 준다. */
export const DoneView = ({ session, grid, timeline, onHome }: DoneViewProps) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(frameRef);

  return (
    <div ref={frameRef} className='relative min-h-0 flex-1 overflow-hidden bg-bg-inverse'>
      <JigsawBoard
        className='absolute inset-0'
        width={size.width}
        height={size.height}
        grid={grid}
        photoUrl={session.photoUrl}
        look={() => 'photo'}
        outlineClassName={() => 'stroke-white/70 stroke-[1.5]'}
      />
      <Toast
        variant='dark'
        className='absolute top-[calc(45px+env(safe-area-inset-top))] left-1/2 -translate-x-1/2'
      >
        완성! 사진이 공개됐어요
      </Toast>
      <ResultSummary timeline={timeline} goalMinutes={session.goalMinutes} onHome={onHome} />
    </div>
  );
};
