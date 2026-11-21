import { create } from 'zustand';
import { MOCK_INVITE, mockPhoto } from './mockData';
import { randomFilterId } from './photoFilters';
import type { Member, Session, TickMode, Timeline } from './types';

// 세션을 만드는 동안 고른 값과, 들어가 있는 세션의 상태를 한곳에서 들고 있는다.
// TODO(mock): 세션 서버 API 가 생기면 createSession, joinAsGuest, addMember, tick 의 다른 사람 부분을 서버 값으로 바꾼다.

type Draft = { photoUrl: string | null; memberCount: number; pieceCount: number };

const EMPTY_TIMELINE: Timeline = { elapsed: 0, focused: 0, away: 0, hidden: 0, paused: 0 };

const member = (id: string, name: string, extra: Partial<Member> = {}): Member => ({
  id,
  name,
  isMe: false,
  isHost: false,
  joined: name !== '',
  progress: 0,
  status: 'recording',
  ...extra,
});

const emptySeats = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, index) => member(`seat-${from + index}`, ''));

const randomCode = () => Math.random().toString(36).slice(2, 6);

interface SessionStore {
  draft: Draft;
  session: Session | null;
  timeline: Timeline;
  paused: boolean;
  /** 제자리에 끼운 조각 번호 */
  placed: number[];
  /** 마지막으로 조각을 끼운 사람. 알림에 쓴다 */
  lastPlacedBy: string | null;

  setPhoto: (photoUrl: string | null) => void;
  setSize: (memberCount: number, pieceCount: number) => void;
  /** 고른 값으로 세션을 만들고 초대 코드를 돌려준다 */
  createSession: () => string;
  /** 초대 링크로 들어온 사람이 이름을 정하고 들어간다 */
  joinAsGuest: (code: string, name: string) => void;
  rename: (name: string) => void;
  setGoal: (minutes: number) => void;
  addMember: (name: string) => void;
  /** 지금 들어온 사람으로 명단을 굳히고 공부를 시작한다 */
  start: () => void;
  /** 시간을 seconds 만큼 흘려보낸다. mode 에 따라 어디에 쌓일지가 달라진다 */
  tick: (seconds: number, mode: TickMode) => void;
  setPaused: (paused: boolean) => void;
  /** 공부를 끝내고 퍼즐 맞추기로 넘어간다 */
  finishStudy: () => void;
  placePiece: (index: number, by: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  draft: { photoUrl: null, memberCount: 6, pieceCount: 12 },
  session: null,
  timeline: EMPTY_TIMELINE,
  paused: false,
  placed: [],
  lastPlacedBy: null,

  setPhoto: (photoUrl) => set((state) => ({ draft: { ...state.draft, photoUrl } })),

  setSize: (memberCount, pieceCount) =>
    set((state) => ({ draft: { ...state.draft, memberCount, pieceCount } })),

  createSession: () => {
    const { draft } = get();
    const code = randomCode();
    set({
      session: {
        code,
        photoUrl: draft.photoUrl ?? mockPhoto(),
        filterId: randomFilterId(),
        memberCount: draft.memberCount,
        pieceCount: draft.pieceCount,
        goalMinutes: 50,
        members: [
          member('me', '개설자', { isMe: true, isHost: true }),
          ...emptySeats(1, draft.memberCount),
        ],
        phase: 'lobby',
      },
      timeline: EMPTY_TIMELINE,
      paused: false,
      placed: [],
      lastPlacedBy: null,
    });
    return code;
  },

  joinAsGuest: (code, name) => {
    const others = [MOCK_INVITE.hostName, ...MOCK_INVITE.joinedNames];
    set({
      session: {
        code,
        photoUrl: mockPhoto(),
        filterId: randomFilterId(),
        memberCount: MOCK_INVITE.memberCount,
        pieceCount: 12,
        goalMinutes: 50,
        members: [
          ...others.map((other, index) => member(`mock-${index}`, other, { isHost: index === 0 })),
          member('me', name, { isMe: true }),
          ...emptySeats(others.length + 1, MOCK_INVITE.memberCount),
        ],
        phase: 'lobby',
      },
      timeline: EMPTY_TIMELINE,
      paused: false,
      placed: [],
      lastPlacedBy: null,
    });
  },

  rename: (name) =>
    set((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              members: state.session.members.map((each) => (each.isMe ? { ...each, name } : each)),
            },
          }
        : state,
    ),

  setGoal: (minutes) =>
    set((state) =>
      state.session ? { session: { ...state.session, goalMinutes: minutes } } : state,
    ),

  addMember: (name) =>
    set((state) => {
      if (!state.session) return state;
      const seat = state.session.members.findIndex((each) => !each.joined);
      if (seat === -1) return state;
      return {
        session: {
          ...state.session,
          members: state.session.members.map((each, index) =>
            index === seat ? { ...each, name, joined: true } : each,
          ),
        },
      };
    }),

  start: () =>
    set((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              members: state.session.members.filter((each) => each.joined),
              phase: 'study',
            },
            timeline: EMPTY_TIMELINE,
            paused: false,
          }
        : state,
    ),

  tick: (seconds, mode) =>
    set((state) => {
      const { session } = state;
      if (!session || session.phase !== 'study') return state;
      const goal = session.goalMinutes * 60;
      const timeline = {
        ...state.timeline,
        elapsed: state.timeline.elapsed + seconds,
        [mode]: state.timeline[mode] + seconds,
      };
      const members = session.members.map((each): Member => {
        if (each.isMe) {
          return {
            ...each,
            progress: Math.min(timeline.focused / goal, 1),
            status: mode === 'focused' ? 'recording' : mode === 'paused' ? 'paused' : 'away',
          };
        }
        // 다른 사람은 대체로 자리를 지키다가 가끔 비운다
        const leaves = each.status === 'recording' ? Math.random() < 0.03 : Math.random() > 0.2;
        const status = leaves ? 'away' : 'recording';
        const gained = status === 'recording' ? seconds / goal : 0;
        return { ...each, status, progress: Math.min(each.progress + gained, 1) };
      });
      return {
        timeline,
        session: { ...session, members, phase: timeline.elapsed >= goal ? 'assembly' : 'study' },
      };
    }),

  setPaused: (paused) => set({ paused }),

  finishStudy: () =>
    set((state) =>
      state.session ? { session: { ...state.session, phase: 'assembly' }, paused: false } : state,
    ),

  placePiece: (index, by) =>
    set((state) =>
      state.placed.includes(index) ? state : { placed: [...state.placed, index], lastPlacedBy: by },
    ),

  reset: () =>
    set({
      draft: { photoUrl: null, memberCount: 6, pieceCount: 12 },
      session: null,
      timeline: EMPTY_TIMELINE,
      paused: false,
      placed: [],
      lastPlacedBy: null,
    }),
}));
