import { useRef } from 'react';
import userIcon from '@/assets/icons/user.svg';
import { CameraView } from '@/features/attention/components/CameraView';
import { useAttention } from '@/features/attention/useAttention';
import { StatusChip } from '@/shared/StatusChip';
import { MaskIcon } from './MaskIcon';

/** 05 카메라를 켠 뒤의 미리보기. 얼굴이 잡히면 아래에 알려 준다 */
export const CameraPreview = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const attention = useAttention(videoRef, true);

  return (
    <div className='relative h-[280px] overflow-hidden rounded-[8px] bg-bg-inverse'>
      <CameraView videoRef={videoRef} className='size-full' />
      <StatusChip variant='overlay' className='absolute top-3 left-3 gap-1'>
        <span className='size-1.5 rounded-full bg-status-away' />
        미리보기
      </StatusChip>
      {attention === 'present' && (
        <span className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-subtle px-3 py-1.5 text-body-m-medium whitespace-nowrap text-text-primary'>
          <MaskIcon src={userIcon} className='size-4 text-text-body' />내 얼굴이 보여요
        </span>
      )}
    </div>
  );
};
