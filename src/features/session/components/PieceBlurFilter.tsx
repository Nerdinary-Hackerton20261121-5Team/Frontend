interface PieceBlurFilterProps {
  id: string;
  /** 흐림 정도(px) */
  radius: number;
}

/**
 * 조각 그림을 흐리게 하되 직소 모양의 가장자리는 또렷하게 남기는 필터.
 * CSS blur 는 가장자리까지 번져서, 끼운 조각 둘레가 흐릿하게 비친다.
 * 서버가 남의 조각을 줄 때처럼 그림만 흐리고 원래 모양으로 다시 오려 낸다.
 */
export const PieceBlurFilter = ({ id, radius }: PieceBlurFilterProps) => (
  <svg aria-hidden width='0' height='0' className='absolute'>
    <filter id={id} x='-10%' y='-10%' width='120%' height='120%' colorInterpolationFilters='sRGB'>
      <feGaussianBlur in='SourceGraphic' stdDeviation={radius} result='blurred' />
      {/* 번지며 옅어진 가장자리를 다시 불투명하게 채운 뒤 */}
      <feComponentTransfer in='blurred' result='solid'>
        <feFuncA type='linear' slope='255' />
      </feComponentTransfer>
      {/* 원래 조각 모양으로 오려 낸다 */}
      <feComposite in='solid' in2='SourceAlpha' operator='in' />
    </filter>
  </svg>
);
