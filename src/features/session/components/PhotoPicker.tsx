import plusIcon from '@/assets/icons/plus.svg';

interface PhotoPickerProps {
  onPick: () => void;
}

/** 아직 사진을 고르지 않았을 때의 큰 버튼 */
export const PhotoPicker = ({ onPick }: PhotoPickerProps) => {
  return (
    <button
      type='button'
      onClick={onPick}
      className='flex h-[260px] w-full flex-col items-center justify-center gap-[10px] rounded-[8px] border border-dashed border-border-default bg-bg-field'
    >
      <span className='flex size-14 items-center justify-center rounded-full bg-bg-subtle'>
        <img src={plusIcon} alt='' width={24} height={24} />
      </span>
      <span className='text-body-m-medium text-text-secondary'>사진 올리기</span>
    </button>
  );
};
