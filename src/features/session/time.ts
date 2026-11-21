/** 시연할 때 시간을 빨리 흐르게 한다. 주소 맨 뒤가 아니라 # 앞에 ?speed=30 을 붙이면 1초에 30초가 흐른다. */
export const SPEED = Math.max(
  1,
  Number(new URLSearchParams(window.location.search).get('speed')) || 1,
);

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
