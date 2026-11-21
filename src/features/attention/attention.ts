// 카메라 영상에서 자리에 있는지, 다른 곳을 보는지를 기기 안에서만 판정한다. 영상은 저장하거나 보내지 않는다.

import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import modelUrl from '@/assets/models/face_landmarker.task?url';

export type Attention = 'present' | 'absent' | 'looking-away';

/** 판정 한 번의 결과. 얼굴이 없으면 null */
export type AttentionSample = {
  /** 고개의 좌우 각도(도) */
  yaw: number;
  /** 고개의 상하 각도(도). 화면에 보여 주기만 하고 판정에는 쓰지 않는다 */
  pitch: number;
  /** 고개를 숙인 정도. 눈과 턱 사이에서 코끝이 어디쯤인지의 비율이고, 숙일수록 커진다 */
  down: number;
  /** 얼굴 크기. 두 눈 사이가 화면 폭에서 차지하는 비율 */
  span: number;
} | null;

export type AttentionConfig = {
  /** 공부하던 방향에서 이만큼(도) 넘게 고개가 돌아가면 다른 곳을 보는 것으로 본다 */
  yawLimit: number;
  /** 다른 곳을 보다가 이 각도(도) 안으로 돌아와야 다시 자리에 있는 것으로 본다. 경계에서 깜빡이지 않게 한다 */
  yawReturn: number;
  /** 고개를 돌린 채 이만큼(초) 지나야 다른 곳을 보는 것으로 본다. 잠깐 돌린 것은 넘어간다 */
  awaySeconds: number;
  /** 얼굴이 이만큼(초) 안 보이면 자리를 비운 것으로 본다 */
  absentSeconds: number;
  /** 얼굴이 사라지기 직전에 평소보다 이만큼 넘게 숙이고 있었으면 책을 보는 것으로 본다 */
  bowedMargin: number;
  /** 책을 보느라 얼굴이 안 보이는 것을 이만큼(초)까지 기다린다 */
  bowedSeconds: number;
};

export const DEFAULT_ATTENTION_CONFIG: AttentionConfig = {
  yawLimit: 35,
  yawReturn: 25,
  awaySeconds: 5,
  absentSeconds: 5,
  bowedMargin: 0.08,
  bowedSeconds: 90,
};

export type AttentionStatus = {
  attention: Attention;
  /** 얼굴은 안 보이지만 고개를 숙인 것으로 보고 기다리는 중이면 true */
  bowed: boolean;
  /** 지금 기준으로 삼는 고개 방향(도). 아직 얼굴을 본 적이 없으면 null */
  baselineYaw: number | null;
};

/** 기준 자세가 지금 자세를 따라가는 빠르기. 고쳐 앉아도 수십 초 안에 새 자세가 기준이 된다 */
const BASELINE_RATE = 0.05;
/**
 * 숙인 정도의 기준은 가장 꼿꼿했던 자세에 맞춘다. 더 꼿꼿해지면 빨리, 숙이는 쪽으로는 아주 느리게만 따라간다.
 * 책을 오래 보는 동안 기준이 숙인 자세로 옮겨 가면 그 뒤로는 숙인 것을 알아보지 못하기 때문이다.
 */
const UPRIGHT_RATE = 0.2;
const BOWING_RATE = 0.0005;

// 얼굴 그물망에서 쓰는 점 번호
/** 한 장면에서 찾는 얼굴 수 */
const MAX_FACES = 3;
/** 두 눈 사이가 화면 폭의 이 비율보다 좁으면 멀리 있는 다른 사람으로 보고 무시한다 */
const MIN_FACE_SPAN = 0.07;

const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** 얼굴 판정 모델을 준비한다. 파일이 커서 카메라를 켠 직후에 미리 불러 둔다. */
export const loadAttention = () => {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = { wasmLoaderPath: wasmLoaderUrl, wasmBinaryPath: wasmBinaryUrl };
    const create = (delegate: 'GPU' | 'CPU') =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: modelUrl, delegate },
        runningMode: 'VIDEO',
        // 뒤에 다른 사람이 지나가도 가장 가까운 얼굴을 고를 수 있게 여러 개를 찾는다
        numFaces: MAX_FACES,
        outputFacialTransformationMatrixes: true,
      });
    try {
      return await create('GPU');
    } catch {
      // GPU 를 못 쓰는 기기에서는 느리더라도 CPU 로 돌린다
      return await create('CPU');
    }
  })();
  landmarkerPromise.catch(() => {
    landmarkerPromise = null;
  });
  return landmarkerPromise;
};

