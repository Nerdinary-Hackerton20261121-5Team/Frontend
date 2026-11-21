import { useState } from 'react';
import { BottomSheet } from '@/shared/BottomSheet';
import { GOAL_MAX, GOAL_MIN } from '../limits';
import { SheetActions } from './SheetActions';

interface TimeSheetProps {
  /** 처음에 보여 줄 값(분) */
  initial: number;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

/** 목표 시간을 숫자로 직접 넣는 시트. 열 때마다 새로 그려 처음 값에서 시작한다. */
export const TimeSheet = ({ initial, onClose, onSave }: TimeSheetProps) => {
  const [text, setText] = useState(String(initial));
  const minutes = Number(text);
  const valid = text !== '' && minutes >= GOAL_MIN && minutes <= GOAL_MAX;

  return (
    <BottomSheet open onClose={onClose} title='목표 시간 직접 입력'>
      <p className='text-body-m-medium text-text-secondary'>
        {GOAL_MIN}분부터 {GOAL_MAX}분(3시간)까지 입력할 수 있어요
      </p>
      <label className='flex h-[72px] items-center justify-center gap-[6px] rounded-[12px] border-[1.5px] border-brand-primary bg-brand-subtle px-4'>
        <input
          autoFocus
          inputMode='numeric'
          aria-label='목표 시간(분)'
          value={text}
          onChange={(event) => setText(event.target.value.replace(/\D/g, '').slice(0, 3))}
          style={{ width: `${Math.max(text.length, 1)}ch` }}
          className='bg-transparent text-center text-display text-text-primary caret-brand-primary outline-none'
        />
        <span className='pt-[14px] text-title-l text-text-primary'>분</span>
      </label>
      <SheetActions
        cancelLabel='취소'
        confirmLabel='저장'
        onCancel={onClose}
        onConfirm={() => onSave(minutes)}
        confirmDisabled={!valid}
      />
    </BottomSheet>
  );
};
