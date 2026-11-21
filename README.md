# Pocus 웹

한 조각씩, 함께 한 장.

Pocus 는 여럿이 함께 공부하는 집중 세션입니다. 방장이 사진 한 장을 올리면 참가자마다 조각 2개를 맡습니다. 카메라에 얼굴이 보이는 동안만 공부 시간이 쌓이고, 시간이 끝나면 조각을 함께 끼워 사진을 완성합니다. 조각은 주인이 집중한 만큼만 선명합니다.

11th NE(O)RDINARY HACKATHON 5팀의 웹 저장소입니다. 모바일 화면을 웹으로 만들어 배포하고, 같은 주소를 WebView 로 감싼 APK 를 제출합니다.

|          | 주소                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 운영     | https://cmc-11th.bemelon.me                                               |
| dev      | https://cmc-11th-dev.bemelon.me                                           |
| API 명세 | https://cmc-11th.bemelon.me/docs                                          |
| 백엔드   | [Back_End](https://github.com/Nerdinary-Hackerton20261121-5Team/Back_End) |

## 사용 흐름

1. 방장이 사진을 올리고 인원(4~6명)과 목표 시간을 정해 방을 만듭니다.
2. 초대 링크나 참여 코드로 친구들이 들어와 이름을 정합니다.
3. 각자 카메라를 켜고 공부합니다. 얼굴이 보이는 동안만 시간이 쌓이고 내 조각이 선명해집니다.
4. 시간이 끝나면 자기 조각을 끌어다 제자리에 끼웁니다. 모두 끼우면 사진이 공개됩니다.

로그인은 없습니다. 방을 만들거나 들어올 때 받은 토큰으로 참가자를 구분합니다.

## 기술 스택

React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router, Zustand, MediaPipe

## 시작하기

Node 22 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입 검사 포함 빌드
npm run lint
npm run format
```

로컬에서는 백엔드 저장소의 서버(3000)를 함께 띄웁니다. 서버 주소는 `.env.development` 의 `VITE_API_BASE_URL` 입니다. 배포된 웹은 서버와 주소가 같아 `/api/...` 로 바로 부릅니다.

## 서버 연동

세션 데이터는 모두 서버에서 옵니다. 호출은 `src/features/session/api.ts` 한 파일에 모여 있습니다.

| 화면                         | API                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 방 만들기 (사진, 인원, 시간) | `POST /api/sessions`<br>`POST /api/images`<br>`PATCH /api/sessions/{id}/image`                                                                                                                                  |
| 참여 (코드 입력, 초대 링크)  | `POST /api/sessions/join`<br>`PATCH /api/sessions/{id}/participants/me`<br>`DELETE /api/sessions/{id}/participants/me`                                                                                          |
| 초대, 대기실                 | `GET /api/sessions/{id}`<br>`POST /api/sessions/{id}/start`                                                                                                                                                     |
| 공부 중                      | `POST /api/sessions/{id}/heartbeat`<br>`GET /api/sessions/{id}/board`<br>`POST /api/sessions/{id}/end`                                                                                                          |
| 퍼즐 맞추기, 완성            | `GET /api/sessions/{id}/assembly`<br>`PATCH /api/sessions/{id}/assembly/pieces/{pieceId}`<br>`GET /api/sessions/{id}/pieces/{position}/image`<br>`GET /api/sessions/{id}/result`<br>`DELETE /api/sessions/{id}` |

- 참가자 토큰은 `X-Participant-Token` 헤더로 보냅니다.
- 서버는 `{ success, code, message, data }` 로 응답합니다. `src/lib/api.ts` 가 `data` 만 꺼내 돌려주고, 실패는 `ApiError` 로 바꿉니다.
- 얼굴 인식은 기기 안에서만 돕니다. 영상은 서버로 가지 않고, 자리에 있음, 자리 비움, 일시정지 상태만 heartbeat 로 보냅니다. 상태가 바뀌면 바로 보내고 평소에는 3초마다 보냅니다.
- 조각의 흐림은 서버와 같은 공식을 씁니다(`limits.ts` 의 `blurRatio`). 어느 기기에서 보아도 같은 그림이 됩니다.

## 구조

```
src
├── App.tsx                 라우트 목록
├── styles                  디자인 토큰 (colors.css, typography.css)
├── lib
│   ├── api.ts              서버 호출, ApiError
│   └── cn.ts               클래스 합치기
├── shared                  공통 컴포넌트 (Button, Header, BottomSheet ...)
├── components              불러오는 중, 오류 화면
└── features
    ├── attention           카메라 영상으로 자리에 있는지 판정
    └── session
        ├── api.ts          서버 호출과 React Query 훅
        ├── store.ts        서버에서 읽은 세션 상태
        ├── pages           화면 하나에 파일 하나
        └── components      화면 안의 조각
```

새 화면을 만드는 방식과 코드 규칙은 [AGENTS.md](AGENTS.md) 에 있습니다.

## 협업 규칙

- 브랜치는 `feat/작업명`, `fix/작업명` 으로 `dev` 에서 따고, base 를 `dev` 로 해서 PR 을 엽니다.
- PR 을 올리기 전에 `npm run lint` 와 `npm run build` 를 통과시킵니다. 같은 검사가 PR 에서 자동으로 돕니다.
- 커밋은 기능 단위로 나누고 `종류: 내용` 형식으로 씁니다.

| 종류     | 쓰는 경우                  |
| -------- | -------------------------- |
| feat     | 기능 추가                  |
| fix      | 버그 수정                  |
| style    | 화면 수정 (동작 변화 없음) |
| refactor | 동작 변화 없는 코드 정리   |
| chore    | 설정, 의존성               |
| docs     | 문서                       |
| ci       | 배포, 검사 워크플로        |

## 배포

`dev` 에 합쳐지면 dev 서버에, `main` 에 합쳐지면 운영에 자동으로 배포됩니다. 운영에는 dev 서버에서 확인한 뒤 `dev` → `main` PR 로 올립니다.

```
dev 또는 main 에 합쳐짐
  └─ GitHub Actions (.github/workflows/deploy.yml)
       ├─ 이미지 빌드 후 레지스트리에 push
       └─ 배포 설정 저장소에 새 이미지 태그를 커밋
Argo CD 가 그 커밋을 감지해 클러스터에 반영 (1~3분)
```

- 이미지는 빌드한 정적 파일을 nginx 가 80 포트로 서빙합니다. 설정은 `deploy/nginx.conf` 입니다.
- PR 에서는 검사(`CI`)만 돌고 배포는 일어나지 않습니다.
- 서버에 떠 있는 버전은 `/api/health` 의 `commit`(백엔드)과 페이지의 번들 파일 이름(프론트)으로 확인합니다.
- 인프라 구성도는 [Back_End README](https://github.com/Nerdinary-Hackerton20261121-5Team/Back_End#인프라-구성도) 에 있습니다.

## 앱 (APK)

APK 는 운영 주소(https://cmc-11th.bemelon.me)를 WebView 로 엽니다. 웹을 운영에 배포하면 앱에도 바로 반영되므로 APK 를 다시 만들 필요가 없습니다. 다시 빌드하는 경우는 앱 이름, 아이콘, 스플래시, 접속 주소를 바꿀 때뿐입니다.

앱이 백그라운드로 가거나 화면이 꺼지면 웹 코드가 멈춥니다. 그래서 공부 시간은 서버가 heartbeat 로 세고 화면은 그 값을 따릅니다. 공부하는 동안에는 화면이 저절로 꺼지지 않게 합니다.
