FROM alpine:3.15

RUN apk add nodejs

ENV CDS_DATA_DIR=/data

COPY ./src /app

CMD [ "node", "/app/app.js" ]