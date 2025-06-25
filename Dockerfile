FROM node:alpine3.19 AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .  # gunakan lock file untuk npm
RUN npm install

COPY . .

RUN npm run build

FROM node:alpine3.19 AS deploy

WORKDIR /app

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .  # pastikan ini juga disalin

RUN npm install --omit=dev  # hanya install dependencies production

CMD ["npm", "run", "start"]
