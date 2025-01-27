FROM node:18.0-alpine3.14 as build-stage

WORKDIR /app

COPY package.json .

RUN yarn install

COPY . .

RUN npm run build

# production stage
FROM node:18.0-alpine3.14 as production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json

WORKDIR /app

RUN yarn install --production

EXPOSE 3001

CMD ["node", "/app/main.js"]
