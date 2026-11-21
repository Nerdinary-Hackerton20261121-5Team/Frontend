import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { BottomSheet } from '@/shared/BottomSheet';
import { Button } from '@/shared/Button';
import { Input } from '@/shared/Input';
import { useJoinByCode } from '../api';
import { inviteCodeFrom } from '../inviteCode';

interface JoinSheetProps {
  onClose: () => void;
}

/** 01-1 참여 코드 입력. 서버에서 코드를 확인하면 03-B 초대받은 입장으로 넘어간다 */
export const JoinSheet = ({ onClose }: JoinSheetProps) => {
  const navigate = useNavigate();
  const join = useJoinByCode();
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = (value: string) => {
    // 초대 링크를 통째로 붙여 넣어도 코드만 꺼내 쓴다
    const code = inviteCodeFrom(value)?.toUpperCase();
    if (!code) return setInvalid(true);
    join.mutate(code, {
      onSuccess: () => navigate(`/s/${code}`),
      onError: () => setInvalid(true),
    });
  };

  // 코드가 틀린 경우는 입력 칸 아래 문구로, 서버에 닿지 못한 경우는 서버 메시지로 알린다
  const unreachable = join.error instanceof ApiError && join.error.status === 0;

  return (
    <BottomSheet open onClose={onClose} title='참여 코드를 입력해 주세요'>
      <p className='text-caption-medium text-text-secondary'>
        초대한 사람에게 받은 코드를 넣으면 바로 들어가요.
      </p>
      <div className='flex flex-col gap-1'>
        <Input
          autoFocus
          aria-label='참여 코드'
          aria-invalid={invalid}
          autoCapitalize='characters'
          autoComplete='off'
          value={text}
          className={cn(invalid && 'ring-1 ring-status-away focus-within:ring-status-away')}
          onChange={(event) => {
            setText(event.target.value);
            setInvalid(false);
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text');
            if (!inviteCodeFrom(pasted)) return;
            event.preventDefault();
            setText(pasted.trim());
            submit(pasted);
          }}
        />
        {invalid && (
          <p role='alert' className='px-1 text-caption-medium text-status-away'>
            {unreachable ? join.error?.message : '코드를 다시 확인해 주세요'}
          </p>
        )}
      </div>
      <Button
        disabled={text.trim() === '' || invalid}
        loading={join.isPending}
        onClick={() => submit(text)}
      >
        입장하기
      </Button>
    </BottomSheet>
  );
};
