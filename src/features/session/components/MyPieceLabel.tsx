import { cn } from '@/lib/cn';
import { toPercent } from '../time';
import { ProgressRing } from './ProgressRing';

interface MyPieceLabelProps {
  progress: number;
  away: boolean;
  left: number;
  top: number;
}

/** 내 조각 위에 붙는 이름표. 자리를 비우면 주황색으로 바뀐다 */
export const MyPieceLabel = ({ progress, away, left, top }: MyPieceLabelProps) => {
  return (
    <p
      style={{ left, top }}
      className={cn(
        'absolute flex items-center gap-[6px] rounded-full bg-bg-surface py-[5px] pr-[10px] pl-[6px] text-caption-medium whitespace-nowrap shadow-[0_2px_10px_rgba(0,0,0,0.12)]',
        away ? 'text-status-away' : 'text-text-primary',
      )}
    >
      <ProgressRing size={18} value={progress} tone={away ? 'away' : 'brand'} />
      {away ? '자리 비움' : '내 조각'} {toPercent(progress)}%
    </p>
  );
};
