#!/bin/bash

prout=$(docker ps -qa); \
while read -r dock; do
file=$(docker ps -af "id=$dock" --format "{{.Names}}");\
docker logs $dock &> ./logs/logs_$file
done <<< $prout