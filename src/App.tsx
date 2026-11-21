import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router';
import { NotFoundPage } from '@/components/NotFoundPage';
import { CameraTestPage } from '@/features/attention/CameraTestPage';
import { ExamplePage } from '@/features/example/ExamplePage';
import { HomePage } from '@/features/home/HomePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// HashRouter 를 쓴다. 정적 호스팅과 앱(WebView) 어디서든 새로고침과 딥링크가 서버 설정 없이 동작한다.
export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        {/* 모든 화면의 틀. 모바일 폭(최대 402px)으로 고정한다. 화면은 Header 와 main 을 직접 둔다. */}
        <div className='mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-y-auto bg-bg-default'>
          <Routes>
            {/* 로컬 개발에서는 서버 없이 공통 컴포넌트를 바로 보도록 example 을 첫 화면으로 띄운다 */}
            <Route path='/' element={import.meta.env.DEV ? <ExamplePage /> : <HomePage />} />
            {/* 카메라 판정 확인용. 서비스 흐름에서는 들어올 길이 없다 */}
            <Route path='/camera-test' element={<CameraTestPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};
