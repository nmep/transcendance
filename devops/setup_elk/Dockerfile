FROM docker.elastic.co/elasticsearch/elasticsearch:8.9.2

USER root

RUN apt-get update

RUN apt-get install -y jq

RUN mkdir -p /kibana_set

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755  /entrypoint.sh

COPY ./setup.sh /setup.sh

RUN chmod 755 /setup.sh

RUN chmod 644 /kibana_set

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "/setup.sh" ]
