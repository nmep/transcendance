#!/bin/sh

while true; do
    logrotate -f -s /tmp/logrotate.status /syslog/logrotate.conf
    sleep 300 # wait 5 minutes
done
