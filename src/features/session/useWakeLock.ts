import { useEffect } from 'react';

/** 켜져 있는 동안 화면이 저절로 꺼지지 않게 한다. 지원하지 않는 브라우저에서는 아무 일도 하지 않는다. */
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (cancelled) void sentinel.release();
          else lock = sentinel;
        })
        // 배터리 절약 모드 등으로 거절되면 그냥 둔다
        .catch(() => undefined);
    };
    // 다른 앱에 다녀오면 풀리므로 돌아왔을 때 다시 건다
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
};
