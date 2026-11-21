import { cn } from '@/lib/cn';
import { toPercent } from '../time';
import type { Member } from '../types';
import { ProgressRing } from './ProgressRing';

interface RowMarkersProps {
  members: Member[];
  /** 한 줄의 높이(px) */
  rowHeight: number;
  away: boolean;
}

/** 퍼즐의 줄마다 왼쪽에 붙는 표시. 내 줄에는 채운 비율이 글자로, 다른 줄에는 고리만 보인다. */
export const RowMarkers = ({ members, rowHeight, away }: RowMarkersProps) => {
  return (
    <>
      {members.map((member, row) =>
        member.isMe ? (
          <p
            key={member.id}
            style={{ top: (row + 0.5) * rowHeight }}
            className={cn(
              'absolute left-[14px] flex -translate-y-1/2 items-center gap-[6px] rounded-full bg-bg-surface py-[5px] pr-[10px] pl-[6px] text-caption-medium shadow-[0_2px_10px_rgba(0,0,0,0.12)]',
              away ? 'text-status-away' : 'text-brand-strong',
            )}
          >
            <ProgressRing size={18} value={member.progress} tone={away ? 'away' : 'brand'} />
            {away ? '자리 비움' : '내 조각'} {toPercent(member.progress)}%
          </p>
        ) : (
          <span
            key={member.id}
            style={{ top: (row + 0.5) * rowHeight }}
            className='absolute left-[5px] flex size-[34px] -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55'
          >
            <ProgressRing
              size={22}
              value={member.progress}
              tone={member.status === 'away' ? 'away' : 'brand'}
              trackClassName='stroke-white/25'
            />
          </span>
        ),
      )}
    </>
  );
};
