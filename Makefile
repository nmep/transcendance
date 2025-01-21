all:
	mkdir -p ./devops/elasticsearch/data
	docker compose up

fclean:
	docker rm -f $(shell docker ps -qa)
	docker volume rm -f $(shell docker volume ls -q)
	rm -rf ./devops/elasticsearch/data

re: fclean all