FROM python:3.10

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY ../requirements/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ../requirements/ .

EXPOSE 8080
CMD ["python", "manage.py", "runserver", "0.0.0.0:8080"]