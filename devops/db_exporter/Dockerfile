FROM bitnami/postgres-exporter:0.16.0

USER root

RUN apt-get update && apt-get install -y jq curl postgresql-client rsyslog

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

RUN mkdir -p /var/log
RUN touch /var/log/postgres_exporter.log
RUN chown 1000:1000 /var/log/postgres_exporter.log
RUN chmod 664 /var/log/postgres_exporter.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

EXPOSE 9187
USER 1000
ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres_exporter","--no-collector.stat_bgwriter" ]
