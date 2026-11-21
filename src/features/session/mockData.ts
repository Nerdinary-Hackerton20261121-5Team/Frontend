// TODO(mock): 세션 서버 API 가 생기면 지운다. 함께하는 사람과 사진을 흉내 내는 값이다.

export const MOCK_NAMES = ['비둘기', '누렁이', '진혁', '오뎅', '콩떡'];

/** 초대받아 들어온 쪽에서 보이는, 이미 만들어져 있는 세션 */
export const MOCK_INVITE = { hostName: '비둘기', joinedNames: ['누렁이', '진혁'], memberCount: 6 };

/** 사진을 받아 올 서버가 없을 때 쓰는 임시 그림 */
export const mockPhoto = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 393;
  canvas.height = 852;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const sky = context.createLinearGradient(0, 0, 0, 852);
  sky.addColorStop(0, '#8ec5e8');
  sky.addColorStop(0.55, '#d7eddf');
  sky.addColorStop(1, '#4c765c');
  context.fillStyle = sky;
  context.fillRect(0, 0, 393, 852);
  context.fillStyle = '#ffffffcc';
  [
    [90, 180, 46],
    [150, 170, 60],
    [290, 300, 40],
  ].forEach(([x, y, r]) => {
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = '#72b08a';
  context.beginPath();
  context.moveTo(0, 620);
  context.quadraticCurveTo(200, 500, 393, 640);
  context.lineTo(393, 852);
  context.lineTo(0, 852);
  context.fill();
  return canvas.toDataURL('image/jpeg', 0.85);
};
