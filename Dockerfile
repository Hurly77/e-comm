FROM node:lts-alpine

WORKDIR /app

COPY . .

RUN yarn install --production

CMD ["yarn", "start:prod"]

EXPOSE 4000
EXPOSE 3000
EXPOSE 5432
EXPOSE 5433
