import { cn } from '@/lib/cn';
import { blurRatio } from '../limits';
import type { Grid } from '../puzzle';
import type { Member } from '../types';
import { CellRing } from './CellRing';
import { MyPieceLabel } from './MyPieceLabel';

interface StudyBoardProps {
  width: number;
  height: number;
  grid: Grid;
  /** 조각마다 맡은 사람 번호(members 의 순서) */
  owners: number[];
  members: Member[];
  photoUrl: string | null;
  /**
   * 칸마다 사진의 어느 칸을 보여 줄지(왼쪽 위부터 0). 서버가 정답 칸이 드러나지 않게 섞어 준 순서다.
   * 없으면 사진을 제자리 그대로 보여 준다
   */
  sources?: number[];
  /** 내 조각을 얼마나 흐리게 할지(px). 시간을 채울수록 0 에 가까워진다 */
  myBlur: number;
  away: boolean;
  /** 판을 감싼 카드의 모서리 둥글기(px). 모서리에 놓인 내 조각의 테두리도 같은 곡선을 따른다 */
  radius: number;
}

// 칸 안쪽으로 고리와 이름표를 띄우는 거리
const INSET = 10;
// 내 조각 테두리 두께(px). 사진 위에서도 잘 보이게 굵게 둔다
const BORDER = 3;

/** 06 공부 화면의 사진 판. 내 조각만 선명하게, 다른 사람 조각은 흐리게 보이고 칸마다 채운 정도를 고리로 보여 준다 */
export const StudyBoard = ({
  width,
  height,
  grid,
  owners,
  members,
  photoUrl,
  sources,
  myBlur,
  away,
  radius,
}: StudyBoardProps) => {
  if (width === 0 || height === 0) return null;
  const cellW = width / grid.cols;
  const cellH = height / grid.rows;
  const myIndex = members.findIndex((member) => member.isMe);
  const me = members[myIndex];
  const cells = owners.map((owner, index) => ({
    index,
    owner,
    x: (index % grid.cols) * cellW,
    y: Math.floor(index / grid.cols) * cellH,
  }));
  const mine = cells.filter((cell) => cell.owner === myIndex);
  // 이 칸에 보여 줄 사진 부분의 왼쪽 위 좌표
  const sourceOf = (index: number) => {
    const source = sources?.[index] ?? index;
    return { x: (source % grid.cols) * cellW, y: Math.floor(source / grid.cols) * cellH };
  };

  // 판의 네 모서리에 놓인 칸은 카드처럼 그 모서리만 둥글게 해서 테두리가 잘리지 않게 한다
  const cornerRadius = (index: number) => {
    const row = Math.floor(index / grid.cols);
    const col = index % grid.cols;
    const top = row === 0;
    const bottom = row === grid.rows - 1;
    const left = col === 0;
    const right = col === grid.cols - 1;
    return {
      borderTopLeftRadius: top && left ? radius : 0,
      borderTopRightRadius: top && right ? radius : 0,
      borderBottomLeftRadius: bottom && left ? radius : 0,
      borderBottomRightRadius: bottom && right ? radius : 0,
    };
  };

  return (
    <div className='absolute inset-0'>
      {photoUrl &&
        (sources ? (
          // 다른 사람의 조각. 공부하는 동안에는 어떤 그림인지 알아볼 수 없게 흐리게만 보여 준다
          cells
            .filter((cell) => cell.owner !== myIndex)
            .map((cell) => (
              <div
                key={cell.index}
                style={{ left: cell.x, top: cell.y, width: cellW, height: cellH }}
                className='absolute overflow-hidden'
              >
                <img
                  src={photoUrl}
                  alt=''
                  style={{
                    width,
                    height,
                    left: -sourceOf(cell.index).x,
                    top: -sourceOf(cell.index).y,
                    // 공부하는 동안 남의 조각은 가장 흐린 단계로 보여 준다
                    filter: `blur(${cellW * blurRatio(0)}px) brightness(0.75)`,
                  }}
                  className='absolute max-w-none object-cover'
                />
              </div>
            ))
        ) : (
          <img
            src={photoUrl}
            alt=''
            className='absolute inset-0 size-full object-cover blur-[10px] brightness-75'
          />
        ))}

      {mine.map((cell) => (
        <div
          key={cell.index}
          style={{
            left: cell.x,
            top: cell.y,
            width: cellW,
            height: cellH,
            ...cornerRadius(cell.index),
          }}
          className={cn(
            'absolute overflow-hidden border-[3px]',
            away ? 'border-status-away' : 'border-brand-primary',
          )}
        >
          {photoUrl && (
            // 판 전체 크기의 사진을 옮겨 이 칸에 해당하는 부분만 보이게 한다
            <img
              src={photoUrl}
              alt=''
              style={{
                width,
                height,
                left: -sourceOf(cell.index).x - BORDER,
                top: -sourceOf(cell.index).y - BORDER,
                filter: myBlur > 0 ? `blur(${myBlur}px)` : undefined,
              }}
              className='absolute max-w-none object-cover'
            />
          )}
        </div>
      ))}

      {Array.from({ length: grid.cols - 1 }, (_, i) => (
        <span
          key={`col-${i}`}
          style={{ left: (i + 1) * cellW }}
          className='absolute inset-y-0 w-px bg-white/20'
        />
      ))}
      {Array.from({ length: grid.rows - 1 }, (_, i) => (
        <span
          key={`row-${i}`}
          style={{ top: (i + 1) * cellH }}
          className='absolute inset-x-0 h-px bg-white/20'
        />
      ))}

      {cells
        .filter((cell) => cell.owner !== myIndex && members[cell.owner])
        .map((cell) => (
          <CellRing
            key={cell.index}
            value={members[cell.owner].progress}
            away={members[cell.owner].status !== 'recording'}
            left={cell.x + INSET}
            top={cell.y + INSET}
          />
        ))}
      {me && mine[0] && (
        <MyPieceLabel
          progress={me.progress}
          away={away}
          left={mine[0].x + INSET}
          top={mine[0].y + INSET}
        />
      )}
    </div>
  );
};
