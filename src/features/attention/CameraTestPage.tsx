import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/Button';
import {
  CHECK_INTERVAL_MS,
  DEFAULT_ATTENTION_CONFIG,
  createAttentionTracker,
  loadAttention,
  sampleAttention,
} from './attention';
import type { Attention, AttentionConfig, AttentionSample } from './attention';
import { useCameraStore } from './camera';
import { CameraView } from './components/CameraView';

type Reading = {
  attention: Attention;
  bowed: boolean;
  baselineYaw: number | null;
  sample: AttentionSample;
  /** 판정 한 번에 걸린 시간(ms) */
  elapsed: number;
  /** 판정에 쓴 영상의 크기 */
  size: string;
};

const LABEL: Record<Attention, string> = {
  present: '자리에 있음',
  absent: '얼굴 없음 (자리 비움)',
  'looking-away': '다른 곳을 봄',
};

/** 화면에서 바꿔 볼 수 있는 기준값 */
const SETTINGS: { key: keyof AttentionConfig; label: string; step: number }[] = [
  { key: 'yawLimit', label: '다른 곳으로 보는 각도(도)', step: 5 },
  { key: 'yawReturn', label: '돌아온 것으로 보는 각도(도)', step: 5 },
  { key: 'awaySeconds', label: '고개를 돌린 채 기다리는 시간(초)', step: 0.5 },
  { key: 'absentSeconds', label: '아무도 없을 때 기다리는 시간(초)', step: 0.5 },
  { key: 'turnLimit', label: '얼굴이 안 보일 때 옆으로 보는 치우침', step: 0.05 },
];

const degrees = (value: number | null | undefined) =>
  value == null ? '-' : `${value.toFixed(1)}도`;

