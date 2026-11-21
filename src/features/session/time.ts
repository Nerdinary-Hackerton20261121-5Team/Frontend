const pad = (value: number) => String(value).padStart(2, '0');

/** 32:10 */
export const formatClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 60))}:${pad(Math.floor(seconds % 60))}`;

/** 00:32:10 */
export const formatLongClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(Math.floor(seconds % 60))}`;

export const toMinutes = (seconds: number) => Math.floor(seconds / 60);

/** 0.64 를 64 로 */
export const toPercent = (ratio: number) => Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
