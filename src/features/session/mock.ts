// TODO(mock): 세션 서버 API(만들기, 입장, 조회, 진행 상황, 조립)가 아직 배포되지 않았다.
// 그때까지 함께하는 사람을 여기서 흉내 낸다. API 가 생기면 이 파일과 store 의 mock 표시 부분을 바꾼다.
import { useEffect } from 'react';
import { MOCK_NAMES } from './mockData';
import { gridFor, ownerRow, pieceTotal } from './puzzle';
import { useSessionStore } from './store';

/** 대기 중인 자리에 사람이 하나씩 들어오게 한다 */
export const useMockJoins = () => {
  useEffect(() => {
    const timer = window.setInterval(() => {
      const { session, addMember } = useSessionStore.getState();
      // 서버에 만들어진 세션은 실제로 들어온 사람만 보여 준다
      if (!session || session.remote || session.phase !== 'lobby') return;
      const taken = session.members.map((member) => member.name);
      const next = MOCK_NAMES.find((name) => !taken.includes(name));
      if (next && session.members.some((member) => !member.joined)) addMember(next);
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);
};

/** 다른 사람이 자기 조각을 하나씩 끼우게 한다 */
export const useMockAssembly = () => {
  useEffect(() => {
    const timer = window.setInterval(() => {
      const { session, placed, placePiece } = useSessionStore.getState();
      if (!session || session.phase !== 'assembly') return;
      const grid = gridFor(session.pieceCount, session.members.length);
      for (let index = 0; index < pieceTotal(grid); index += 1) {
        const owner = session.members[ownerRow(index, grid)];
        if (!placed.includes(index) && !owner.isMe) {
          placePiece(index, owner.name);
          return;
        }
      }
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);
};
