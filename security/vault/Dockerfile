FROM hashicorp/vault:1.18

USER root

RUN apk update

RUN apk add curl openssl rsyslog

RUN mkdir -p /etc/syslog /vault/tls

COPY ./syslog/rsyslog.conf /rsyslog.conf

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

ENTRYPOINT [ "sh", "/entrypoint.sh" ]

CMD [ "vault", "server", "-config", "/vault/config/config.hcl" ]
