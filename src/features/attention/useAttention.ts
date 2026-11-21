import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import {
  CHECK_INTERVAL_MS,
  createAttentionTracker,
  loadAttention,
  sampleAttention,
} from './attention';
import type { Attention } from './attention';

/**
 * 카메라 영상을 짧은 간격으로 판정해 자리에 있는지 알려 준다. 기록 중일 때만 enabled 를 켜면 배터리를 아낀다.
 * 모델을 아직 못 불렀거나 이 기기에서 돌릴 수 없으면 판정할 수 없으므로 null 을 돌려준다.
 */
export const useAttention = (videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) => {
  const [attention, setAttention] = useState<Attention | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    let cancelled = false;

    loadAttention()
      .then((detector) => {
        if (cancelled) return;
        const tracker = createAttentionTracker(undefined, detector.pose !== null);
        timer = window.setInterval(() => {
          const video = videoRef.current;
          // 화면이 가려져 있으면 영상이 멈춰 있으므로 판정하지 않는다
          if (document.hidden || !video || video.readyState < 2 || video.videoWidth === 0) return;
          try {
            setAttention(tracker(sampleAttention(detector, video), performance.now()).attention);
          } catch {
            setAttention(null);
          }
        }, CHECK_INTERVAL_MS);
      })
      .catch(() => setAttention(null));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, videoRef]);

  return enabled ? attention : null;
};
