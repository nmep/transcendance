FROM prom/prometheus:v3.1.0 AS base

FROM alpine:3.21.3

RUN apk add bash logrotate openssl curl

COPY ./prometheus.yml /etc/prometheus/prometheus.yml
RUN chmod 644 /etc/prometheus/prometheus.yml
COPY ./alert_rules.yml /etc/prometheus/alert_rules.yml
RUN chmod 644 /etc/prometheus/alert_rules.yml

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


COPY ./web-config.yml /etc/prometheus/web-config.yml
COPY ./openssl.cnf /etc/prometheus/openssl.cnf
COPY --from=base /bin/prometheus /bin/prometheus
RUN mkdir -p /prometheus && chmod 755 /prometheus

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD ["/bin/prometheus","--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--log.format=json", "--storage.tsdb.retention.size=10GB", "--storage.tsdb.retention.time=30d", "--web.config.file=/etc/prometheus/web-config.yml","--web.external-url=https://localhost/"]