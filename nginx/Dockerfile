FROM owasp/modsecurity:nginx

USER root
RUN apt-get update
RUN apt-get install -y procps logrotate 

COPY ./html /var/www/html

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log 
RUN touch /tmp/log/nginx.log
RUN chown 1000:1000 /tmp/log/nginx.log
RUN chown 1000:1000 /tmp/log/
RUN chmod 644 /tmp/log/nginx.log

RUN mkdir -p /etc/nginx/ssl
RUN chmod 700 /etc/nginx/ssl
RUN chown 1000:1000 /etc/nginx/ssl

COPY ./syslog/logrotate.conf /etc/logrotate.conf

USER 1000

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "nginx", "-g", "daemon off;" ]
