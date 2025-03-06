#!/bin/bash
rsyslogd -i /tmp/rsyslogd.pid -f /syslog/rsyslog.conf
/logrotate_script.sh &
exec "$@" >>/tmp/log/prometheus.log 2>&1
