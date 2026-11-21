import type { ReactNode } from 'react';
import { Header } from '@/shared/Header';
import { Progress } from '@/shared/Progress';

interface StepLayoutProps {
  /** 헤더에 보이는 글자 */
  header: string;
  back?: boolean;
  /** 세션 만들기 4단계 중 지금 단계. 없으면 진행 막대를 그리지 않는다 */
  step?: number;
  title: ReactNode;
  description?: ReactNode;
  /** 화면 아래에 고정되는 버튼들 */
  footer?: ReactNode;
  children?: ReactNode;
}

/** 준비 단계 화면의 틀. 헤더, 진행 막대, 큰 제목과 설명, 아래 버튼 자리가 있다. */
export const StepLayout = ({
  header,
  back,
  step,
  title,
  description,
  footer,
  children,
}: StepLayoutProps) => {
  return (
    <>
      <Header title={header} back={back} />
      {step !== undefined && (
        <div className='relative -mt-0.5 shrink-0 px-5'>
          <Progress step={step} />
        </div>
      )}
      <main className='flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-[30px] pb-4'>
        <h2 className='text-title-l text-text-primary'>{title}</h2>
        {description && (
          <p className='mt-3 text-body-m-medium text-text-secondary'>{description}</p>
        )}
        <div className='mt-7 flex flex-col'>{children}</div>
      </main>
      {footer && (
        <footer className='flex shrink-0 flex-col gap-4 px-5 pt-2 pb-[calc(22px+env(safe-area-inset-bottom))]'>
          {footer}
        </footer>
      )}
    </>
  );
};
