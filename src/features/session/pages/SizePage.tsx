import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Chip } from '@/shared/Chip';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { StepLayout } from '../components/StepLayout';
import { MEMBER_COUNTS } from '../limits';
import { getPickedPhoto } from '../pickedPhoto';
import { useSessionStore } from '../store';

/** 02-2 인원. 조각은 한 사람에 2개씩이라 인원이 정해지면 조각 수도 정해진다 */
export const SizePage = () => {
  const navigate = useNavigate();
  const draft = useSessionStore((state) => state.draft);
  const setMemberCount = useSessionStore((state) => state.setMemberCount);

  if (!draft.photoUrl || !getPickedPhoto()) return <Navigate to='/new/photo' replace />;

  return (
    <StepLayout
      header='세션 만들기'
      back
      step={2}
      title={
        <>
          <Accent>몇 명이서</Accent>, 조각을 맞출까요?
        </>
      }
      description='인원에 맞춰 조각을 나눠 맡아요.'
      footer={<Button onClick={() => navigate('/new/goal')}>다음으로</Button>}
    >
      <div className='flex flex-col gap-7'>
        <Field label='인원'>
          <div className='flex gap-2'>
            {MEMBER_COUNTS.map((count) => (
              <Chip
                key={count}
                selected={draft.memberCount === count}
                onClick={() => setMemberCount(count)}
              >
                {count}명
              </Chip>
            ))}
          </div>
        </Field>
      </div>
    </StepLayout>
  );
};
