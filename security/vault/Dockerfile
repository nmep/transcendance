FROM hashicorp/vault:1.18

USER root

RUN apk add openssl logrotate --no-cache

RUN mkdir -p /syslog /vault/tls /vault/data /vault/config

COPY ./config/config.hcl /vault/config/

RUN chown vault:vault /vault/config/config.hcl

COPY ./syslog /syslog

RUN chown -R vault:vault /syslog /vault/tls

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

RUN mkdir -p /tmp/log /vault/data
RUN touch /tmp/log/vault.log
RUN chown vault:vault /tmp/log/vault.log
RUN chown vault:vault /tmp/log/
RUN chmod 644 /tmp/log/vault.log

COPY ./entrypoint.sh /entrypoint.sh

RUN chmod 755 /entrypoint.sh

RUN chown -R vault:vault /vault/data

USER vault

ENTRYPOINT [ "sh", "/entrypoint.sh" ]

CMD [ "vault", "server", "-config", "/vault/config/config.hcl" ]
