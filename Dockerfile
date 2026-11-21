# 홈서버(k3s) 배포용 이미지. 빌드한 정적 파일을 nginx가 80 포트로 서빙한다.
# Vercel 배포는 이 파일을 쓰지 않는다.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 홈서버는 gateway 뒤에서 FE와 API가 같은 origin이므로 기본값은 빈 값(상대 경로 /api/...)이다.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