/** 영상의 지금 장면을 한 번 판정한다. */
export const sampleAttention = (
  landmarker: FaceLandmarker,
  video: HTMLVideoElement,
): AttentionSample => {
  const result = landmarker.detectForVideo(video, performance.now());
  const { videoWidth, videoHeight } = video;

  // 카메라에 가장 크게 잡힌 얼굴이 공부하는 사람이다
  let face = -1;
  let span = 0;
  result.faceLandmarks.forEach((candidate, index) => {
    const width =
      Math.hypot(
        (candidate[LEFT_EYE_OUTER].x - candidate[RIGHT_EYE_OUTER].x) * videoWidth,
        (candidate[LEFT_EYE_OUTER].y - candidate[RIGHT_EYE_OUTER].y) * videoHeight,
      ) / videoWidth;
    if (width > span) {
      span = width;
      face = index;
    }
  });
  const points = result.faceLandmarks[face];
  const matrix = result.facialTransformationMatrixes?.[face]?.data;
  if (!points || !matrix || span < MIN_FACE_SPAN) return null;

  // 4x4 변환 행렬(열 우선)의 셋째 열이 얼굴이 향하는 방향이다
  const toDegrees = 180 / Math.PI;
  const yaw = Math.atan2(matrix[8], matrix[10]) * toDegrees;
  const pitch = Math.atan2(-matrix[9], Math.hypot(matrix[8], matrix[10])) * toDegrees;

  // 고개를 숙이면 튀어나온 코끝이 눈에서 턱 쪽으로 내려와 보인다. 고개를 기울여도 같게 나오도록 눈-턱 축에 투영한다
  const at = (index: number) => ({
    x: points[index].x * videoWidth,
    y: points[index].y * videoHeight,
  });
  const leftEye = at(LEFT_EYE_OUTER);
  const rightEye = at(RIGHT_EYE_OUTER);
  const eyes = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const chin = at(CHIN);
  const nose = at(NOSE_TIP);
  const axis = { x: chin.x - eyes.x, y: chin.y - eyes.y };
  const length = axis.x * axis.x + axis.y * axis.y;
  const down = length > 0 ? ((nose.x - eyes.x) * axis.x + (nose.y - eyes.y) * axis.y) / length : 0;

  return { yaw, pitch, down, span };
};

/** 판정 결과를 시각과 함께 이어 받아 지금 상태를 정한다. */
export const createAttentionTracker = (config: AttentionConfig = DEFAULT_ATTENTION_CONFIG) => {
  let attention: Attention = 'present';
  let baselineYaw: number | null = null;
  let baselineDown: number | null = null;
  let lastDown: number | null = null;
  let seen = 0;
  /** 고개를 돌리기 시작한 시각과 얼굴이 사라진 시각(ms) */
  let turnedSince: number | null = null;
  let lostSince: number | null = null;
  let bowed = false;

  return (sample: AttentionSample, now: number): AttentionStatus => {
    if (sample === null) {
      turnedSince = null;
      if (lostSince === null) {
        lostSince = now;
        bowed =
          lastDown !== null &&
          baselineDown !== null &&
          lastDown - baselineDown > config.bowedMargin;
      }
      const limit = bowed ? config.bowedSeconds : config.absentSeconds;
      if (now - lostSince >= limit * 1000) {
        attention = 'absent';
        bowed = false;
      }
      return { attention, bowed, baselineYaw };
    }

    lostSince = null;
    bowed = false;
    lastDown = sample.down;
    seen += 1;
    // 처음 몇 번은 평균으로 기준을 빨리 잡고, 그 뒤로는 천천히 따라간다
    const rate = Math.max(BASELINE_RATE, 1 / seen);
    if (baselineYaw === null || baselineDown === null) {
      baselineYaw = sample.yaw;
      baselineDown = sample.down;
    }

    const limit = attention === 'looking-away' ? config.yawReturn : config.yawLimit;
    if (Math.abs(sample.yaw - baselineYaw) > limit) {
      turnedSince ??= now;
      if (now - turnedSince >= config.awaySeconds * 1000) attention = 'looking-away';
    } else {
      turnedSince = null;
      attention = 'present';
      // 공부하는 자세일 때만 기준을 옮긴다. 다른 곳을 보는 자세가 기준이 되면 안 된다
      baselineYaw += rate * (sample.yaw - baselineYaw);
      const downRate = sample.down < baselineDown ? UPRIGHT_RATE : BOWING_RATE;
      // 처음 세 번만 평균으로 빨리 잡는다
      baselineDown += (seen <= 3 ? 1 / seen : downRate) * (sample.down - baselineDown);
    }
    return { attention, bowed, baselineYaw };
  };
};
