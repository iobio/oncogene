FROM quay.io/iobio/iobio-gru-backend:1.6.0

ARG oncogene_version=master
RUN git clone --depth 1 --branch ${oncogene_version} https://github.com/iobio/oncogene /oncogene

WORKDIR /oncogene

COPY demo.json ./src/data/

RUN ["npm", "install"]
RUN ["npm", "run", "build"]
RUN ["mv", "dist", "/app"]

RUN chmod 777 /app

RUN mkdir -p /app/config
RUN chmod a+w /app/config

WORKDIR /iobio-gru-backend

RUN rm -rf /oncogene

CMD ["node", "/iobio-gru-backend/src/index.js", "--app-dir=/app"]
