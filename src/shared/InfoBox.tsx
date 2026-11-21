import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// Figma Components > InfoBox. 연한 그린 안내 박스. 문구 안의 줄바꿈(\n)을 그대로 보여 준다
const infoBoxClass =
  'w-full rounded-[8px] border border-brand-primary bg-brand-subtle px-4 py-3.5 text-body-m-medium whitespace-pre-line text-brand-primary'

type InfoBoxProps = HTMLAttributes<HTMLDivElement>

export const InfoBox = ({ className, ...rest }: InfoBoxProps) => (
  <div className={cn(infoBoxClass, className)} {...rest} />
)
