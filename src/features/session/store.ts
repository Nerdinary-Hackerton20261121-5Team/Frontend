import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BoardMember, BoardPiece, SessionDetail, SessionEntry } from './api';
import { HOST_NAME, PIECES_PER_PERSON } from './limits';
import type { Member, Session, TickMode, Timeline } from './types';

// 세션을 만드는 동안 고른 값과, 들어가 있는 세션의 상태를 한곳에서 들고 있는다.
// 새로고침해도 이어지도록 탭이 열려 있는 동안 sessionStorage 에 남긴다.

type Draft = {
  photoUrl: string | null;
  memberCount: number;
  pieceCount: number;
  goalMinutes: number;
  /** 방 만들기 요청 ID. 서버에 보내는 값(인원, 목표 시간)이 바뀌기 전까지 같은 값을 다시 쓴다 */
  requestId: string;
};

const freshDraft = (): Draft => ({
  photoUrl: null,
  memberCount: 6,
  pieceCount: 12,
  goalMinutes: 50,
  requestId: crypto.randomUUID(),
});
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

/** 서버 참가자 번호로 만든 명단 id */
export const remoteId = (participantId: number) => `p-${participantId}`;

/** 방의 사진을 받아 오기 전에 잠깐 보이는 빈 그림 */
const BLANK_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='4'%3E%3Crect width='3' height='4' fill='%23d9eee0'/%3E%3C/svg%3E";

