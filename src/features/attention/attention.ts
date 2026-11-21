// 카메라 영상에서 자리에 있는지, 다른 곳을 보는지를 기기 안에서만 판정한다. 영상은 저장하거나 보내지 않는다.

import type { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import faceModelUrl from '@/assets/models/face_landmarker.task?url';
import poseModelUrl from '@/assets/models/pose_landmarker_lite.task?url';

export type Attention = 'present' | 'absent' | 'looking-away';

/** 얼굴이 정면에 가깝게 보일 때의 판정 결과 */
export type FaceSample = {
  kind: 'face';
  /** 고개의 좌우 각도(도) */
  yaw: number;
  /** 고개의 상하 각도(도). 화면에 보여 주기만 하고 판정에는 쓰지 않는다 */
  pitch: number;
  /** 고개를 숙인 정도. 눈과 턱 사이에서 코끝이 어디쯤인지의 비율이고, 숙일수록 커진다 */
  down: number;
  /** 얼굴 크기. 두 눈 사이가 화면 폭에서 차지하는 비율 */
  span: number;
};

/** 얼굴은 안 보이지만 머리와 어깨로 사람이 있는 것은 확인된 결과. 옆을 보거나 깊이 숙였을 때다 */
export type BodySample = {
  kind: 'body';
  /** 몸 크기. 어깨 폭 또는 머리에서 어깨까지가 화면 폭에서 차지하는 비율 */
  size: number;
  /** 고개가 옆으로 돌아간 정도. 두 귀 사이 거리에 견준 코의 치우침이고, 옆을 볼수록 커진다 */
  turn: number;
  /** 머리가 화면 안에 또렷이 잡힌 정도(0~1). 일어서서 머리가 화면 밖으로 나가면 낮아진다 */
  head: number;
};

/** 판정 한 번의 결과. 화면에 아무도 없으면 null */
export type AttentionSample = FaceSample | BodySample | null;

export type AttentionConfig = {
  /** 공부하던 방향에서 이만큼(도) 넘게 고개가 돌아가면 다른 곳을 보는 것으로 본다 */
  yawLimit: number;
  /** 다른 곳을 보다가 이 각도(도) 안으로 돌아와야 다시 자리에 있는 것으로 본다. 경계에서 깜빡이지 않게 한다 */
  yawReturn: number;
  /** 고개를 돌린 채 이만큼(초) 지나야 다른 곳을 보는 것으로 본다. 한두 번 잘못 잡힌 것은 넘어간다 */
  awaySeconds: number;
  /** 화면에 아무도 없는 채 이만큼(초) 지나면 자리를 비운 것으로 본다 */
  absentSeconds: number;
  /** 얼굴이 사라지기 직전에 평소보다 이만큼 넘게 숙이고 있었으면 책을 보는 것으로 본다 */
  bowedMargin: number;
  /** 몸 인식을 쓸 수 없는 기기에서, 책을 보느라 얼굴이 안 보이는 것을 이만큼(초)까지 기다린다 */
  bowedSeconds: number;
  /** 얼굴이 안 보일 때 코가 이만큼 넘게 치우쳐 있으면 옆을 보는 것으로 본다 */
  turnLimit: number;
};

export const DEFAULT_ATTENTION_CONFIG: AttentionConfig = {
  yawLimit: 35,
  yawReturn: 25,
  awaySeconds: 1,
  absentSeconds: 1,
  bowedMargin: 0.08,
  bowedSeconds: 90,
  turnLimit: 0.6,
};

export type AttentionStatus = {
  attention: Attention;
  /** 얼굴은 안 보이지만 고개를 숙인 것으로 보고 자리에 있다고 판정하는 중이면 true */
  bowed: boolean;
  /** 지금 기준으로 삼는 고개 방향(도). 아직 얼굴을 본 적이 없으면 null */
  baselineYaw: number | null;
};

export type AttentionDetector = {
  face: FaceLandmarker;
  /** 몸 인식 모델. 이 기기에서 불러오지 못했으면 null */
  pose: PoseLandmarker | null;
};

/** 판정 간격(ms). 상태가 바로 바뀌어 보이도록 짧게 잡는다 */
export const CHECK_INTERVAL_MS = 300;

/** 기준 자세가 지금 자세를 따라가는 데 걸리는 시간(초). 고쳐 앉으면 이 정도 뒤에 새 자세가 기준이 된다 */
const BASELINE_SECONDS = 20;
/**
 * 숙인 정도의 기준은 가장 꼿꼿했던 자세에 맞춘다. 더 꼿꼿해지면 빨리, 숙이는 쪽으로는 아주 느리게만 따라간다.
 * 책을 오래 보는 동안 기준이 숙인 자세로 옮겨 가면 그 뒤로는 숙인 것을 알아보지 못하기 때문이다.
 */
const UPRIGHT_SECONDS = 5;
const BOWING_SECONDS = 2000;

/** 한 장면에서 찾는 사람 수. 뒤에 다른 사람이 있어도 가장 가까운 사람을 고르기 위해 여럿을 찾는다 */
const MAX_PEOPLE = 3;
/** 두 눈 사이가 화면 폭의 이 비율보다 좁으면 멀리 있는 다른 사람으로 보고 무시한다 */
const MIN_FACE_SPAN = 0.07;
/** 몸 크기가 화면 폭의 이 비율보다 작으면 멀리 있는 다른 사람으로 보고 무시한다 */
const MIN_BODY_SIZE = 0.18;
/** 몸의 점이 이 값보다 흐릿하게 잡히면 믿지 않는다 */
const MIN_VISIBILITY = 0.5;
/** 옆을 보다가 치우침이 기준보다 이만큼 더 줄어야 돌아온 것으로 본다. 경계에서 깜빡이지 않게 한다 */
const TURN_RETURN_GAP = 0.15;
/** 얼굴이 사라지던 순간 고개가 이만큼(도) 넘게 돌아가 있었으면 숙인 것이 아니라 돌린 것이다 */
const BOW_MAX_YAW = 20;

// 얼굴 그물망의 점 번호
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

// 몸의 점 번호
const BODY_NOSE = 0;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;

let detectorPromise: Promise<AttentionDetector> | null = null;

/** 판정 모델을 준비한다. 파일이 커서 카메라를 켠 직후에 미리 불러 둔다. */
export const loadAttention = () => {
  detectorPromise ??= (async () => {
    const { FaceLandmarker, PoseLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = { wasmLoaderPath: wasmLoaderUrl, wasmBinaryPath: wasmBinaryUrl };
    // GPU 를 못 쓰는 기기에서는 느리더라도 CPU 로 돌린다
    const withFallback = async <T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>) => {
      try {
        return await create('GPU');
      } catch {
        return await create('CPU');
      }
    };
    const face = await withFallback((delegate) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: faceModelUrl, delegate },
        runningMode: 'VIDEO',
        numFaces: MAX_PEOPLE,
        outputFacialTransformationMatrixes: true,
      }),
    );
    // 몸 인식이 없어도 얼굴 판정은 되므로 실패해도 넘어간다
    const pose = await withFallback((delegate) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: poseModelUrl, delegate },
        runningMode: 'VIDEO',
        numPoses: MAX_PEOPLE,
      }),
    ).catch(() => null);
    return { face, pose };
  })();
  detectorPromise.catch(() => {
    detectorPromise = null;
  });
  return detectorPromise;
};

