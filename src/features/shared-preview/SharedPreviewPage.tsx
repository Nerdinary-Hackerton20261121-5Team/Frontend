import { useState } from 'react';
import { BottomSheet } from '@/shared/BottomSheet';
import { Input } from '@/shared/Input';
import { InputButton } from '@/shared/InputButton';
import { MemberRow } from '@/shared/MemberRow';
import { Progress } from '@/shared/Progress';

const STEPS = [1, 2, 3, 4];

/** shared 컴포넌트를 Figma 와 나란히 놓고 보는 확인용 화면. 주소는 /#/shared-preview 이고 서비스 흐름에는 들어가지 않는다. */
export const SharedPreviewPage = () => {
  const [name, setName] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copyResult, setCopyResult] = useState('');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyResult(`복사했어요: ${text}`);
    } catch {
      setCopyResult('복사하지 못했어요');
    }
  };
  // Figma 의 MemberRow 예시에 들어 있는 상태 칩. StatusChip 컴포넌트가 생기면 그것으로 바꾼다
  const chip = (
    <span className='shrink-0 rounded-full bg-status-info-bg px-[10px] py-1 text-caption-medium text-status-info'>
      기록 중
    </span>
  );

  return (
    <div className='mx-auto flex min-h-dvh w-full max-w-[393px] flex-col gap-8 bg-bg-default px-5 py-8'>
      <section className='flex flex-col gap-5'>
        <h2 className='text-caption-medium text-text-secondary'>Progress</h2>
        {STEPS.map((step) => (
          <Progress key={step} step={step} />
        ))}
      </section>

      <section className='flex flex-col gap-4'>
        <h2 className='text-caption-medium text-text-secondary'>Input</h2>
        <Input
          placeholder='이름을 입력해 주세요'
          value={name}
          onChange={(event) => setName(event.target.value)}
          action={
            <InputButton disabled={name === ''} onClick={() => void copy(name)}>
              복사
            </InputButton>
          }
        />
        <Input
          readOnly
          value='focus.app/s/8f2k'
          action={<InputButton onClick={() => void copy('focus.app/s/8f2k')}>복사</InputButton>}
        />
        {copyResult && <p className='text-caption-medium text-text-secondary'>{copyResult}</p>}
        <Input placeholder='버튼 없는 입력 칸' />
      </section>

      <section className='flex flex-col gap-4'>
        <h2 className='text-caption-medium text-text-secondary'>MemberRow</h2>
        <MemberRow name='ㄴㅇ' trailing={chip} />
        <MemberRow name='ㄴㅇ' variant='waiting' trailing={chip} />
        <MemberRow name='ㄴㅇ' variant='highlighted' trailing={chip} />
      </section>

      <section className='flex flex-col gap-4'>
        <h2 className='text-caption-medium text-text-secondary'>BottomSheet</h2>
        <button
          type='button'
          onClick={() => setSheetOpen(true)}
          className='h-12 rounded-[8px] bg-brand-primary text-body-l-bold text-text-on-brand'
        >
          시트 열기
        </button>
      </section>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title='시트 제목'>
        <p className='text-body-m-medium text-text-secondary'>여기에 목록이나 버튼을 넣으세요</p>
      </BottomSheet>
    </div>
  );
};
