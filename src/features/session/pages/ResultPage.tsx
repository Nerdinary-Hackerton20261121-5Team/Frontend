import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useCameraStore } from '@/features/attention/camera';
import { useAssembly, useBoard, useEndSession, usePlacePiece } from '../api';
import { AssemblyView } from '../components/AssemblyView';
import { DoneView } from '../components/DoneView';
import { useMockAssembly } from '../mock';
import { gridFor, piecesOfRow, pieceTotal } from '../puzzle';
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
  const syncAssembly = useSessionStore((state) => state.syncAssembly);
  const place = usePlacePiece();
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

  // 서버 세션이면 조립판을 서버에서 읽는다. 다른 사람이 끼운 조각과 완성 여부가 여기로 들어온다
  const remote = session?.remote ?? null;
  const assembly = useAssembly(remote, session?.phase === 'assembly');
  const myName = session?.members.find((member) => member.isMe)?.name ?? '';
  const myPositions = session?.myPositions ?? null;
  useEffect(() => {
    if (!assembly.data) return;
    const placedIndexes = assembly.data.pieces
      .filter((piece) => piece.placed && piece.position !== null)
      .map((piece) => (piece.position ?? 0) - 1);
    syncAssembly(
      placedIndexes,
      (myPositions ?? []).map((position) => position - 1),
      myName,
    );
  }, [assembly.data, myPositions, myName, syncAssembly]);

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase === 'lobby') return <Navigate to={`/s/${code}/lobby`} replace />;
  if (session.phase === 'study') return <Navigate to={`/s/${code}/study`} replace />;

  // 서버 세션은 서버가 알려 준 판 크기와 내 칸을 쓴다
  const grid = assembly.data
    ? { rows: assembly.data.boardRows, cols: assembly.data.boardCols }
    : gridFor(session.pieceCount, session.members.length);
  const myRow = session.members.findIndex((member) => member.isMe);
  const myPieces = myPositions
    ? myPositions.map((position) => position - 1)
    : piecesOfRow(myRow, grid);
  const completed = assembly.data?.completed ?? placed.length === pieceTotal(grid);

  const onPlace = (index: number) => {
    if (!remote) return placePiece(index, myName);
    // 아직 놓지 않은 내 조각을 이 칸에 놓아 본다. 맞으면 화면에도 바로 끼운다
    const pieceIds = (assembly.data?.pieces ?? [])
      .filter((piece) => piece.isMine && !piece.placed)
      .map((piece) => piece.pieceId);
    place.mutate(
      { remote, pieceIds, position: index + 1 },
      { onSuccess: (result) => result && placePiece(index, myName) },
    );
  };

  if (completed) {
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
      myPieces={myPieces}
      lastPlacedBy={lastPlacedBy}
      onPlace={onPlace}
    />
  );
};
