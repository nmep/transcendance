#!/bin/sh

while true; do
    logrotate -f -s /tmp/logrotate.status /etc/logrotate.conf
    sleep 86400 # wait 1 day
done
