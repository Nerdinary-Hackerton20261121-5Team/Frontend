import { BottomSheet } from '@/shared/BottomSheet';
import { Button } from '@/shared/Button';
import { StatusChip } from '@/shared/StatusChip';
import { formatDuration } from '../time';
import type { Member } from '../types';
import { SheetActions } from './SheetActions';

interface PeopleSheetProps {
  members: Member[];
  goalMinutes: number;
  onClose: () => void;
  onPause: () => void;
  /** 모두의 공부를 끝낸다. 만든 사람에게만 준다 */
  onFinish?: () => void;
}

/** 07 함께하는 사람. 각자 지금 기록 중인지 보여 주고, 여기서 일시정지한다. 만든 사람은 모두의 공부를 끝낼 수도 있다. */
export const PeopleSheet = ({
  members,
  goalMinutes,
  onClose,
  onPause,
  onFinish,
}: PeopleSheetProps) => {
  return (
    <BottomSheet open onClose={onClose} title='함께 하는 사람'>
      {members.map((member) => (
        <div key={member.id} className='flex h-[26px] items-center justify-between gap-3'>
          <span className='min-w-0 truncate text-body-m-medium text-text-primary'>
            {member.isMe ? `나 (${member.name})` : member.name}
          </span>
          {member.status === 'recording' ? (
            <StatusChip variant='recording'>
              기록 중 · {formatDuration(member.progress * goalMinutes * 60)}째
            </StatusChip>
          ) : (
            <StatusChip variant='away'>
              {member.status === 'paused' ? '일시정지' : '자리비움'}
            </StatusChip>
          )}
        </div>
      ))}
      {onFinish ? (
        <SheetActions
          cancelLabel='일시정지'
          confirmLabel='종료'
          onCancel={onPause}
          onConfirm={onFinish}
        />
      ) : (
        <Button variant='secondary' onClick={onPause}>
          일시정지
        </Button>
      )}
    </BottomSheet>
  );
};
