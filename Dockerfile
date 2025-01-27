# 1.Build stage
FROM node:18.20.6-alpine3.21 AS build-stage

WORKDIR /app

# Copy package.json and yarn.lock separately to leverage Docker cache
COPY package.json yarn.lock .

# Install dependencies (node镜像自带yarn)
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn run build

# 2.production stage
FROM node:18.20.6-alpine3.21 AS production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json

WORKDIR /app

RUN yarn install --production

EXPOSE 3001

CMD ["node", "/app/main.js"]
