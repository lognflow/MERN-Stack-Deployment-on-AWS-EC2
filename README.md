## 📌 Architecture Overview

```

User → Nginx (Port 80)
├── React Frontend (Port 3000)
└── /api → Node.js Backend (Port 5000)
└── MongoDB Database

````

---

## 📌 Architecture Overview

```
User (Browser)
   │
   ├──▶ Frontend EC2 [app_client] (Port 80 / 3000)
   │      - React Production Build
   │      - Served with PM2 & Serve
   │
   └──▶ Backend EC2 [app_server] (Port 5000)
          - Node.js & Express REST API
          - In-Memory Cache & MongoDB Database
          - Served with PM2
```

---

## 🚀 Step-by-Step AWS EC2 Hosting Guide

Repository URL: `https://github.com/lognflow/MERN-Stack-Deployment-on-AWS-EC2.git`

---

### PART 1: Backend Server Deployment (`app_server`)

#### 1. Create Security Group for Backend
1. Open AWS Management Console → Go to **EC2**.
2. From the left sidebar, click **Security Groups** → Click **Create security group**.
3. Name: `app_server_sg`, Description: `app_server_sg`.
4. In **Inbound rules**, click **Add rule** twice:
   - **Rule 1:** Type: `Custom TCP` | Port range: `5000` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
   - **Rule 2:** Type: `SSH` | Port range: `22` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
5. Scroll down and click **Create security group**.

#### 2. Create Key Pair for Backend
1. In EC2 left sidebar, click **Key Pairs** → Click **Create key pair**.
2. Name: `app_server_key`.
3. Key pair type: `RSA`, Private key file format: `.pem`.
4. Click **Create key pair** (the `app_server_key.pem` file will download to your `Downloads` folder).

#### 3. Launch Backend EC2 Instance
1. In EC2 left sidebar, click **Instances** → Click **Launch instances**.
2. **Name:** `app_server`.
3. **Application and OS Images:** Select **Amazon Linux 2023** (or **Ubuntu 22.04 LTS**).
4. **Instance type:** `t2.micro` (Free tier eligible).
5. **Key pair:** Select `app_server_key`.
6. **Network settings:**
   - Choose **Select existing security group**.
   - Select `app_server_sg`.
7. Click **Launch instance**.

#### 4. SSH into Backend EC2 Instance
1. Go to **Instances**, select `app_server`, and click **Connect** (top right).
2. Go to the **SSH client** tab and copy the SSH command.
3. On your local computer, open terminal / command prompt in your `Downloads` folder where `app_server_key.pem` is located.
4. Run:
   ```bash
   ssh -i "app_server_key.pem" ec2-user@<YOUR_BACKEND_PUBLIC_IP>
   ```
   *(If using Ubuntu, use `ubuntu@<YOUR_BACKEND_PUBLIC_IP>`)*
5. Type `yes` when prompted. You will enter the `$` prompt.

#### 5. Install Git & Clone Repository
In the backend `$` prompt, execute:
```bash
sudo dnf update -y
sudo dnf install git -y
git clone https://github.com/lognflow/MERN-Stack-Deployment-on-AWS-EC2.git
```
*(If using Ubuntu: use `sudo apt update -y && sudo apt install git -y`)*

#### 6. Run Automated Backend Setup Script
Execute these commands one by one:
```bash
cd MERN-Stack-Deployment-on-AWS-EC2/scripts
chmod +x backend-setup.sh
./backend-setup.sh
```

#### 7. Verify Backend Locally on EC2
```bash
curl http://localhost:5000/products
```

#### 8. Test Backend in Your Web Browser
Open your browser and navigate to:
```
http://<YOUR_BACKEND_PUBLIC_IP>:5000/products
```
> **Important:** Note down `<YOUR_BACKEND_PUBLIC_IP>`. You will need it in the next step!

---

### PART 2: Frontend Client Deployment (`app_client`)

#### 1. Create Security Group for Frontend
1. Go to **EC2** → **Security Groups** → Click **Create security group**.
2. Name: `app_client_sg`, Description: `app_client_sg`.
3. In **Inbound rules**, click **Add rule** three times:
   - **Rule 1:** Type: `HTTP` | Port range: `80` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
   - **Rule 2:** Type: `Custom TCP` | Port range: `3000` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
   - **Rule 3:** Type: `SSH` | Port range: `22` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
4. Click **Create security group**.

#### 2. Create Key Pair for Frontend
1. EC2 left sidebar → **Key Pairs** → **Create key pair**.
2. Name: `app_client_key`.
3. Format: `.pem` → Click **Create key pair** (saves to `Downloads`).

#### 3. Launch Frontend EC2 Instance
1. In EC2 left sidebar, click **Instances** → Click **Launch instances**.
2. **Name:** `app_client`.
3. **OS Image:** Select **Amazon Linux 2023** (or **Ubuntu 22.04 LTS**).
4. **Instance type:** `t2.micro` (Free tier eligible).
5. **Key pair:** Select `app_client_key`.
6. **Network settings:**
   - Choose **Select existing security group**.
   - Select `app_client_sg`.
7. Click **Launch instance**.

#### 4. SSH into Frontend EC2 Instance
1. Go to **Instances**, select `app_client`, click **Connect** → **SSH client**.
2. In your computer's `Downloads` folder terminal, run:
   ```bash
   ssh -i "app_client_key.pem" ec2-user@<YOUR_FRONTEND_PUBLIC_IP>
   ```
   *(If using Ubuntu, use `ubuntu@<YOUR_FRONTEND_PUBLIC_IP>`)*
3. Type `yes` to enter the `$` prompt.

#### 5. Install Git & Clone Repository
In the frontend `$` prompt, execute:
```bash
sudo dnf update -y
sudo dnf install git -y
git clone https://github.com/lognflow/MERN-Stack-Deployment-on-AWS-EC2.git
```

#### 6. Run Automated Frontend Setup Script with Backend IP
Execute the frontend setup script and pass your backend public IP:
```bash
cd MERN-Stack-Deployment-on-AWS-EC2/scripts
chmod +x frontend-setup.sh
./frontend-setup.sh http://<YOUR_BACKEND_PUBLIC_IP>:5000
```

#### 7. Verify Frontend Status
```bash
pm2 status
```

#### 8. Open the Live Grocery Website in Your Web Browser
Open your browser and navigate to:
```
http://<YOUR_FRONTEND_PUBLIC_IP>
```
*(Port 80 is default HTTP, so you don't even need to type `:80`!)*

---

### PART 3: If You Ever Change the Backend Public IP

Run this in your Frontend `app_client` terminal anytime to update the backend link:
```bash
cd MERN-Stack-Deployment-on-AWS-EC2/scripts
chmod +x update-backend-ip.sh
./update-backend-ip.sh http://<NEW_BACKEND_PUBLIC_IP>:5000
```

---

