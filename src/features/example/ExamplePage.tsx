import { useState } from 'react';
import { Avatar } from '@/shared/Avatar';
import { BottomSheet } from '@/shared/BottomSheet';
import { Button } from '@/shared/Button';
import { Header } from '@/shared/Header';
import { Input } from '@/shared/Input';
import { InputButton } from '@/shared/InputButton';
import { MemberRow } from '@/shared/MemberRow';
import { Progress } from '@/shared/Progress';

const variants = ['primary', 'secondary', 'strong'] as const;
const steps = [1, 2, 3, 4];
const inviteLink = 'focus.app/s/8f2k';

// Figma 대기실 화면의 예시 값
const members = [
  { name: '홍길동(나)', status: '카메라 OK', waiting: false },
  { name: '비둘기', status: '카메라 OK', waiting: false },
  { name: '누렁이', status: '카메라 OK', waiting: false },
  { name: '콩떡', status: '기다리는 중...', waiting: true },
];

// MemberRow 오른쪽에 들어가는 상태 칩. StatusChip 컴포넌트가 합쳐지면 그것으로 바꾼다
const chip = (label: string) => (
  <span className='shrink-0 rounded-full bg-status-info-bg px-[10px] py-1 text-caption-medium text-status-info'>
    {label}
  </span>
);

/** 공통 컴포넌트를 눌러 보는 확인용 화면. 서비스 흐름에서는 들어올 길이 없다. */
export const ExamplePage = () => {
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`복사한 글자 ${text}`);
    } catch {
      setCopied('복사하지 못했어요');
    }
  };

  const count = (key: string) => setClicks((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));

  const submit = () => {
    count('loading');
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      <Header title='공통 컴포넌트' />
      <main className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5'>
        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>Header</h2>
          <Header title='세션 만들기' back onBack={() => count('back')} />
          <Header title='세션 만들기' />
          <p className='text-caption-regular text-text-secondary'>
            뒤로가기 누른 횟수 {clicks.back ?? 0}
          </p>
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>Avatar</h2>
          <div className='flex gap-4'>
            <Avatar name='비둘기' />
            <Avatar name='비둘기' state='waiting' />
          </div>
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>Button</h2>
          {variants.map((variant) => (
            <div key={variant} className='flex flex-col gap-1'>
              <Button variant={variant} disabled={disabled} onClick={() => count(variant)}>
                세션 만들기
              </Button>
              <p className='text-caption-regular text-text-secondary'>
                {variant} · 누른 횟수 {clicks[variant] ?? 0}
              </p>
            </div>
          ))}
          <label className='flex items-center gap-2 text-body-m-medium text-text-body'>
            <input
              type='checkbox'
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            모두 비활성
          </label>
        </section>

        <section className='flex flex-col gap-1'>
          <h2 className='text-title-m text-text-primary'>Button loading</h2>
          <Button loading={loading} onClick={submit}>
            저장하기
          </Button>
          <p className='text-caption-regular text-text-secondary'>
            누른 횟수 {clicks.loading ?? 0} · 1.5초 동안 다시 누를 수 없다
          </p>
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>Progress</h2>
          {steps.map((step) => (
            <Progress key={step} step={step} />
          ))}
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>Input</h2>
          <Input
            placeholder='이름을 입력해 주세요'
            value={name}
            onChange={(e) => setName(e.target.value)}
            action={
              <InputButton disabled={name === ''} onClick={() => void copy(name)}>
                복사
              </InputButton>
            }
          />
          <Input
            readOnly
            value={inviteLink}
            action={<InputButton onClick={() => void copy(inviteLink)}>복사</InputButton>}
          />
          <Input placeholder='버튼 없는 입력 칸' />
          <p className='text-caption-regular text-text-secondary'>
            {copied || '복사를 누르면 여기에 결과가 보인다'}
          </p>
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>MemberRow</h2>
          <MemberRow name='비둘기' trailing={chip('카메라 OK')} />
          <MemberRow name='비둘기' variant='highlighted' trailing={chip('카메라 OK')} />
          <MemberRow name='콩떡' variant='waiting' trailing={chip('기다리는 중...')} />
          <p className='text-caption-regular text-text-secondary'>
            default · highlighted · waiting
          </p>
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-title-m text-text-primary'>BottomSheet</h2>
          <Button variant='secondary' onClick={() => setSheetOpen(true)}>
            시트 열기
          </Button>
          <p className='text-caption-regular text-text-secondary'>
            아래로 끌어내리거나, 바깥을 누르거나, Esc 를 누르면 닫힌다
          </p>
        </section>
      </main>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title='함께하는 사람'>
        {members.map((member) => (
          <MemberRow
            key={member.name}
            name={member.name}
            variant={member.waiting ? 'waiting' : 'default'}
            trailing={chip(member.status)}
          />
        ))}
      </BottomSheet>
    </>
  );
};
