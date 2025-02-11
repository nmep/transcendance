FROM docker.elastic.co/kibana/kibana:8.9.2

EXPOSE 5601

USER root

RUN apt-get update 

RUN apt-get install -y jq

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh 

USER kibana

ENTRYPOINT [ "/entrypoint.sh" ]
 