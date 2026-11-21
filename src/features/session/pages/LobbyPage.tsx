import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/shared/Button';
import { MemberRow } from '@/shared/MemberRow';
import { StatusChip } from '@/shared/StatusChip';
import { Accent } from '../components/Accent';
import { RenameSheet } from '../components/RenameSheet';
import { StepLayout } from '../components/StepLayout';
import { EARLY_START_MIN } from '../limits';
import { useStartSession } from '../api';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

/** 05-2 대기실. 모두 들어오기를 기다렸다가 공부를 시작한다. */
export const LobbyPage = () => {
  const { code, session } = useCurrentSession();
  const rename = useSessionStore((state) => state.rename);
  const start = useSessionStore((state) => state.start);
  const startOnServer = useStartSession();
  const [renaming, setRenaming] = useState(false);
  const { gone } = useSessionSync();

  const me = session?.members.find((member) => member.isMe);
  const joined = session?.members.filter((member) => member.joined).length ?? 0;
  const full = session !== null && joined === session.memberCount;
  const guestWaiting =
    session?.phase === 'lobby' && !session.remote && me !== undefined && !me.isHost && full;

  // TODO(mock): 서버 없이 흉내 낸 세션의 참가자는 개설자가 시작한 것처럼 잠시 뒤 넘어간다.
  // 서버 세션에서는 useSessionSync 가 단계 변화를 읽어 넘긴다
  useEffect(() => {
    if (!guestWaiting) return;
    const timer = window.setTimeout(start, 1500);
    return () => window.clearTimeout(timer);
  }, [guestWaiting, start]);

  if (!session || !me) return <Navigate to={`/s/${code}`} replace />;
  // 방이 끝났거나 내 자리가 없어졌으면 더 기다릴 수 없다
  if (gone) return <Navigate to={`/s/${code}/closed`} replace />;
  if (session.phase !== 'lobby') return <Navigate to={`/s/${code}/study`} replace />;

  // 서버 세션이면 서버에서 먼저 시작하고, 성공하면 화면을 넘긴다
  const begin = () => {
    if (!session.remote) return start();
    startOnServer.mutate(session.remote, { onSuccess: start });
  };

  return (
    <StepLayout
      header='대기실'
      back
      title={
        <>
          <Accent>모두 들어오면</Accent> 공부를 시작해요
        </>
      }
      description={
        <>
          현재{' '}
          <span className='text-brand-strong'>
            <b>{joined}</b>/{session.memberCount}
          </span>
          명이 들어왔어요
        </>
      }
      footer={
        me.isHost ? (
          <>
            {startOnServer.isError && (
              <p role='alert' className='text-center text-caption-medium text-status-away'>
                {startOnServer.error.message}
              </p>
            )}
            {!full && joined >= EARLY_START_MIN && (
              <Button variant='secondary' loading={startOnServer.isPending} onClick={begin}>
                지금 {joined}명으로 시작하기
              </Button>
            )}
            <Button disabled={!full} loading={startOnServer.isPending} onClick={begin}>
              {full ? '공부 시작하기' : `${session.memberCount}명이 모이면 시작할 수 있어요`}
            </Button>
          </>
        ) : (
          <>
            <p className='text-center text-caption-medium text-text-tertiary'>
              {EARLY_START_MIN}명 이상이면 개설자가 지금 인원으로 먼저 시작할 수도 있어요
            </p>
            <Button disabled>모두 모이면 자동으로 시작돼요</Button>
          </>
        )
      }
    >
      <div className='flex flex-col gap-3'>
        {session.members.map((member) =>
          member.isMe ? (
            <MemberRow
              key={member.id}
              name={`${member.name}(나)`}
              variant='highlighted'
              trailing={
                <button type='button' onClick={() => setRenaming(true)}>
                  <StatusChip variant='neutral'>이름 바꾸기</StatusChip>
                </button>
              }
            />
          ) : member.joined ? (
            <MemberRow
              key={member.id}
              name={member.name}
              trailing={
                member.isHost ? (
                  <StatusChip variant='recording'>개설자</StatusChip>
                ) : (
                  <StatusChip variant='info'>카메라 OK</StatusChip>
                )
              }
            />
          ) : (
            <MemberRow
              key={member.id}
              name='빈 자리'
              variant='waiting'
              trailing={<StatusChip variant='neutral'>기다리는 중...</StatusChip>}
            />
          ),
        )}
      </div>

      {renaming && (
        <RenameSheet
          initial={me.name}
          onClose={() => setRenaming(false)}
          onSave={(name) => {
            rename(name);
            setRenaming(false);
          }}
        />
      )}
    </StepLayout>
  );
};
