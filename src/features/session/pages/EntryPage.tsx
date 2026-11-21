import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import illustration from '@/assets/images/entry-illustration.svg';
import shadow from '@/assets/images/entry-shadow.svg';
import { useCameraStore } from '@/features/attention/camera';
import { Button } from '@/shared/Button';
import { Accent } from '../components/Accent';
import { JoinSheet } from '../components/JoinSheet';
import { SplashScreen } from '../components/SplashScreen';
import { useSessionStore } from '../store';

/** 초록 시작 화면을 보여 주는 시간(ms) */
const SPLASH_MS = 1500;
// 앱을 연 뒤 처음 한 번만 보여 준다. 처음 화면으로 돌아올 때는 다시 띄우지 않는다
let splashSeen = false;

/** 01 진입. 앱을 처음 열면 초록 시작 화면을 잠깐 보여 주고, 서비스를 한 줄로 알리며 세션 참여나 세션 만들기로 보낸다. */
export const EntryPage = () => {
  const navigate = useNavigate();
  const reset = useSessionStore((state) => state.reset);
  const stopCamera = useCameraStore((state) => state.stop);
  const [splash, setSplash] = useState(!splashSeen);
  const [joinOpen, setJoinOpen] = useState(false);

  // 처음으로 돌아왔으면 이전 세션을 비우고 켜 둔 카메라를 끈다
  useEffect(() => {
    reset();
    stopCamera();
  }, [reset, stopCamera]);

  useEffect(() => {
    if (!splash) return;
    splashSeen = true;
    const timer = window.setTimeout(() => setSplash(false), SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [splash]);

  return (
    <>
      {splash && <SplashScreen />}
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
        {/* Figma 393px 프레임 기준 위치. 일러스트는 화면 폭 그대로라 가운데 두고, 바닥 그림자는 그 중심에서 왼쪽으로 136.5px 지점에 둔다 */}
        <div className='relative -mx-5 mt-[59px] h-[345px] shrink-0 overflow-hidden'>
          <img
            src={illustration}
            alt=''
            width={393}
            height={286}
            className='absolute top-0 left-1/2 max-w-none -translate-x-1/2'
          />
          <img
            src={shadow}
            alt=''
            width={206}
            height={34}
            className='absolute top-[311px] left-[calc(50%-136.5px)] max-w-none'
          />
        </div>
      </main>
      <footer className='flex shrink-0 flex-col gap-4 px-5 pt-2 pb-[calc(22px+env(safe-area-inset-bottom))]'>
        <Button variant='secondary' onClick={() => setJoinOpen(true)}>
          세션 참여하기
        </Button>
        <Button onClick={() => navigate('/new/photo')}>세션 만들기</Button>
      </footer>
      {joinOpen && <JoinSheet onClose={() => setJoinOpen(false)} />}
    </>
  );
};
