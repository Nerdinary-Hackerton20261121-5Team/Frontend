import { formatLongClock } from '../time';

interface PausedOverlayProps {
  /** 지금까지 기록된 시간(초) */
  focused: number;
}

/** 일시정지한 동안 화면을 어둡게 덮고 멈춘 시간을 보여 준다 */
export const PausedOverlay = ({ focused }: PausedOverlayProps) => {
  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center gap-[6px] bg-black/20 text-center text-text-on-brand'>
      <p className='text-body-m-regular'>일시정지 중</p>
      <p className='text-display'>{formatLongClock(focused)}</p>
      <p className='text-body-m-medium'>일시정지한 시간은 기록에 더하지 않아요</p>
    </div>
  );
};
