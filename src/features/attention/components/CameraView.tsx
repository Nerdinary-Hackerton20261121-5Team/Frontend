import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useCameraStore } from '../camera';

interface CameraViewProps {
  className?: string;
  /** 얼굴 확인에 쓸 수 있게 video 요소를 밖으로 내보낸다 */
  videoRef?: RefObject<HTMLVideoElement | null>;
}

/** 켜져 있는 카메라 영상을 거울처럼 보여 준다. 나에게만 보인다. */
export const CameraView = ({ className = '', videoRef }: CameraViewProps) => {
  const stream = useCameraStore((state) => state.stream);
  const innerRef = useRef<HTMLVideoElement | null>(null);
  const ref = videoRef ?? innerRef;

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [ref, stream]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={`-scale-x-100 object-cover ${className}`}
    />
  );
};
