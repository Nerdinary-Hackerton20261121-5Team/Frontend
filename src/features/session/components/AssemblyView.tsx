import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Toast } from '@/shared/Toast';
import { blurRatio } from '../limits';
import { loosePadding, pieceTotal } from '../puzzle';
import type { Grid } from '../puzzle';
import { formatDuration, toPercent } from '../time';
import type { Session, Timeline } from '../types';
import { useElementSize } from '../useElementSize';
import { Accent } from './Accent';
import { Confetti } from './Confetti';
import { JigsawBoard } from './JigsawBoard';
import { LoosePiece } from './LoosePiece';
import { PieceBlurFilter } from './PieceBlurFilter';
import { PieceImages } from './PieceImages';
import { ProgressRing } from './ProgressRing';

/** Figma 의 판 크기. 화면이 작으면 같은 비율로 줄인다 */
const BOARD_WIDTH = 220;
const BOARD_HEIGHT = 477;
/** 서버 조각은 튀어나온 부분까지 그림에 들어 있어서 빈 칸은 네모로 둔다 */
const FLAT = { top: 0, right: 0, bottom: 0, left: 0 };

interface AssemblyViewProps {
  session: Session;
  grid: Grid;
  timeline: Timeline;
  placed: number[];
  /** 내가 끼울 조각 번호 */
  myPieces: number[];
  /** 마지막으로 조각을 끼운 사람. 누군지 모르면 빈 문자열 */
  lastPlacedBy: string | null;
  /** 아직 조각을 끼우지 않은 다른 사람의 이름 */
  waitingName?: string;
  /** 서버가 오려 준 조각 그림(조각 번호별). 있으면 이것으로 그리고, 없으면 사진을 직접 잘라 그린다 */
  pieceImages?: Record<number, string>;
  /** 조각 그림이 칸보다 사방으로 얼마나 큰지(칸 크기에 대한 비율) */
  padRatio?: number;
  /** 판의 가로세로 비율(가로 ÷ 세로). 서버 조각은 사진 비율을 그대로 따른다 */
  aspect?: number;
  /** 내가 채운 정도. 0 에서 1. 내 조각은 이만큼만 선명하게 보인다 */
  myRestoration?: number;
  onPlace: (index: number) => void;
}

