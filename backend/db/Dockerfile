FROM python:3.10

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client && apt-get install -y vim \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY srcs/requirements.txt ./
RUN pip install -r requirements.txt

COPY srcs/ .

COPY connection_to_db.sh /usr/local/bin/

EXPOSE 8001

ENTRYPOINT ["connection_to_db.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]