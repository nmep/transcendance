FROM grafana/grafana

EXPOSE 3000

USER root

RUN apk add jq

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh 

ENTRYPOINT [ "/entrypoint.sh" ]

USER grafana

CMD ["grafana", "server", "--config", "/etc/grafana/grafana.ini"]