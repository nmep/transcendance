VOLUMES_DIR=devops/
VOLUMES=grafana/data logstash/data certs elasticsearch/data kibana/data prometheus/data
VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})
BUILD_IMAGES=$(addprefix transcendance_, grafana auth)


all: 
	mkdir -p ${VOLUMES_NAMES}
	docker compose up

logs:
	mkdir -p logs
	bash prout.sh

rm_logs:
	rm -rf logs

fclean:
	@docker rm -f $(shell docker ps -qa) || echo prout > /dev/null
	@docker volume rm -f $(shell docker volume ls -q) || echo prout > /dev/null
	@docker run --rm -v ./$(VOLUMES_DIR):/test -w /test alpine rm -rf $(VOLUMES)
	@docker image rm -f ${BUILD_IMAGES}
	
re: fclean all

.PHONY: logs all rm_logs re fclean