FROM python:3.10

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    jq \
    rsyslog \
    iputils-ping \
    docker.io && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY files/requirements.txt ./

RUN pip install -r requirements.txt

COPY files/ .

COPY ./entrypoint.sh /usr/local/bin/

COPY ./rsyslog.conf /rsyslog.conf

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]