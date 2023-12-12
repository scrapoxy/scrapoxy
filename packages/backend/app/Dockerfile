FROM node:20.9.0-alpine3.18

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup --system scrapoxy && \
    adduser --system -G scrapoxy scrapoxy

COPY ["dist/scrapoxy/package*.json", "./"]

RUN npm install --production

COPY dist/scrapoxy .

RUN chown -R scrapoxy:scrapoxy .

CMD [ "node", "scrapoxy.js" ]
