import { ProgressRing } from './ProgressRing';

interface CellRingProps {
  /** 이 조각을 맡은 사람이 채운 비율(0~1) */
  value: number;
  away: boolean;
  left: number;
  top: number;
}

/** 다른 사람 조각의 왼쪽 위에 붙는 작은 고리 */
export const CellRing = ({ value, away, left, top }: CellRingProps) => {
  return (
    <span
      style={{ left, top }}
      className='absolute flex size-[34px] items-center justify-center rounded-full border border-white/15 bg-black/55'
    >
      <ProgressRing
        size={22}
        value={value}
        tone={away ? 'away' : 'brand'}
        trackClassName='stroke-white/25'
      />
    </span>
  );
};
