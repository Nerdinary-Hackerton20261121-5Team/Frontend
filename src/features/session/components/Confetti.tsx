/** 공부를 마친 화면 위쪽에 흩뿌리는 작은 종이 조각들 */
export const Confetti = () => {
  return (
    <div aria-hidden className='pointer-events-none absolute inset-x-0 top-10 h-[200px]'>
      <span className='absolute top-[2px] right-[65px] size-[7px] rounded-full bg-status-info opacity-60' />
      <span className='absolute top-[69px] left-[56px] h-[15px] w-2 rotate-[70deg] rounded-[2px] bg-status-away opacity-50' />
      <span className='absolute top-[102px] left-[44px] h-[21px] w-[10px] rotate-12 rounded-[2px] bg-brand-primary opacity-90' />
      <span className='absolute top-[68px] right-[30px] size-2 rounded-full bg-status-info opacity-60' />
      <span className='absolute top-[84px] right-[50px] size-[5px] rounded-full bg-status-away opacity-80' />
      <span className='absolute top-[103px] right-[32px] size-[7px] rounded-full bg-status-away opacity-80' />
      <span className='absolute top-[97px] right-[36px] h-[11px] w-[6px] -rotate-12 rounded-[2px] bg-brand-pressed opacity-60' />
    </div>
  );
};
