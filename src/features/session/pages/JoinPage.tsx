import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { LoadingView } from '@/components/LoadingView';
import { Button } from '@/shared/Button';
import { Input } from '@/shared/Input';
import { leaveSession, shouldUseMock, useJoinSession } from '../api';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { JigsawBoard } from '../components/JigsawBoard';
import { StepLayout } from '../components/StepLayout';
import { readInvite } from '../invite';
import { NAME_MAX } from '../limits';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

const PREVIEW_GRID = { cols: 3, rows: 3 };

/** 03-B 초대받은 입장. 링크를 열면 바로 자리를 잡고, 보일 이름을 정한 뒤 들어간다. */
export const JoinPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { code, session } = useCurrentSession();
  const openAsGuest = useSessionStore((state) => state.openAsGuest);
  const rename = useSessionStore((state) => state.rename);
  const reset = useSessionStore((state) => state.reset);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const join = useJoinSession(code, session === null);
  const { gone } = useSessionSync();

  // 링크에 실려 온 값은 누구나 바꿀 수 있으므로 확인한 것만 쓴다
  const { photoUrl, pieceCount } = readInvite(params);

  useEffect(() => {
    if (session) return;
    const invite = { photoUrl, pieceCount };
    if (join.data) openAsGuest(code, join.data, invite);
    // TODO(mock): 세션 API 가 없는 서버에서는 흉내 낸 세션으로 들어간다
    else if (join.error && shouldUseMock(join.error)) openAsGuest(code, null, invite);
  }, [session, join.data, join.error, code, photoUrl, pieceCount, openAsGuest]);

  // 잡아 둔 자리가 서버에서 없어졌으면(나갔다가 돌아온 경우 등) 비우고 다시 입장한다
  useEffect(() => {
    if (!gone) return;
    queryClient.removeQueries({ queryKey: ['session-join', code] });
    reset();
  }, [gone, code, queryClient, reset]);

  // 링크를 열 때 자리를 먼저 잡아 두므로, 이름을 정하지 않고 떠나면 그 자리를 돌려준다.
  useEffect(() => {
    // 자리를 잡아 두기만 한 상태면 서버에 나간다고 알리고 true 를 돌려준다
    const leave = (keepalive: boolean) => {
      const current = useSessionStore.getState().session;
      const me = current?.members.find((member) => member.isMe);
      const holding =
        current?.code === code && current.phase === 'lobby' && me !== undefined && me.name === '';
      if (!holding || !current.remote || current.remote.isCreator) return false;
      // 실패해도 화면은 떠나야 하므로 결과를 기다리지 않는다
      void leaveSession(current.remote, keepalive).catch(() => undefined);
      return true;
    };
    // 탭을 닫거나 새로고침할 때. 화면이 아직 살아 있으므로 세션을 비우면 곧바로 다시 입장해 버린다.
    // 그래서 저장해 둔 것만 지워, 다시 열었을 때 새로 입장하게 한다
    const onPageHide = () => {
      if (leave(true)) sessionStorage.removeItem('session');
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      // 뒤로 가기처럼 주소가 이 세션 밖으로 바뀌어 화면이 사라질 때.
      // 주소가 그대로면 화면을 다시 그리는 것뿐이라 나가지 않는다
      if (!window.location.hash.startsWith(`#/s/${code}`) && leave(false)) {
        queryClient.removeQueries({ queryKey: ['session-join', code] });
        reset();
      }
    };
  }, [code, queryClient, reset]);

  // 없는 코드, 이미 시작한 방, 정원이 찬 방은 들어갈 수 없다
  if (!session && join.error && !shouldUseMock(join.error)) {
    return <Navigate to={`/s/${code}/closed`} replace />;
  }
  if (!session) return <LoadingView />;

  const me = session.members.find((member) => member.isMe);
  if (!me || me.name !== '') return <Navigate to={`/s/${code}/goal`} replace />;

  const joined = session.members.filter((member) => member.joined).length;
  const trimmed = name.trim();

  const next = () => {
    rename(trimmed);
    navigate(`/s/${code}/goal`);
  };

  return (
    <StepLayout
      header='세션 만들기'
      title={
        <>
          <Accent>공부 세션</Accent>에 초대됐어요
        </>
      }
      description={`${session.memberCount}명이 모두 들어오면 공부를 시작할 수 있어요.`}
      footer={
        <Button disabled={trimmed === ''} onClick={next}>
          다음으로
        </Button>
      }
    >
      <div className='flex flex-col gap-7'>
        <div className='flex h-[260px] flex-col items-center justify-center gap-[10px] rounded-[8px] bg-bg-field'>
          <div className='relative overflow-hidden rounded-[9px]'>
            <JigsawBoard
              width={200}
              height={200}
              grid={PREVIEW_GRID}
              photoUrl={session.photoUrl}
              photoBlur={6}
              look={() => 'photo'}
              outlineClassName={() => 'stroke-white/60'}
            />
            {/* 둥글게 잘린 판의 바깥 테두리를 다시 그려 모서리에서도 선이 끊기지 않게 한다 */}
            <span
              aria-hidden
              className='pointer-events-none absolute inset-0 rounded-[9px] border border-white/60'
            />
          </div>
          <p className='text-body-m-medium text-brand-strong'>
            지금 <b>{joined}</b>/{session.memberCount}명이 들어와 있어요
          </p>
        </div>
        <Field label='함께 하는 사람에게 보일 이름'>
          <Input
            placeholder='이름을 입력해 주세요'
            value={name}
            maxLength={NAME_MAX}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      </div>
    </StepLayout>
  );
};
