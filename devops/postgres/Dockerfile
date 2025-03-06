FROM postgres:17.3-alpine3.21

USER root

RUN apk update && apk add jq curl rsyslog logrotate

COPY ./db_users.sh /docker-entrypoint-initdb.d/00-db_user.sh

RUN chmod 755 /docker-entrypoint-initdb.d/00-db_user.sh

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh
COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

RUN mkdir -p /tmp/log 
RUN touch /tmp/log/postgres.log
RUN chown postgres:postgres /tmp/log/postgres.log
RUN chown postgres:postgres /tmp/log/
RUN chmod 664 /tmp/log/postgres.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R postgres:postgres /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

COPY ./syslog/logrotate.conf /etc/logrotate.conf

USER postgres

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres" ]