const sampleFace = (face: FaceLandmarker, video: HTMLVideoElement): FaceSample | null => {
  const result = face.detectForVideo(video, performance.now());
  const { videoWidth, videoHeight } = video;

  // 카메라에 가장 크게 잡힌 얼굴이 공부하는 사람이다
  let best = -1;
  let span = 0;
  result.faceLandmarks.forEach((candidate, index) => {
    const width =
      Math.hypot(
        (candidate[LEFT_EYE_OUTER].x - candidate[RIGHT_EYE_OUTER].x) * videoWidth,
        (candidate[LEFT_EYE_OUTER].y - candidate[RIGHT_EYE_OUTER].y) * videoHeight,
      ) / videoWidth;
    if (width > span) {
      span = width;
      best = index;
    }
  });
  const points = result.faceLandmarks[best];
  const matrix = result.facialTransformationMatrixes?.[best]?.data;
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

  return { kind: 'face', yaw, pitch, down, span };
};

const sampleBody = (pose: PoseLandmarker, video: HTMLVideoElement): BodySample | null => {
  const result = pose.detectForVideo(video, performance.now());
  const { videoWidth, videoHeight } = video;

  let best: BodySample | null = null;
  result.landmarks.forEach((points) => {
    const at = (index: number) => ({
      x: points[index].x * videoWidth,
      y: points[index].y * videoHeight,
      seen: points[index].visibility >= MIN_VISIBILITY,
    });
    const nose = at(BODY_NOSE);
    const leftEar = at(LEFT_EAR);
    const rightEar = at(RIGHT_EAR);
    const leftShoulder = at(LEFT_SHOULDER);
    const rightShoulder = at(RIGHT_SHOULDER);
    if (!leftShoulder.seen && !rightShoulder.seen) return;

    const shoulders = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    // 몸을 옆으로 틀면 어깨 폭이 좁아 보이므로 머리에서 어깨까지의 길이도 함께 본다
    const shoulderSpan = Math.hypot(
      leftShoulder.x - rightShoulder.x,
      leftShoulder.y - rightShoulder.y,
    );
    const headDrop = Math.hypot(nose.x - shoulders.x, nose.y - shoulders.y);
    const size = Math.max(shoulderSpan, headDrop * 1.5) / videoWidth;

    const ears = { x: (leftEar.x + rightEar.x) / 2, y: (leftEar.y + rightEar.y) / 2 };
    const earSpan = Math.hypot(leftEar.x - rightEar.x, leftEar.y - rightEar.y);
    // 정면이나 숙인 자세에서는 코가 두 귀의 가운데에 오고, 옆을 보면 한쪽으로 크게 치우친다
    const turn = earSpan > 0 ? Math.abs(nose.x - ears.x) / earSpan : 0;

    // 코가 화면 밖에 있으면 모델이 짐작한 자리일 뿐이므로 머리가 안 보이는 것으로 친다
    const noseInFrame =
      points[BODY_NOSE].x >= 0 &&
      points[BODY_NOSE].x <= 1 &&
      points[BODY_NOSE].y >= 0 &&
      points[BODY_NOSE].y <= 1;
    const head = noseInFrame ? points[BODY_NOSE].visibility : 0;

    if (size >= MIN_BODY_SIZE && (best === null || size > best.size)) {
      best = { kind: 'body', size, turn, head };
    }
  });
  return best;
};

