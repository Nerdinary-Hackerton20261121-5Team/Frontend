/** 고를 수 있는 인원과 퍼즐 조각 수 */
export const MEMBER_COUNTS = [4, 5, 6];
/** 한 사람이 맡는 조각 수. 서버가 정한 값이다 */
export const PIECES_PER_PERSON = 2;
/** 보일 이름의 최대 글자 수 */
export const NAME_MAX = 10;
/** 방을 만든 사람의 처음 이름. 대기실에서 바꿀 수 있다 */
export const HOST_NAME = '개설자';
/** 목표 시간으로 정할 수 있는 범위(분) */
// 서버의 최소 목표 시간(60초)에 맞춘다. 짧게 한 바퀴 돌려 볼 수 있다
export const GOAL_MIN = 1;
export const GOAL_MAX = 180;
/**
 * 채운 정도(0 에서 1)에 따른 조각의 흐림 세기. 칸 너비에 대한 비율이다.
 * 서버가 남의 조각을 흐릴 때 쓰는 공식(Back_End piece-blur.ts)과 같다. 10% 단위로 선명해지고,
 * 0% 는 칸 너비의 10% 로 알아볼 수 없고, 50% 는 2.8%, 80% 는 0.8%, 100% 는 선명하다. 서버 값을 바꾸면 여기도 같이 바꾼다.
 * 서버는 내 조각만 선명하게 주므로 내 조각에도 같은 세기를 걸어, 어느 기기에서 보아도 같은 그림이 되게 한다
 */
const BLUR_MAX = 48;
const BLUR_MIN = 2;
export const blurRatio = (restoration: number) => {
  const level = Math.floor(Math.min(Math.max(restoration, 0), 1) * 10 + 1e-9);
  // 다 채운 내 조각은 서버가 준 선명한 그림 그대로 보여 준다. 남에게 가는 그림은 서버가 BLUR_MIN 만큼만 흐린다
  if (level === 10) return 0;
  // 남은 비율의 제곱으로 줄인다. 절반을 넘기면 빠르게 선명해진다
  const remaining = (10 - level) / 10;
  return (BLUR_MIN + (BLUR_MAX - BLUR_MIN) * remaining * remaining) / 480;
};
/** 개설자가 다 모이기 전에 먼저 시작할 수 있는 최소 인원 */
export const EARLY_START_MIN = 4;
