import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Header } from '@/shared/Header';
import { useServerGreeting } from './api';

// 첫 화면이 정해지기 전까지 서버 연결을 확인하는 자리다. 실제 첫 화면으로 바꾼다.
export const HomePage = () => {
  const greeting = useServerGreeting();

  return (
    <>
      <Header title='5팀' />
      <main className='min-h-0 flex-1 overflow-y-auto'>
        {greeting.isPending && <LoadingView />}
        {greeting.isError && (
          <ErrorView message={greeting.error.message} onRetry={() => greeting.refetch()} />
        )}
        {greeting.isSuccess && (
          <div className='flex h-full flex-col items-center justify-center gap-2 px-8 text-center'>
            <p className='text-base font-semibold'>서버와 연결됐어요</p>
            <p className='text-sm text-text-secondary'>{greeting.data}</p>
          </div>
        )}
      </main>
    </>
  );
};
