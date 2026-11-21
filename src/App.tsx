import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router';
import { NotFoundPage } from '@/components/NotFoundPage';
import { CameraTestPage } from '@/features/attention/CameraTestPage';
import { ExamplePage } from '@/features/example/ExamplePage';
import { SkipButton } from '@/features/session/components/SkipButton';
import { CameraPage } from '@/features/session/pages/CameraPage';
import { ClosedPage } from '@/features/session/pages/ClosedPage';
import { EntryPage } from '@/features/session/pages/EntryPage';
import { GoalPage } from '@/features/session/pages/GoalPage';
import { InvitePage } from '@/features/session/pages/InvitePage';
import { JoinPage } from '@/features/session/pages/JoinPage';
import { LobbyPage } from '@/features/session/pages/LobbyPage';
import { PhotoPage } from '@/features/session/pages/PhotoPage';
import { ResultPage } from '@/features/session/pages/ResultPage';
import { SizePage } from '@/features/session/pages/SizePage';
import { StudyPage } from '@/features/session/pages/StudyPage';

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
            <Route path='/' element={<EntryPage />} />
            {/* 세션 만들기. 사진을 올리고 인원과 조각 수를 정한다 */}
            <Route path='/new/photo' element={<PhotoPage />} />
            <Route path='/new/size' element={<SizePage />} />
            {/* 초대 링크의 주소. 초대받은 사람은 여기로 들어와 이름을 정한다 */}
            <Route path='/s/:code' element={<JoinPage />} />
            <Route path='/s/:code/closed' element={<ClosedPage />} />
            <Route path='/s/:code/invite' element={<InvitePage />} />
            <Route path='/s/:code/goal' element={<GoalPage />} />
            <Route path='/s/:code/camera' element={<CameraPage />} />
            <Route path='/s/:code/lobby' element={<LobbyPage />} />
            <Route path='/s/:code/study' element={<StudyPage />} />
            <Route path='/s/:code/result' element={<ResultPage />} />
            {/* 공통 컴포넌트를 눌러 보는 화면. 개발할 때만 열린다 */}
            {import.meta.env.DEV && <Route path='/example' element={<ExamplePage />} />}
            {/* 카메라 판정 확인용. 서비스 흐름에서는 들어올 길이 없다 */}
            <Route path='/camera-test' element={<CameraTestPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Routes>
          {/* TODO(skip): 테스트용 건너뛰기 버튼. 시연 전에 지운다 */}
          <SkipButton />
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};
