#!/bin/sh

while true; do
    logrotate -s /tmp/logrotate.status /syslog/logrotate.conf
    sleep 386400 #wait 1 day
done
