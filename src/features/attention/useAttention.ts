import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { createAttentionTracker, loadAttention, sampleAttention } from './attention';
import type { Attention } from './attention';

const CHECK_INTERVAL_MS = 1000;

/**
 * 카메라 영상을 1초마다 판정해 자리에 있는지 알려 준다.
 * 모델을 아직 못 불렀거나 이 기기에서 돌릴 수 없으면 판정할 수 없으므로 null 을 돌려준다.
 */
export const useAttention = (videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) => {
  const [attention, setAttention] = useState<Attention | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    let cancelled = false;
    const track = createAttentionTracker();

    loadAttention()
      .then((landmarker) => {
        if (cancelled) return;
        timer = window.setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;
          try {
            setAttention(track(sampleAttention(landmarker, video)));
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
