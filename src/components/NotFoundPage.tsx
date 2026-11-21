import { Link } from 'react-router';
import { Header } from '@/shared/Header';
import { EmptyView } from './EmptyView';

export const NotFoundPage = () => {
  return (
    <>
      <Header title='페이지를 찾을 수 없어요' />
      <main className='min-h-0 flex-1 overflow-y-auto'>
        <EmptyView
          title='없는 화면이에요'
          description='주소가 바뀌었거나 삭제된 화면이에요.'
          action={
            <Link to='/' className='font-semibold text-brand-primary'>
              처음으로 가기
            </Link>
          }
        />
      </main>
    </>
  );
};
