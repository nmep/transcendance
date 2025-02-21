FROM grafana/grafana:latest

USER root

# Installer rsyslog
RUN apk update && apk add rsyslog jq logrotate

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log 
RUN touch /tmp/log/grafana.log
RUN chown 1000:1000 /tmp/log/grafana.log
RUN chown 1000:1000 /tmp/log/
RUN chmod 664 /tmp/log/grafana.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog
# Passer à l'utilisateur `grafana`
USER 1000

# Exposer le port de Grafana
EXPOSE 3000

# Définir l'entrypoint pour que Grafana soit en PID 1
ENTRYPOINT ["/entrypoint.sh"]

CMD ["grafana", "server", "--config", "/etc/grafana/grafana.ini"]