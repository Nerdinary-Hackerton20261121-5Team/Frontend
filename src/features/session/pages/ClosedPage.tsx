import { useNavigate } from 'react-router';
import lockIcon from '@/assets/icons/lock.svg';
import { Button } from '@/shared/Button';
import { MaskIcon } from '../components/MaskIcon';
import { NoticeLayout } from '../components/NoticeLayout';

/** E1 입장 불가. 들어갈 수 없는 세션의 링크로 왔을 때 보여 준다. */
export const ClosedPage = () => {
  const navigate = useNavigate();
  return (
    <NoticeLayout
      icon={<MaskIcon src={lockIcon} className='size-9 text-icon-brand' />}
      title='들어갈 수 없는 세션이에요'
      description='자리가 다 찼거나, 이미 시작했거나, 링크가 만료됐어요.'
      footer={
        <>
          <Button variant='secondary' onClick={() => navigate('/')}>
            처음으로
          </Button>
          <Button onClick={() => navigate('/new/photo')}>새 세션 만들기</Button>
        </>
      }
    />
  );
};
