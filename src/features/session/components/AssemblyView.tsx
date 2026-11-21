import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Toast } from '@/shared/Toast';
import { loosePadding, piecesOfRow, pieceTotal } from '../puzzle';
import type { Grid } from '../puzzle';
import { toMinutes, toPercent } from '../time';
import type { Session, Timeline } from '../types';
import { useElementSize } from '../useElementSize';
import { Accent } from './Accent';
import { Confetti } from './Confetti';
import { JigsawBoard } from './JigsawBoard';
import { LoosePiece } from './LoosePiece';
import { ProgressRing } from './ProgressRing';

/** Figma 의 판 크기. 화면이 작으면 같은 비율로 줄인다 */
const BOARD_WIDTH = 220;
const BOARD_HEIGHT = 477;

interface AssemblyViewProps {
  session: Session;
  grid: Grid;
  timeline: Timeline;
  placed: number[];
  lastPlacedBy: string | null;
  onPlace: (index: number) => void;
}

/** 09-0, 09-A 퍼즐 맞추기. 내 조각을 끌어다 제자리에 끼우고, 다른 사람이 끼우는 것을 함께 본다. */
export const AssemblyView = ({
  session,
  grid,
  timeline,
  placed,
  lastPlacedBy,
  onPlace,
}: AssemblyViewProps) => {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const area = useElementSize(areaRef);
  const grabbedAt = useRef({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ index: number; dx: number; dy: number } | null>(null);

  const total = pieceTotal(grid);
  const myRow = session.members.findIndex((member) => member.isMe);
  const myPieces = piecesOfRow(myRow, grid);
  const remaining = myPieces.filter((index) => !placed.includes(index));
  const waitingFor = session.members.find(
    (member, row) =>
      !member.isMe && piecesOfRow(row, grid).some((index) => !placed.includes(index)),
  );

  const boardHeight = Math.min(BOARD_HEIGHT, area.height);
  const boardWidth = (boardHeight * BOARD_WIDTH) / BOARD_HEIGHT;
  const boardLeft = (area.width - boardWidth) / 2;
  const cellW = boardWidth / grid.cols;
  const cellH = boardHeight / grid.rows;
  const padding = loosePadding(cellW, cellH);

  // 아직 끼우지 않은 내 조각은 판의 왼쪽과 오른쪽에 번갈아 놓아 둔다
  const homeOf = (index: number) => {
    const order = myPieces.indexOf(index);
    const lowest = Math.max(boardHeight - cellH - padding * 2, 0);
    return {
      x: order % 2 === 0 ? 4 : area.width - cellW - padding * 2 - 4,
      y: Math.min(40 + order * (cellH + 24), lowest),
    };
  };
  const slotOf = (index: number) => ({
    x: boardLeft + (index % grid.cols) * cellW - padding,
    y: Math.floor(index / grid.cols) * cellH - padding,
  });

  const grab = (event: PointerEvent<HTMLDivElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    grabbedAt.current = { x: event.clientX, y: event.clientY };
    setDrag({ index, dx: 0, dy: 0 });
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag({
      index: drag.index,
      dx: event.clientX - grabbedAt.current.x,
      dy: event.clientY - grabbedAt.current.y,
    });
  };
  const drop = () => {
    if (!drag) return;
    const home = homeOf(drag.index);
    const slot = slotOf(drag.index);
    const distance = Math.hypot(home.x + drag.dx - slot.x, home.y + drag.dy - slot.y);
    // 제자리 가까이에 놓으면 끼워지고, 아니면 원래 자리로 돌아간다
    if (distance < Math.max(28, cellW * 0.4)) onPlace(drag.index);
    setDrag(null);
  };

  return (
    <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-b from-brand-subtle to-bg-default to-45%'>
      <Confetti />
      <div className='shrink-0 px-5 pt-[calc(50px+env(safe-area-inset-top))] text-center'>
        <h1 className='text-title-l text-text-primary'>
          {placed.length === 0 ? (
            <>
              <Accent>모든 공부</Accent>를 마쳤어요!
            </>
          ) : (
            <>
              <Accent>
                {placed.length} / {total}
              </Accent>{' '}
              끼웠어요
            </>
          )}
        </h1>
        <p className='mt-3 text-body-m-medium text-text-secondary'>
          {remaining.length > 0
            ? `내 조각 ${remaining.length}개를 찾아 제자리에 끼워요`
            : '모두 끼우면 사진이 공개돼요'}
        </p>
        <p className='mt-5 inline-flex items-center gap-[6px] rounded-full bg-bg-default py-[5px] pr-3 pl-2 text-caption-medium text-text-body shadow-[0_2px_10px_rgba(0,0,0,0.08)]'>
          <ProgressRing size={16} value={timeline.focused / (session.goalMinutes * 60)} />
          {session.goalMinutes}분 목표 중 {toMinutes(timeline.focused)}분
          <span className='text-brand-strong'>
            {toPercent(timeline.focused / (session.goalMinutes * 60))}%
          </span>
        </p>
      </div>

      <div ref={areaRef} className='relative mt-9 min-h-0 flex-1'>
        <div
          className='absolute top-0 overflow-hidden rounded-[11px] bg-brand-disabled'
          style={{ left: boardLeft, width: boardWidth, height: boardHeight }}
        >
          <JigsawBoard
            width={boardWidth}
            height={boardHeight}
            grid={grid}
            photoUrl={session.photoUrl}
            look={(index) => (placed.includes(index) ? 'photo' : 'slot')}
            outlineClassName={(index) =>
              placed.includes(index) ? 'stroke-white/70' : 'stroke-brand-disabled stroke-[1.5]'
            }
          />
        </div>
        {area.width > 0 &&
          remaining.map((index) => {
            const home = homeOf(index);
            const dragging = drag?.index === index;
            const tilt = myPieces.indexOf(index) % 2 === 0 ? -6 : 8;
            return (
              <div
                key={index}
                role='button'
                aria-label='내 조각'
                onPointerDown={(event) => grab(event, index)}
                onPointerMove={move}
                onPointerUp={drop}
                onPointerCancel={() => setDrag(null)}
                className='absolute cursor-grab touch-none active:cursor-grabbing'
                style={{
                  left: home.x + (dragging ? drag.dx : 0),
                  top: home.y + (dragging ? drag.dy : 0),
                  transform: dragging ? undefined : `rotate(${tilt}deg)`,
                  zIndex: dragging ? 2 : 1,
                }}
              >
                <LoosePiece
                  grid={grid}
                  index={index}
                  cellW={cellW}
                  cellH={cellH}
                  photoUrl={session.photoUrl}
                />
              </div>
            );
          })}
      </div>

      <p className='mt-3 flex shrink-0 items-center justify-center gap-2 text-caption-medium text-text-body'>
        <span className='size-[7px] rounded-full bg-brand-primary' />
        <span className='text-body-m-medium text-text-primary'>
          {placed.length} / {total}
        </span>
        {placed.length === 0 || !waitingFor
          ? `${session.members.length}명이 함께 맞추는 중`
          : `${waitingFor.name}님 조각을 기다리는 중`}
      </p>
      <div className='flex h-[53px] shrink-0 items-start justify-center pt-3 pb-[env(safe-area-inset-bottom)]'>
        {lastPlacedBy && (
          <Toast key={placed.length}>
            {lastPlacedBy === session.members[myRow].name
              ? '내 조각을 끼웠어요'
              : `${lastPlacedBy}님이 조각을 끼웠어요`}
          </Toast>
        )}
      </div>
    </main>
  );
};
