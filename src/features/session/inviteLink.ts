/** 초대 링크. 지금 열려 있는 주소에 세션 코드를 붙인다 */
export const inviteLink = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/s/${code}`;

// 앱의 WebView 는 클립보드 API 를 막아 둔 경우가 많다. 그때는 글상자를 잠깐 만들어 복사한다
const copyWithTextarea = (text: string) => {
  const area = document.createElement('textarea');
  area.value = text;
  area.readOnly = true;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
};

/** 초대 링크를 복사한다. 어떤 방법으로도 복사하지 못하면 false 를 돌려준다 */
export const copyInviteLink = async (code: string) => {
  const link = inviteLink(code);
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return copyWithTextarea(link);
  }
};
