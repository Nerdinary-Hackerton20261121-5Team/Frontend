import { useState } from 'react';
import { Avatar } from '@/shared/Avatar';
import { Button } from '@/shared/Button';
import { Header } from '@/shared/Header';

const variants = ['primary', 'secondary', 'strong'] as const;

/** 공통 컴포넌트를 눌러 보는 확인용 화면. 서비스 흐름에서는 들어올 길이 없다. */
export const ExamplePage = () => {
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

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
      </main>
    </>
  );
};
