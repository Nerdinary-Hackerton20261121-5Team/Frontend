import checkIcon from '@/assets/icons/check.svg';

interface PhotoReadyProps {
  src: string;
}

/** 사진이 올라간 뒤. 퍼즐 판 비율로 자른 모습을 보여 준다. */
export const PhotoReady = ({ src }: PhotoReadyProps) => {
  return (
    <div className='relative flex h-[330px] w-full items-center justify-center rounded-[8px] bg-bg-subtle'>
      <img
        src={src}
        alt='올린 사진'
        className='h-[300px] w-[138px] rounded-[8px] object-cover shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
      />
      <span className='absolute top-6 flex items-center gap-[6px] rounded-full bg-bg-default py-[6px] pr-3 pl-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'>
        <span className='flex size-[18px] items-center justify-center rounded-full bg-brand-primary'>
          <img src={checkIcon} alt='' width={12} height={12} />
        </span>
        <span className='text-body-m-bold text-brand-strong'>업로드 완료</span>
      </span>
    </div>
  );
};
