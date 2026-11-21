import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@/shared/BottomSheet';
import { Input } from '@/shared/Input';
import { inviteCodeFrom } from '../inviteCode';
import { SheetActions } from './SheetActions';

interface JoinSheetProps {
  onClose: () => void;
}

/** 받은 초대 링크를 붙여 넣는 시트. 링크를 붙여 넣으면 바로 03-B 초대받은 입장으로 넘어간다 */
export const JoinSheet = ({ onClose }: JoinSheetProps) => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);

  const go = (value: string) => {
    const code = inviteCodeFrom(value);
    if (!code) return false;
    navigate(`/s/${code}`);
    return true;
  };

  return (
    <BottomSheet open onClose={onClose} title='세션 참여하기'>
      <p className='text-body-m-medium text-text-secondary'>받은 초대 링크를 붙여 넣어 주세요.</p>
      <div className='flex flex-col gap-1'>
        <Input
          autoFocus
          aria-label='초대 링크'
          placeholder='초대 링크'
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setInvalid(false);
          }}
          onPaste={(event) => {
            // 붙여 넣은 글이 초대 링크면 확인 버튼 없이 바로 넘어간다
            if (go(event.clipboardData.getData('text'))) event.preventDefault();
          }}
        />
        {invalid && (
          <p role='alert' className='text-caption-medium text-status-away'>
            초대 링크를 확인해 주세요.
          </p>
        )}
      </div>
      <SheetActions
        cancelLabel='취소'
        confirmLabel='참여하기'
        onCancel={onClose}
        onConfirm={() => setInvalid(!go(text))}
        confirmDisabled={text.trim() === ''}
      />
    </BottomSheet>
  );
};
