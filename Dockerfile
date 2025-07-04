FROM node:alpine3.19 AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

RUN npm run build
RUN ls -R /app/public

FROM node:alpine3.19 AS deploy

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install --omit=dev

COPY --from=build /app/public ./public
COPY --from=build /app/views ./views
COPY --from=build /app/routes ./routes
COPY --from=build /app/services ./services
COPY --from=build /app/utils ./utils
COPY --from=build /app/middleware ./middleware
COPY --from=build /app/server.js .
COPY --from=build /app/config.js .
COPY --from=build /app/validators ./validators

EXPOSE 3000
CMD ["npm", "run", "start"]
