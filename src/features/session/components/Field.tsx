import type { ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
}

/** 작은 회색 이름표와 그 아래 내용 한 묶음 */
export const Field = ({ label, children }: FieldProps) => {
  return (
    <div className='flex flex-col gap-2'>
      <div className='text-body-m-medium text-text-tertiary'>{label}</div>
      {children}
    </div>
  );
};
