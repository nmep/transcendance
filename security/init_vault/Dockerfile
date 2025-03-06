FROM alpine:3.21.3

RUN apk update

RUN  apk add curl jq bash shadow

COPY ./tools /

RUN chmod 755 /entrypoint.sh

RUN chmod 755 /check_requirements.sh

RUN mkdir -p /logs  /vault/data /secret/ips

RUN chmod 755 /logs  /vault/data /secret/ips /secret/

RUN adduser -u 1001 -D init_vault

RUN addgroup -g 4316 dummygroup

RUN usermod -g dummygroup init_vault

RUN chown -R init_vault:dummygroup /secret /logs /vault

USER init_vault

ENTRYPOINT [ "./entrypoint.sh" ]