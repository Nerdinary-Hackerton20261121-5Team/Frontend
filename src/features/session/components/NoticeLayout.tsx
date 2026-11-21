import type { ReactNode } from 'react';

interface NoticeLayoutProps {
  /** 가운데 연두 원 안에 넣는 아이콘 */
  icon: ReactNode;
  title: string;
  description: string;
  /** 아래에 놓는 버튼들 */
  footer: ReactNode;
}

/** 더 진행할 수 없을 때 보여 주는 화면. 가운데에 안내가 있고 아래에 버튼이 있다. */
export const NoticeLayout = ({ icon, title, description, footer }: NoticeLayoutProps) => {
  return (
    <>
      <main className='flex min-h-0 flex-1 flex-col items-center justify-center gap-7 overflow-y-auto px-5'>
        <div className='flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-subtle'>
          {icon}
        </div>
        <div className='flex flex-col gap-3 text-center'>
          <h1 className='text-title-l text-text-primary'>{title}</h1>
          <p className='text-body-m-medium whitespace-pre-line text-text-secondary'>
            {description}
          </p>
        </div>
      </main>
      <footer className='flex shrink-0 flex-col gap-4 px-5 pt-2 pb-[calc(22px+env(safe-area-inset-bottom))]'>
        {footer}
      </footer>
    </>
  );
};
