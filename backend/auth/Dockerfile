FROM python:3.10

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    jq \
    iputils-ping \
    logrotate \
    docker.io && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY files/requirements.txt ./

RUN pip install -r requirements.txt

COPY files/ .

COPY ./entrypoint.sh /usr/local/bin/

RUN chmod 755 /usr/local/bin/entrypoint.sh

EXPOSE 8000

RUN mkdir -p /tmp/log
RUN chown 1000:1000 /tmp/log

USER 1000

ENTRYPOINT ["entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]