import { useMutation, useQuery } from '@tanstack/react-query';
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

const withToken = (remote: Remote) => ({ 'X-Participant-Token': remote.token });

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
    mutationFn: (input: { goalSeconds: number; maxParticipants: number }) =>
      api.post<SessionEntry>('/api/sessions', {
        ...input,
        // 같은 값으로 다시 보내면 방을 새로 만들지 않는다
        clientRequestId: crypto.randomUUID(),
      }),
  });
};

// 새로고침해도 같은 자리를 돌려받도록 초대 코드마다 요청 ID 를 남겨 둔다
const joinRequestId = (code: string) => {
  const key = `join-request:${code}`;
  const saved = sessionStorage.getItem(key);
  if (saved) return saved;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
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
