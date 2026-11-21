import closeIcon from '@/assets/icons/close-brand.svg';
import recordIcon from '@/assets/icons/record.svg';

interface DoneActionsProps {
  /** 방을 정리하는 중인지 */
  ending: boolean;
  onHome: () => void;
  onOpenRecord: () => void;
}

/** 09-B 완성 확인. 사진을 가리지 않게 아래 양 끝에 작은 버튼만 둔다. */
export const DoneActions = ({ ending, onHome, onOpenRecord }: DoneActionsProps) => (
  <div className='absolute inset-x-5 bottom-[max(44px,calc(env(safe-area-inset-bottom)+14px))] flex items-end justify-between'>
    <button
      type='button'
      aria-label='처음으로'
      disabled={ending}
      onClick={onHome}
      className='flex size-11 items-center justify-center rounded-full bg-bg-surface shadow-[0_6px_16px_rgba(0,0,0,0.25)] disabled:opacity-60'
    >
      <img src={closeIcon} alt='' className='size-3' />
    </button>
    <button
      type='button'
      onClick={onOpenRecord}
      className='flex h-[42px] items-center gap-2 rounded-full bg-bg-surface pr-4 pl-3 text-body-m-bold text-brand-primary shadow-[0_6px_16px_rgba(0,0,0,0.25)]'
    >
      <img src={recordIcon} alt='' className='size-[22px]' />내 기록
    </button>
  </div>
);
