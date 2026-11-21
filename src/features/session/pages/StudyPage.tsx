import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { useAttention } from '@/features/attention/useAttention';
import { BottomSheet } from '@/shared/BottomSheet';
import { AwayCard } from '../components/AwayCard';
import { JigsawBoard } from '../components/JigsawBoard';
import { PausedOverlay } from '../components/PausedOverlay';
import { PeopleSheet } from '../components/PeopleSheet';
import { RowMarkers } from '../components/RowMarkers';
import { SKIP_ENABLED } from '../components/SkipButton';
import { SheetActions } from '../components/SheetActions';
import { StudyHud } from '../components/StudyHud';
import { findFilter } from '../photoFilters';
import { gridFor, ownerRow } from '../puzzle';
import { useSessionStore } from '../store';
import { SPEED } from '../time';
import { useCurrentSession } from '../useCurrentSession';
import { useElementSize } from '../useElementSize';
import { useWakeLock } from '../useWakeLock';

/** 내 조각이 가장 흐릴 때의 흐림 정도(px). 시간을 채울수록 0 에 가까워진다 */
const MAX_BLUR = 8;

/** 06 공부 중. 자리를 지키는 동안 내 줄의 조각이 선명해진다. 06-1 자리 비움, 07 함께하는 사람, 08 일시정지를 함께 다룬다. */
export const StudyPage = () => {
  const { code, session } = useCurrentSession();
  const timeline = useSessionStore((state) => state.timeline);
  const paused = useSessionStore((state) => state.paused);
  const tick = useSessionStore((state) => state.tick);
  const setPaused = useSessionStore((state) => state.setPaused);
  const finishStudy = useSessionStore((state) => state.finishStudy);
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

  const grid = gridFor(session.pieceCount, session.members.length);
  const myRow = session.members.findIndex((member) => member.isMe);
  const me = session.members[myRow];
  const showAway = away && !paused;

  return (
    <div ref={frameRef} className='relative min-h-0 flex-1 overflow-hidden bg-bg-inverse'>
      <JigsawBoard
        className='absolute inset-0'
        width={size.width}
        height={size.height}
        grid={grid}
        photoUrl={session.photoUrl}
        filter={findFilter(session.filterId)}
        photoBlur={(1 - me.progress) * MAX_BLUR}
        look={(index) => (ownerRow(index, grid) === myRow ? 'photo' : 'dim')}
        outlineClassName={(index) =>
          ownerRow(index, grid) !== myRow
            ? 'stroke-white/25'
            : showAway
              ? 'stroke-status-away stroke-2'
              : 'stroke-brand-subtle stroke-2'
        }
      />
      <RowMarkers members={session.members} rowHeight={size.height / grid.rows} away={showAway} />
      {showAway && <AwayCard />}
      {paused && <PausedOverlay focused={timeline.focused} />}
      <StudyHud
        videoRef={videoRef}
        focused={timeline.focused}
        goalMinutes={session.goalMinutes}
        memberCount={session.members.length}
        away={showAway}
        onOpenPeople={() => setPeopleOpen(true)}
      />

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
