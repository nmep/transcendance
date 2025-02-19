FROM postgres:17.3-alpine3.21

USER root

RUN apk update && apk add jq curl

COPY ./db_users.sh /docker-entrypoint-initdb.d/00-db_user.sh

RUN chmod 755 /docker-entrypoint-initdb.d/00-db_user.sh

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

USER postgres

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres" ]