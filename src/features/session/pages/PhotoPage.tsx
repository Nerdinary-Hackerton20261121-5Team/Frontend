import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { InfoBox } from '@/shared/InfoBox';
import { Toast } from '@/shared/Toast';
import { useUploadPhoto } from '../api';
import { Accent } from '../components/Accent';
import { PhotoPicker } from '../components/PhotoPicker';
import { PhotoReady } from '../components/PhotoReady';
import { PhotoUploading } from '../components/PhotoUploading';
import { StepLayout } from '../components/StepLayout';
import { useSessionStore } from '../store';

const FILTER_NOTICE =
  '사진에 웃긴 필터가 랜덤으로 씌워져요.\n어떤 필터인지는 퍼즐을 다 맞추면 공개돼요!';

/** 02 사진 올리기. 사진을 골라 서버에 올리고, 올라간 사진을 확인한다. */
export const PhotoPage = () => {
  const navigate = useNavigate();
  const setPhoto = useSessionStore((state) => state.setPhoto);
  const upload = useUploadPhoto();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [failed, setFailed] = useState(false);

  // 서버가 진행률을 알려 주지 않아서, 올리는 동안 막대가 천천히 차오르게만 한다
  useEffect(() => {
    if (!upload.isPending) return;
    const timer = window.setInterval(() => setPercent((value) => value + (92 - value) * 0.12), 200);
    return () => window.clearInterval(timer);
  }, [upload.isPending]);

  useEffect(() => {
    if (!failed) return;
    const timer = window.setTimeout(() => setFailed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [failed]);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setPercent(0);
    setFailed(false);
    upload.mutate(file, {
      onSuccess: (image) => setPhoto(image.url),
      onError: () => {
        setPhoto(null);
        setPreview(null);
        setFailed(true);
      },
    });
  };

  const openPicker = () => inputRef.current?.click();
  const ready = upload.isSuccess && preview !== null;

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
        {ready ? (
          <PhotoReady src={preview} />
        ) : upload.isPending && preview ? (
          <PhotoUploading src={preview} percent={Math.round(percent)} />
        ) : (
          <PhotoPicker onPick={openPicker} />
        )}
        <InfoBox>{FILTER_NOTICE}</InfoBox>
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
