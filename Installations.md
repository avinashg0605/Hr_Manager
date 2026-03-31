# Tools Installation Guide

## Public Server (Amazon Linux 2023)

### 1. Nginx Web Server

```sh
sudo dnf update -y
sudo dnf install nginx git -y
sudo systemctl start nginx
sudo systemctl enable nginx
systemctl status nginx
```

#### Nginx Config for HR Manager

```sh
sudo vi /etc/nginx/conf.d/hr_manager.conf
```

```nginx
server {
    listen 80;
    root /usr/share/nginx/html/hr_manager_fe;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```sh
sudo systemctl restart nginx
```

---

### 2. MariaDB

```sh
sudo dnf install mariadb105-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
mysql -u root -p
```

---

### 3. Node.js

```sh
dnf module list nodejs
sudo dnf install nodejs -y
node -v
npm -v
```
---

## Amazon Linux 2 (AL2)

### Nginx

```sh
sudo yum update -y
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### MariaDB

```sh
sudo yum install mariadb-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo systemctl status mariadb
sudo mysql_secure_installation
```

### Node.js

```sh
amazon-linux-extras list | grep nodejs
sudo amazon-linux-extras enable nodejs14   # or nodejs16
sudo yum install nodejs -y
node -v
npm -v
```