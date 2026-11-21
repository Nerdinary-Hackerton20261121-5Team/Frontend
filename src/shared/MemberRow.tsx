import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const memberRow = cva(
  'flex w-full items-center justify-between gap-3 rounded-[8px] px-5 py-[14px] shadow-[0_4px_12px_rgba(50,59,71,0.08)]',
  {
    variants: {
      variant: {
        default: 'min-h-[56px] border border-border-default bg-bg-default text-text-primary',
        /** 초록 테두리로 강조한 줄 */
        highlighted: 'min-h-[56px] border border-brand-primary bg-bg-default text-text-primary',
        /** 아직 들어오지 않은 자리 */
        waiting: 'min-h-[54px] bg-bg-field text-text-tertiary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

interface MemberRowProps extends VariantProps<typeof memberRow> {
  name: string;
  /** 오른쪽에 붙일 것. 보통 상태 칩을 넣는다 */
  trailing?: ReactNode;
  className?: string;
}

/** 함께하는 사람 한 명을 보여 주는 줄. 왼쪽에 이름, 오른쪽에 상태가 온다. */
export const MemberRow = ({ name, variant, trailing, className }: MemberRowProps) => {
  return (
    <div className={cn(memberRow({ variant }), className)}>
      <span className='min-w-0 truncate text-body-m-medium'>{name}</span>
      {trailing}
    </div>
  );
};
