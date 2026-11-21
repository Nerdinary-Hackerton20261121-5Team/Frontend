import { useState } from 'react';
import { Input } from '@/shared/Input';
import { InputButton } from '@/shared/InputButton';
import { copyInviteLink, inviteLink } from '../inviteLink';
import { Field } from './Field';

interface InviteLinkFieldProps {
  code: string;
  onCopied?: () => void;
}

/** 초대 링크와 복사 버튼. 복사가 막힌 브라우저에서는 링크 칸을 길게 눌러 직접 복사할 수 있다. */
export const InviteLinkField = ({ code, onCopied }: InviteLinkFieldProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!(await copyInviteLink(code))) return;
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
    </Field>
  );
};
