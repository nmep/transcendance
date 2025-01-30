FROM grafana/grafana

EXPOSE 3000

USER root

RUN apk add jq && apk add vim

USER grafana

CMD [ "/bin/bash",  "grafana --config /etc/grafana/grafana.ini"]