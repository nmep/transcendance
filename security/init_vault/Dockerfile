FROM alpine:3.21.3

RUN apk update

RUN  apk add curl jq bash

COPY ./tools /

RUN chmod 755 /entrypoint.sh

RUN chmod 755 /check_requirements.sh

RUN mkdir -p /logs  /vault/data /secret/ips

RUN chmod 755 /logs  /vault/data /secret/ips /secret/

RUN chown -R 1000:4316 /secret /logs /vault

USER 1000

ENTRYPOINT [ "./entrypoint.sh" ]