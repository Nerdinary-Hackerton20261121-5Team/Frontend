import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/shared/Button';
import { MemberRow } from '@/shared/MemberRow';
import { StatusChip } from '@/shared/StatusChip';
import { Accent } from '../components/Accent';
import { RenameSheet } from '../components/RenameSheet';
import { StepLayout } from '../components/StepLayout';
import { EARLY_START_MIN } from '../limits';
import { useMockJoins } from '../mock';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';

/** 05-2 대기실. 모두 들어오기를 기다렸다가 공부를 시작한다. */
export const LobbyPage = () => {
  const { code, session } = useCurrentSession();
  const rename = useSessionStore((state) => state.rename);
  const start = useSessionStore((state) => state.start);
  const [renaming, setRenaming] = useState(false);
  useMockJoins();

  const me = session?.members.find((member) => member.isMe);
  const joined = session?.members.filter((member) => member.joined).length ?? 0;
  const full = session !== null && joined === session.memberCount;
  const guestWaiting = session?.phase === 'lobby' && me !== undefined && !me.isHost && full;

  // TODO(mock): 참가자 쪽에서는 개설자가 시작한 것처럼 잠시 뒤 넘어간다. 서버가 생기면 서버가 알려 준다
  useEffect(() => {
    if (!guestWaiting) return;
    const timer = window.setTimeout(start, 1500);
    return () => window.clearTimeout(timer);
  }, [guestWaiting, start]);

  if (!session || !me) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase !== 'lobby') return <Navigate to={`/s/${code}/study`} replace />;

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
            {!full && joined >= EARLY_START_MIN && (
              <Button variant='secondary' onClick={start}>
                지금 {joined}명으로 시작하기
              </Button>
            )}
            <Button disabled={!full} onClick={start}>
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
