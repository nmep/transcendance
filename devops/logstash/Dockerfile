FROM docker.elastic.co/logstash/logstash:8.9.2

USER root

RUN apt-get update 

RUN apt-get install -y jq wget logrotate 

COPY ./postgresql-42.7.5.jar /usr/share/logstash/lib/postgresql-42.7.5.jar

RUN wget -O /usr/share/logstash/lib/logstash-exporter https://github.com/kuskoman/logstash-exporter/releases/download/v1.8.4/logstash-exporter-linux

RUN chmod 755 /usr/share/logstash/lib/postgresql-42.7.5.jar /usr/share/logstash/lib/logstash-exporter

COPY ./exporter_config.yml /exporter_config.yml

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh 

COPY ./patterns /usr/share/logstash/patterns

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log/logstash
RUN chown 1000:1000 /tmp/log/logstash
COPY ./logstash.yml config/logstash.yml
USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "/usr/share/logstash/bin/logstash"]