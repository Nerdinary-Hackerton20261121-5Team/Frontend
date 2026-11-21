import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { useBoard, useEndSession } from '../api';
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
  const syncBoard = useSessionStore((state) => state.syncBoard);
  const endSession = useEndSession();
  const stopCamera = useCameraStore((state) => state.stop);
  useMockAssembly();

  // 공부가 끝났으니 카메라를 끈다
  useEffect(() => {
    stopCamera();
  }, [stopCamera]);

  // 공부가 끝나면 서버가 모두의 복원도를 공개한다
  const board = useBoard(session?.remote ?? null, session?.phase === 'assembly');
  useEffect(() => {
    if (board.data) syncBoard(board.data.pieces);
  }, [board.data, syncBoard]);

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
        ending={endSession.isPending}
        onHome={() => {
          // 세션은 진입 화면에 도착하면 비운다. 여기서 먼저 비우면 이 화면이 입장 화면으로 튕긴다
          const leave = () => navigate('/');
          // 만든 사람이 나가면 서버의 방도 함께 지운다. 지우지 못해도 화면은 처음으로 돌아간다
          if (session.remote?.isCreator) endSession.mutate(session.remote, { onSettled: leave });
          else leave();
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
