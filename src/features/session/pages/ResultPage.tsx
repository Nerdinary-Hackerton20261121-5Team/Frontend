import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { AssemblyView } from '../components/AssemblyView';
import { DoneView } from '../components/DoneView';
import { useMockAssembly } from '../mock';
import { gridFor, pieceTotal } from '../puzzle';
import { useSessionStore } from '../store';
import { useCurrentSession } from '../useCurrentSession';

/** 09 결과. 공부가 끝나면 함께 퍼즐을 맞추고, 다 맞추면 완성된 사진을 본다. */
export const ResultPage = () => {
  const navigate = useNavigate();
  const { code, session } = useCurrentSession();
  const timeline = useSessionStore((state) => state.timeline);
  const placed = useSessionStore((state) => state.placed);
  const lastPlacedBy = useSessionStore((state) => state.lastPlacedBy);
  const placePiece = useSessionStore((state) => state.placePiece);
  const reset = useSessionStore((state) => state.reset);
  const stopCamera = useCameraStore((state) => state.stop);
  useMockAssembly();

  // 공부가 끝났으니 카메라를 끈다
  useEffect(() => {
    stopCamera();
  }, [stopCamera]);

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase === 'lobby') return <Navigate to={`/s/${code}/lobby`} replace />;
  if (session.phase === 'study') return <Navigate to={`/s/${code}/study`} replace />;

  const grid = gridFor(session.pieceCount, session.members.length);
  const me = session.members.find((member) => member.isMe);

  if (placed.length === pieceTotal(grid)) {
    return (
      <DoneView
        session={session}
        grid={grid}
        timeline={timeline}
        onHome={() => {
          reset();
          navigate('/');
        }}
      />
    );
  }

  return (
    <AssemblyView
      session={session}
      grid={grid}
      timeline={timeline}
      placed={placed}
      lastPlacedBy={lastPlacedBy}
      onPlace={(index) => placePiece(index, me?.name ?? '')}
    />
  );
};
