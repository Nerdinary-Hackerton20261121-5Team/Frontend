import { Navigate, useNavigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { Button } from '@/shared/Button';
import { InfoBox } from '@/shared/InfoBox';
import { Accent } from '../components/Accent';
import { NoticeLayout } from '../components/NoticeLayout';
import { StepLayout } from '../components/StepLayout';
import { useCurrentSession } from '../useCurrentSession';
import { useSessionSync } from '../useSessionSync';

const PRIVACY_NOTICE =
  '나에게만 보이고, 다른 사람에게는 안 보여요\n자리에 있는지 확인하는 용도입니다.';

/** 05 카메라 켜기. 켜지 못하면 05-1 카메라 권한 없음 안내로 바뀐다. */
export const CameraPage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const start = useCameraStore((state) => state.start);
  const starting = useCameraStore((state) => state.starting);
  const error = useCameraStore((state) => state.error);
  const { gone } = useSessionSync();

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  // 방이 끝났거나 내 자리가 없어졌으면 더 기다릴 수 없다
  if (gone) return <Navigate to={`/s/${code}/closed`} replace />;

  const turnOn = async () => {
    if (await start()) navigate(`/s/${code}/lobby`);
  };

  if (error) {
    return (
      <NoticeLayout
        title='카메라를 쓸 수 없어요'
        description={
          '카메라 권한이 꺼져 있거나 연결된 카메라가 없어요.\n브라우저 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.'
        }
        footer={
          <>
            <Button variant='secondary' onClick={() => navigate('/')}>
              처음으로
            </Button>
            <Button loading={starting} onClick={turnOn}>
              다시 시도
            </Button>
          </>
        }
      />
    );
  }

  return (
    <StepLayout
      header='카메라 확인'
      back
      title={
        <>
          <Accent>카메라</Accent>를 켜고 시작해요
        </>
      }
      description='얼굴이 카메라에 보일 때만 공부 시간이 쌓여요.'
      footer={
        <Button loading={starting} onClick={turnOn}>
          카메라 켜고 시작
        </Button>
      }
    >
      <div className='flex flex-col gap-3'>
        <div className='flex h-[280px] flex-col items-center justify-center gap-2 rounded-[8px] bg-bg-subtle'>
          <span className='size-[72px] rounded-full bg-border-default' />
          <span className='text-body-m-medium text-text-tertiary'>카메라 미리보기</span>
        </div>
        <InfoBox>{PRIVACY_NOTICE}</InfoBox>
      </div>
    </StepLayout>
  );
};
