import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Chip } from '@/shared/Chip';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { StepLayout } from '../components/StepLayout';
import { useSessionStore } from '../store';

const MEMBER_COUNTS = [4, 5, 6];
const PIECE_COUNTS = [6, 12, 24];

/** 02-2 인원과 퍼즐 조각 수. 정하면 세션이 만들어진다. */
export const SizePage = () => {
  const navigate = useNavigate();
  const draft = useSessionStore((state) => state.draft);
  const setSize = useSessionStore((state) => state.setSize);
  const createSession = useSessionStore((state) => state.createSession);

  if (!draft.photoUrl) return <Navigate to='/new/photo' replace />;

  const next = () => navigate(`/s/${createSession()}/invite`);

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={2}
      title={
        <>
          <Accent>몇 명이서</Accent>, 몇 조각으로 할까요?
        </>
      }
      description='인원에 맞춰 조각을 나눠 맡아요.'
      footer={<Button onClick={next}>다음으로</Button>}
    >
      <div className='flex flex-col gap-7'>
        <Field label='인원'>
          <div className='flex gap-2'>
            {MEMBER_COUNTS.map((count) => (
              <Chip
                key={count}
                selected={draft.memberCount === count}
                onClick={() => setSize(count, draft.pieceCount)}
              >
                {count}명
              </Chip>
            ))}
          </div>
        </Field>
        <Field label='퍼즐 조각 수'>
          <div className='flex gap-2'>
            {PIECE_COUNTS.map((count) => (
              <Chip
                key={count}
                selected={draft.pieceCount === count}
                className='px-0'
                onClick={() => setSize(draft.memberCount, count)}
              >
                {count}조각
              </Chip>
            ))}
          </div>
        </Field>
      </div>
    </StepLayout>
  );
};
