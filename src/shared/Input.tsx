import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 입력 칸 오른쪽에 붙일 것. 보통 InputButton 을 넣는다 */
  action?: ReactNode;
}

/** 한 줄 입력 칸. 글자를 넣는 동안 초록 테두리가 생긴다. */
export const Input = ({ action, className, ...rest }: InputProps) => {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-[10px] rounded-[12px] bg-bg-field px-4 py-[10px] ring-brand-primary ring-inset focus-within:ring-1',
        className,
      )}
    >
      <input
        className='h-[29px] min-w-0 flex-1 bg-transparent text-body-m-medium text-text-body caret-brand-primary outline-none placeholder:text-text-tertiary'
        {...rest}
      />
      {action}
    </div>
  );
};
