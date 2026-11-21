import logo from '@/assets/images/splash-logo.svg';

/** 앱을 처음 열 때 잠깐 보이는 초록 화면. 캐릭터와 Pocus 로고, 한 줄 소개가 있다. */
export const SplashScreen = () => {
  return (
    // Figma 852px 프레임에서 로고 묶음이 가운데보다 34px 위에 있어 아래 여백으로 맞춘다
    <div
      role='status'
      aria-label='Pocus'
      className='fixed inset-0 z-[70] mx-auto flex w-full max-w-[402px] flex-col items-center justify-center gap-[17px] bg-brand-primary pb-[68px]'
    >
      <img src={logo} alt='' width={171} height={164} />
      <p className='text-body-m-medium text-text-on-brand opacity-85'>한 조각씩, 함께 한 장</p>
    </div>
  );
};
