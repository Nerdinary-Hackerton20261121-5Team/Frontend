/** 초대 링크. 지금 열려 있는 주소에 세션 코드를 붙인다 */
export const inviteLink = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/s/${code}`;

/** 초대 링크를 복사한다. 복사를 막아 둔 브라우저에서는 false 를 돌려준다 */
export const copyInviteLink = async (code: string) => {
  try {
    await navigator.clipboard.writeText(inviteLink(code));
    return true;
  } catch {
    return false;
  }
};
