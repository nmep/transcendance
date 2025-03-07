FROM docker.elastic.co/kibana/kibana:8.9.2

EXPOSE 5601

USER root

RUN apt-get update 

RUN apt-get install -y jq rsyslog logrotate wget

RUN wget https://github.com/chamilad/kibana-prometheus-exporter/releases/download/v8.7.x.2/kibana_exporter-v8.7.x.2-linux-amd64

RUN mv kibana_exporter-v8.7.x.2-linux-amd64 bin/kibana_exporter

RUN chmod +x bin/kibana_exporter

COPY entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log 
RUN touch /tmp/log/kibana.log
RUN chown 1000:1000 /tmp/log/kibana.log
RUN chown 1000:1000 /tmp/log/
RUN chmod 664 /tmp/log/kibana.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

COPY ./kibana.yml /usr/share/kibana/config

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "/usr/local/bin/kibana-docker" ] 
