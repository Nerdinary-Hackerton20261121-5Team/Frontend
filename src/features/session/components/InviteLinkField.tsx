import { useState } from 'react';
import { Input } from '@/shared/Input';
import { InputButton } from '@/shared/InputButton';
import { copyInviteLink, inviteLink } from '../inviteLink';
import { Field } from './Field';

interface InviteLinkFieldProps {
  code: string;
  onCopied?: () => void;
}

/** 초대 링크와 복사 버튼. 복사가 막힌 환경에서는 링크 칸을 길게 눌러 복사하라고 알려 준다. */
export const InviteLinkField = ({ code, onCopied }: InviteLinkFieldProps) => {
  const [copied, setCopied] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const copy = async () => {
    if (!(await copyInviteLink(code))) return setBlocked(true);
    setBlocked(false);
    setCopied(true);
    onCopied?.();
  };

  return (
    <Field label='초대 링크'>
      <Input
        readOnly
        value={inviteLink(code).replace(/^https?:\/\//, '')}
        aria-label='초대 링크'
        action={<InputButton onClick={copy}>{copied ? '복사됨' : '복사'}</InputButton>}
      />
      {blocked && (
        <p role='alert' className='mt-2 text-caption-medium text-status-away'>
          복사하지 못했어요. 링크를 길게 눌러 복사해 주세요.
        </p>
      )}
    </Field>
  );
};
