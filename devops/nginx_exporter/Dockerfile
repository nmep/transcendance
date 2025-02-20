FROM nginx/nginx-prometheus-exporter:1.4.0 AS base

FROM alpine:3.21.3

RUN apk update && apk add rsyslog bash

COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY --from=base /usr/bin/nginx-prometheus-exporter /usr/bin/nginx-prometheus-exporter

RUN mkdir -p /var/log
RUN touch /var/log/nginx_exporter.log
RUN chown 1000:1000 /var/log/nginx_exporter.log
RUN chmod 664 /var/log/nginx_exporter.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "/usr/bin/nginx-prometheus-exporter", "--nginx.scrape-uri=https://nginx/status"]