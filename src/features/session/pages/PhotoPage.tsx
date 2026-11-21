import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Toast } from '@/shared/Toast';
import { Accent } from '../components/Accent';
import { PhotoPicker } from '../components/PhotoPicker';
import { PhotoReady } from '../components/PhotoReady';
import { StepLayout } from '../components/StepLayout';
import { getPickedPhoto, setPickedPhoto } from '../pickedPhoto';
import { useSessionStore } from '../store';

/** 서버가 받는 사진 크기의 한도 */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * 02 사진 올리기. 퍼즐로 만들 사진을 고르고 확인한다.
 * 서버는 방을 만든 뒤에만 사진을 받으므로, 여기서는 고른 사진을 들고 있다가 방을 만들 때 올린다.
 */
export const PhotoPage = () => {
  const navigate = useNavigate();
  const preview = useSessionStore((state) => state.draft.photoUrl);
  const setPhoto = useSessionStore((state) => state.setPhoto);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!failed) return;
    const timer = window.setTimeout(() => setFailed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [failed]);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // 사진이 아니거나 너무 큰 파일은 서버가 받지 않는다
    if (!file.type.startsWith('image/') || file.size > MAX_BYTES) {
      setFailed(true);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPickedPhoto(file);
    setPhoto(URL.createObjectURL(file));
    setFailed(false);
  };

  const openPicker = () => inputRef.current?.click();
  // 새로고침으로 파일이 사라졌으면 다시 고르게 한다
  const ready = preview !== null && getPickedPhoto() !== null;

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={1}
      title={
        ready ? (
          <>
            <Accent>사진</Accent>이 준비됐어요
          </>
        ) : (
          <>
            퍼즐로 만들 <Accent>사진</Accent>을 올려요
          </>
        )
      }
      description={
        ready ? '퍼즐 크기에 맞게 자동으로 맞췄어요,' : '캐릭터 그림이나 사진 1장을 골라 주세요.'
      }
      footer={
        <>
          {failed && (
            <Toast variant='dark' alert className='self-center bg-brand-strong text-body-m-bold'>
              업로드에 실패했어요. 다른 사진을 골라 주세요.
            </Toast>
          )}
          {ready && (
            <Button variant='secondary' onClick={openPicker}>
              다른 사진 고르기
            </Button>
          )}
          <Button disabled={!ready} onClick={() => navigate('/new/size')}>
            다음으로
          </Button>
        </>
      }
    >
      <input ref={inputRef} type='file' accept='image/*' hidden onChange={pick} />
      <div className='flex flex-col gap-3'>
        {ready ? <PhotoReady src={preview} /> : <PhotoPicker onPick={openPicker} />}
        {!ready && (
          <p className='text-caption-medium text-text-tertiary'>
            이 사진으로 만든 결과가 함께하는 사람에게 보여요.
            <br />
            사용 권한이 있는 사진만 올려 주세요.
          </p>
        )}
      </div>
    </StepLayout>
  );
};
