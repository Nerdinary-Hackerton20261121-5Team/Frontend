interface PhotoUploadingProps {
  /** 고른 사진의 미리보기 주소 */
  src: string;
  percent: number;
}

/** 사진을 올리는 동안. 사진 위에 진행 정도를 겹쳐 보여 준다. */
export const PhotoUploading = ({ src, percent }: PhotoUploadingProps) => {
  return (
    <div className='relative h-[260px] w-full overflow-hidden rounded-[8px]'>
      <img src={src} alt='' className='size-full object-cover' />
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-[10px] bg-black/35'>
        <div className='flex flex-col items-center gap-1 text-text-on-brand'>
          <span className='text-title-m'>{percent}%</span>
          <span className='text-body-m-medium'>사진을 올리는 중이에요</span>
        </div>
        <div
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className='h-[6px] w-[200px] overflow-hidden rounded-[3px] bg-brand-disabled'
        >
          <div className='h-full rounded-[3px] bg-brand-primary' style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
};
