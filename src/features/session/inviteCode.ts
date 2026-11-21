/** 붙여 넣은 초대 링크(…#/s/ABC123)나 코드만 적은 글에서 초대 코드를 꺼낸다. 못 찾으면 null */
export const inviteCodeFrom = (text: string) => {
  const trimmed = text.trim();
  const fromLink = trimmed.match(/#\/s\/([A-Za-z0-9]+)/);
  if (fromLink) return fromLink[1];
  return /^[A-Za-z0-9]{4,8}$/.test(trimmed) ? trimmed : null;
};
