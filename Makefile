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
		vault/startup_logs\
		setup_elk

VOLUMES_NAMES=$(addprefix ${VOLUMES_DIR}, ${VOLUMES})

IMAGES= grafana\
		auth\
		kibana\
		vault\
		init_vault\
		logstash\
		elasticsearch\
		setup_elk\
		postgres_exporter\
		postgres\
		nginx_exporter\
		prometheus\
		nginx
	
BUILD_IMAGES=$(addprefix transcendance_, ${IMAGES})


all: help

help:
	@echo "\033[1;32mAvailable targets\033[0m"
	@echo "\033[1;34mup\033[0m          \t Create volumes and start containers (docker compose up)"
	@echo "\033[1;34mvolumes\033[0m     \t Create required volumes"
	@echo "\033[1;34mlogs\033[0m        \t Create and show logs"
	@echo "\033[1;34mrm_logs\033[0m     \t Remove logs"
	@echo "\033[1;34mdown\033[0m        \t Stop and remove containers (docker compose down)"
	@echo "\033[1;34mrestart\033[0m     \t Restart containers (docker compose restart)"
	@echo "\033[1;34mfclean\033[0m      \t Remove all containers, volumes, and images"
	@echo "\033[1;34mre\033[0m          \t Rebuild everything (fclean + up)"


up: volumes
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

restart:
	docker compose restart

fclean:
	@docker rm -f $(shell docker ps -qa) || true
	@docker volume rm -f $(shell docker volume ls -q) || true
	@docker run --rm -v ./:/test -w /test alpine rm -rf $(VOLUMES_DIR)
	@docker image rm -f ${BUILD_IMAGES}
	
re: fclean up

.PHONY: logs up help restart all rm_logs re fclean down volumes