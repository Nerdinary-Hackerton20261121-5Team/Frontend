import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Chip } from '@/shared/Chip';
import { shouldUseMock, useCreateSession } from '../api';
import { Accent } from '../components/Accent';
import { GoalPreview } from '../components/GoalPreview';
import { getPickedPhoto } from '../pickedPhoto';
import { StepLayout } from '../components/StepLayout';
import { TimeSheet } from '../components/TimeSheet';
import { useSessionStore } from '../store';

const PRESETS = [25, 50, 90];

/** 04 내 조각과 목표 시간 (개설자). 목표 시간을 정하면 서버에 방이 만들어진다. */
export const NewGoalPage = () => {
  const navigate = useNavigate();
  const draft = useSessionStore((state) => state.draft);
  const setDraftGoal = useSessionStore((state) => state.setDraftGoal);
  const openAsHost = useSessionStore((state) => state.openAsHost);
  const session = useSessionStore((state) => state.session);
  const create = useCreateSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const custom = !PRESETS.includes(draft.goalMinutes);

  // 초대 화면에서 뒤로 왔다가 값을 바꾸지 않고 다시 누르면 이미 만든 방으로 돌아간다.
  // 방을 또 만들면 먼저 나눈 초대 링크가 쓸모없어진다
  const reusable =
    session !== null &&
    session.phase === 'lobby' &&
    session.members.some((member) => member.isMe && member.isHost) &&
    session.goalMinutes === draft.goalMinutes &&
    session.memberCount === draft.memberCount &&
    session.pieceCount === draft.pieceCount;

  // 새로고침하면 고른 사진 파일이 사라진다. 이미 만든 방이 없으면 사진부터 다시 고른다
  if (!draft.photoUrl || (!getPickedPhoto() && !reusable)) {
    return <Navigate to='/new/photo' replace />;
  }

  const next = () => {
    if (reusable) return navigate(`/s/${session.code}/invite`);
    create.mutate(
      {
        goalSeconds: draft.goalMinutes * 60,
        maxParticipants: draft.memberCount,
        // 이전 버전에서 만든 값이 남아 있으면 요청 ID 가 없을 수 있다
        clientRequestId: draft.requestId ?? crypto.randomUUID(),
        photo: getPickedPhoto(),
      },
      {
        onSuccess: ({ entry, photoUrl }) => navigate(`/s/${openAsHost(entry, photoUrl)}/invite`),
        onError: (error) => {
          if (shouldUseMock(error)) navigate(`/s/${openAsHost(null)}/invite`);
        },
      },
    );
  };

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={3}
      title={
        <>
          오늘 <Accent>목표 시간</Accent>을 정해요
        </>
      }
      description='모두 같은 시간 동안 공부해요. 시작하면 바꿀 수 없어요.'
      footer={
        <>
          {create.isError && !shouldUseMock(create.error) && (
            <p role='alert' className='text-center text-caption-medium text-status-away'>
              {create.error.message}
            </p>
          )}
          <Button loading={create.isPending} onClick={next}>
            다음으로
          </Button>
        </>
      }
    >
      <GoalPreview
        pieceCount={draft.pieceCount}
        memberCount={draft.memberCount}
        myRow={0}
        seed='new'
        goalMinutes={draft.goalMinutes}
      />
      <div className='mt-5 flex w-full gap-2'>
        {PRESETS.map((minutes) => (
          <Chip
            key={minutes}
            selected={draft.goalMinutes === minutes}
            className='min-w-0 flex-1 px-0'
            onClick={() => setDraftGoal(minutes)}
          >
            {minutes}분
          </Chip>
        ))}
        <Chip selected={custom} className='min-w-0 flex-1 px-0' onClick={() => setSheetOpen(true)}>
          직접 입력
        </Chip>
      </div>

      {sheetOpen && (
        <TimeSheet
          initial={draft.goalMinutes}
          onClose={() => setSheetOpen(false)}
          onSave={(minutes) => {
            setDraftGoal(minutes);
            setSheetOpen(false);
          }}
        />
      )}
    </StepLayout>
  );
};
