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
		cert_prom\
		cert_grafana\
		setup_elk\
		$(addprefix logs/, ${IMAGES})


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
		nginx \
		db_api \
		db \
	
BUILD_IMAGES=$(addprefix transcendance_, ${IMAGES})


all: up

help:
	@echo "\033[1;32mAvailable targets\033[0m"
	@echo "\033[1;34mup\033[0m\t\t\t Create volumes and start containers (docker compose up)"
	@echo "\033[1;34mvolumes\033[0m\t\t\t Create required volumes"
	@echo "\033[1;34mlogs\033[0m\t\t\t Create and show logs"
	@echo "\033[1;34mrm_logs\033[0m\t\t\t Remove logs"
	@echo "\033[1;34mdown\033[0m\t\t\t Stop and remove containers (docker compose down)"
	@echo "\033[1;34mrestart\033[0m\t\t\t Restart containers (docker compose restart)"
	@echo "\033[1;34mfclean\033[0m\t\t\t Remove all containers, volumes, and images"
	@echo "\033[1;34mre\033[0m\t\t\t Rebuild everything (fclean + up)"
	@echo "\033[1;34mroot_token\033[0m\t\t Shows Vault Root Token (Only for testing purposes)"


up: volumes
	mkdir -p ${VOLUMES_NAMES}
	docker compose up --build

volumes: ${VOLUMES_NAMES}

${VOLUMES_NAMES}:
	mkdir -p ${VOLUMES_NAMES}

root_token:
	@if docker ps | grep -q init_vault; then \
	docker exec init_vault cat /secret/root_token.txt; \
	else \
	echo "Init_vault is currently not running"; \
	fi

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

.PHONY: logs up help restart all rm_logs re fclean down volumes root_token