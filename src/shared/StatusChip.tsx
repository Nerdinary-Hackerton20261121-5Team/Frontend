import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Figma Components > StatusChip
// recording 기록 중 / away 자리 비움·멈춤 / info 카메라 OK / neutral 대기 / overlay 사진 위 표시
const statusChipVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-caption-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        recording: 'bg-status-recording-bg text-status-recording',
        away: 'bg-status-away-bg text-status-away',
        info: 'bg-status-info-bg text-status-info',
        neutral: 'bg-bg-subtle text-text-body',
        overlay: 'bg-overlay-dim text-text-on-brand',
      },
    },
    defaultVariants: {
      variant: 'recording',
    },
  },
)

interface StatusChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusChipVariants> {}

export const StatusChip = ({ variant, className, ...rest }: StatusChipProps) => (
  <span className={cn(statusChipVariants({ variant }), className)} {...rest} />
)
