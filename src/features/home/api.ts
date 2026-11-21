import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

// 서버 연결 확인용. 새 기능은 이 파일을 본떠 features/{이름}/api.ts 에 타입과 훅을 만든다.
export function useServerGreeting() {
  return useQuery({ queryKey: ['server-greeting'], queryFn: () => api.get<string>('/api') })
}
