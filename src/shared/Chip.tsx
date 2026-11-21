import type { ButtonHTMLAttributes } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// Figma Components > Chip (Default · Variant2=선택됨)
const chipVariants = cva(
  'inline-flex h-9 min-w-[72px] items-center justify-center rounded-full px-6 text-body-l-medium whitespace-nowrap',
  {
    variants: {
      selected: {
        false: 'bg-bg-subtle text-text-body',
        true: 'bg-brand-primary text-text-on-brand',
      },
    },
    defaultVariants: { selected: false },
  },
);

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = ({ selected = false, className, ...rest }: ChipProps) => {
  return (
    <button
      type='button'
      aria-pressed={selected}
      className={cn(chipVariants({ selected }), className)}
      {...rest}
    />
  );
};
