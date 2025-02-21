#!/bin/bash

rsyslogd -i /tmp/rsyslogd.pid -f /syslog/rsyslog.conf
/logrotate_script.sh &
exec "$@" >>/tmp/log/nginx_exporter.log 2>&1
