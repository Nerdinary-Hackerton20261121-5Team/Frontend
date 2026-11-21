import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Remote } from './types';

/** 서버가 저장한 사진. url 은 화면에 쓸 수 있게 크기를 줄인 주소다 */
export type UploadedImage = {
  imageId: number;
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
  /** 방의 사진. 아직 정하지 않았으면 null */
  image: UploadedImage | null;
  me: { participantId: number; isCreator: boolean };
  /** 들어온 사람 명단, 입장 순서. 이름을 아직 정하지 않았으면 nickname 이 null */
  participants: { participantId: number; nickname: string | null; isCreator: boolean }[];
};

/** 서버에 알리는 내 상태. 서버는 FOCUSING 인 동안만 공부 시간을 쌓는다 */
export type Presence = 'FOCUSING' | 'PAUSED' | 'AWAY';

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
  /** 정답 칸 번호. 왼쪽 위부터 1 */
  position: number;
  /** 공부하는 동안 보여 줄 칸 번호. 정답 칸이 드러나지 않게 서버가 섞어 둔다 */
  displaySlot: number;
  isMine: boolean;
  /** 0 에서 1. 공부 중에는 내 것만 값이 있고 남의 것은 null 이다 */
  restoration: number | null;
};

/** 함께 하는 사람의 지금 상태. DISCONNECTED 는 연결 확인이 오래 끊긴 경우다 */
export type BoardMember = {
  participantId: number;
  nickname: string | null;
  isMe: boolean;
  state: Presence | 'DISCONNECTED';
  focusedSeconds: number;
  /** 0 에서 1. 쌓인 공부 시간 ÷ 목표 시간 */
  restoration: number;
};

export type Board = {
  status: SessionStatus;
  /** 명단, 입장 순서 */
  members: BoardMember[];
  gridRows: number;
  gridCols: number;
  /** 세션에 사진이 있는지. 없으면 조각 그림도 없다 */
  hasImage: boolean;
  /** 조각 그림이 칸보다 사방으로 얼마나 큰지(칸 크기에 대한 비율). 튀어나온 부분이 들어갈 자리다 */
  padRatio: number;
  pieces: BoardPiece[];
};

const withToken = (remote: Remote) => ({ headers: { 'X-Participant-Token': remote.token } });

/**
 * TODO(mock): 세션 API 가 아직 배포되지 않은 서버이거나 서버에 닿지 못한 경우다.
 * 이때는 프론트에서 흉내 낸 세션으로 이어 간다. 세션 API 가 운영에 올라가면 이 함수와 쓰는 곳을 지운다.
 */
export const shouldUseMock = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.code === 'NOT_FOUND');

/**
 * 방을 만들고 고른 사진을 방의 사진으로 올린다.
 * 서버는 참가자 토큰이 있어야 사진을 받으므로 방을 먼저 만든 뒤 그 토큰으로 올린다.
 * clientRequestId 가 같으면 서버는 방을 새로 만들지 않고 먼저 만든 방을 돌려준다.
 */
export const useCreateSession = () => {
  return useMutation({
    mutationFn: async (input: {
      goalSeconds: number;
      maxParticipants: number;
      clientRequestId: string;
      /** 함께 하는 사람에게 보일 내 이름 */
      nickname: string;
      photo: File | null;
    }) => {
      const { photo, ...body } = input;
      const entry = await api.post<SessionEntry>('/api/sessions', body);
      const remote = {
        sessionId: entry.sessionId,
        token: entry.participantToken,
        isCreator: entry.isCreator,
      };
      if (!photo) return { entry, photoUrl: null };
      try {
        const form = new FormData();
        form.append('file', photo);
        const image = await api.post<UploadedImage>('/api/images', form, withToken(remote));
        await api.patch(
          `/api/sessions/${remote.sessionId}/image`,
          { imageId: image.imageId },
          withToken(remote),
        );
        return { entry, photoUrl: image.url };
      } catch {
        // 방은 만들어졌다. 다시 누르면 같은 요청 ID 라 그 방을 돌려받고 사진만 다시 올린다.
        // ApiError 로 던지면 서버가 없는 경우로 읽혀 흉내 낸 세션으로 넘어가므로 일반 오류로 던진다
        throw new Error('사진을 올리지 못했어요. 다시 시도하거나 다른 사진을 골라 주세요.');
      }
    },
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
      // 이름은 화면에서 받은 뒤 useSetNickname 으로 따로 보낸다
      api.post<SessionEntry>('/api/sessions/join', {
        sessionCode: code,
        clientRequestId: joinRequestId(code),
      }),
    enabled,
    retry: false,
    staleTime: Infinity,
  });
};

