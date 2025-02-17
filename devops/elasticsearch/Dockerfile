FROM  docker.elastic.co/elasticsearch/elasticsearch:8.9.2

USER root

RUN apt-get update 

RUN apt-get install -y jq curl

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "eswrapper" ]