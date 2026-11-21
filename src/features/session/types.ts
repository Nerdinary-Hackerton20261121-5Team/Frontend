export type MemberStatus = 'recording' | 'away' | 'paused';

export type Member = {
  id: string;
  /** 아직 들어오지 않은 자리는 빈 문자열 */
  name: string;
  isMe: boolean;
  isHost: boolean;
  joined: boolean;
  /** 목표 시간 중 채운 비율. 0 에서 1 */
  progress: number;
  status: MemberStatus;
};

export type Phase = 'lobby' | 'study' | 'assembly';

/** 서버에 만들어진 세션과 나를 가리키는 값 */
export type Remote = { sessionId: number; token: string; isCreator: boolean };

export type Session = {
  code: string;
  remote: Remote;
  /** 서버 세션에서 내가 몇 번째로 들어왔는지. 다른 사람을 번호로 부를 때 쓴다 */
  mySeat: number;
  /** 서버가 정해 준 내 조각의 칸 번호(왼쪽 위부터 1). 서버 세션이 시작된 뒤에만 있다 */
  myPositions: number[] | null;
  photoUrl: string;
  /** 개설자가 정한 인원 */
  memberCount: number;
  /** 개설자가 고른 퍼즐 조각 수 */
  pieceCount: number;
  goalMinutes: number;
  members: Member[];
  phase: Phase;
};

/** 공부 시간이 어디에 쓰였는지 초 단위로 모은 것 */
export type Timeline = {
  /** 세션이 시작된 뒤 흐른 시간 */
  elapsed: number;
  /** 자리를 지켜 기록된 시간 */
  focused: number;
  away: number;
  /** 화면을 벗어나 있던 시간 */
  hidden: number;
  paused: number;
};

export type TickMode = 'focused' | 'away' | 'hidden' | 'paused';
