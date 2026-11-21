import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Chip } from '@/shared/Chip';
import { Accent } from '../components/Accent';
import { JigsawBoard } from '../components/JigsawBoard';
import { StepLayout } from '../components/StepLayout';
import { TimeSheet } from '../components/TimeSheet';
import { useMockJoins } from '../mock';
import { previewGrid, previewPieces } from '../goalPreview';
import { gridFor, pieceTotal } from '../puzzle';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';

const PRESETS = [25, 50, 90];

/** 04 내 조각과 목표 시간. 내가 맡을 조각을 보여 주고 오늘 공부할 시간을 정한다. */
export const GoalPage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const setGoal = useSessionStore((state) => state.setGoal);
  const [sheetOpen, setSheetOpen] = useState(false);
  useMockJoins();

  if (!session) return <Navigate to={`/s/${code}`} replace />;

  const grid = gridFor(session.pieceCount, session.memberCount);
  const board = previewGrid(pieceTotal(grid));
  const myPieces = previewPieces(
    code,
    board,
    grid.cols,
    session.members.findIndex((member) => member.isMe),
  );
  const custom = !PRESETS.includes(session.goalMinutes);

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={4}
      title={
        <>
          오늘 <Accent>목표 시간</Accent>을 정해요
        </>
      }
      description={`${session.memberCount}명이 모두 들어오면 공부를 시작할 수 있어요.`}
      footer={<Button onClick={() => navigate(`/s/${code}/camera`)}>다음으로</Button>}
    >
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

      <div className='mt-7 flex flex-col items-center gap-5'>
        <p className='flex items-end gap-0.5 text-text-primary'>
          <span className='text-display'>{session.goalMinutes}</span>
          <span className='pb-[5px] text-title-l'>분</span>
        </p>
        <div className='flex w-full gap-2'>
          {PRESETS.map((minutes) => (
            <Chip
              key={minutes}
              selected={session.goalMinutes === minutes}
              className='min-w-0 flex-1 px-0'
              onClick={() => setGoal(minutes)}
            >
              {minutes}분
            </Chip>
          ))}
          <Chip
            selected={custom}
            className='min-w-0 flex-1 px-0'
            onClick={() => setSheetOpen(true)}
          >
            직접 입력
          </Chip>
        </div>
      </div>

      {sheetOpen && (
        <TimeSheet
          initial={session.goalMinutes}
          onClose={() => setSheetOpen(false)}
          onSave={(minutes) => {
            setGoal(minutes);
            setSheetOpen(false);
          }}
        />
      )}
    </StepLayout>
  );
};
