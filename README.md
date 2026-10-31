## 📌 Architecture Overview

```

User → Nginx (Port 80)
├── React Frontend (Port 3000)
└── /api → Node.js Backend (Port 5000)
└── MongoDB Database

````

---

## 🖥️ 1. EC2 Instance Setup

- Launch Ubuntu EC2 instance
- Configure Security Group-
  - `22` (SSH)
  - `80` (HTTP)
  - `443` (HTTPS)
  - `5000` (Backend)
  - `3000` (frontend)


### Connect to server
```bash
ssh -i your-key.pem ubuntu@your-public-ip
````

### Update system

```bash
sudo apt update && sudo apt upgrade -y
```

---

## ⚙️ 2. Install Dependencies

### Node.js & npm

```bash
sudo apt install nodejs npm -y
```

### MongoDB

```bash
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Nginx

```bash
sudo apt install nginx -y
```

### PM2

```bash
sudo npm install -g pm2
```

---

## 📦 3. Backend Deployment

```bash
git clone <your-backend-repo>
cd backend
npm install
```

### Environment Variables

```bash
nano .env
```

```env
PORT=5000
MONGO_URI=your_mongodb_connection
```

### Start Server

```bash
pm2 start server.js
pm2 save
pm2 startup
```

---

## 🌐 4. Frontend Deployment

```bash
git clone <your-frontend-repo>
cd frontend
npm install
npm run build
```

### Move build to Nginx

```bash
sudo cp -r build/* /var/www/html/
```

---

## 🔁 5. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

```bash
sudo systemctl restart nginx
```
## 🏷️ Tags

`MERN` `AWS` `EC2` `DevOps` `React` `Node.js` `MongoDB`

---

