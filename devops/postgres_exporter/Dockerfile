FROM bitnami/postgres-exporter:0.16.0

USER root

RUN apt-get update && apt-get install -y jq curl postgresql-client rsyslog

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

COPY ./syslog/logrotate.conf /etc/logrotate.conf

RUN mkdir -p /tmp/log
RUN chown 1000:1000 /tmp/log

EXPOSE 9187
USER 1000
ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres_exporter","--no-collector.stat_bgwriter", "--log.format=json" ]
