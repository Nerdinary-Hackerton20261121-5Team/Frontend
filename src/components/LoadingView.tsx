/** 목록이나 상세를 불러오는 동안 보여 준다. */
export const LoadingView = () => {
  return (
    <div role="status" className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
      <span className="size-8 animate-spin rounded-full border-4 border-border-default border-t-brand-primary" />
      <p className="text-sm">불러오는 중…</p>
    </div>
  )
}
