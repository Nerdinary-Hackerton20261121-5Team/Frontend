import { cn } from '@/lib/cn';

interface ProgressRingProps {
  /** 지름(px) */
  size: number;
  /** 0 에서 1 */
  value: number;
  tone?: 'brand' | 'away';
  /** 채워지지 않은 부분의 색 */
  trackClassName?: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 9;

/** 얼마나 채웠는지 보여 주는 작은 고리 */
export const ProgressRing = ({
  size,
  value,
  tone = 'brand',
  trackClassName = 'stroke-brand-subtle',
}: ProgressRingProps) => {
  const filled = Math.min(Math.max(value, 0), 1) * CIRCUMFERENCE;
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' className='shrink-0 -rotate-90' aria-hidden>
      <circle cx='12' cy='12' r='9' fill='none' strokeWidth='5' className={trackClassName} />
      <circle
        cx='12'
        cy='12'
        r='9'
        fill='none'
        strokeWidth='5'
        strokeLinecap='round'
        strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        className={cn(tone === 'away' ? 'stroke-status-away' : 'stroke-brand-primary')}
      />
    </svg>
  );
};
