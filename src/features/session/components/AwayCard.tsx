/** 자리를 비운 것으로 보일 때 화면 가운데에 띄우는 안내 */
export const AwayCard = () => {
  return (
    <div
      role='status'
      className='absolute inset-x-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-[6px] rounded-[8px] bg-bg-default p-5 text-center shadow-[0_8px_20px_rgba(0,0,0,0.16)]'
    >
      <p className='text-title-m text-text-primary'>자리를 비운 것 같아요</p>
      <p className='text-body-m-medium text-text-secondary'>
        카메라에 얼굴이 보이면 다시 쌓여요.
        <br />
        지금 시간은 내 조각에 더하지 않아요.
      </p>
    </div>
  );
};
