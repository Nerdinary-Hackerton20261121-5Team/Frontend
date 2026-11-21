import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { useAttention } from '@/features/attention/useAttention';
import { BottomSheet } from '@/shared/BottomSheet';
import { useBoard, useHeartbeat } from '../api';
import { PausedOverlay } from '../components/PausedOverlay';
import { PeopleSheet } from '../components/PeopleSheet';
import { SKIP_ENABLED } from '../components/SkipButton';
import { SheetActions } from '../components/SheetActions';
import { StudyBoard } from '../components/StudyBoard';
import { StudyHud } from '../components/StudyHud';
import { pieceOwners } from '../goalPreview';
import { gridFor, ownersFromServer, pieceTotal } from '../puzzle';
import { useSessionStore } from '../store';
import { studyGrid } from '../studyLayout';
import { SPEED } from '../time';
import { useCurrentSession } from '../useCurrentSession';
import { useElementSize } from '../useElementSize';
import { useWakeLock } from '../useWakeLock';

/** 내 조각이 가장 흐릴 때의 흐림 정도(px). 시간을 채울수록 0 에 가까워진다 */
const MAX_BLUR = 8;
/** 사진 카드의 모서리 둥글기(px) */
const BOARD_RADIUS = 16;

/** 06 공부 중. 자리를 지키는 동안 내 조각이 선명해진다. 06-1 자리 비움, 07 함께하는 사람, 08 일시정지를 함께 다룬다. */
export const StudyPage = () => {
  const { code, session } = useCurrentSession();
  const timeline = useSessionStore((state) => state.timeline);
  const paused = useSessionStore((state) => state.paused);
  const tick = useSessionStore((state) => state.tick);
  const setPaused = useSessionStore((state) => state.setPaused);
  const finishStudy = useSessionStore((state) => state.finishStudy);
  const syncBoard = useSessionStore((state) => state.syncBoard);
  const stream = useCameraStore((state) => state.stream);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const size = useElementSize(frameRef);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const studying = session?.phase === 'study';
  const attention = useAttention(videoRef, studying && stream !== null && !paused);
  // 판정 모델을 아직 못 불렀을 때는 자리에 있는 것으로 본다
  const away = attention === 'absent' || attention === 'looking-away';
  useWakeLock(studying);

  // 서버 세션이면 연결을 알리고, 서버의 공부 시간이 끝났으면 함께 퍼즐 맞추기로 넘어간다
  const heartbeat = useHeartbeat(session?.remote ?? null, studying);
  const endedOnServer =
    heartbeat.data?.status === 'ASSEMBLING' || heartbeat.data?.status === 'COMPLETED';
  useEffect(() => {
    if (endedOnServer) finishStudy();
  }, [endedOnServer, finishStudy]);

  // 서버가 정한 내 자리를 따른다
  const board = useBoard(session?.remote ?? null, studying);
  useEffect(() => {
    if (board.data) syncBoard(board.data.pieces);
  }, [board.data, syncBoard]);

  useEffect(() => {
    if (!studying) return;
    const timer = window.setInterval(() => {
      tick(SPEED, paused ? 'paused' : document.hidden ? 'hidden' : away ? 'away' : 'focused');
    }, 1000);
    return () => window.clearInterval(timer);
  }, [studying, paused, away, tick]);

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase === 'lobby') return <Navigate to={`/s/${code}/lobby`} replace />;
  if (session.phase === 'assembly') return <Navigate to={`/s/${code}/result`} replace />;
  // TODO(skip): 건너뛰기로 카메라 없이 들어온 경우를 허용한다. 건너뛰기를 지울 때 조건을 !stream 으로 되돌린다
  if (!stream && !SKIP_ENABLED) return <Navigate to={`/s/${code}/camera`} replace />;

  // 한 사람이 맡을 조각 수는 줄 단위 판(gridFor)과 같고, 화면에는 Figma 처럼 세로로 긴 판에 흩어 놓는다
  const perPerson = gridFor(session.pieceCount, session.members.length).cols;
  const grid = studyGrid(pieceTotal(gridFor(session.pieceCount, session.members.length)));
  const myIndex = session.members.findIndex((member) => member.isMe);
  // 서버 세션이면 서버가 정한 내 칸을 쓴다. 결과 화면에서 끼우는 칸과 같아진다
  const owners = session.myPositions
    ? ownersFromServer(
        pieceTotal(grid),
        session.myPositions,
        myIndex,
        session.members.length,
        perPerson,
      )
    : pieceOwners(code, grid, perPerson);
  const me = session.members[myIndex];
  const showAway = away && !paused;

  return (
    <div className='relative flex min-h-0 flex-1 flex-col bg-brand-subtle'>
      <div
        ref={frameRef}
        className='relative mx-4 mt-[calc(14px+env(safe-area-inset-top))] min-h-0 flex-1 overflow-hidden bg-bg-inverse'
        style={{ borderRadius: BOARD_RADIUS }}
      >
        <StudyBoard
          width={size.width}
          height={size.height}
          grid={grid}
          owners={owners}
          members={session.members}
          photoUrl={session.photoUrl}
          myBlur={(1 - (me?.progress ?? 0)) * MAX_BLUR}
          away={showAway}
          radius={BOARD_RADIUS}
        />
      </div>
      <StudyHud
        videoRef={videoRef}
        focused={timeline.focused}
        goalMinutes={session.goalMinutes}
        memberCount={session.members.length}
        away={showAway}
        onOpenPeople={() => setPeopleOpen(true)}
      />
      {paused && <PausedOverlay focused={timeline.focused} />}

      {peopleOpen && (
        <PeopleSheet
          members={session.members}
          goalMinutes={session.goalMinutes}
          onClose={() => setPeopleOpen(false)}
          onPause={() => {
            setPeopleOpen(false);
            setPaused(true);
          }}
          onFinish={finishStudy}
        />
      )}
      <BottomSheet open={paused} onClose={() => setPaused(false)}>
        <SheetActions
          cancelLabel='다시 시작'
          confirmLabel='종료'
          onCancel={() => setPaused(false)}
          onConfirm={finishStudy}
        />
      </BottomSheet>
    </div>
  );
};
