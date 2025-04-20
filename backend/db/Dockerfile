FROM python:3.10

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client logrotate && apt-get install -y jq \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY ./syslog /syslog

RUN chown -R 1000:1000 /syslog

COPY srcs/requirements.txt ./
RUN pip install -r requirements.txt

COPY srcs/ .

COPY ./logrotate_script.sh /logrotate_script.sh

RUN chmod 755 /logrotate_script.sh

COPY connection_to_db.sh /usr/local/bin/

EXPOSE 8001

RUN mkdir -p /tmp/log
RUN chown 1000:1000 /tmp/log

USER 1000

ENTRYPOINT ["connection_to_db.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]