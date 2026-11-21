const pad = (value: number) => String(value).padStart(2, '0');

/** 32:10 */
export const formatClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 60))}:${pad(Math.floor(seconds % 60))}`;

/** 00:32:10 */
export const formatLongClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(Math.floor(seconds % 60))}`;

/** 90 을 "1분 30초" 로. 분으로 떨어지면 "2분", 1분이 안 되면 "45초" */
export const formatDuration = (seconds: number) => {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (minutes === 0) return `${rest}초`;
  return rest === 0 ? `${minutes}분` : `${minutes}분 ${rest}초`;
};

/** 0.64 를 64 로 */
export const toPercent = (ratio: number) => Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
