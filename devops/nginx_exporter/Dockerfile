FROM nginx/nginx-prometheus-exporter:1.4.0 AS base

FROM alpine:3.21.3

RUN apk add bash logrotate

COPY ./entrypoint.sh /entrypoint.sh
COPY --from=base /usr/bin/nginx-prometheus-exporter /usr/bin/nginx-prometheus-exporter
RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log
RUN chown 1000:1000 /tmp/log

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "/usr/bin/nginx-prometheus-exporter", "--nginx.scrape-uri=https://nginx/status", "--log.format=json"]