import { cn } from '@/lib/cn';

interface MaskIconProps {
  src: string;
  className?: string;
}

/** SVG 아이콘을 글자색(text-*) 토큰으로 칠해 보여 준다. 에셋의 선 색이 회색 하나뿐이라 모양만 빌려 쓴다 */
export const MaskIcon = ({ src, className }: MaskIconProps) => {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        maskImage: `url("${src}")`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  );
};
