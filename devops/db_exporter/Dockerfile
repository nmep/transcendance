FROM bitnami/postgres-exporter:0.16.0

USER root

RUN apt-get update && apt-get install -y jq curl postgresql-client rsyslog

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog/rsyslog.conf /rsyslog.conf

EXPOSE 9187

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "postgres_exporter","--no-collector.stat_bgwriter" ]
