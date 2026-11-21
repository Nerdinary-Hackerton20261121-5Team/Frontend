import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'flex h-14 w-full items-center justify-center rounded-[8px] px-4 text-body-l-bold tracking-[-0.24px] text-text-on-brand transition-[filter] duration-150 enabled:hover:brightness-95 enabled:active:brightness-90 disabled:border-transparent disabled:bg-brand-disabled disabled:text-text-on-brand',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary',
        secondary: 'border border-brand-primary text-brand-primary',
        strong: 'bg-brand-strong',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 요청 중이면 true. 버튼을 막고 문구를 바꾼다. */
  loading?: boolean
}

export const Button = ({
  variant,
  loading,
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(buttonVariants({ variant }), className)}
    {...rest}
  >
    {loading ? '처리 중…' : children}
  </button>
)