/**
 * 시트에 적은 참여 코드로 들어가 본다. 성공하면 받은 자리를 입장 쿼리에 넣어 두어 03-B 가 같은 요청을 다시 보내지 않게 한다.
 * 요청 ID 가 링크로 들어올 때와 같아서 다시 열어도 자리를 또 차지하지 않는다.
 */
export const useJoinByCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<SessionEntry>('/api/sessions/join', {
        sessionCode: code,
        clientRequestId: joinRequestId(code),
      }),
    onSuccess: (entry, code) => queryClient.setQueryData(['session-join', code], entry),
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

/**
 * 공부하는 동안 10초마다 연결과 내 상태를 알린다. 서버는 FOCUSING 인 동안만 공부 시간을 쌓는다.
 * 상태가 바뀌면 주기를 기다리지 않고 바로 한 번 보낸다(상태가 쿼리 키에 들어 있다).
 */
export const useHeartbeat = (remote: Remote | null, enabled: boolean, state: Presence) => {
  return useQuery({
    queryKey: ['session-heartbeat', remote?.sessionId, state],
    queryFn: () => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      return api.post<Heartbeat>(
        `/api/sessions/${remote.sessionId}/heartbeat`,
        { state },
        withToken(remote),
      );
    },
    enabled: remote !== null && enabled,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    // 상태가 바뀌어 다시 보내는 동안에도 직전 응답(서버의 단계)을 들고 있는다
    placeholderData: keepPreviousData,
  });
};

/** 함께 하는 사람에게 보일 내 이름을 서버에 알린다 */
export const useSetNickname = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ remote, nickname }: { remote: Remote; nickname: string }) =>
      api.patch<{ participantId: number; nickname: string }>(
        `/api/sessions/${remote.sessionId}/participants/me`,
        { nickname },
        withToken(remote),
      ),
    onSuccess: (_, { remote }) =>
      queryClient.invalidateQueries({ queryKey: ['session', remote.sessionId] }),
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

/**
 * 모두의 공부를 지금 끝내고 퍼즐 맞추기로 넘긴다. 만든 사람만 할 수 있다.
 * 방을 지우는 useEndSession 과 다르다. 이미 끝났으면 서버가 처음 끝난 시각을 그대로 돌려준다.
 */
export const useEndFocus = () => {
  return useMutation({
    mutationFn: (remote: Remote) =>
      api.post<{ sessionId: number; status: SessionStatus; alreadyEnded: boolean }>(
        `/api/sessions/${remote.sessionId}/end`,
        undefined,
        withToken(remote),
      ),
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
  /** 조각 주인의 참가자 번호 */
  participantId: number;
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

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** 그림의 가로세로 비율(가로 ÷ 세로) */
const aspectOf = (url: string) =>
  new Promise<number>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth / image.naturalHeight);
    image.onerror = () => reject(new Error('조각 그림을 읽지 못했어요'));
    image.src = url;
  });

export type PieceImages = {
  /** 정답 칸 번호별 그림 주소 */
  urls: Record<number, string>;
  /** 칸 하나의 가로세로 비율. 서버는 사진을 자르지 않고 원래 비율대로 나눈다 */
  cellAspect: number;
};

/**
 * 서버가 직소 모양으로 오려 준 조각 그림을 받는다.
 * 내 조각은 선명하고, 남의 조각은 그 사람이 채운 만큼만 선명하다.
 * 토큰이 필요해 img 주소로 바로 쓸 수 없어서, 받아서 data 주소로 바꿔 돌려준다.
 */
export const usePieceImages = (
  remote: Remote | null,
  positions: number[],
  /** 공부 중에는 남의 조각이 점점 선명해지므로 가끔 다시 받는다. 조립 단계에서는 굳어 있다 */
  stage: 'study' | 'assembly' | null,
) => {
  return useQuery({
    queryKey: ['piece-images', remote?.sessionId, stage, positions.join()],
    queryFn: async (): Promise<PieceImages> => {
      if (!remote) throw new Error('세션에 들어가 있지 않아요');
      const entries = await Promise.all(
        positions.map(async (position) => {
          const blob = await api.getBlob(
            `/api/sessions/${remote.sessionId}/pieces/${position}/image`,
            withToken(remote),
          );
          return [position, await toDataUrl(blob)] as const;
        }),
      );
      return { urls: Object.fromEntries(entries), cellAspect: await aspectOf(entries[0][1]) };
    },
    enabled: remote !== null && stage !== null && positions.length > 0,
    staleTime: Infinity,
    refetchInterval: stage === 'study' ? 30_000 : false,
  });
};
