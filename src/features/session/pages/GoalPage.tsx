import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Accent } from '../components/Accent';
import { GoalPreview } from '../components/GoalPreview';
import { StepLayout } from '../components/StepLayout';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

/** 04 내 조각과 목표 시간 (초대받은 사람). 개설자가 정한 목표 시간과 내가 맡을 조각을 확인한다. */
export const GoalPage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  useSessionSync();

  if (!session) return <Navigate to={`/s/${code}`} replace />;

  return (
    <StepLayout
      header='세션 만들기'
      back
      title={
        <>
          오늘 <Accent>목표 시간</Accent>이에요
        </>
      }
      description={`${session.memberCount}명이 모두 들어오면 공부를 시작할 수 있어요.`}
      footer={<Button onClick={() => navigate(`/s/${code}/camera`)}>다음으로</Button>}
    >
      <GoalPreview
        pieceCount={session.pieceCount}
        memberCount={session.memberCount}
        myRow={session.members.findIndex((member) => member.isMe)}
        seed={code}
        goalMinutes={session.goalMinutes}
      />
    </StepLayout>
  );
};
