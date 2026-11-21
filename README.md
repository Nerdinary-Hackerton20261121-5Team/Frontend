# 5팀 프론트엔드

11th NE(O)RDINARY HACKATHON 5팀의 웹 저장소입니다. 모바일 화면을 웹으로 만들어 배포하고, 주최 측 WebView 템플릿으로 감싼 APK를 제출합니다.

React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router를 씁니다.

## 시작하기

Node 22 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입 검사 포함 빌드
npm run lint
npm run format
```

첫 화면은 서버의 `GET /api` 를 호출해 연결을 확인합니다. 백엔드 저장소에서 `npm run start:dev` 로 서버(3000)를 띄우면 "서버와 연결됐어요"가 보입니다. 서버 주소는 `.env.development` 의 `VITE_API_BASE_URL` 입니다.

## 구조

```
src
├── App.tsx                 라우트 목록
├── index.css               디자인 토큰 (색, 폰트)
├── lib
│   └── api.ts              서버 호출, ApiError
├── components              Screen, Button, TextField, 상태 화면
└── features
    └── home                서버 연결 확인 화면. 실제 첫 화면으로 바꾼다
        ├── api.ts          React Query 훅
        └── HomePage.tsx
```

## 새 화면을 추가하는 순서

1. `src/features/{이름}/api.ts` 에 타입과 훅을 만든다. 서버 명세(`/docs`)의 필드 이름을 그대로 쓴다.
2. 화면 컴포넌트를 `Screen` 으로 감싸서 만든다.
3. 조회 화면에는 `LoadingView`, `EmptyView`, `ErrorView` 를 모두 넣는다.
4. `src/App.tsx` 에 라우트를 추가한다.
5. 서버에 연결해 정상, 빈 목록, 서버 중단 세 경우를 직접 확인한다.

디자인 시스템이 나오면 `src/index.css` 의 `@theme` 값을 먼저 바꿉니다. AI 도구용 규칙은 `AGENTS.md` 에 있습니다.

## 협업 규칙

- **브랜치**. 흐름은 기능 브랜치 → PR(base `dev`) → `dev` → `dev`→`main` PR → `main` 입니다. `dev`·`main` 모두 PR 승인은 필요 없고 force push·브랜치 삭제만 막혀 있습니다. `dev` 에서 딴 `feat/작업명`, `fix/작업명` 브랜치에서 작업하고 base를 `dev` 로 해서 PR을 여는 것을 기본으로 합니다(PR은 권장).
- **커밋**. 기능 단위로 나누고 `종류: 내용` 형식으로 씁니다. 예시는 `feat: 타이머 화면 추가` 입니다.

  | 종류     | 쓰는 경우                    |
  | -------- | ---------------------------- |
  | feat     | 기능 추가                    |
  | fix      | 버그 수정                    |
  | style    | 화면 수정 (동작 변화 없음)   |
  | refactor | 동작 변화 없는 코드 정리     |
  | chore    | 설정, 의존성                 |
  | docs     | 문서                         |

- **PR**. 올리기 전에 `npm run lint` 와 `npm run build` 를 통과시킵니다. 같은 검사가 PR에서 자동으로 돕니다. 팀원 한 명이 확인한 뒤 합칩니다. `dev` 에 합치면 dev 서버에 배포되니 거기서 확인한 뒤 `dev`→`main` PR로 운영에 올립니다.
- **파일 나누기**. 기능마다 `src/features/{이름}` 폴더를 따로 써서 같은 파일을 동시에 고치지 않게 합니다.

## 배포·운영 한눈에 보기

Back_End · Frontend · cluster-config 세 레포 README가 같은 표를 쓴다.

인프라 전체 구성: https://github.com/Nerdinary-Hackerton20261121-5Team/cluster-config/blob/main/docs/INFRA.md

| 항목 | 내용 |
|---|---|
| 서버 주소 | **dev** https://cmc-11th-dev.bemelon.me · **운영** https://cmc-11th.bemelon.me. 두 주소 모두 `/api/*`·`/docs*`는 BE로, 나머지는 FE로 가므로 FE와 API가 같은 origin이다 |
| API · 문서 · 버전 확인 | `<주소>/api` · Swagger `<주소>/docs`(dev·운영 둘 다 열린다) · `<주소>/api/health` → 200 `{"status":"ok","commit":"<배포된 커밋 sha>"}`. `commit`으로 그 서버에 떠 있는 빌드를 확인한다 |
| 브랜치 흐름 | 기능 브랜치 → PR(권장, base `dev`) → `dev` 머지 = dev 서버 배포 → dev에서 확인 → `dev`→`main` PR로 승격 → `main` 머지 = 운영 배포. Back_End·Frontend의 기본 브랜치는 `dev`이고, `dev`·`main` 모두 PR 승인은 필요 없다. 보호 규칙은 force push·브랜치 삭제 금지뿐이다. cluster-config는 `main`에 직접 push한다 |
| 배포 | 앱 레포(Back_End·Frontend)에 push(머지)되면 GitHub Actions `Deploy`가 이미지 `registry.bemelon.me/cmc-11th/back_end:<커밋 sha>`(BE) 또는 `.../frontend:<커밋 sha>`(FE)를 올리고 [cluster-config](https://github.com/Nerdinary-Hackerton20261121-5Team/cluster-config)에 커밋한다. `dev` push → `apps/be-dev`·`apps/fe-dev`에 `deploy(be-dev)`·`deploy(fe-dev)`, `main` push → `apps/be`·`apps/fe`에 `deploy(be)`·`deploy(fe)`. 그 뒤 Argo CD가 자동 반영한다(보통 1~3분). 배포는 머지로만 일어나고 서버에 직접 올리는 일은 없다 |
| 롤백 | cluster-config에서 해당 `deploy(...)` 커밋을 `git revert` 후 push (force push 금지). 앱 코드는 별도 PR로 고친다 |
| 상태·로그 | Argo CD https://cmc-11th-argocd.bemelon.me · 계정 `cmc-11th` · 비밀번호는 운영자에게. 앱 6개(`cmc-11th-be`·`-fe`·`-be-dev`·`-fe-dev`·`-gateway`·`-mysql`)의 상태 조회·SYNC·파드 로그만 가능하다 |
| DB | 같은 MySQL 8.4 서버에 DB가 둘이다. 운영은 사용자 `app` · DB `app`, dev는 사용자 `app_dev` · DB `app_dev`이며 서로의 DB에는 접근할 수 없다. 클러스터 안에서는 `mysql:3306`이고 BE 파드(`be`·`be-dev`)에 `DB_HOST` 등이 주입된다. 비밀번호는 운영자에게. root는 외부 접속 불가. 노트북에서는 [DB 외부 접속](#db-외부-접속) |
| CORS | BE `CORS_ORIGIN`: 운영 `be`는 `https://cmc-11th.bemelon.me`, `be-dev`는 `https://cmc-11th-dev.bemelon.me`. FE는 같은 origin이라 CORS 없이 상대 경로 `/api/...`를 부른다 |
| 마이그레이션 | TypeORM `synchronize: false`라 스키마는 마이그레이션으로만 바뀐다. 마이그레이션은 앱 시작 때 자동 실행되지 않고 `npm run migration:run`으로 직접 돌린다(DB 연결 코드 Back_End PR #3이 머지된 뒤부터). 배포는 이미지만 교체한다 |

### DB 외부 접속

노트북의 MySQL 클라이언트(DBeaver·DataGrip·`mysql` CLI)로 DB에 붙는 방법은 두 가지다. 운영 DB는 사용자 `app` · 데이터베이스 `app`, dev DB는 사용자 `app_dev` · 데이터베이스 `app_dev`이고(아래 예시는 dev, 운영은 `app`으로 바꾼다), 비밀번호는 운영자에게 받는다. 비밀번호는 `.env` 같은 로컬 파일에만 두고 레포·이슈·PR·공개 채팅에 쓰지 않는다(이 주소는 인터넷에 열려 있고 보호막은 비밀번호뿐이다. 새어 나가면 바로 운영자에게 알린다). 백업이 없으니 `DROP`·대량 `DELETE` 전에 한 번 더 확인한다. 해커톤이 끝나면 닫힌다.

1. **cloudflared** (누구나, 비밀번호만 있으면 된다). 설치는 macOS `brew install cloudflared`, Windows `winget install --id Cloudflare.cloudflared`. 터미널 하나를 켜 둔 채로 쓴다.

   ```sh
   cloudflared access tcp --hostname cmc-11th-db.bemelon.me --url 127.0.0.1:13306
   mysql -h 127.0.0.1 -P 13306 -u app_dev -p app_dev    # 다른 터미널에서
   ```

2. **Tailscale** (운영자가 `bemelon` 노드를 공유한 사람만). Tailscale 앱을 켠 상태(tailnet 안)에서만 열리고 cloudflared 없이 바로 접속한다. 이름이 안 풀리면 호스트에 `100.105.208.85`를 쓴다.

   ```sh
   mysql -h bemelon.tailc71c61.ts.net -P 30306 -u app_dev -p app_dev
   ```

## 배포 상세 (Frontend)

`dev` 에 합쳐지면 dev 서버(https://cmc-11th-dev.bemelon.me)에, `main` 에 합쳐지면 운영(https://cmc-11th.bemelon.me)에 GitHub Actions가 홈서버(k3s)로 자동 배포합니다. Vercel은 쓰지 않습니다.

```
dev 또는 main 에 합쳐짐
  └─ .github/workflows/deploy.yml
       ├─ Dockerfile 로 이미지 빌드 (linux/amd64) → registry.bemelon.me/cmc-11th/frontend:<커밋 sha>
       └─ cluster-config 의 deploy-image 호출 → 이미지 태그 커밋
            ├─ dev  → app=fe-dev, 커밋 "deploy(fe-dev): ..." → dev 서버
            └─ main → app=fe,     커밋 "deploy(fe): ..."     → 운영
Argo CD 가 그 커밋을 감지해 롤링 업데이트
```

- 이미지는 `node:22-alpine` 에서 빌드한 정적 파일을 `nginx:1.27-alpine` 이 80 포트로 서빙합니다. 설정은 `deploy/nginx.conf` 이고, 없는 경로는 `index.html` 로 보냅니다.
- 같은 origin이라 배포 빌드에서는 `VITE_API_BASE_URL` 을 빈 값으로 두고 `/api/...` 를 부릅니다. gateway가 `/api`·`/docs` 는 서버로, 나머지는 FE로 보내며 dev 주소는 `be-dev`·`fe-dev` 로 갑니다. 로컬 개발에서만 `.env.development` 의 `VITE_API_BASE_URL` 로 서버 주소를 지정합니다.
- PR에서는 `CI`(lint·build)만 돌고 배포는 일어나지 않습니다. 배포는 `dev`·`main` 에서만 일어나고, `Deploy` 를 수동 실행(Run workflow)할 때도 `dev` 또는 `main` 만 고릅니다.
- 운영 반영은 dev에서 확인한 뒤 `dev`→`main` PR을 머지하는 것뿐입니다. 이 PR에는 `dev` 에만 있는 커밋이 모두 실리니 머지 전에 커밋 목록을 확인합니다.
- 배포 워크플로는 레포 secret `ZOT_USERNAME`·`ZOT_PASSWORD`(운영자 사설 레지스트리 `registry.bemelon.me`, CI 계정은 `cmc-11th/*` 에만 push)와 `CLUSTER_CONFIG_DEPLOY_KEY` 를 씁니다. 모두 운영자가 등록하며 값은 공유하지 않습니다.
- 레이어 하나가 100MB를 넘으면 push가 `413`으로 실패하니(Cloudflare 한도) 큰 파일을 이미지에 넣지 않습니다.
- 롤백은 [cluster-config](https://github.com/Nerdinary-Hackerton20261121-5Team/cluster-config) 에서 해당 `deploy(fe)`(운영)·`deploy(fe-dev)`(dev) 커밋을 `git revert` 해 push합니다. 이 레포의 코드는 별도 PR로 고칩니다.
- 로컬에서 이미지를 확인하려면 `docker build --platform linux/amd64 -t frontend .` 후 `docker run -p 8080:80 frontend` 를 실행합니다.
- 기여 규칙(브랜치·PR, 하면 안 되는 것)은 [AGENTS.md](AGENTS.md) 에 있습니다.

## 앱(APK)

주최 측 WebView 템플릿이 배포된 웹 주소를 띄웁니다. 접속 주소는 운영 주소 **https://cmc-11th.bemelon.me** 입니다(dev 서버가 아닙니다). 웹을 고쳐 `dev` 에서 확인한 뒤 `main` 에 합쳐 운영에 배포하면 앱에도 바로 반영되고 APK를 다시 만들 필요가 없습니다.

- APK를 다시 빌드하는 경우는 앱 이름, 아이콘, 패키지명, 스플래시, 접속 주소를 바꿀 때뿐입니다. 접속 주소를 이 주소로 바꾼 뒤에는 한 번 다시 빌드해야 합니다(주최 측 템플릿에서 팀이 직접 합니다. 이 레포 밖 작업입니다).
- 앱에서는 `https` 주소만 열립니다. 서버 주소도 `https` 여야 합니다.
- 웹에서 안 되는 기능은 앱에서도 안 됩니다. 앱이 백그라운드로 가거나 화면이 꺼지면 웹 코드가 멈추므로, 타이머는 시작 시각을 저장해 계산합니다.

## 웹 파트 심사 기준

기본 100점에 가산점 최대 10점입니다.

| 항목                | 배점 | 내용                                                                 |
| ------------------- | ---- | -------------------------------------------------------------------- |
| 기능 구현 완성도    | 30   | 핵심 기능 20, 끊기지 않는 시나리오 5, 에러 처리 2.5, 빈 상태 2.5     |
| 디자인 구현 완성도  | 20   | 시안과 레이아웃, 간격, 타이포그래피, 색상 일치                       |
| 서버 및 API 연동    | 20   | 전체 연동 20. 목 데이터만 쓰면 0                                     |
| 애플리케이션 완성도 | 20   | APK 설치와 실행 10, 앱에서 안내 없이 안 되는 기능은 건당 2점 감점    |
| 팀워크              | 10   | 작업별 커밋 분리 5, 협업 컨벤션 5                                    |
| 가산점              | 5    | 스플래시 이미지 처리                                                 |
