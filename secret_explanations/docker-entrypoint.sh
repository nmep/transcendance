DATA_DIR=/var/www/wordpress
check_env()
{
	echo "Checking needed env variables"
	i=0
	while read var; do
		upper_var=$(echo $var | tr a-z A-Z)
		var_content=$(eval "echo \${$upper_var}")
		if [ -z "$var_content" ]; then
			echo "Error: $upper_var is empty"
			i=$((i+1))
		else
			echo "$upper_var is set !"
		fi
	done <<- EOVARS
	domain_name
	login
	corrector
	wordpress_site_title
	wordpress_db_name
	EOVARS

	if [ $i -gt 0 ]; then
		exit 1;
	else
		echo "All needed env variables were set, continuing..."
	fi
}

check_secrets() 
{
	echo "Checking needed secrets..."

	i=0
	while read var; do
		upper_var=$(echo $var | tr a-z A-Z)
		secret_file_var="${upper_var}_FILE"
		secret_file=$(eval "echo \${$secret_file_var}")
		if [ -r "${secret_file}" ]; then
			value=$(cat ${secret_file})
			if [ -z "$value" ]; then
				i=$((i+1))
				echo "Error: $upper_var secret file is empty"
			else
				echo "$upper_var has been set"
				export "$upper_var"="$value"
			fi
		else
			echo "Error: $secret_file is unreadable"
			i=$((i+1))
		fi
	done <<- EOSECRETS
	wordpress_admin_user
	wordpress_admin_password
	wordpress_admin_email
	wordpress_user
	wordpress_password
	wordpress_email
	wordpress_db_user
	wordpress_db_password
	EOSECRETS

	if [ $i -gt 0 ]; then
		echo "Not all needed secrets were set"
		exit 1
	else
		echo "All needed secrets were set, continuing"
	fi
}

TITLE="Welcome to $LOGIN's Inception !"

if [ -f "$DATA_DIR/wp-config.php" ]; then
    echo "Wordpress is already installed"
else
	check_env
	check_secrets
    while ! mysqladmin ping -hmariadb --silent; do
        echo "Waiting for database..."
        sleep 2
    done
    echo "Database ready ! Now installing Wordpress"
	#creating config file
	wget https://wordpress.org/latest.tar.gz
	mv latest.tar.gz /var/www/
	cd /var/www
	tar -xvf latest.tar.gz
	rm latest.tar.gz
	wp --path=$DATA_DIR config create --dbname="$WORDPRESS_DB_NAME" --dbuser="$WORDPRESS_DB_USER" --dbpass="$WORDPRESS_DB_PASSWORD" --dbhost="mariadb":"3306" --dbprefix='wp_'
	#installing wp
	wp --path=$DATA_DIR core install --url="$DOMAIN_NAME" --title="$WORDPRESS_SITE_TITLE" --admin_user="$WORDPRESS_ADMIN_USER" --admin_password="$WORDPRESS_ADMIN_PASSWORD" --admin_email="$WORDPRESS_ADMIN_EMAIL"
	wp --path=$DATA_DIR theme activate twentytwentyfour
	wp --path=$DATA_DIR option update comment_moderation
	wp --path=$DATA_DIR option update comment_previously_approved
	wp --path=$DATA_DIR option update comment_registration
	wp --path=$DATA_DIR option update require_name_email
	wp --path=$DATA_DIR post delete 1

	wp --path=$DATA_DIR post create --post_status='publish' --post_title="$TITLE" --post_author='1' - <<-EOCONTENT
													Hello $CORRECTOR ! Please enjoy !
													EOCONTENT
	#creating wp user
	wp --path=$DATA_DIR user create "$WORDPRESS_USER" "$WORDPRESS_EMAIL" --role='editor' --user_pass="$WORDPRESS_PASSWORD"

	# SETUP REDIS
	wp --path=$DATA_DIR config set WP_CACHE_KEY_SALT "$DOMAIN_NAME"
	wp --path=$DATA_DIR config set WP_CACHE "true" --raw
	wp --path=$DATA_DIR config set WP_REDIS_HOST "redis"
	wp --path=$DATA_DIR plugin install redis-cache --activate
	wp --path=$DATA_DIR redis enable

fi

chmod 777 -R $DATA_DIR

exec "$@"