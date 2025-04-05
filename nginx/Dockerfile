FROM owasp/modsecurity:nginx

USER root
ENV XDG_CONFIG_HOME=/tmp
RUN apt-get update
RUN unset LD_LIBRARY_PATH && apt-get upgrade -y
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

COPY ./syslog/logrotate.conf /etc/logrotate.conf

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV BASH_ENV /.bash_env
RUN touch "${BASH_ENV}"
RUN echo '. "${BASH_ENV}"' >> /.bashrc
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | PROFILE="${BASH_ENV}" bash
RUN echo node > /.nvmrc
RUN nvm install
RUN mkdir -p /.npm
RUN chown -R 1000:1000 /var/www/html /.npm

USER 1000


ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "nginx", "-g", "daemon off;" ]
