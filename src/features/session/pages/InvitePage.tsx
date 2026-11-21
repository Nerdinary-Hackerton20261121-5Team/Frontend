import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Avatar } from '@/shared/Avatar';
import { Button } from '@/shared/Button';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { InviteLinkField } from '../components/InviteLinkField';
import { StepLayout } from '../components/StepLayout';
import { copyInviteLink, inviteLink } from '../inviteLink';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

/** 03-A 초대. 개설자가 초대 링크를 나누고 누가 들어왔는지 본다. */
export const InvitePage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const [invited, setInvited] = useState(false);
  const { gone } = useSessionSync();

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  // 방이 끝났거나 내 자리가 없어졌으면 더 기다릴 수 없다
  if (gone) return <Navigate to={`/s/${code}/closed`} replace />;

  const joined = session.members.filter((member) => member.joined).length;

  const share = async () => {
    if (!navigator.share) {
      if (await copyInviteLink(code)) setInvited(true);
      return;
    }
    try {
      await navigator.share({ title: '공부 세션에 초대됐어요', url: inviteLink(code) });
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
        <InviteLinkField code={code} onCopied={() => setInvited(true)} />
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
