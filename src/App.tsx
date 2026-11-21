import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { CameraTestPage } from '@/features/attention/CameraTestPage'
import { HomePage } from '@/features/home/HomePage'
import { SharedPreviewPage } from '@/features/shared-preview/SharedPreviewPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

// HashRouter 를 쓴다. 정적 호스팅과 앱(WebView) 어디서든 새로고침과 딥링크가 서버 설정 없이 동작한다.
export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* 카메라 판정 확인용. 서비스 흐름에서는 들어올 길이 없다 */}
          <Route path="/camera-test" element={<CameraTestPage />} />
          {/* shared 컴포넌트 확인용. 서비스 흐름에서는 들어올 길이 없다 */}
          <Route path="/shared-preview" element={<SharedPreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
