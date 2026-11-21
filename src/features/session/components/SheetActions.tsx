interface SheetActionsProps {
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

/** 시트 아래에 나란히 놓는 두 버튼. 왼쪽은 회색, 오른쪽은 초록이다. */
export const SheetActions = ({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled,
}: SheetActionsProps) => {
  return (
    <div className='flex gap-2'>
      <button
        type='button'
        onClick={onCancel}
        className='h-14 flex-1 rounded-[8px] bg-bg-subtle text-body-l-medium text-text-body'
      >
        {cancelLabel}
      </button>
      <button
        type='button'
        onClick={onConfirm}
        disabled={confirmDisabled}
        className='h-14 flex-1 rounded-[8px] bg-brand-primary text-body-l-medium text-text-on-brand active:bg-brand-pressed disabled:bg-brand-disabled'
      >
        {confirmLabel}
      </button>
    </div>
  );
};
