FROM grafana/grafana

EXPOSE 3000

USER root

RUN apk add jq

COPY entrypoint.sh /entrypoint.sh

# COPY datasource.yml /etc/grafana/provisioning/datasources/datasource.yml

# COPY grafana.ini /etc/grafana/grafana.ini

RUN chmod 755 /entrypoint.sh 

ENTRYPOINT [ "/entrypoint.sh" ]

USER grafana

CMD ["grafana", "server", "--config", "/etc/grafana/grafana.ini"]