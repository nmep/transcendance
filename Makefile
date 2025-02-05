VOLUMES_DIR=devops/
VOLUMES=grafana/data logstash/data certs elasticsearch/data kibana/data prometheus/data
VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})

DOCKER_DIR=./backend/auth/ ./
STAMPS=$(addsuffix stamp, ${DOCKER_DIR})

all: 
	mkdir -p ${VOLUMES_NAMES}
	docker compose up

docker_images: ${STAMPS}

%stamp: % %Dockerfile
	docker build $< -t auth
	touch $@

logs:
	bash prout.sh

rm_logs:
	rm ./logs/logs_*

fclean:
	@docker rm -f $(shell docker ps -qa) || echo prout > /dev/null
	@docker volume rm -f $(shell docker volume ls -q) || echo prout > /dev/null
	@docker run --rm -v ./$(VOLUMES_DIR):/test -w /test alpine rm -rf $(VOLUMES)
	@docker image rm -f transcendance_cp-grafana
	
re: fclean all

.PHONY: logs all rm_logs re fclean