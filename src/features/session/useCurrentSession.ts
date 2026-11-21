import { useParams } from 'react-router';
import { useSessionStore } from './store';

/** 주소의 초대 코드와 같은 세션에 들어가 있으면 그 세션을, 아니면 null 을 돌려준다 */
export const useCurrentSession = () => {
  const { code = '' } = useParams();
  const session = useSessionStore((state) => state.session);
  return { code, session: session && session.code === code ? session : null };
};
