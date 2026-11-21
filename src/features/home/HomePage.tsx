import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Header } from '@/shared/Header';
import { useServerHealth } from './api';

// 첫 화면이 정해지기 전까지 서버 연결을 확인하는 자리다. 실제 첫 화면으로 바꾼다.
export const HomePage = () => {
  const health = useServerHealth();

  return (
    <>
      <Header title='5팀' />
      <main className='min-h-0 flex-1 overflow-y-auto'>
        {health.isPending && <LoadingView />}
        {health.isError && (
          <ErrorView message={health.error.message} onRetry={() => health.refetch()} />
        )}
        {health.isSuccess && (
          <div className='flex h-full flex-col items-center justify-center px-8 text-center'>
            <p className='text-base font-semibold'>서버와 연결됐어요</p>
          </div>
        )}
      </main>
    </>
  );
};
