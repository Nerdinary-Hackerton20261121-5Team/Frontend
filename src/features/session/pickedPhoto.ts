// 고른 사진 파일을 방을 만들 때까지 들고 있는다.
// 서버는 방을 만든 뒤(참가자 토큰이 생긴 뒤)에만 사진을 받는다. 그래서 사진 화면에서는 올리지 않고 여기에 둔다.
// 파일은 저장할 수 없어서 새로고침하면 사라진다. 그때는 사진 화면에서 다시 고른다.

let picked: File | null = null;

export const setPickedPhoto = (file: File | null) => {
  picked = file;
};

export const getPickedPhoto = () => picked;
