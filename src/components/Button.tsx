import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  /** 요청 중이면 true. 버튼을 막고 문구를 바꾼다. */
  loading?: boolean
}

export const Button = ({
  variant = 'primary',
  loading,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) => {
  const style =
    variant === 'primary'
      ? 'bg-brand-primary text-text-on-brand active:bg-brand-pressed'
      : 'bg-transparent text-brand-primary active:bg-bg-subtle'
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`h-12 w-full rounded-xl px-4 text-base font-semibold disabled:opacity-40 ${style} ${className}`}
      {...rest}
    >
      {loading ? '처리 중…' : children}
    </button>
  )
}
