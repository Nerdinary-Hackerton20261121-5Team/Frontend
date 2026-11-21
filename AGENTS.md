# AGENTS.md

해커톤 5팀 프론트엔드 저장소다. 모바일 화면 하나를 웹으로 만들어 홈서버(k3s, 운영 https://cmc-11th.bemelon.me, dev https://cmc-11th-dev.bemelon.me)에 배포하고, 주최 측 WebView 템플릿으로 감싼 APK를 제출한다. 심사자는 앱을 실행해 핵심 기능을 끝까지 써 보고, 코드에서 실제 서버와 통신하는지 확인한다. 목 데이터만 쓰면 API 연동 항목이 0점이다.

## 새 기능을 만드는 방식

`src/features/home` 이 가장 작은 본보기다. 새 기능은 `src/features/{이름}/` 에 같은 구성으로 만든다.

- **서버 호출**. `features/{이름}/api.ts` 에 타입과 React Query 훅(`useQuery`, `useMutation`)을 만들고, 훅 안에서 `lib/api.ts` 의 `api.get/post/put/patch/delete` 를 쓴다. 변경이 성공하면 관련 쿼리를 `invalidateQueries` 한다.
- **화면 틀**. 모든 화면은 `Screen` 으로 감싼다. 주요 버튼은 `footer` 에 둔다.
- **세 가지 상태**. 데이터를 불러오는 화면은 `LoadingView`, `EmptyView`, `ErrorView` 를 모두 그린다. `ErrorView` 에는 `onRetry` 를 넘긴다.
- **변경 요청**. 버튼에 `loading` 을 넘겨 중복 요청을 막고, 실패하면 `ApiError.message` 를 화면에 보여 준다.
- **스타일**. Tailwind 클래스를 쓰고, 색과 글자는 `src/styles` 의 `@theme` 토큰으로 쓴다. 색은 `colors.css` 의 용도별 토큰(`bg-bg-default`, `text-text-primary`, `bg-brand-primary`)을 쓰고 원색(`--green-400`)은 직접 쓰지 않는다. 글자는 `typography.css` 의 토큰(`text-title-l`, `text-body-m-medium`)을 쓴다. 새 색은 토큰에 먼저 추가한다.
- **라우트**. `src/App.tsx` 의 `Routes` 에 추가한다. 화면 이동은 `Link` 와 `useNavigate` 를 쓴다.
- **상태**. 서버 데이터는 React Query, 입력값은 `useState` 로 다룬다.
- **컴포넌트 작성**. 컴포넌트와 훅은 `export const Button = ({ ... }: ButtonProps) => { ... }` 처럼 화살표 함수로 선언한다. 파일 하나에는 컴포넌트를 하나만 두고, 파일 이름을 컴포넌트 이름과 같게 한다. 작은 하위 컴포넌트도 파일을 나눈다.
- **타입 선언**. 컴포넌트 props 는 `interface ButtonProps { ... }` 처럼 `interface` 로 컴포넌트 파일 안에 선언한다. 그 밖의 타입은 `type User = { ... }` 처럼 `type` 으로 선언한다. 서버 응답 타입은 그 기능의 `api.ts` 에 둔다.
- **import 경로**. `src` 아래 파일은 `@/components/Button` 처럼 `@/` 로 시작하는 경로로 가져온다. 같은 폴더 안의 파일만 `./` 를 쓴다.

## 화면은 Figma를 그대로 옮긴다

사람이 디자인한 시안이 기준이다. 구현은 시안의 재현이고, 시안에 없는 것을 더하는 일이 아니다.

- **수치**. 간격, 크기, 모서리, 글자 크기와 굵기와 행간, 색은 Figma에서 읽은 값을 쓴다. 디자인 시스템에 있는 값은 `@theme` 토큰으로, 한 번만 쓰이는 값은 `p-[18px]` 처럼 정확한 값으로 쓴다.
- **아이콘과 이미지**. 디자이너가 준 SVG와 PNG를 `src/assets` 에 넣어 쓴다. 에셋이 없으면 사용자에게 요청한다. 이모지와 유니코드 기호는 아이콘 자리에 쓰지 않는다.
- **문구**. Figma의 문구를 글자 그대로 쓴다. 시안에 없는 문구가 필요하면 짧은 평서문으로 쓰고 사용자에게 알린다.
- **장식**. 그라데이션, 그림자, 테두리, 애니메이션은 시안에 있는 것만 넣는다.
- **시안에 없는 화면과 상태**. 로딩, 빈 목록, 에러처럼 시안이 없는 상태는 `src/components` 의 `LoadingView`, `EmptyView`, `ErrorView` 를 쓰고, 새 형태가 필요하면 만들기 전에 사용자에게 묻는다.
- **폰트**. Pretendard가 번들에 포함돼 있다. 다른 폰트는 npm 패키지나 `src/assets` 로 번들에 넣는다.
- **코드**. 쓰이는 컴포넌트와 옵션만 만든다. 주석은 이유를 적어야 하는 곳에 한 줄로 쓴다.

화면을 만든 뒤에는 시안과 나란히 놓고 402px 폭에서 간격, 줄바꿈, 글자 굵기를 비교한다.

## 완료 기준

`npm run build` 와 `npm run lint` 가 통과하고, 추가한 화면이 서버와 연결된 상태에서 로딩, 빈 목록, 실패 세 경우 모두 확인됐다.

## 범위

애니메이션, 전역 상태 라이브러리, 로그인은 팀이 결정했다고 사용자가 말한 경우에만 추가한다. 서버 API가 아직 없어서 임시 데이터를 쓸 때는 `// TODO(mock)` 주석을 달고 사용자에게 알린다.

## 이 저장소에서 헷갈리는 것

- 서버는 NestJS이고 로컬 주소는 `http://localhost:3000`, 모든 경로에 `/api` 가 붙는다. 명세는 `http://localhost:3000/docs` 에 있다.
- 서버는 `{ success, code, message, data }` 로 응답한다. `lib/api.ts` 가 성공이면 `data` 만 꺼내 돌려주고, 실패면 `message` 와 `code` 를 담은 `ApiError` 로 바꾼다. 그래서 `api.get<T>` 의 `T` 는 `data` 의 타입이다. 공통 응답 형식이 바뀌면 그 파일 하나만 고친다.
- 앱은 배포된 웹 주소를 WebView로 띄운다. 웹에서 안 되는 기능은 앱에서도 안 되고, 앱이 백그라운드로 가면 웹 코드는 멈춘다.
- 앱에서는 `https` 주소만 호출된다. 배포된 웹은 서버와 같은 origin이라 `/api/...` 상대 경로로 부르고, 로컬 개발에서만 `VITE_API_BASE_URL` 로 서버 주소를 준다.
- `HashRouter` 를 쓴다. 주소는 `/#/경로` 형태다.
- React Router는 `react-router` 패키지에서 import 한다 (`react-router-dom` 아님).
- Tailwind 4다. 설정 파일 없이 `src/styles/*.css` 의 `@theme` 으로 토큰을 정의하고 `src/index.css` 에서 import 한다.
- `dev` 에 합쳐지면 dev 서버에, `main` 에 합쳐지면 운영에 바로 배포된다. 작업은 `feat/작업명` 브랜치에서 하고 base를 `dev` 로 해서 PR로 합친다.
- 커밋은 기능 단위로 나누고 `feat: 타이머 화면 추가` 형식을 쓴다.

## 협업·배포 규칙 (사람·AI 기여자 공통)

배포 흐름과 주소는 [README의 배포·운영 한눈에 보기](README.md#배포운영-한눈에-보기)에 있다.

### 브랜치·PR

- 흐름은 **기능 브랜치 → PR(base `dev`) → `dev` → `dev`→`main` PR → `main`** 이다. `dev` 에서 딴 `feat/작업명`, `fix/작업명`, `docs/작업명` 브랜치에서 작업하고 **base를 `dev` 로 해서 PR**을 여는 것을 기본으로 한다(PR은 권장이고, GitHub 기본 브랜치가 `dev` 다). `dev`·`main` 모두 PR 승인은 필요 없다. 보호 규칙은 force push·브랜치 삭제 금지뿐이므로 force push·rebase로 공유 이력을 고치지 않고 브랜치를 지우지 않는다.
- 운영 반영은 dev 서버에서 확인한 뒤 `dev`→`main` PR을 여는 것으로만 한다. 이 PR에는 `dev` 에만 있는 커밋이 모두 실리니 머지 전에 커밋 목록·diff를 확인한다.
- 커밋은 기능 단위로 나누고 `종류: 내용` 형식(`feat`·`fix`·`style`·`refactor`·`chore`·`docs`)을 쓴다. PR 본문은 `.github/pull_request_template.md` 양식을 채우고 관련 이슈는 `closes #번호` 로 잇는다.
- PR을 열기 전에 `npm run lint` 와 `npm run build` 를 통과시킨다. 같은 검사(`CI`)가 PR에서 자동으로 돌고, 팀원 한 명이 확인한 뒤 합친다.
- 커밋·PR에 AI 공동작성자(Co-Authored-By)나 에이전트 도구 표기를 넣지 않는다.
- 같은 파일을 동시에 고치지 않도록 기능마다 `src/features/{이름}` 폴더를 따로 쓴다. 공통 컴포넌트·`lib/api.ts`·라우트 목록은 바꾸기 전에 팀에 알린다.

### 배포

- 배포는 **`dev`·`main` 머지로만** 일어난다. `dev` 머지는 https://cmc-11th-dev.bemelon.me (dev 서버), `main` 머지는 곧바로 https://cmc-11th.bemelon.me (운영)에 반영되므로 CI가 초록인지 확인하고 합친다. 머지 뒤에는 Actions `Deploy` 가 초록인지, 그 주소 화면에 반영됐는지 본다.
- 수동 배포는 하지 않는다. 이미지를 직접 올리거나 `kubectl`·Argo CD 화면으로 운영 리소스를 고치지 않는다. `Deploy` 를 수동 실행할 때도 `dev` 또는 `main` 만 고른다.
- 문제가 생기면 [cluster-config](https://github.com/Nerdinary-Hackerton20261121-5Team/cluster-config) 에서 해당 `deploy(fe)`(운영)·`deploy(fe-dev)`(dev) 커밋을 `git revert` 해 push한다(force push 금지). 이 레포의 코드는 별도 PR로 고친다.
- Vercel은 쓰지 않는다. 배포 주소는 dev https://cmc-11th-dev.bemelon.me 와 운영 https://cmc-11th.bemelon.me 두 개이고, APK는 운영 주소를 띄운다.
- 이미지는 `linux/amd64`(홈서버)로 빌드한다. 레이어 하나가 100MB를 넘으면 레지스트리 push가 `413` 으로 실패하니(Cloudflare 한도) 큰 영상·원본 이미지를 `src/assets` 나 `public` 에 넣지 않는다.

### 비밀값

- 이 저장소는 공개다. 비밀번호·토큰·API 키를 코드·문서·이슈·PR·커밋 메시지·스크린샷에 올리지 않는다. 브라우저로 내려가는 `VITE_` 변수는 누구나 읽을 수 있으니 비밀을 넣지 않는다.
- 필요한 환경변수 이름은 `VITE_API_BASE_URL` 하나다(로컬 개발용 서버 주소, `.env.development`). 배포 빌드는 빈 값으로 두고, 값은 `.env.example` 에 예시만 둔다. `.env` 는 `.gitignore` 에 있다.
- 비밀이 필요한 기능이면 직접 넣지 말고 운영자에게 묻는다. 실수로 올렸다면 바로 알려 교체한다.

### 코드 계약 (바꾸면 배포가 깨진다)

- 서버 호출은 같은 origin의 상대 경로 `/api/...` 로 한다(`lib/api.ts`). 배포 주소를 코드에 적지 않는다. gateway가 `/api`·`/docs` 는 서버(BE)로, 나머지는 이 FE로 보낸다(dev 주소는 be-dev·fe-dev).
- `HashRouter` 를 유지한다. 주소는 `/#/경로` 형태이고, 정적 호스팅과 앱(WebView) 어디서든 새로고침·딥링크가 서버 설정 없이 동작한다.
- 컨테이너는 **80 포트**에서 받고 `GET /` 가 200이어야 한다(파드 probe). `Dockerfile`·`deploy/nginx.conf`(없는 경로는 `index.html`)의 포트와 fallback을 유지한다.
- `Dockerfile` 의 `VITE_API_BASE_URL` 기본값과 `deploy.yml` 의 빈 `build-args` 를 유지한다. 값이 들어가면 배포된 웹이 다른 origin을 불러 CORS로 막힌다.
- `.github/workflows/`·`Dockerfile`·`deploy/` 는 배포에 영향이 있으니 바꾸기 전에 운영자와 맞춘다.

### 막히면

클러스터·레지스트리·Argo CD 비밀번호·배포 실패처럼 이 저장소 밖의 문제는 **운영자**에게 묻는다. 배포 상태와 파드 로그는 https://cmc-11th-argocd.bemelon.me(계정 `cmc-11th`)에서 먼저 확인하고, 본 내용을 함께 전한다.
