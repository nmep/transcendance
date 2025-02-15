#!/bin/bash

docker_list=$(docker ps -qa)
if [ -z "$docker_list" ]; then
    echo "No docker running..."
    exit 0
else
    while read -r dock; do
        file=$(docker ps -af "id=$dock" --format "{{.Names}}")
        docker logs $dock &>./logs/logs_$file
    done <<<$docker_list
fi
