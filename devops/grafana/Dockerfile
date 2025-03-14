FROM grafana/grafana:latest

USER root

RUN apk update && apk add jq logrotate openssl

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY ./dashboards /var/lib/grafana/dashboards
COPY ./dashboards.yaml /etc/grafana/provisioning/dashboards/dashboards.yaml

RUN mkdir -p /tmp/log /etc/grafana/cert/grafana
RUN chown 1000:1000 /tmp/log /etc/grafana/cert/grafana

# Passer à l'utilisateur `grafana`
USER 1000

# Exposer le port de Grafana
EXPOSE 3000

# Définir l'entrypoint pour que Grafana soit en PID 1
ENTRYPOINT ["/entrypoint.sh"]

CMD ["grafana", "server", "--config", "/etc/grafana/grafana.ini"]