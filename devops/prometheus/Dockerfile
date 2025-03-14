FROM prom/prometheus:v3.1.0 as base

FROM alpine:3.21.3

RUN apk update && apk add bash logrotate openssl

COPY ./prometheus.yml /etc/prometheus/prometheus.yml
RUN chmod 664 /etc/prometheus/prometheus.yml

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log /data /etc/prometheus/cert/prometheus
RUN touch /tmp/log/prometheus.log
RUN chown 1000:1000 /tmp/log/prometheus.log /etc/prometheus/cert/prometheus
RUN chown 1000:1000 /tmp/log/

COPY --from=base /bin/prometheus /bin/prometheus
RUN mkdir -p /prometheus && chmod 775 /prometheus

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD ["/bin/prometheus","--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--log.format=json", "--storage.tsdb.retention.size=10GB", "--storage.tsdb.retention.time=30d"]