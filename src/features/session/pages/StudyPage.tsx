import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Navigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { useAttention } from '@/features/attention/useAttention';
import { BottomSheet } from '@/shared/BottomSheet';
import { Button } from '@/shared/Button';
import { useBoard, useEndFocus, useHeartbeat } from '../api';
import { PausedOverlay } from '../components/PausedOverlay';
import { PeopleSheet } from '../components/PeopleSheet';
import { SheetActions } from '../components/SheetActions';
import { StudyBoard } from '../components/StudyBoard';
import { StudyHud } from '../components/StudyHud';
import { pieceOwners } from '../goalPreview';
import { MY_BLUR_RATIO } from '../limits';
import { gridFor, ownersFromServer, pieceTotal } from '../puzzle';
import { useSessionStore } from '../store';
import { studyGrid } from '../studyLayout';
import { SPEED } from '../time';
import type { TickMode } from '../types';
import { useCurrentSession } from '../useCurrentSession';
import { useElementSize } from '../useElementSize';
import { useWakeLock } from '../useWakeLock';

/** 사진 카드의 모서리 둥글기(px) */
const BOARD_RADIUS = 16;

const watchVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};

/** 06 공부 중. 자리를 지키는 동안 내 조각이 선명해진다. 06-1 자리 비움, 07 함께하는 사람, 08 일시정지를 함께 다룬다. */
export const StudyPage = () => {
  const { code, session } = useCurrentSession();
  const timeline = useSessionStore((state) => state.timeline);
  const paused = useSessionStore((state) => state.paused);
  const tick = useSessionStore((state) => state.tick);
  const setPaused = useSessionStore((state) => state.setPaused);
  const finishStudy = useSessionStore((state) => state.finishStudy);
  const syncBoard = useSessionStore((state) => state.syncBoard);
  const syncMembers = useSessionStore((state) => state.syncMembers);
  const syncFocused = useSessionStore((state) => state.syncFocused);
  const endFocus = useEndFocus();
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
  const hidden = useSyncExternalStore(watchVisibility, () => document.hidden);

  // 서버 세션이면 연결을 알리고, 서버의 공부 시간이 끝났으면 함께 퍼즐 맞추기로 넘어간다
  // 얼굴이 보이는 동안만 서버에 공부 시간이 쌓인다. 화면을 가렸을 때도 자리 비움으로 알린다
  const presence = paused ? 'PAUSED' : away || hidden ? 'AWAY' : 'FOCUSING';
  const heartbeat = useHeartbeat(session?.remote ?? null, studying, presence);
  const endedOnServer =
    heartbeat.data?.status === 'ASSEMBLING' || heartbeat.data?.status === 'COMPLETED';
  useEffect(() => {
    if (endedOnServer) finishStudy();
  }, [endedOnServer, finishStudy]);

  // 서버가 정한 내 자리를 따른다
  const board = useBoard(session?.remote ?? null, studying);
  useEffect(() => {
    if (!board.data) return;
    syncBoard(board.data.pieces);
    syncMembers(board.data.members);
  }, [board.data, syncBoard, syncMembers]);
  // 공부 중에는 정답 칸이 드러나지 않게 서버가 섞어 준 칸에 조각을 놓는다.
  // 칸마다 사진의 어느 부분을 보여 줄지 정해 둔다. 조각 그림은 받지 않고 방의 사진을 잘라 쓴다(서버가 조각을 오리는 데 오래 걸린다)
  const sources = board.data
    ? board.data.pieces.reduce<number[]>((list, piece) => {
        list[piece.displaySlot - 1] = piece.position - 1;
        return list;
      }, [])
    : undefined;

  // 서버가 센 내 공부 시간을 따른다. 이 기기의 시계가 밀려도 서버 값으로 돌아온다
  const serverFocused = heartbeat.data?.focusedSeconds;
  useEffect(() => {
    if (serverFocused !== undefined) syncFocused(serverFocused);
  }, [serverFocused, syncFocused]);

  // 1초마다 시간을 흘려보낸다. 얼굴 판정이 자주 바뀌어도 시계가 다시 시작되지 않게 지금 상태는 ref 로 읽는다
  const mode: TickMode = paused ? 'paused' : hidden ? 'hidden' : away ? 'away' : 'focused';
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    if (!studying) return;
    const timer = window.setInterval(() => tick(SPEED, modeRef.current), 1000);
    return () => window.clearInterval(timer);
  }, [studying, tick]);

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase === 'lobby') return <Navigate to={`/s/${code}/lobby`} replace />;
  if (session.phase === 'assembly') return <Navigate to={`/s/${code}/result`} replace />;
  // 새로고침 등으로 카메라가 꺼졌으면 다시 켜고 돌아온다
  if (!stream) return <Navigate to={`/s/${code}/camera`} replace />;

  // 한 사람이 맡을 조각 수는 줄 단위 판(gridFor)과 같고, 화면에는 Figma 처럼 세로로 긴 판에 흩어 놓는다
  const perPerson = gridFor(session.pieceCount, session.members.length).cols;
  const grid = studyGrid(pieceTotal(gridFor(session.pieceCount, session.members.length)));
  const myIndex = session.members.findIndex((member) => member.isMe);
  // 서버 세션이면 서버가 섞어 준 칸 가운데 내 칸을 쓴다
  const mySlots = board.data
    ? board.data.pieces.filter((piece) => piece.isMine).map((piece) => piece.displaySlot)
    : session.myPositions;
  const owners = mySlots
    ? ownersFromServer(pieceTotal(grid), mySlots, myIndex, session.members.length, perPerson)
    : pieceOwners(code, grid, perPerson);
  const me = session.members[myIndex];
  // 공부를 끝내는 것은 만든 사람만 한다. 서버에서 모두의 공부가 끝나고, 다른 사람은 heartbeat 로 알아채 따라 넘어온다.
  // 참가자가 혼자 넘어가면 서버는 아직 공부 중이라 조각을 끼울 수 없다
  const canFinish = !session.remote || session.remote.isCreator;
  const finish = () => {
    if (!session.remote?.isCreator) return finishStudy();
    endFocus.mutate(session.remote, { onSettled: finishStudy });
  };
  // 서버가 섞어 준 칸을 알기 전에 그리면 정답 칸이 잠깐 드러난다. 진행판을 받은 뒤에 그린다
  const loadingBoard = session.remote !== null && board.isPending;
  const showAway = away && !paused;

  return (
    <div className='relative flex min-h-0 flex-1 flex-col bg-brand-subtle'>
      <div
        ref={frameRef}
        className='relative mx-4 mt-[calc(14px+env(safe-area-inset-top))] min-h-0 flex-1 overflow-hidden bg-bg-inverse'
        style={{ borderRadius: BOARD_RADIUS }}
      >
        {!loadingBoard && (
          <StudyBoard
            width={size.width}
            height={size.height}
            grid={grid}
            owners={owners}
            members={session.members}
            photoUrl={session.photoUrl}
            sources={sources}
            myBlur={(1 - (me?.progress ?? 0)) * (size.width / grid.cols) * MY_BLUR_RATIO}
            away={showAway}
            radius={BOARD_RADIUS}
          />
        )}
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
          onFinish={canFinish ? finish : undefined}
        />
      )}
      <BottomSheet open={paused} onClose={() => setPaused(false)}>
        {canFinish ? (
          <SheetActions
            cancelLabel='다시 시작'
            confirmLabel='종료'
            onCancel={() => setPaused(false)}
            onConfirm={finish}
          />
        ) : (
          <Button onClick={() => setPaused(false)}>다시 시작</Button>
        )}
      </BottomSheet>
    </div>
  );
};
