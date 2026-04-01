FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=rootpass
#ENV MYSQL_DATABASE=hr_manager
#ENV MYSQL_USER=myuser
#ENV MYSQL_PASSWORD=mypass

COPY data.sql /docker-entrypoint-initdb.d/

EXPOSE 3306