const remoteOf = (entry: SessionEntry) => ({
  sessionId: entry.sessionId,
  token: entry.participantToken,
  isCreator: entry.isCreator,
});

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
  setMemberCount: (memberCount: number) => void;
  setDraftGoal: (minutes: number) => void;
  /** 서버에 만든 방으로 세션을 열고 초대 코드를 돌려준다 */
  openAsHost: (entry: SessionEntry, photoUrl: string | null) => string;
  /** 초대 링크로 들어온 사람의 세션을 연다. 이름은 rename 으로 나중에 정한다 */
  openAsGuest: (code: string, entry: SessionEntry) => void;
  /** 서버에서 읽은 인원, 목표 시간, 단계를 반영한다 */
  syncRemote: (detail: SessionDetail) => void;
  /** 서버 진행판의 자리 순서와 공개된 복원도를 반영한다 */
  syncBoard: (pieces: BoardPiece[]) => void;
  /** 서버 진행판의 명단(이름, 상태, 채운 정도)을 반영한다 */
  syncMembers: (members: BoardMember[]) => void;
  /** 서버 조립판에서 제자리에 놓인 조각을 반영한다 */
  syncAssembly: (placedIndexes: number[], ownerName: (index: number) => string) => void;
  rename: (name: string) => void;
  /** 지금 들어온 사람으로 명단을 굳히고 공부를 시작한다 */
  start: () => void;
  /** 시간을 seconds 만큼 흘려보낸다. mode 에 따라 어디에 쌓일지가 달라진다 */
  tick: (seconds: number, mode: TickMode) => void;
  /** 서버가 센 내 공부 시간(초)에 맞춘다. 이 기기에서 센 값이 벌어졌을 때만 고친다 */
  syncFocused: (seconds: number) => void;
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
      draft: freshDraft(),
      session: null,
      ...FRESH,

      setPhoto: (photoUrl) => set((state) => ({ draft: { ...state.draft, photoUrl } })),

      // 하나씩 바꾼다. 둘을 함께 받으면 빠르게 이어 누를 때 앞에서 고른 값이 옛 값으로 덮인다
      // 서버에 보내는 값이 바뀌면 다른 방이므로 요청 ID 도 새로 만든다
      setMemberCount: (memberCount) =>
        set((state) => ({
          draft: {
            ...state.draft,
            memberCount,
            // 조각 수는 인원에 따라 정해진다
            pieceCount: memberCount * PIECES_PER_PERSON,
            requestId:
              memberCount === state.draft.memberCount ? state.draft.requestId : crypto.randomUUID(),
          },
        })),

      setDraftGoal: (goalMinutes) =>
        set((state) => ({
          draft: {
            ...state.draft,
            goalMinutes,
            requestId:
              goalMinutes === state.draft.goalMinutes ? state.draft.requestId : crypto.randomUUID(),
          },
        })),

      openAsHost: (entry, photoUrl) => {
        const { draft } = get();
        const code = entry.sessionCode;
        set({
          session: {
            code,
            remote: remoteOf(entry),
            mySeat: 0,
            myPositions: null,
            // 서버에 올라간 주소가 있으면 그것을, 없으면 고른 사진의 미리보기를 쓴다
            photoUrl: photoUrl ?? draft.photoUrl ?? BLANK_PHOTO,
            memberCount: draft.memberCount,
            pieceCount: draft.pieceCount,
            goalMinutes: draft.goalMinutes,
            members: [
              member('me', HOST_NAME, { isMe: true, isHost: true }),
              ...emptySeats(1, draft.memberCount),
            ],
            phase: 'lobby',
          },
          ...FRESH,
        });
        return code;
      },

      openAsGuest: (code, entry) => {
        set({
          session: {
            code,
            remote: remoteOf(entry),
            mySeat: 0,
            myPositions: null,
            // 사진, 인원, 목표 시간, 명단은 곧이어 세션 조회(syncRemote)로 채운다
            photoUrl: BLANK_PHOTO,
            memberCount: 6,
            pieceCount: 12,
            goalMinutes: 50,
            members: [member('me', '', { isMe: true }), ...emptySeats(1, 6)],
            phase: 'lobby',
          },
          ...FRESH,
        });
      },

      syncRemote: (detail) =>
        set((state) => {
          const { session } = state;
          if (!session || session.phase !== 'lobby') return state;
          const found = session.members.find((each) => each.isMe);
          if (!found) return state;
          // 방장이 나가면 서버가 다음 사람을 방장으로 올린다. 내가 방장이 됐는지 매번 서버 값을 따른다
          const isCreator = detail.me.isCreator;
          const capacity = detail.maxParticipants ?? session.memberCount;
          // 명단은 서버의 입장 순서를 따른다. 이름을 아직 정하지 않은 사람은 번호로 부른다
          const joined = detail.participants.map((each, seat) =>
            each.participantId === detail.me.participantId
              ? { ...found, name: found.name || (each.nickname ?? ''), isHost: isCreator }
              : member(remoteId(each.participantId), each.nickname ?? `참가자 ${seat + 1}`, {
                  isHost: each.isCreator,
                }),
          );
          const mySeat = Math.max(
            detail.participants.findIndex((each) => each.participantId === detail.me.participantId),
            0,
          );
          const synced: Session = {
            ...session,
            remote: { ...session.remote, isCreator },
            photoUrl: detail.image?.url ?? session.photoUrl,
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

      syncBoard: (pieces) =>
        set((state) => {
          const { session } = state;
          if (!session || session.phase === 'lobby' || pieces.length === 0) return state;
          const mine = pieces.filter((piece) => piece.isMine).map((piece) => piece.position);
          const same =
            session.pieceCount === pieces.length && session.myPositions?.join() === mine.join();
          // 조각 수와 내 칸은 서버가 정한다. 모든 기기에서 같은 칸이 같은 사람 것이 된다
          return same
            ? state
            : { session: { ...session, pieceCount: pieces.length, myPositions: mine } };
        }),

      syncMembers: (list) =>
        set((state) => {
          const { session } = state;
          if (!session || session.phase === 'lobby' || list.length === 0) return state;
          const me = session.members.find((each) => each.isMe);
          if (!me) return state;
          // 내 진행은 이 기기에서 센 값을 그대로 두고, 다른 사람은 서버 값을 따른다
          const members = list.map((each, seat) =>
            each.isMe
              ? me
              : member(remoteId(each.participantId), each.nickname ?? `참가자 ${seat + 1}`, {
                  progress: each.restoration,
                  status:
                    each.state === 'FOCUSING'
                      ? 'recording'
                      : each.state === 'PAUSED'
                        ? 'paused'
                        : 'away',
                }),
          );
          return { session: { ...session, members } };
        }),

      syncAssembly: (placedIndexes, ownerName) =>
        set((state) => {
          const fresh = placedIndexes.filter((index) => !state.placed.includes(index));
          if (fresh.length === 0) return state;
          const last = fresh[fresh.length - 1];
          return {
            placed: [...state.placed, ...fresh],
            lastPlacedBy: ownerName(last),
          };
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
            // 다른 사람의 상태와 진행은 서버 진행판에서 받아 온다(syncMembers)
            return each;
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

      syncFocused: (seconds) =>
        set((state) =>
          Math.abs(state.timeline.focused - seconds) <= 2
            ? state
            : { timeline: { ...state.timeline, focused: seconds } },
        ),

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

      reset: () => set({ draft: freshDraft(), session: null, ...FRESH }),
    }),
    { name: 'session', storage: createJSONStorage(() => sessionStorage) },
  ),
);
