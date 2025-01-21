VOLUMES_DIR=devops/elasticsearch/data devops/grafana/data devops/kibana/data devops/certs devops/logstash/data devops/prometheus/data


all:
	mkdir -p .${VOLUMES_DIR}
	docker compose up

fclean:
	docker rm -f $(shell docker ps -qa)
	docker volume rm -f $(shell docker volume ls -q)
	rm -rf ${VOLUMES_DIR}

re: fclean all