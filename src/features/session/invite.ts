import { PIECE_COUNTS } from './limits';
import type { Invite } from './store';

// TODO(mock): 서버가 세션의 사진과 조각 수를 주기 전까지 초대 링크에 실어 보낸다.
// 링크의 값은 누구나 바꿀 수 있으므로, 우리 서버가 내준 사진 주소와 정해진 조각 수만 받는다.

/** 사진을 내주는 서버. 올린 사진의 주소는 이 중 하나의 /img/ 아래에 있다 */
const PHOTO_ORIGINS = [
  window.location.origin,
  'https://cmc-11th.bemelon.me',
  'https://cmc-11th-dev.bemelon.me',
];

const safePhotoUrl = (raw: string | null) => {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const trusted = PHOTO_ORIGINS.includes(url.origin) && url.pathname.startsWith('/img/');
    return trusted ? url.href : null;
  } catch {
    return null;
  }
};

/** 초대 링크의 값을 읽는다. 믿을 수 없는 값은 버리고 null 로 둔다 */
export const readInvite = (params: URLSearchParams): Invite => {
  const pieces = Number(params.get('pieces'));
  return {
    photoUrl: safePhotoUrl(params.get('photo')),
    pieceCount: PIECE_COUNTS.includes(pieces) ? pieces : null,
  };
};
