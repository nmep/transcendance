FROM python:3.10

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    jq \
    iputils-ping \
    docker.io && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY files/requirements.txt ./

RUN pip install -r requirements.txt

COPY files/ .

COPY ./entrypoint.sh /usr/local/bin/

RUN chmod 755 /usr/local/bin/entrypoint.sh

EXPOSE 8000

USER 1000

ENTRYPOINT ["entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]