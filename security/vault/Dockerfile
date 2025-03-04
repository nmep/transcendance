FROM hashicorp/vault:1.18

USER root

RUN apk update

RUN apk add openssl rsyslog logrotate

RUN mkdir -p /syslog /vault/tls /vault/data

COPY ./syslog /syslog

RUN chown -R vault:vault /syslog /vault/tls

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log /vault/data
RUN touch /tmp/log/vault.log
RUN chown vault:vault /tmp/log/vault.log
RUN chown vault:vault /tmp/log/
RUN chmod 664 /tmp/log/vault.log

RUN mkdir -p /var/spool/rsyslog
RUN chown -R vault:vault /var/spool/rsyslog
RUN chmod -R 775 /var/spool/rsyslog

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

RUN chown -R vault:vault /vault/data

USER vault

ENTRYPOINT [ "sh", "/entrypoint.sh" ]

CMD [ "vault", "server", "-config", "/vault/config/config.hcl" ]
