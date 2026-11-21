import type { ReactNode } from 'react'

interface EmptyViewProps {
  title: string
  description?: string
  action?: ReactNode
}

/** 데이터가 하나도 없을 때. 다음에 할 행동을 action 으로 넣는다. */
export const EmptyView = ({ title, description, action }: EmptyViewProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4 w-full">{action}</div>}
    </div>
  )
}
