FROM bitnami/postgres-exporter:0.16.0

USER root

RUN apt-get update && apt-get install -y jq curl

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

USER 1001

ENTRYPOINT [ "/entrypoint.sh" ]

EXPOSE 9187

CMD [ "postgres_exporter","--no-collector.stat_bgwriter" ]
