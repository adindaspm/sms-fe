FROM node:alpine3.19 AS build

WORKDIR /app
RUN npm install -g pnpm

COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:alpine3.19 AS deploy

WORKDIR /app
RUN npm install -g pnpm

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json .
COPY --from=build /app/pnpm-lock.yaml .

RUN pnpm install --prod

CMD ["pnpm", "run", "start"]