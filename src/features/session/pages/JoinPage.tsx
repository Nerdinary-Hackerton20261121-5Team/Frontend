import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/shared/Button';
import { Input } from '@/shared/Input';
import { Accent } from '../components/Accent';
import { Field } from '../components/Field';
import { JigsawBoard } from '../components/JigsawBoard';
import { StepLayout } from '../components/StepLayout';
import { NAME_MAX } from '../limits';
import { MOCK_INVITE, mockPhoto } from '../mockData';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';

const PREVIEW_GRID = { cols: 3, rows: 3 };

/** 03-B 초대받은 입장. 초대 링크로 들어온 사람이 보일 이름을 정한다. */
export const JoinPage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const joinAsGuest = useSessionStore((state) => state.joinAsGuest);
  const [name, setName] = useState('');
  // TODO(mock): 세션 조회 API 가 생기면 서버의 사진과 인원으로 바꾼다
  const photo = useMemo(() => mockPhoto(), []);

  if (session) return <Navigate to={`/s/${code}/goal`} replace />;

  const joined = MOCK_INVITE.joinedNames.length + 1;
  const trimmed = name.trim();

  const next = () => {
    joinAsGuest(code, trimmed);
    navigate(`/s/${code}/goal`);
  };

  return (
    <StepLayout
      header='세션 만들기'
      title={
        <>
          <Accent>공부 세션</Accent>에 초대됐어요
        </>
      }
      description={`${MOCK_INVITE.memberCount}명이 모두 들어오면 공부를 시작할 수 있어요.`}
      footer={
        <Button disabled={trimmed === ''} onClick={next}>
          다음으로
        </Button>
      }
    >
      <div className='flex flex-col gap-7'>
        <div className='flex h-[260px] flex-col items-center justify-center gap-[10px] rounded-[8px] bg-bg-field'>
          <div className='overflow-hidden rounded-[9px]'>
            <JigsawBoard
              width={200}
              height={200}
              grid={PREVIEW_GRID}
              photoUrl={photo}
              photoBlur={6}
              look={() => 'photo'}
              outlineClassName={() => 'stroke-white/60'}
            />
          </div>
          <p className='text-body-m-medium text-brand-strong'>
            지금 <b>{joined}</b>/{MOCK_INVITE.memberCount}명이 들어와 있어요
          </p>
        </div>
        <Field label='함께 하는 사람에게 보일 이름'>
          <Input
            placeholder='이름을 입력해 주세요'
            value={name}
            maxLength={NAME_MAX}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      </div>
    </StepLayout>
  );
};
