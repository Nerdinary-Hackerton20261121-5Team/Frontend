import { useState } from 'react';
import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/cn';

interface BottomSheetProps {
  open: boolean;
  /** 시트를 끌어내리거나, 바깥을 누르거나, Esc 를 눌렀을 때. 내려가는 애니메이션이 끝난 뒤 부른다. */
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** 화면 아래에서 올라오는 시트. 뒤 화면을 어둡게 덮고, 위에 손잡이가 있고 제목 아래에 내용을 넣는다. 아래로 끌어내려 닫는다. */
export const BottomSheet = ({ open, onClose, title, children, className }: BottomSheetProps) => {
  // 부모가 onClose 에서 시트를 바로 없애도 내려가는 애니메이션이 보이도록, 애니메이션이 끝날 때까지 닫힌 상태만 먼저 그린다.
  const [closing, setClosing] = useState(false);

  return (
    <Drawer.Root
      open={open && !closing}
      onOpenChange={(next) => {
        if (!next) setClosing(true);
      }}
      onAnimationEnd={(isOpen) => {
        if (isOpen) return;
        setClosing(false);
        onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 z-50 mx-auto max-w-[402px] bg-black/20' />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] max-w-[402px] flex-col items-center gap-[14px] rounded-t-[20px] bg-bg-default px-5 pt-3 pb-[max(48px,calc(env(safe-area-inset-bottom)+14px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] outline-none',
            className,
          )}
        >
          <div className='h-1 w-10 shrink-0 rounded-[2px] bg-border-default' />
          {/* 내용이 길면 이 안에서 스크롤한다. 바깥 여백은 안쪽 그림자가 잘리지 않게 넓힌 것이다. */}
          <div className='-mx-5 -mt-2 -mb-4 flex min-h-0 flex-col gap-3 self-stretch overflow-y-auto overscroll-contain px-5 pt-2 pb-4'>
            {/* 화면 읽기 프로그램이 시트 이름을 읽도록 제목이 없어도 Title 을 둔다 */}
            <Drawer.Title className={title ? 'text-title-m text-text-primary' : 'sr-only'}>
              {title}
            </Drawer.Title>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
