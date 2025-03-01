#!/bin/bash

service="Nginx"
service_lower=$(echo $service | tr A-Z a-z)
/logrotate_script.sh &
rsyslogd -i /tmp/rsyslogd.pid -f /etc/rsyslog.conf
exec /bin/bash /usr/local/bin/ssl_certificate.sh "$@"
