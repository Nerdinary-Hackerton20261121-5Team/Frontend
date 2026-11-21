import type { HTMLAttributes } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// Figma Components > Toast. 짧은 알림. light 소식 / dark 기다림·안내
const toastVariants = cva('inline-flex items-center rounded-full px-4 py-2.5 whitespace-nowrap', {
  variants: {
    type: {
      light:
        'bg-bg-surface text-body-m-bold text-text-primary drop-shadow-[0_4px_6px_rgba(0,0,0,0.04)]',
      dark: 'bg-bg-inverse text-body-m-medium text-text-on-brand drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]',
    },
  },
  defaultVariants: { type: 'light' },
});

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'light' | 'dark';
}

export const Toast = ({ type = 'light', className, ...rest }: ToastProps) => {
  return <div role='status' className={cn(toastVariants({ type }), className)} {...rest} />;
};
