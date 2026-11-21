import { useState } from 'react';
import { BottomSheet } from '@/shared/BottomSheet';
import { Input } from '@/shared/Input';
import { NAME_MAX } from '../limits';
import { SheetActions } from './SheetActions';

interface RenameSheetProps {
  initial: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

/** 함께하는 사람에게 보일 내 이름을 바꾸는 시트 */
export const RenameSheet = ({ initial, onClose, onSave }: RenameSheetProps) => {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();

  return (
    <BottomSheet open onClose={onClose} title='이름 바꾸기'>
      <p className='text-body-m-medium text-text-secondary'>
        함께하는 사람에게 이 이름으로 보여요.
      </p>
      <div className='flex flex-col gap-1'>
        <Input
          autoFocus
          aria-label='이름'
          value={name}
          maxLength={NAME_MAX}
          onChange={(event) => setName(event.target.value)}
        />
        <span className='self-end text-caption-regular text-text-tertiary'>
          {name.length}/{NAME_MAX}
        </span>
      </div>
      <SheetActions
        cancelLabel='취소'
        confirmLabel='저장'
        onCancel={onClose}
        onConfirm={() => onSave(trimmed)}
        confirmDisabled={trimmed === ''}
      />
    </BottomSheet>
  );
};
