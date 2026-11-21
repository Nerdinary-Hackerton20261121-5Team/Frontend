import { Button } from './Button'

interface ErrorViewProps {
  message: string
  onRetry?: () => void
}

/** 요청이 실패했을 때. 다시 시도할 수 있게 한다. */
export const ErrorView = ({ message, onRetry }: ErrorViewProps) => {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center"
    >
      <p className="text-base font-semibold">문제가 생겼어요</p>
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <div className="mt-4 w-full">
          <Button variant="ghost" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  )
}
