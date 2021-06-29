FROM quay.io/iobio/iobio-gru-backend:latest

ARG oncogene_branch=master
RUN git clone --depth 1 --branch ${oncogene_branch} https://github.com/iobio/oncogene /oncogene
#RUN git clone --depth 1 --branch ${oncogene_branch} https://github.com/anderspitman/oncogene /oncogene

WORKDIR /oncogene

COPY galaxy_config.json ./public

RUN ["npm", "install"]

COPY demo.json ./

RUN ["npm", "run", "build-galaxy"]
RUN ["mv", "dist", "/app"]

RUN mkdir -p /app/config
RUN chmod a+w /app/config

WORKDIR /iobio-gru-backend

RUN rm -rf /oncogene

CMD ["node", "/iobio-gru-backend/src/index.js", "--app-dir=/app"]
