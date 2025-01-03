FROM postgres:latest

RUN mkdir -p docker-entrypoint-initdb.d/
COPY postgresql/init.sh docker-entrypoint-initdb.d/
RUN cat docker-entrypoint-initdb.d/init.sh