import { useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { shouldUseMock, useSessionDetail } from './api';
import { useMockJoins } from './mock';
import { useSessionStore } from './store';

/**
 * 시작을 기다리는 화면에서 쓴다. 서버의 인원과 단계를 계속 읽어 세션에 반영한다.
 * 방이 끝났거나 내 자리가 없어져 더는 읽을 수 없으면 gone 이 true 가 된다.
 */
export const useSessionSync = () => {
  const session = useSessionStore((state) => state.session);
  const syncRemote = useSessionStore((state) => state.syncRemote);
  const detail = useSessionDetail(session?.remote ?? null, session?.phase === 'lobby');

  useEffect(() => {
    if (detail.data) syncRemote(detail.data);
  }, [detail.data, syncRemote]);

  // TODO(mock): 서버 없이 흉내 낸 세션에서는 사람이 하나씩 들어오게 한다
  useMockJoins();

  // 토큰이 더는 통하지 않거나(401, 403) 세션이 지워진(404) 경우다
  const gone =
    detail.error instanceof ApiError &&
    [401, 403, 404].includes(detail.error.status) &&
    !shouldUseMock(detail.error);
  return { gone };
};
