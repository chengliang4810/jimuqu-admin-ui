FROM node:22.18.0-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
