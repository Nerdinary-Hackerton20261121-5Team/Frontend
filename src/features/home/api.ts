import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// 서버 연결 확인용. 새 기능은 이 파일을 본떠 features/{이름}/api.ts 에 타입과 훅을 만든다.
// 서버가 살아 있는지 알려 주는 /api/health 를 부른다. 이 주소는 공통 응답 형식을 쓰지 않는다.
export const useServerHealth = () => {
  return useQuery({
    queryKey: ['server-health'],
    queryFn: () => api.get<{ status: string }>('/api/health'),
  })
}
