import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface BottomSheetProps {
  open: boolean;
  /** 시트 바깥을 누르거나 Esc 를 눌렀을 때 */
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** 화면 아래에서 올라오는 시트. 뒤 화면을 어둡게 덮고, 위에 손잡이가 있고 제목 아래에 내용을 넣는다. */
export const BottomSheet = ({ open, onClose, title, children, className }: BottomSheetProps) => {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 mx-auto flex w-full max-w-[402px] flex-col justify-end bg-black/20'>
      <button type='button' aria-label='닫기' onClick={onClose} className='min-h-0 flex-1' />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={cn(
          'flex flex-col items-center gap-[14px] rounded-t-[20px] bg-bg-default px-5 pt-3 pb-[max(48px,calc(env(safe-area-inset-bottom)+14px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]',
          className,
        )}
      >
        <div className='h-1 w-10 shrink-0 rounded-[2px] bg-border-default' />
        <div className='flex w-full flex-col gap-3'>
          {title && <h2 className='text-title-m text-text-primary'>{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
};
