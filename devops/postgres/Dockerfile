FROM postgres:17.3-alpine3.21

USER root

RUN apk update && apk add jq curl logrotate

COPY ./db_users.sh /docker-entrypoint-initdb.d/00-db_user.sh

RUN chmod 755 /docker-entrypoint-initdb.d/00-db_user.sh

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh
COPY ./logrotate_script.sh /logrotate_script.sh

RUN mkdir -p /tmp/log
RUN chown postgres:postgres /tmp/log

RUN chmod 755 /logrotate_script.sh

COPY ./syslog/logrotate.conf /etc/logrotate.conf
RUN chmod 644 /etc/logrotate.conf
COPY ./postgres.conf /etc/postgresql.conf

USER postgres

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres", "-c", "config_file=/etc/postgresql.conf" ]