/** 카메라 판정이 기기에서 제대로 도는지 보는 확인용 화면. 주소는 /#/camera-test 이고 서비스 흐름에는 들어가지 않는다. */
export const CameraTestPage = () => {
  const stream = useCameraStore((state) => state.stream);
  const cameraError = useCameraStore((state) => state.error);
  const start = useCameraStore((state) => state.start);
  const stop = useCameraStore((state) => state.stop);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [modelState, setModelState] = useState<'idle' | 'ready' | 'face-only' | 'failed'>('idle');
  const [config, setConfig] = useState(DEFAULT_ATTENTION_CONFIG);
  const [reading, setReading] = useState<Reading | null>(null);
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!stream) return;
    let timer: number | undefined;
    let cancelled = false;

    loadAttention()
      .then((detector) => {
        if (cancelled) return;
        const track = createAttentionTracker(config, detector.pose !== null);
        setModelState(detector.pose ? 'ready' : 'face-only');
        timer = window.setInterval(() => {
          const video = videoRef.current;
          if (document.hidden || !video || video.readyState < 2 || video.videoWidth === 0) return;
          const startedAt = performance.now();
          const sample = sampleAttention(detector, video);
          const finishedAt = performance.now();
          setReading({
            ...track(sample, finishedAt),
            sample,
            elapsed: finishedAt - startedAt,
            size: `${video.videoWidth}x${video.videoHeight}`,
          });
          setCount((value) => value + 1);
        }, CHECK_INTERVAL_MS);
      })
      .catch(() => setModelState('failed'));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stream, config, round]);

  useEffect(() => stop, [stop]);

  const restart = () => {
    setReading(null);
    setCount(0);
    setRound((value) => value + 1);
  };

  const changeSetting = (key: keyof AttentionConfig, value: number) => {
    if (Number.isNaN(value) || value < 0) return;
    setReading(null);
    setCount(0);
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const sample = reading?.sample;
  const face = sample?.kind === 'face' ? sample : null;
  const body = sample?.kind === 'body' ? sample : null;
  const rows: [string, string][] = [
    [
      '카메라',
      stream
        ? `켜짐${reading ? ` (${reading.size})` : ''}`
        : cameraError === 'denied'
          ? '권한 거부됨'
          : cameraError
            ? '쓸 수 없음'
            : '꺼짐',
    ],
    [
      '판정 모델',
      modelState === 'ready'
        ? '준비됨 (얼굴, 몸)'
        : modelState === 'face-only'
          ? '얼굴만 준비됨 (몸 인식 실패)'
          : modelState === 'failed'
            ? '불러오지 못함'
            : stream
              ? '불러오는 중'
              : '대기',
    ],
    [
      '보이는 것',
      !reading
        ? '-'
        : face
          ? '얼굴'
          : body
            ? reading.bowed
              ? '몸만 (숙인 것으로 봄)'
              : body.head < 0.5
                ? '몸만 (머리 안 보임)'
                : '몸만 (얼굴 안 보임)'
            : reading.bowed
              ? '없음 (숙인 것으로 보고 기다림)'
              : '아무도 없음',
    ],
    ['고개 좌우 각도', degrees(face?.yaw)],
    ['기준 좌우 각도', degrees(reading?.baselineYaw)],
    [
      '기준에서 벗어난 각도',
      face && reading?.baselineYaw != null
        ? degrees(Math.abs(face.yaw - reading.baselineYaw))
        : '-',
    ],
    ['고개 상하 각도 (참고)', degrees(face?.pitch)],
    ['숙인 정도 (클수록 숙임)', face ? face.down.toFixed(2) : '-'],
    ['얼굴 크기 (0.07 미만은 무시)', face ? face.span.toFixed(2) : '-'],
    ['몸 크기 (0.18 미만은 무시)', body ? body.size.toFixed(2) : '-'],
    ['코의 치우침 (클수록 옆을 봄)', body ? body.turn.toFixed(2) : '-'],
    ['머리가 보이는 정도 (0.5 미만은 일어난 것)', body ? body.head.toFixed(2) : '-'],
    ['판정 한 번에 걸린 시간', reading ? `${reading.elapsed.toFixed(0)}ms` : '-'],
    ['판정 횟수 (0.3초에 한 번)', String(count)],
  ];

  return (
    <div className='mx-auto flex min-h-dvh w-full max-w-[402px] flex-col gap-4 bg-white px-6 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]'>
      <h1 className='text-[22px] font-bold text-text-primary'>카메라 판정 확인</h1>
      <div className='relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-bg-subtle'>
        {stream ? (
          <CameraView videoRef={videoRef} className='size-full' />
        ) : (
          <p className='flex size-full items-center justify-center text-[13px] text-text-secondary'>
            카메라가 꺼져 있어요
          </p>
        )}
      </div>

      <p
        className={`text-[22px] font-bold ${
          reading && reading.attention !== 'present' ? 'text-status-away' : 'text-brand-primary'
        }`}
      >
        {reading ? LABEL[reading.attention] : '판정 전'}
      </p>

      <dl className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-[12px] bg-bg-subtle p-[14px] text-[13px]'>
        {rows.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-text-secondary'>{label}</dt>
            <dd className='text-right font-bold text-text-primary'>{value}</dd>
          </div>
        ))}
      </dl>

      <div className='flex flex-col gap-2 rounded-[12px] bg-bg-subtle p-[14px] text-[13px]'>
        <p className='font-bold text-text-primary'>기준값 (바꾸면 처음부터 다시 판정해요)</p>
        {SETTINGS.map(({ key, label, step }) => (
          <label key={key} className='flex items-center justify-between gap-3 text-text-secondary'>
            {label}
            <input
              type='number'
              inputMode='decimal'
              min={0}
              step={step}
              value={config[key]}
              onChange={(event) => changeSetting(key, event.target.valueAsNumber)}
              className='h-9 w-[72px] rounded-[8px] border border-border-default bg-white px-2 text-right font-bold text-text-primary'
            />
          </label>
        ))}
      </div>

      <p className='text-[12px] text-text-secondary'>
        고개를 좌우로 돌린 것만 다른 곳을 보는 것으로 판정해요. 아래를 보는 것은 판정하지 않아요.
        얼굴이 안 보이면 몸을 찾아서, 사람이 있으면 옆을 보는지 숙였는지 가르고 아무도 없으면 자리
        비움으로 봐요.
      </p>

      {stream ? (
        <>
          <Button variant='secondary' onClick={restart}>
            처음부터 다시 판정
          </Button>
          <Button onClick={stop}>카메라 끄기</Button>
        </>
      ) : (
        <Button onClick={() => void start()}>카메라 켜기</Button>
      )}
    </div>
  );
};
