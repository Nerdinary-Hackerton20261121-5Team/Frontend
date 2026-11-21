import type { ReactNode } from 'react';

/** 제목에서 초록색으로 강조하는 말 */
export const Accent = ({ children }: { children: ReactNode }) => {
  return <span className='text-brand-primary'>{children}</span>;
};
