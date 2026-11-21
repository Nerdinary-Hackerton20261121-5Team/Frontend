import type { RefObject } from 'react';
import { CameraView } from '@/features/attention/components/CameraView';
import { cn } from '@/lib/cn';
import { formatClock } from '../time';

interface StudyHudProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 기록된 시간(초) */
  focused: number;
  goalMinutes: number;
  memberCount: number;
  away: boolean;
  onOpenPeople: () => void;
}

/** 공부 화면 사진 아래의 막대. 내 카메라, 기록된 시간, 함께하는 사람 수가 있다. */
export const StudyHud = ({
  videoRef,
  focused,
  goalMinutes,
  memberCount,
  away,
  onOpenPeople,
}: StudyHudProps) => {
  const ratio = Math.min(focused / (goalMinutes * 60), 1);
  return (
    <div className='mx-5 mt-[18px] mb-[calc(32px+env(safe-area-inset-bottom))] flex h-[68px] shrink-0 items-center gap-3 rounded-[22px] bg-bg-surface py-2 pr-4 pl-2'>
      <div className='relative h-[52px] w-10 shrink-0 overflow-hidden rounded-[12px] bg-bg-inverse'>
        <CameraView videoRef={videoRef} className='size-full' />
        <span
          className={cn(
            'absolute top-1 right-1 size-2 rounded-full border-[1.5px] border-brand-subtle',
            away ? 'bg-status-away' : 'bg-brand-primary',
          )}
        />
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-[5px]'>
        <p className='flex items-end gap-1'>
          <span className='text-title-m text-brand-primary'>{formatClock(focused)}</span>
          <span className='pb-0.5 text-caption-regular text-text-tertiary'>/ {goalMinutes}분</span>
        </p>
        <div className='h-1 overflow-hidden rounded-[2px] bg-brand-disabled'>
          <div
            className='h-full rounded-[2px] bg-brand-primary'
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <span className='h-7 w-px shrink-0 bg-brand-disabled' />
      <button
        type='button'
        onClick={onOpenPeople}
        className='flex shrink-0 items-center gap-1 text-body-m-medium text-text-secondary'
      >
        <span className='size-[7px] rounded-full bg-brand-primary' />
        {memberCount}명 함께
      </button>
    </div>
  );
};
