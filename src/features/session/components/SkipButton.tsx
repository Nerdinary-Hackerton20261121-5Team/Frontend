import { useLocation, useNavigate } from 'react-router';
import { MOCK_NAMES, mockPhoto } from '../mockData';
import { gridFor, pieceTotal } from '../puzzle';
import { useSessionStore } from '../store';

// TODO(skip): 테스트를 빨리 하려고 넣은 건너뛰기 버튼이다. 시연 전에 이 파일과 App.tsx 의 한 줄,
// StudyPage 의 SKIP_ENABLED 조건을 지운다.

/** 건너뛰기를 쓸 수 있는지. 운영 주소에서는 버튼을 숨긴다 */
export const SKIP_ENABLED = window.location.hostname !== 'cmc-11th.bemelon.me';

const STEPS = ['join', 'invite', 'goal', 'camera', 'lobby', 'study', 'result'];

/** 지금 화면에서 해야 할 일을 대신 채우고 다음 화면으로 넘어간다 */
export const SkipButton = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const placedCount = useSessionStore((state) => state.placed.length);

  const [, code, step = 'join'] = pathname.match(/^\/s\/([^/]+)(?:\/(\w+))?$/) ?? [];
  const total = session ? pieceTotal(gridFor(session.pieceCount, session.members.length)) : 0;
  const finished = step === 'result' && session?.phase === 'assembly' && placedCount === total;
  const known =
    ['/', '/new/photo', '/new/size', '/new/goal'].includes(pathname) || STEPS.includes(step);

  if (!SKIP_ENABLED || !known || (code === undefined && pathname.startsWith('/s/')) || finished) {
    return null;
  }

  const skip = () => {
    const store = useSessionStore.getState();
    if (pathname === '/') return navigate('/new/photo');
    if (pathname === '/new/photo') {
      if (!store.draft.photoUrl) store.setPhoto(mockPhoto());
      return navigate('/new/size');
    }
    if (pathname === '/new/size') return navigate('/new/goal');
    // 서버에 방을 만들지 않고 흉내 낸 세션으로 넘어간다
    if (pathname === '/new/goal') return navigate(`/s/${store.openAsHost(null)}/invite`);

    if (step === 'join') {
      if (!store.session) {
        store.openAsGuest(code, null, { photoUrl: null, pieceCount: null });
      }
      useSessionStore.getState().rename('테스트');
      return navigate(`/s/${code}/goal`);
    }
    if (step === 'invite' || step === 'goal') return navigate(`/s/${code}/camera`);
    if (step === 'camera') return navigate(`/s/${code}/lobby`);
    if (step === 'lobby') {
      const taken = store.session?.members.map((member) => member.name) ?? [];
      MOCK_NAMES.filter((name) => !taken.includes(name)).forEach(store.addMember);
      store.start();
      return navigate(`/s/${code}/study`);
    }
    if (step === 'study') return store.finishStudy();
    // 결과 화면에서는 남은 조각을 모두 끼운다
    for (let index = 0; index < total; index += 1) store.placePiece(index, '테스트');
  };

  return (
    <button
      type='button'
      onClick={skip}
      className='fixed top-[calc(8px+env(safe-area-inset-top))] right-2 z-[60] rounded-full bg-bg-inverse px-3 py-1 text-caption-medium text-text-on-brand opacity-80'
    >
      건너뛰기
    </button>
  );
};
