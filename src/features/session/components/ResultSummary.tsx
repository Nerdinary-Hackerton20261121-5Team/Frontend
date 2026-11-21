import { Button } from '@/shared/Button';
import { toMinutes, toPercent } from '../time';
import type { Timeline } from '../types';

interface ResultSummaryProps {
  timeline: Timeline;
  goalMinutes: number;
  onHome: () => void;
}

/** 퍼즐을 다 맞춘 뒤 아래에서 올라와 있는 요약. 시간이 어디에 쓰였는지 보여 준다. */
export const ResultSummary = ({ timeline, goalMinutes, onHome }: ResultSummaryProps) => {
  const rows = [
    {
      label: '화면에 둔 시간',
      value: `${toMinutes(timeline.focused)}분 / ${goalMinutes}분 · ${toPercent(timeline.focused / (goalMinutes * 60))}%`,
    },
    { label: '화면 밖', value: `${toMinutes(timeline.hidden)}분` },
    { label: '자리 비움', value: `${toMinutes(timeline.away)}분` },
    { label: '직접 일시정지', value: `${toMinutes(timeline.paused)}분` },
  ];

  return (
    <section className='absolute inset-x-0 bottom-0 flex flex-col items-center gap-[14px] rounded-t-[20px] bg-bg-default px-5 pt-3 pb-[max(48px,calc(env(safe-area-inset-bottom)+14px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]'>
      <div className='h-1 w-10 shrink-0 rounded-[2px] bg-border-default' />
      <div className='flex w-full flex-col gap-3'>
        <h2 className='text-title-m text-text-primary'>퍼즐이 완성되었어요</h2>
        <dl className='flex flex-col gap-2 rounded-[8px] bg-bg-surface px-4 py-[14px]'>
          {rows.map((row) => (
            <div key={row.label} className='flex items-center justify-between gap-3'>
              <dt className='text-body-m-medium text-text-secondary'>{row.label}</dt>
              <dd className='text-body-m-bold text-text-primary'>{row.value}</dd>
            </div>
          ))}
        </dl>
        <Button onClick={onHome}>처음으로</Button>
      </div>
    </section>
  );
};
