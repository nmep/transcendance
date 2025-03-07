FROM  docker.elastic.co/elasticsearch/elasticsearch:8.9.2

USER root

RUN apt-get update 

RUN apt-get install -y jq curl logrotate rsyslog wget

RUN wget -O /tmp/elastic-exporter.tar.gz https://github.com/prometheus-community/elasticsearch_exporter/releases/download/v1.9.0/elasticsearch_exporter-1.9.0.linux-386.tar.gz

RUN tar -xf /tmp/elastic-exporter.tar.gz 

RUN mv elasticsearch_exporter-1.9.0.linux-386 exporter

RUN mv exporter/elasticsearch_exporter /usr/share/elasticsearch/bin

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog
RUN mkdir -p /tmp/log
RUN chown 1000:1000 /tmp/log

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "eswrapper" ]