import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { Button } from '@/shared/Button';
import { Accent } from '../components/Accent';
import { useSessionStore } from '../store';

/** 01 진입. 서비스를 한 줄로 알리고 세션 만들기로 보낸다. */
export const EntryPage = () => {
  const navigate = useNavigate();
  const reset = useSessionStore((state) => state.reset);
  const stopCamera = useCameraStore((state) => state.stop);

  // 세션 도중에 처음으로 돌아왔다면 켜 둔 카메라를 끈다
  useEffect(() => {
    stopCamera();
  }, [stopCamera]);

  const create = () => {
    reset();
    navigate('/new/photo');
  };

  return (
    <>
      <main className='flex min-h-0 flex-1 flex-col overflow-y-auto bg-linear-to-b from-brand-subtle to-bg-default to-40% px-5 pt-[calc(51px+env(safe-area-inset-top))]'>
        <h1 className='text-title-l text-text-primary'>
          함께 공부하고,
          <br />
          <Accent>사진 한 장</Accent>을 같이 완성해요
        </h1>
        <p className='mt-3 text-body-m-medium text-text-secondary'>
          각자 한 조각씩 맡아,
          <br />
          목표 시간 동안 자리를 지키면 내 조각이 만들어져요
        </p>
      </main>
      <footer className='shrink-0 px-5 pt-2 pb-[calc(22px+env(safe-area-inset-bottom))]'>
        <Button onClick={create}>세션 만들기</Button>
      </footer>
    </>
  );
};
