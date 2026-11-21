import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Remote } from './types';

/** 서버가 저장한 사진. url 은 화면에 쓸 수 있게 크기를 줄인 주소다 */
export type UploadedImage = {
  key: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
};

/** WAITING 시작 전, FOCUSING 공부 중, ASSEMBLING 퍼즐 맞추기, COMPLETED 완성 */
export type SessionStatus = 'WAITING' | 'FOCUSING' | 'ASSEMBLING' | 'COMPLETED';

/** 방을 만들거나 들어갔을 때의 응답. participantToken 은 이때만 받을 수 있다 */
export type SessionEntry = {
  sessionId: number;
  sessionCode: string;
  participantId: number;
  participantToken: string;
  isCreator: boolean;
  restored: boolean;
};

export type SessionDetail = {
  sessionId: number;
  sessionCode: string;
  status: SessionStatus;
  goalSeconds: number;
  maxParticipants: number | null;
  participantCount: number;
  startedAt: string | null;
  endsAt: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  serverNow: string;
  me: { participantId: number; isCreator: boolean };
};

export type Heartbeat = {
  status: SessionStatus;
  disconnected: boolean;
  myRestoration: number;
  remainingSeconds: number;
  heartbeatIntervalSeconds: number;
  serverNow: string;
};

/** 진행판의 한 칸. 한 사람이 한 칸을 맡는다 */
export type BoardPiece = {
  /** 왼쪽 위부터 1 */
  position: number;
  isMine: boolean;
  /** 0 에서 1. 공부 중에는 내 것만 값이 있고 남의 것은 null 이다 */
  restoration: number | null;
};

export type Board = { status: SessionStatus; pieces: BoardPiece[] };

const withToken = (remote: Remote) => ({ headers: { 'X-Participant-Token': remote.token } });

/**
 * TODO(mock): 세션 API 가 아직 배포되지 않은 서버이거나 서버에 닿지 못한 경우다.
 * 이때는 프론트에서 흉내 낸 세션으로 이어 간다. 세션 API 가 운영에 올라가면 이 함수와 쓰는 곳을 지운다.
 */
export const shouldUseMock = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.code === 'NOT_FOUND');

/** 퍼즐로 만들 사진을 서버에 올린다 */
export const useUploadPhoto = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<UploadedImage>('/api/images', form);
    },
  });
};

/** 방을 만든다. 만든 사람도 참가자로 등록된다 */
export const useCreateSession = () => {
  return useMutation({
    // clientRequestId 가 같으면 서버는 방을 새로 만들지 않고 먼저 만든 방을 돌려준다.
    // 응답을 못 받고 다시 누르거나 새로고침해도 방이 두 개가 되지 않는다
    mutationFn: (input: {
      goalSeconds: number;
      maxParticipants: number;
      clientRequestId: string;
    }) => api.post<SessionEntry>('/api/sessions', input),
  });
};

// 같은 사람이 초대 링크를 다시 열어도 자리를 또 차지하지 않도록, 브라우저에 초대 코드마다 요청 ID 를 남겨 둔다.
// 서버는 같은 ID 로 다시 오면 새 참가자를 만들지 않고 원래 자리를 돌려준다
const joinRequestId = (code: string) => {
  const key = `join-request:${code.toUpperCase()}`;
  const saved = localStorage.getItem(key);
  if (saved) return saved;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
};

/** 초대 코드로 방에 들어간다. 링크를 열자마자 한 번 부른다 */
export const useJoinSession = (code: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['session-join', code],
    queryFn: () =>
      api.post<SessionEntry>('/api/sessions/join', {
        sessionCode: code,
        clientRequestId: joinRequestId(code),
      }),
    enabled,
    retry: false,
    staleTime: Infinity,
  });
};

/** 시작 전까지 인원과 단계를 2초마다 다시 읽는다 */
export const useSessionDetail = (remote: Remote | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['session', remote?.sessionId],
    queryFn: () => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      return api.get<SessionDetail>(`/api/sessions/${remote.sessionId}`, withToken(remote));
    },
    enabled: remote !== null && enabled,
    refetchInterval: 2000,
  });
};

