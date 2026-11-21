import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const avatarVariants = cva(
  'flex size-9 shrink-0 items-center justify-center rounded-full text-body-m-bold',
  {
    variants: {
      state: {
        joined: 'bg-brand-subtle text-brand-primary',
        waiting: 'bg-bg-subtle text-text-tertiary',
      },
    },
    defaultVariants: {
      state: 'joined',
    },
  },
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** 참가자 이름. 첫 글자만 보여 준다. */
  name: string;
  className?: string;
}

/** 참가자 원형 아바타. joined 는 들어온 사람, waiting 은 기다리는 중인 사람이다. */
export const Avatar = ({ name, state, className }: AvatarProps) => (
  <span role='img' aria-label={name} className={cn(avatarVariants({ state }), className)}>
    {Array.from(name)[0]}
  </span>
);