/** 영상의 지금 장면을 한 번 판정한다. 몸 인식은 얼굴이 안 보일 때만 돌린다. */
export const sampleAttention = (
  detector: AttentionDetector,
  video: HTMLVideoElement,
): AttentionSample =>
  sampleFace(detector.face, video) ?? (detector.pose ? sampleBody(detector.pose, video) : null);

/**
 * 판정 결과를 시각과 함께 이어 받아 지금 상태를 정한다.
 * hasBodyCheck 가 false 면 몸 인식을 쓸 수 없는 기기이므로, 숙인 채 얼굴이 사라진 경우를 시간으로만 기다린다.
 */
export const createAttentionTracker = (
  config: AttentionConfig = DEFAULT_ATTENTION_CONFIG,
  hasBodyCheck = true,
) => {
  let attention: Attention = 'present';
  let baselineYaw: number | null = null;
  let baselineDown: number | null = null;
  let lastDown: number | null = null;
  let seen = 0;
  let lastFaceAt: number | null = null;
  /** 고개를 돌리기 시작한 시각, 화면에 아무도 없게 된 시각(ms) */
  let turnedSince: number | null = null;
  let goneSince: number | null = null;
  /** 얼굴이 사라지던 순간에 숙이고 있었는지. 얼굴이 다시 보일 때까지 유지한다 */
  let wasBowing: boolean | null = null;
  /** 마지막으로 본 얼굴이 기준에서 벗어나 있던 각도(도) */
  let lastYawOff = 0;
  /** 얼굴 없이 몸만 보이는 동안 옆을 보고 있다고 판단했는지 */
  let bodyTurned = false;

  const noteFaceLost = () => {
    wasBowing ??=
      lastDown !== null &&
      baselineDown !== null &&
      lastDown - baselineDown > config.bowedMargin &&
      lastYawOff < BOW_MAX_YAW;
    return wasBowing;
  };

  const turned = (now: number) => {
    turnedSince ??= now;
    if (now - turnedSince >= config.awaySeconds * 1000) attention = 'looking-away';
  };

  return (sample: AttentionSample, now: number): AttentionStatus => {
    // 몸은 보여도 머리가 화면에 없으면 자리에서 일어난 것이므로 아무도 없는 것과 같게 본다
    if (sample === null || (sample.kind === 'body' && sample.head < MIN_VISIBILITY)) {
      const bowing = noteFaceLost();
      turnedSince = null;
      bodyTurned = false;
      goneSince ??= now;
      // 몸 인식이 있으면 사람이 없다는 것이 확인된 것이므로 숙임을 따로 기다리지 않는다
      const wait = !hasBodyCheck && bowing ? config.bowedSeconds : config.absentSeconds;
      if (now - goneSince >= wait * 1000) attention = 'absent';
      return {
        attention,
        bowed: !hasBodyCheck && bowing && attention !== 'absent',
        baselineYaw,
      };
    }

    goneSince = null;

    if (sample.kind === 'body') {
      // 사람은 있는데 얼굴이 안 보인다. 코가 한쪽으로 치우쳤으면 옆을 보는 것이고,
      // 치우치지 않았고 숙이다가 얼굴이 사라졌으면 책을 보는 것이다
      const limit = bodyTurned ? config.turnLimit - TURN_RETURN_GAP : config.turnLimit;
      bodyTurned = sample.turn > limit;
      const bowing = noteFaceLost() && !bodyTurned;
      if (bowing) {
        turnedSince = null;
        attention = 'present';
      } else {
        turned(now);
        if (attention === 'absent') attention = 'looking-away';
      }
      return { attention, bowed: bowing, baselineYaw };
    }

    wasBowing = null;
    bodyTurned = false;
    lastDown = sample.down;
    seen += 1;
    if (baselineYaw === null || baselineDown === null) {
      baselineYaw = sample.yaw;
      baselineDown = sample.down;
    }

    const limit = attention === 'looking-away' ? config.yawReturn : config.yawLimit;
    lastYawOff = Math.abs(sample.yaw - baselineYaw);
    if (lastYawOff > limit) {
      turned(now);
      if (attention === 'absent') attention = 'present';
    } else {
      turnedSince = null;
      attention = 'present';
      // 공부하는 자세일 때만 기준을 옮긴다. 다른 곳을 보는 자세가 기준이 되면 안 된다.
      // 처음 세 번은 평균으로 기준을 빨리 잡고, 그 뒤로는 흐른 시간만큼 천천히 따라간다
      const elapsed = lastFaceAt === null ? 0 : (now - lastFaceAt) / 1000;
      const follow = (seconds: number) => (seen <= 3 ? 1 / seen : 1 - Math.exp(-elapsed / seconds));
      baselineYaw += follow(BASELINE_SECONDS) * (sample.yaw - baselineYaw);
      baselineDown +=
        follow(sample.down < baselineDown ? UPRIGHT_SECONDS : BOWING_SECONDS) *
        (sample.down - baselineDown);
    }
    lastFaceAt = now;
    return { attention, bowed: false, baselineYaw };
  };
};
