// 카메라 영상에서 자리에 있는지, 다른 곳을 보는지를 기기 안에서만 판정한다. 영상은 저장하거나 보내지 않는다.

import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import modelUrl from '@/assets/models/face_landmarker.task?url';

export type Attention = 'present' | 'absent' | 'looking-away';

/** 판정 한 번의 결과. 얼굴이 없으면 null, 있으면 고개의 좌우 각도(도) */
export type AttentionSample = { yaw: number } | null;

/** 공부하던 방향에서 이만큼 넘게 고개가 돌아가면 다른 곳을 보는 것으로 본다 */
const YAW_LIMIT = 35;
/** 처음 몇 번의 고개 방향을 공부하는 자세의 기준으로 삼는다 */
const BASELINE_SAMPLES = 3;
/** 같은 결과가 이만큼 이어져야 상태를 바꾼다. 잠깐 고개를 돌린 것을 딴짓으로 보지 않기 위해서다 */
const ABSENT_STREAK = 3;
const AWAY_STREAK = 5;

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
        numFaces: 1,
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
export const sampleAttention = (landmarker: FaceLandmarker, video: HTMLVideoElement) => {
  const result = landmarker.detectForVideo(video, performance.now());
  const matrix = result.facialTransformationMatrixes?.[0]?.data;
  if (result.faceLandmarks.length === 0 || !matrix) return null;
  // 4x4 변환 행렬(열 우선)에서 고개의 좌우 회전을 꺼낸다
  const yaw = (Math.atan2(matrix[8], matrix[10]) * 180) / Math.PI;
  return { yaw } satisfies AttentionSample;
};

/** 판정 결과를 이어 받아 지금 상태를 정한다. */
export const createAttentionTracker = () => {
  const baseline: number[] = [];
  let state: Attention = 'present';
  let candidate: Attention = 'present';
  let streak = 0;

  return (sample: AttentionSample): Attention => {
    let seen: Attention = 'present';
    if (sample === null) {
      seen = 'absent';
    } else if (baseline.length < BASELINE_SAMPLES) {
      baseline.push(sample.yaw);
    } else {
      const sorted = [...baseline].sort((a, b) => a - b);
      const usual = sorted[Math.floor(sorted.length / 2)];
      if (Math.abs(sample.yaw - usual) > YAW_LIMIT) seen = 'looking-away';
    }

    if (seen === candidate) streak += 1;
    else {
      candidate = seen;
      streak = 1;
    }
    const needed = seen === 'present' ? 1 : seen === 'absent' ? ABSENT_STREAK : AWAY_STREAK;
    if (streak >= needed) state = seen;
    return state;
  };
};
