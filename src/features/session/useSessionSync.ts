import { useEffect } from 'react';
import { useSessionDetail } from './api';
import { useMockJoins } from './mock';
import { useSessionStore } from './store';

/** 시작을 기다리는 화면에서 쓴다. 서버의 인원과 단계를 계속 읽어 세션에 반영한다. */
export const useSessionSync = () => {
  const session = useSessionStore((state) => state.session);
  const syncRemote = useSessionStore((state) => state.syncRemote);
  const detail = useSessionDetail(session?.remote ?? null, session?.phase === 'lobby');

  useEffect(() => {
    if (detail.data) syncRemote(detail.data);
  }, [detail.data, syncRemote]);

  // TODO(mock): 서버 없이 흉내 낸 세션에서는 사람이 하나씩 들어오게 한다
  useMockJoins();
};
