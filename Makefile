VOLUMES_DIR=volumes/
VOLUMES=grafana/data\
		logstash/data\
		certs\
		elasticsearch/data\
		kibana/data\
		prometheus/data\
		vault/data\
		vault/cert\
		vault/secret\
		vault/startup_logs

VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})

IMAGES= grafana\
		auth\
		kibana\
		vault\
		init_vault\
		logstash\
		elasticsearch\
		setup_elk\
		db_exporter
	
BUILD_IMAGES=$(addprefix transcendance_, ${IMAGES})


all: volumes
	mkdir -p ${VOLUMES_NAMES}
	docker compose up

volumes: ${VOLUMES_NAMES}

${VOLUMES_NAMES}:
	mkdir -p ${VOLUMES_NAMES}

logs:
	mkdir -p logs
	bash logger.sh

rm_logs:
	rm -rf logs

down:
	docker compose down

fclean:
	@docker rm -f $(shell docker ps -qa) || echo > /dev/null
	@docker volume rm -f $(shell docker volume ls -q) || echo > /dev/null
	@docker run --rm -v ./:/test -w /test alpine rm -rf $(VOLUMES_DIR)
	@docker image rm -f ${BUILD_IMAGES}
	
re: fclean all

.PHONY: logs all rm_logs re fclean down volumes