/** 지금 들어온 사람으로 공부를 시작한다. 만든 사람만 할 수 있다 */
export const useStartSession = () => {
  return useMutation({
    mutationFn: (remote: Remote) =>
      api.post<{ status: SessionStatus; participantCount: number }>(
        `/api/sessions/${remote.sessionId}/start`,
        undefined,
        withToken(remote),
      ),
  });
};

/** 공부하는 동안 10초마다 연결을 알린다. 서버는 이것으로 끊긴 사람을 가려낸다 */
export const useHeartbeat = (remote: Remote | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['session-heartbeat', remote?.sessionId],
    queryFn: () => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      return api.post<Heartbeat>(
        `/api/sessions/${remote.sessionId}/heartbeat`,
        undefined,
        withToken(remote),
      );
    },
    enabled: remote !== null && enabled,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
};

/** 진행판을 읽는다. 내가 몇 번째 자리인지와, 공개된 다른 사람의 복원도를 알 수 있다 */
export const useBoard = (remote: Remote | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['session-board', remote?.sessionId],
    queryFn: () => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      return api.get<Board>(`/api/sessions/${remote.sessionId}/board`, withToken(remote));
    },
    enabled: remote !== null && enabled,
    refetchInterval: 10_000,
  });
};

/** 방을 끝내고 서버의 자료를 지운다. 만든 사람만 할 수 있다 */
export const useEndSession = () => {
  return useMutation({
    mutationFn: (remote: Remote) =>
      api.delete<{ sessionId: number; deleted: boolean }>(
        `/api/sessions/${remote.sessionId}`,
        withToken(remote),
      ),
  });
};

/**
 * 시작 전에 방에서 나가 자리를 돌려준다. 만든 사람은 나갈 수 없고 방 종료를 써야 한다.
 * 화면이 닫히는 순간에도 불러야 해서 훅이 아니라 함수로 둔다.
 */
export const leaveSession = (remote: Remote, keepalive: boolean) =>
  api.delete<{ sessionId: number; participantId: number; left: boolean }>(
    `/api/sessions/${remote.sessionId}/participants/me`,
    { ...withToken(remote), keepalive },
  );

/** 조립판의 조각 하나. 한 사람이 2개를 맡는다 */
export type AssemblyPiece = {
  pieceId: number;
  isMine: boolean;
  placed: boolean;
  /** 놓인 칸 번호(왼쪽 위부터 1). 아직 안 놓였으면 null. 서버는 정답 칸을 놓기 전에는 알려 주지 않는다 */
  position: number | null;
  /** 주인이 자리에 없어 서버가 대신 놓은 조각인지 */
  autoPlaced: boolean;
};

export type Assembly = {
  status: SessionStatus;
  boardRows: number;
  boardCols: number;
  totalPieces: number;
  placedCount: number;
  /** 모든 조각이 제자리에 놓였는지 */
  completed: boolean;
  pieces: AssemblyPiece[];
};

type PlaceResult = { pieceId: number; correct: boolean; placedCount: number; completed: boolean };

/** 조립판을 1.5초마다 다시 읽는다. 다른 사람이 끼운 조각이 여기로 들어온다 */
export const useAssembly = (remote: Remote | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['session-assembly', remote?.sessionId],
    queryFn: () => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      return api.get<Assembly>(`/api/sessions/${remote.sessionId}/assembly`, withToken(remote));
    },
    enabled: remote !== null && enabled,
    refetchInterval: 1500,
  });
};

/**
 * 내 조각을 칸에 놓는다. 서버는 어느 조각이 어느 칸인지 놓기 전에는 알려 주지 않으므로,
 * 화면에서 맞는 칸에 놓았을 때 내 조각들을 그 칸에 차례로 놓아 보고 맞는 것을 찾는다(1인 2조각이라 많아야 두 번).
 * 틀린 조각은 서버가 저장하지 않는다.
 */
export const usePlacePiece = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { remote: Remote; pieceIds: number[]; position: number }) => {
      for (const pieceId of input.pieceIds) {
        const result = await api.patch<PlaceResult>(
          `/api/sessions/${input.remote.sessionId}/assembly/pieces/${pieceId}`,
          { targetPosition: input.position },
          withToken(input.remote),
        );
        if (result.correct) return result;
      }
      return null;
    },
    onSuccess: (_result, input) =>
      queryClient.invalidateQueries({ queryKey: ['session-assembly', input.remote.sessionId] }),
  });
};
