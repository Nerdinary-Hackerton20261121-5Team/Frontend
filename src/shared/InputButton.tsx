import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** 입력 칸 오른쪽에 붙는 작은 버튼. 예: 복사 */
export const InputButton = ({ className, children, ...rest }: InputButtonProps) => {
  return (
    <button
      type='button'
      className={cn(
        'inline-flex h-[29px] min-w-[66px] shrink-0 items-center justify-center rounded-[8px] bg-brand-primary px-3 text-body-m-medium whitespace-nowrap text-text-on-brand active:bg-brand-pressed disabled:bg-brand-disabled',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
