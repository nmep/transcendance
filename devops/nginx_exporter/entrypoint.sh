#!/bin/bash

rsyslogd -i /tmp/rsyslogd.pid -f /etc/rsyslog.conf

exec "$@" >>/var/log/nginx_exporter.log 2>&1
