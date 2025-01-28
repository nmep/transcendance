VOLUMES_DIR=devops/
VOLUMES=grafana/data logstash/data certs elasticsearch/data kibana/data prometheus/data
VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})


all:
	mkdir -p ${VOLUMES_NAMES}
	docker compose up

logs:
	bash prout.sh

rm_logs:
	rm ./logs/logs_*

fclean:
	@docker rm -f $(shell docker ps -qa) || echo prout > /dev/null
	@docker volume rm -f $(shell docker volume ls -q) || echo prout > /dev/null
	@docker run --rm -v ./$(VOLUMES_DIR):/test -w /test alpine rm -rf $(VOLUMES)
	@docker image rm transcendance_cp-auth || echo prout > /dev/null
	
re: fclean all

.PHONY: logs