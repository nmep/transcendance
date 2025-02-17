FROM alpine:3.21.3

RUN apk update

RUN  apk add curl jq bash

COPY ./tools /

RUN chmod 755 /entrypoint.sh

RUN chmod 755 /check_requirements.sh

RUN mkdir -p /logs

ENTRYPOINT [ "./entrypoint.sh" ]