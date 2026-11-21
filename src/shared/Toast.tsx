import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// Figma Components > Toast. 짧은 알림. light 소식 / dark 기다림·안내
const toastVariants = cva('inline-flex items-center rounded-full px-4 py-2.5 whitespace-nowrap', {
  variants: {
    variant: {
      light:
        'bg-bg-surface text-body-m-bold text-text-primary drop-shadow-[0_4px_6px_rgba(0,0,0,0.04)]',
      dark: 'bg-bg-inverse text-body-m-medium text-text-on-brand drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]',
    },
  },
  defaultVariants: {
    variant: 'light',
  },
});

interface ToastProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  /** 왼쪽에 느낌표 아이콘을 붙인다. Figma Toast/업로드 실패 */
  alert?: boolean;
}

export const Toast = ({ variant, alert, className, children, ...rest }: ToastProps) => (
  <div
    role='status'
    className={cn(toastVariants({ variant }), alert && 'gap-2 pr-[18px]', className)}
    {...rest}
  >
    {alert && (
      <span
        aria-hidden
        className='flex size-[18px] shrink-0 items-center justify-center rounded-full bg-bg-surface text-[12px] leading-none font-bold text-brand-primary'
      >
        !
      </span>
    )}
    {children}
  </div>
);
