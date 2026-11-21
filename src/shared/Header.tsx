import { useNavigate } from 'react-router';
import backIcon from '@/assets/icons/back.svg';
import { cn } from '@/lib/cn';

interface HeaderProps {
  title: string;
  /** 왼쪽에 뒤로가기 아이콘을 보여 줄지. 없으면 Figma 시안대로 아래 테두리가 생긴다. */
  back?: boolean;
  /** 뒤로가기를 눌렀을 때. 없으면 이전 화면으로 간다. */
  onBack?: () => void;
  className?: string;
}

export const Header = ({ title, back, onBack, className }: HeaderProps) => {
  const navigate = useNavigate();
  return (
    <header
      className={cn(
        // 노치 영역(safe-area-inset-top)만큼 위를 비운다. 노치가 없으면 시안 그대로 57px 이다.
        'relative flex h-[calc(57px+env(safe-area-inset-top))] shrink-0 items-start justify-center bg-bg-default pt-[calc(16px+env(safe-area-inset-top))]',
        !back && 'border-b border-border-subtle',
        className,
      )}
    >
      {back && (
        <button
          type='button'
          aria-label='뒤로'
          onClick={onBack ?? (() => navigate(-1))}
          className='absolute top-[calc(16px+env(safe-area-inset-top))] left-[10px] size-6'
        >
          <img src={backIcon} alt='' width={24} height={24} />
        </button>
      )}
      <h1 className='truncate px-11 text-body-l-medium text-text-primary'>{title}</h1>
    </header>
  );
};
