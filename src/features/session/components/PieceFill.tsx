interface PieceFillProps {
  src: string;
  /** 그림이 칸보다 사방으로 얼마나 큰지(칸 크기에 대한 비율) */
  padRatio: number;
  /** 얼마나 흐리게 할지(px) */
  blur?: number;
}

// 홈은 칸 안쪽으로 파여 있다. 같은 그림을 네 방향으로 밀어 밑에 깔면 홈 자리가 바로 안쪽 그림으로 메워진다
const SHIFTS = [
  [0, 0],
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/** 서버가 오려 준 조각 그림으로 네모 칸을 채운다. 부모는 칸 크기이고 넘치는 부분을 잘라야 한다. */
export const PieceFill = ({ src, padRatio, blur = 0 }: PieceFillProps) => {
  const size = `${(1 + padRatio * 2) * 100}%`;
  // 그림 크기에 대한 비율로 바꾼, 홈 깊이만큼의 이동 거리
  const step = (padRatio / (1 + padRatio * 2)) * 100;

  return (
    <>
      {/* 네 모서리처럼 그래도 남는 빈틈은 가운데를 키운 그림으로 막는다 */}
      <img
        src={src}
        alt=''
        className='absolute inset-0 size-full scale-[2.5] object-cover blur-md'
      />
      {[...SHIFTS].reverse().map(([x, y]) => (
        <img
          key={`${x},${y}`}
          src={src}
          alt=''
          style={{
            left: `${-padRatio * 100}%`,
            top: `${-padRatio * 100}%`,
            width: size,
            height: size,
            transform: `translate(${x * step}%, ${y * step}%)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
          className='absolute max-w-none object-cover'
        />
      ))}
    </>
  );
};
