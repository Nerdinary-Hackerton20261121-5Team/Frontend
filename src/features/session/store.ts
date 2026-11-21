import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SessionDetail, SessionEntry } from './api';
import { MOCK_INVITE, mockPhoto } from './mockData';
import type { Member, Session, TickMode, Timeline } from './types';

// 세션을 만드는 동안 고른 값과, 들어가 있는 세션의 상태를 한곳에서 들고 있는다.
// 새로고침해도 이어지도록 탭이 열려 있는 동안 sessionStorage 에 남긴다.
// TODO(mock): 서버가 주지 않는 값(다른 사람의 이름과 진행 상황, 조립)은 아직 여기서 흉내 낸다.

type Draft = {
  photoUrl: string | null;
  memberCount: number;
  pieceCount: number;
  goalMinutes: number;
};

/** 초대 링크에 실려 온 값. 서버가 아직 세션의 사진과 조각 수를 주지 않아 링크로 넘긴다 */
export type Invite = { photoUrl: string | null; pieceCount: number | null };

const EMPTY_DRAFT: Draft = { photoUrl: null, memberCount: 6, pieceCount: 12, goalMinutes: 50 };
const EMPTY_TIMELINE: Timeline = { elapsed: 0, focused: 0, away: 0, hidden: 0, paused: 0 };
const FRESH = { timeline: EMPTY_TIMELINE, paused: false, placed: [], lastPlacedBy: null };

const member = (id: string, name: string, extra: Partial<Member> = {}): Member => ({
  id,
  name,
  isMe: false,
  isHost: false,
  joined: true,
  progress: 0,
  status: 'recording',
  ...extra,
});

const emptySeats = (from: number, to: number) =>
  Array.from({ length: Math.max(to - from, 0) }, (_, index) =>
    member(`seat-${from + index}`, '', { joined: false }),
  );

const randomCode = () => Math.random().toString(36).slice(2, 6);

const remoteOf = (entry: SessionEntry | null) =>
  entry
    ? { sessionId: entry.sessionId, token: entry.participantToken, isCreator: entry.isCreator }
    : null;

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
  setDraftGoal: (minutes: number) => void;
  /** 고른 값으로 세션을 열고 초대 코드를 돌려준다. entry 가 없으면 서버 없이 흉내 낸 세션이다 */
  openAsHost: (entry: SessionEntry | null) => string;
  /** 초대 링크로 들어온 사람의 세션을 연다. 이름은 rename 으로 나중에 정한다 */
  openAsGuest: (code: string, entry: SessionEntry | null, invite: Invite) => void;
  /** 서버에서 읽은 인원, 목표 시간, 단계를 반영한다 */
  syncRemote: (detail: SessionDetail) => void;
  rename: (name: string) => void;
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

/** 대기실의 세션을 공부 중으로 바꾼다. 들어온 사람만 남긴다 */
const started = (session: Session): Session => ({
  ...session,
  members: session.members.filter((each) => each.joined),
  phase: 'study',
});

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      session: null,
      ...FRESH,

      setPhoto: (photoUrl) => set((state) => ({ draft: { ...state.draft, photoUrl } })),

      setSize: (memberCount, pieceCount) =>
        set((state) => ({ draft: { ...state.draft, memberCount, pieceCount } })),

      setDraftGoal: (goalMinutes) => set((state) => ({ draft: { ...state.draft, goalMinutes } })),

      openAsHost: (entry) => {
        const { draft } = get();
        const code = entry?.sessionCode ?? randomCode();
        set({
          session: {
            code,
            remote: remoteOf(entry),
            mySeat: 0,
            photoUrl: draft.photoUrl ?? mockPhoto(),
            memberCount: draft.memberCount,
            pieceCount: draft.pieceCount,
            goalMinutes: draft.goalMinutes,
            members: [
              member('me', '개설자', { isMe: true, isHost: true }),
              ...emptySeats(1, draft.memberCount),
            ],
            phase: 'lobby',
          },
          ...FRESH,
        });
        return code;
      },

      openAsGuest: (code, entry, invite) => {
        // 서버가 없으면 이미 몇 명이 들어와 있는 세션을 흉내 낸다
        const others = entry ? [] : [MOCK_INVITE.hostName, ...MOCK_INVITE.joinedNames];
        set({
          session: {
            code,
            remote: remoteOf(entry),
            mySeat: others.length,
            photoUrl: invite.photoUrl ?? mockPhoto(),
            memberCount: MOCK_INVITE.memberCount,
            pieceCount: invite.pieceCount ?? 12,
            goalMinutes: 50,
            members: [
              ...others.map((other, index) =>
                member(`mock-${index}`, other, { isHost: index === 0 }),
              ),
              member('me', '', { isMe: true }),
              ...emptySeats(others.length + 1, MOCK_INVITE.memberCount),
            ],
            phase: 'lobby',
          },
          ...FRESH,
        });
      },

      syncRemote: (detail) =>
        set((state) => {
          const { session } = state;
          if (!session?.remote || session.phase !== 'lobby') return state;
          const me = session.members.find((each) => each.isMe);
          if (!me) return state;
          const capacity = detail.maxParticipants ?? session.memberCount;
          // 서버는 다른 사람의 이름을 주지 않는다. 내가 들어온 순서를 기준으로 번호를 붙인다
          const mySeat = session.remote.isCreator
            ? 0
            : Math.min(session.mySeat || detail.participantCount - 1, detail.participantCount - 1);
          const known = new Map(session.members.map((each) => [each.id, each]));
          const joined = Array.from({ length: detail.participantCount }, (_, seat) => {
            if (seat === mySeat) return me;
            const id = `remote-${seat}`;
            return (
              known.get(id) ??
              member(id, `참가자 ${seat + 1}`, { isHost: !me.isHost && seat === 0 })
            );
          });
          const synced: Session = {
            ...session,
            mySeat,
            memberCount: capacity,
            goalMinutes: Math.max(1, Math.round(detail.goalSeconds / 60)),
            members: [...joined, ...emptySeats(joined.length, capacity)],
          };
          // 만든 사람이 시작했으면 기다리던 사람도 함께 넘어간다
          return detail.status === 'WAITING'
            ? { session: synced }
            : { session: started(synced), ...FRESH };
        }),

      rename: (name) =>
        set((state) =>
          state.session
            ? {
                session: {
                  ...state.session,
                  members: state.session.members.map((each) =>
                    each.isMe ? { ...each, name } : each,
                  ),
                },
              }
            : state,
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
          state.session?.phase === 'lobby' ? { session: started(state.session), ...FRESH } : state,
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
            session: {
              ...session,
              members,
              phase: timeline.elapsed >= goal ? 'assembly' : 'study',
            },
          };
        }),

      setPaused: (paused) => set({ paused }),

      finishStudy: () =>
        set((state) =>
          state.session?.phase === 'study'
            ? { session: { ...state.session, phase: 'assembly' }, paused: false }
            : state,
        ),

      placePiece: (index, by) =>
        set((state) =>
          state.placed.includes(index)
            ? state
            : { placed: [...state.placed, index], lastPlacedBy: by },
        ),

      reset: () => set({ draft: EMPTY_DRAFT, session: null, ...FRESH }),
    }),
    { name: 'session', storage: createJSONStorage(() => sessionStorage) },
  ),
);
