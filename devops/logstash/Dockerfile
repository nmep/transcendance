FROM docker.elastic.co/logstash/logstash:8.9.2

EXPOSE 5044
EXPOSE 7777
EXPOSE 9600
EXPOSE 9187

USER root

RUN apt-get update 

RUN apt-get install -y jq wget

RUN wget -O /usr/share/logstash/lib/postgresql-42.7.5.jar https://jdbc.postgresql.org/download/postgresql-42.7.5.jar

RUN wget -O /usr/share/logstash/lib/logstash-exporter https://github.com/kuskoman/logstash-exporter/releases/download/v1.8.4/logstash-exporter-linux

RUN chmod 755 /usr/share/logstash/lib/postgresql-42.7.5.jar /usr/share/logstash/lib/logstash-exporter

COPY ./exporter_config.yml /exporter_config.yml

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh 

COPY ./logstash.yml config/logstash.yml

COPY ./patterns /usr/share/logstash/patterns

# USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "/usr/share/logstash/bin/logstash" ]