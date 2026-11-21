import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { LoadingView } from '@/components/LoadingView';
import { useCameraStore } from '@/features/attention/camera';
import {
  useAssembly,
  useBoard,
  useEndSession,
  usePieceImages,
  usePlacePiece,
  useStudyResult,
} from '../api';
import { AssemblyView } from '../components/AssemblyView';
import { DoneView } from '../components/DoneView';
import { gridFor, piecesOfRow } from '../puzzle';
import { remoteId, useSessionStore } from '../store';
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
  // 서버가 오려 준 조각 그림. 끌어다 놓을 내 조각부터 받고, 칸 번호(1부터)를 조각 번호(0부터)로 바꿔 둔다
  const imagePieces = board.data?.hasImage ? board.data.pieces : [];
  const images = usePieceImages(
    remote,
    imagePieces.filter((piece) => piece.isMine).map((piece) => piece.position),
    imagePieces.filter((piece) => !piece.isMine).map((piece) => piece.position),
    session?.phase === 'assembly',
  );
  const pieceImages =
    imagePieces.length > 0 && !images.failed
      ? Object.fromEntries(
          Object.entries(images.urls).map(([position, url]) => [Number(position) - 1, url]),
        )
      : undefined;
  // 서버가 확정한 내 공부 시간. 받기 전에는 이 기기에서 센 값을 보여 준다
  const result = useStudyResult(remote, session?.phase === 'assembly');
  const myFocused = result.data?.members.find((member) => member.isMe)?.focusedSeconds;
  const record = myFocused === undefined ? timeline : { ...timeline, focused: myFocused };
  const members = session?.members;
  const myName = members?.find((member) => member.isMe)?.name ?? '';
  const myPositions = session?.myPositions ?? null;
  useEffect(() => {
    if (!assembly.data) return;
    const placedIndexes = assembly.data.pieces
      .filter((piece) => piece.placed && piece.position !== null)
      .map((piece) => (piece.position ?? 0) - 1);
    // 조각의 주인 이름. 내 조각이면 내 이름, 명단에 없으면 이름 없이 알린다
    const owners = new Map(
      assembly.data.pieces.map((piece) => [(piece.position ?? 0) - 1, piece] as const),
    );
    syncAssembly(placedIndexes, (index) => {
      const piece = owners.get(index);
      if (!piece || piece.isMine) return myName;
      return members?.find((member) => member.id === remoteId(piece.participantId))?.name ?? '';
    });
  }, [assembly.data, members, myName, syncAssembly]);

  if (!session) return <Navigate to={`/s/${code}`} replace />;
  if (session.phase === 'lobby') return <Navigate to={`/s/${code}/lobby`} replace />;
  if (session.phase === 'study') return <Navigate to={`/s/${code}/study`} replace />;
  // 서버 조각 그림을 받기 전에 그리면 판 모양이 한 번 바뀌어 보인다. 내 조각을 받은 뒤에 그린다
  if (remote && (board.isPending || (imagePieces.length > 0 && !images.mineSettled))) {
    return <LoadingView />;
  }

  // 서버 세션은 서버가 알려 준 판 크기와 내 칸을 쓴다
  const grid = assembly.data
    ? { rows: assembly.data.boardRows, cols: assembly.data.boardCols }
    : gridFor(session.pieceCount, session.members.length);
  const myRow = session.members.findIndex((member) => member.isMe);
  const myPieces = myPositions
    ? myPositions.map((position) => position - 1)
    : piecesOfRow(myRow, grid);
  const completed = assembly.data?.completed ?? false;
  // 아직 조각을 끼우지 않은 다른 사람. 이름을 아는 사람만 알린다
  const waitingPiece = assembly.data?.pieces.find((piece) => !piece.isMine && !piece.placed);
  const waitingName = waitingPiece
    ? members?.find((member) => member.id === remoteId(waitingPiece.participantId))?.name
    : undefined;
  // 공부가 끝나면 서버가 내 최종 복원도를 진행판에 싣는다
  const myRestoration = board.data?.pieces.find((piece) => piece.isMine)?.restoration ?? undefined;
  const boardAspect =
    pieceImages && images.cellAspect ? (images.cellAspect * grid.cols) / grid.rows : undefined;

  const onPlace = (index: number) => {
    if (!remote) return;
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
        timeline={record}
        pieceImages={pieceImages}
        padRatio={board.data?.padRatio}
        aspect={boardAspect}
        myPieces={myPieces}
        myRestoration={myRestoration}
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
      timeline={record}
      placed={placed}
      myPieces={myPieces}
      pieceImages={pieceImages}
      padRatio={board.data?.padRatio}
      aspect={boardAspect}
      myRestoration={myRestoration}
      lastPlacedBy={lastPlacedBy}
      waitingName={waitingName}
      onPlace={onPlace}
    />
  );
};