/** 09-0, 09-A 퍼즐 맞추기. 내 조각을 끌어다 제자리에 끼우고, 다른 사람이 끼우는 것을 함께 본다. */
export const AssemblyView = ({
  session,
  grid,
  timeline,
  placed,
  myPieces,
  lastPlacedBy,
  waitingName,
  pieceImages,
  padRatio = 0.2,
  aspect = BOARD_WIDTH / BOARD_HEIGHT,
  myRestoration = 1,
  onPlace,
}: AssemblyViewProps) => {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const area = useElementSize(areaRef);
  const grabbedAt = useRef({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ index: number; dx: number; dy: number } | null>(null);

  const total = pieceTotal(grid);
  const myRow = session.members.findIndex((member) => member.isMe);
  const remaining = myPieces.filter((index) => !placed.includes(index));
  // 판은 Figma 크기 안에서 비율을 지키며 가장 크게 둔다
  const boardHeight = Math.min(BOARD_HEIGHT, area.height, BOARD_WIDTH / aspect);
  const boardWidth = boardHeight * aspect;
  const boardLeft = (area.width - boardWidth) / 2;
  const cellW = boardWidth / grid.cols;
  const cellH = boardHeight / grid.rows;
  // 조각 둘레의 여백. 서버 그림은 칸의 일정 비율만큼 크고, 직접 그릴 때는 돌기 크기만큼 둔다
  const padX = pieceImages ? cellW * padRatio : loosePadding(cellW, cellH);
  const padY = pieceImages ? cellH * padRatio : loosePadding(cellW, cellH);

  const myBlur = cellW * blurRatio(myRestoration);
  const myFilter = pieceImages && myBlur > 0 ? 'url(#assembly-my-blur)' : undefined;

  // 아직 끼우지 않은 내 조각은 판의 왼쪽과 오른쪽에 번갈아 놓아 둔다
  const homeOf = (index: number) => {
    const order = myPieces.indexOf(index);
    const lowest = Math.max(boardHeight - cellH - padY * 2, 0);
    return {
      x: order % 2 === 0 ? 4 : area.width - cellW - padX * 2 - 4,
      y: Math.min(40 + order * (cellH + 24), lowest),
    };
  };
  const slotOf = (index: number) => ({
    x: boardLeft + (index % grid.cols) * cellW - padX,
    y: Math.floor(index / grid.cols) * cellH - padY,
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
  const drop = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const home = homeOf(drag.index);
    const slot = slotOf(drag.index);
    // 손을 뗀 자리로 잰다. 빠르게 끌면 마지막 움직임이 아직 화면에 반영되지 않았을 수 있다
    const dx = event.clientX - grabbedAt.current.x;
    const dy = event.clientY - grabbedAt.current.y;
    const distance = Math.hypot(home.x + dx - slot.x, home.y + dy - slot.y);
    // 제자리 가까이에 놓으면 끼워지고, 아니면 원래 자리로 돌아간다
    if (distance < Math.max(28, cellW * 0.4)) onPlace(drag.index);
    setDrag(null);
  };

  return (
    <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-b from-brand-subtle to-bg-default to-45%'>
      <Confetti />
      {myFilter && <PieceBlurFilter id='assembly-my-blur' radius={myBlur} />}
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
          {session.goalMinutes}분 목표 중 {formatDuration(timeline.focused)}
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
            edges={pieceImages ? () => FLAT : undefined}
            look={(index) =>
              !placed.includes(index)
                ? 'slot'
                : !pieceImages
                  ? 'photo'
                  : pieceImages[index]
                    ? 'none'
                    : 'slot'
            }
            outlineClassName={(index) =>
              // 끼웠어도 그림을 아직 받지 못한 조각은 빈 칸처럼 둔다
              !placed.includes(index) || (pieceImages && !pieceImages[index])
                ? 'stroke-brand-disabled stroke-[1.5]'
                : pieceImages
                  ? 'stroke-transparent'
                  : 'stroke-white/70'
            }
          />
          {/* 끼워진 조각. 남의 조각은 그 사람이 채운 만큼만 선명하다 */}
          {pieceImages && (
            <PieceImages
              grid={grid}
              cellW={cellW}
              cellH={cellH}
              images={pieceImages}
              indexes={placed}
              padRatio={padRatio}
              filtered={myPieces}
              filter={myFilter}
            />
          )}
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
                {pieceImages?.[index] ? (
                  <img
                    src={pieceImages[index]}
                    alt=''
                    draggable={false}
                    className='block max-w-none'
                    style={{
                      width: cellW + padX * 2,
                      height: cellH + padY * 2,
                      filter: `${myFilter ?? ''} drop-shadow(0 6px 10px rgba(0,0,0,0.18))`,
                    }}
                  />
                ) : (
                  <LoosePiece
                    grid={grid}
                    index={index}
                    cellW={cellW}
                    cellH={cellH}
                    photoUrl={session.photoUrl}
                  />
                )}
              </div>
            );
          })}
      </div>

      <p className='mt-3 flex shrink-0 items-center justify-center gap-2 text-caption-medium text-text-body'>
        <span className='size-[7px] rounded-full bg-brand-primary' />
        <span className='text-body-m-medium text-text-primary'>
          {placed.length} / {total}
        </span>
        {waitingName && placed.length > 0
          ? `${waitingName}님 조각을 기다리는 중`
          : remaining.length === 0 && placed.length > 0
            ? '다른 사람의 조각을 기다리는 중'
            : `${session.members.length}명이 함께 맞추는 중`}
      </p>
      <div className='flex h-[53px] shrink-0 items-start justify-center pt-3 pb-[env(safe-area-inset-bottom)]'>
        {lastPlacedBy !== null && (
          <Toast key={placed.length}>
            {lastPlacedBy === session.members[myRow].name
              ? '내 조각을 끼웠어요'
              : lastPlacedBy === ''
                ? '다른 사람이 조각을 끼웠어요'
                : `${lastPlacedBy}님이 조각을 끼웠어요`}
          </Toast>
        )}
      </div>
    </main>
  );
};
