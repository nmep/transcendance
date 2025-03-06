FROM owasp/modsecurity:nginx

USER root

RUN apt-get update && apt-get install -y procps rsyslog logrotate

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY ./syslog/rsyslog.conf /etc/rsyslog.conf

RUN mkdir -p /tmp/log 
RUN touch /tmp/log/nginx.log
RUN chown 1000:1000 /tmp/log/nginx.log
RUN chown 1000:1000 /tmp/log/
RUN chmod 664 /tmp/log/nginx.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R 1000:1000 /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

COPY ./syslog/logrotate.conf /etc/logrotate.conf

USER 1000
ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "nginx", "-g", "daemon off;" ]
