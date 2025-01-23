VOLUMES_DIR=devops/
VOLUMES=grafana/data logstash/data certs elasticsearch/data kibana/data prometheus/data
VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})


all:
	mkdir -p ${VOLUMES_NAMES}
	docker compose up

fclean:
	docker rm -f $(shell docker ps -qa)
	docker volume rm -f $(shell docker volume ls -q)
	docker run --rm -v ./$(VOLUMES_DIR):/test -w /test alpine rm -rf $(VOLUMES)

re: fclean all