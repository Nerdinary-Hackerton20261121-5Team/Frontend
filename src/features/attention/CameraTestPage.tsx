import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { createAttentionTracker, loadAttention, sampleAttention } from './attention';
import type { Attention } from './attention';
import { useCameraStore } from './camera';
import { CameraView } from './components/CameraView';

type Reading = {
  attention: Attention;
  /** 고개의 좌우 각도(도). 얼굴이 없으면 null */
  yaw: number | null;
  /** 판정 한 번에 걸린 시간(ms) */
  elapsed: number;
};

const LABEL: Record<Attention, string> = {
  present: '자리에 있음',
  absent: '얼굴 없음 (자리 비움)',
  'looking-away': '다른 곳을 봄',
};

/** 카메라 판정이 기기에서 제대로 도는지 보는 확인용 화면. 주소는 /#/camera-test 이고 서비스 흐름에는 들어가지 않는다. */
export const CameraTestPage = () => {
  const stream = useCameraStore((state) => state.stream);
  const cameraError = useCameraStore((state) => state.error);
  const start = useCameraStore((state) => state.start);
  const stop = useCameraStore((state) => state.stop);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [modelState, setModelState] = useState<'idle' | 'ready' | 'failed'>('idle');
  const [reading, setReading] = useState<Reading | null>(null);
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!stream) return;
    let timer: number | undefined;
    let cancelled = false;
    const track = createAttentionTracker();
    loadAttention()
      .then((landmarker) => {
        if (cancelled) return;
        setModelState('ready');
        timer = window.setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;
          const startedAt = performance.now();
          const sample = sampleAttention(landmarker, video);
          setReading({
            attention: track(sample),
            yaw: sample?.yaw ?? null,
            elapsed: performance.now() - startedAt,
          });
          setCount((value) => value + 1);
        }, 1000);
      })
      .catch(() => setModelState('failed'));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stream, round]);

  useEffect(() => stop, [stop]);

  const resetBaseline = () => {
    setReading(null);
    setCount(0);
    setRound((value) => value + 1);
  };

  return (
    <div className='mx-auto flex min-h-dvh w-full max-w-[402px] flex-col gap-4 bg-white px-6 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]'>
      <h1 className='text-[22px] font-bold text-ink'>카메라 판정 확인</h1>
      <div className='relative aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-surface'>
        {stream ? (
          <CameraView videoRef={videoRef} className='size-full' />
        ) : (
          <p className='flex size-full items-center justify-center text-[13px] text-sub'>
            카메라가 꺼져 있어요
          </p>
        )}
      </div>

      <p
        className={`text-[22px] font-bold ${
          reading && reading.attention !== 'present' ? 'text-danger' : 'text-primary'
        }`}
      >
        {reading ? LABEL[reading.attention] : '판정 전'}
      </p>

      <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[12px] bg-surface p-[14px] text-[13px]'>
        <dt className='text-sub'>카메라</dt>
        <dd className='text-right font-bold text-ink'>
          {stream
            ? '켜짐'
            : cameraError === 'denied'
              ? '권한 거부됨'
              : cameraError
                ? '쓸 수 없음'
                : '꺼짐'}
        </dd>
        <dt className='text-sub'>판정 모델</dt>
        <dd className='text-right font-bold text-ink'>
          {modelState === 'ready'
            ? '준비됨'
            : modelState === 'failed'
              ? '불러오지 못함'
              : stream
                ? '불러오는 중'
                : '대기'}
        </dd>
        <dt className='text-sub'>얼굴</dt>
        <dd className='text-right font-bold text-ink'>
          {reading ? (reading.yaw === null ? '안 보임' : '보임') : '-'}
        </dd>
        <dt className='text-sub'>고개 좌우 각도</dt>
        <dd className='text-right font-bold text-ink'>
          {reading?.yaw != null ? `${reading.yaw.toFixed(1)}도` : '-'}
        </dd>
        <dt className='text-sub'>판정 한 번에 걸린 시간</dt>
        <dd className='text-right font-bold text-ink'>
          {reading ? `${reading.elapsed.toFixed(0)}ms` : '-'}
        </dd>
        <dt className='text-sub'>판정 횟수 (1초에 한 번)</dt>
        <dd className='text-right font-bold text-ink'>{count}</dd>
      </dl>

      <p className='text-[12px] text-sub'>
        처음 3번의 고개 방향을 기준으로 잡아요. 얼굴이 3초 동안 안 보이면 자리 비움, 기준에서 35도
        넘게 5초 동안 돌아가 있으면 다른 곳을 보는 것으로 판정해요.
      </p>

      <div className='min-h-0 flex-1' />
      {stream ? (
        <>
          <Button variant='ghost' onClick={resetBaseline}>
            기준 다시 잡기
          </Button>
          <Button onClick={stop}>카메라 끄기</Button>
        </>
      ) : (
        <Button onClick={() => void start()}>카메라 켜기</Button>
      )}
    </div>
  );
};
