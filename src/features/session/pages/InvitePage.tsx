import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Avatar } from '@/shared/Avatar';
import { Button } from '@/shared/Button';
import { Input } from '@/shared/Input';
import { InputButton } from '@/shared/InputButton';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { StepLayout } from '../components/StepLayout';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

/** 03-A 초대. 개설자가 초대 링크를 나누고 누가 들어왔는지 본다. */
export const InvitePage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const [invited, setInvited] = useState(false);
  useSessionSync();

  if (!session) return <Navigate to={`/s/${code}`} replace />;

  // TODO(mock): 서버가 아직 세션의 사진과 조각 수를 주지 않아서 초대 링크에 실어 보낸다
  const extra = new URLSearchParams({ pieces: String(session.pieceCount) });
  if (session.photoUrl.startsWith('http')) extra.set('photo', session.photoUrl);
  const link = `${window.location.origin}${window.location.pathname}#/s/${code}?${extra}`;
  const joined = session.members.filter((member) => member.joined).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setInvited(true);
    } catch {
      // 복사를 막아 둔 브라우저에서는 링크 칸을 길게 눌러 직접 복사할 수 있다
    }
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: '공부 세션에 초대됐어요', url: link });
      setInvited(true);
    } catch {
      // 공유 창을 그냥 닫은 경우다
    }
  };

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={4}
      title={
        <>
          <Accent>함께할 친구</Accent>를 초대해요
        </>
      }
      description={`${session.memberCount}명이 모두 들어오면 공부를 시작할 수 있어요.`}
      footer={
        <>
          <Button variant='secondary' onClick={share}>
            링크 공유하기
          </Button>
          <Button disabled={!invited && joined < 2} onClick={() => navigate(`/s/${code}/camera`)}>
            다음으로
          </Button>
        </>
      }
    >
      <div className='flex flex-col gap-7'>
        <Field label='초대 링크'>
          <Input
            readOnly
            value={link.replace(/^https?:\/\//, '')}
            aria-label='초대 링크'
            action={<InputButton onClick={copy}>{invited ? '복사됨' : '복사'}</InputButton>}
          />
        </Field>
        <Field
          label={
            <>
              들어온 사람{' '}
              <span className='ml-1 text-brand-primary'>
                <b>{joined}</b>/{session.memberCount}
              </span>
            </>
          }
        >
          <div className='flex gap-[10px]'>
            {session.members.map((member) => (
              <Avatar
                key={member.id}
                name={member.isMe ? '나' : member.joined ? member.name : '?'}
                state={member.joined ? 'joined' : 'waiting'}
              />
            ))}
          </div>
        </Field>
      </div>
    </StepLayout>
  );
};
