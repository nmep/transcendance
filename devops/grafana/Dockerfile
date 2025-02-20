FROM grafana/grafana:latest

USER root

# Installer rsyslog
RUN apk update && apk add rsyslog jq

RUN mkdir -p /var/log/grafana
RUN chown -R 1000:1000 /var/log/grafana
# Copier la configuration de rsyslog
COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

# Copier l'entrypoint modifié
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Passer à l'utilisateur `grafana`
USER grafana

# Exposer le port de Grafana
EXPOSE 3000

# Définir l'entrypoint pour que Grafana soit en PID 1
ENTRYPOINT ["/entrypoint.sh"]

CMD ["grafana", "server", "--config", "/etc/grafana/grafana.ini"]