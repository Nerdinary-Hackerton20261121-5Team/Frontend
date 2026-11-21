import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

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
})

interface ToastProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {}

export const Toast = ({ variant, className, ...rest }: ToastProps) => (
  <div role="status" className={cn(toastVariants({ variant }), className)} {...rest} />
)
