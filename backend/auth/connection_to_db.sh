#!/bin/bash

until pg_isready -d toto_db -h db -p 5432 -U toto; do
	echo "connection didn't succed, retrying..."
	echo "exit status $?"
	sleep 3
done

exec "$@"
