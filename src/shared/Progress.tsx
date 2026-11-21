import { cn } from '@/lib/cn';

interface ProgressProps {
  /** 지금 단계. 1부터 센다 */
  step: number;
  /** 전체 단계 수 */
  total?: number;
  className?: string;
}

/** 여러 단계 중 어디까지 왔는지 보여 주는 가는 막대. */
export const Progress = ({ step, total = 4, className }: ProgressProps) => {
  const current = Math.min(Math.max(step, 0), total);

  return (
    <div
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cn('h-1 w-full overflow-hidden rounded-[2px] bg-bg-subtle', className)}
    >
      <div
        className='h-full rounded-[2px] bg-icon-brand'
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
};
