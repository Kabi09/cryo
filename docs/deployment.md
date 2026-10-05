# CryoTech Industrial ERP — Production Deployment Guide

## 1. Production Topology & Architecture

```
[Users / Browsers]
       │
       ▼ (HTTPS :443)
[Cloudflare CDN / DNS]
       │
       ├─────────────────────────────────┐
       ▼ (Static SPA Assets)            ▼ (Reverse Proxy /api/*)
[Vercel / AWS CloudFront]         [NGINX Gateway / Load Balancer]
(React Vite Production Build)             │
                                          ▼
                                [Node.js Express Cluster]
                                (AWS EC2 / Render / Railway)
                                          │
                                          ▼ (TLS Encrypted Mongoose)
                                [MongoDB Atlas Replica Set]
                                (M10+ Multi-AZ with Auto-Failover)
```

---

## 2. Environment Variables Configuration

### 2.1 Backend Environment (`backend/.env`)
```bash
# Server Networking
PORT=5000
NODE_ENV=production
CLIENT_URL=https://cryo-erp.yourdomain.com

# Database Connection (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cryo_erp?retryWrites=true&w=majority&appName=CryoERP

# JWT Cryptographic Secrets
JWT_SECRET=super_strong_cryptographic_random_secret_key_minimum_64_characters
JWT_EXPIRES_IN=24h

# File Storage & Uploads
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE_MB=25
```

### 2.2 Frontend Environment (`frontend/.env`)
```bash
# Production API Gateway URL
VITE_API_BASE_URL=https://api.cryo-erp.yourdomain.com/api
```

---

## 3. Build & Deployment Execution Commands

### 3.1 Backend Deployment
```bash
# 1. Install Production Dependencies
cd backend
npm ci --only=production

# 2. Run Database Migrations / Seed if fresh installation
npm run seed

# 3. Start Backend via PM2 Process Manager
pm2 start src/server.js --name "cryo-erp-api" -i max --env production
pm2 save
```

### 3.2 Frontend Deployment
```bash
# 1. Install Dependencies
cd frontend
npm ci

# 2. Generate Optimized Production Bundle
npm run build
# Outputs to frontend/dist/ (gzip compressed, tree-shaken assets)

# 3. Deploy to Host (e.g. Vercel, S3+CloudFront, or NGINX static directory)
```

---

## 4. Reverse Proxy & NGINX Configuration

```nginx
server {
    listen 80;
    server_name api.cryo-erp.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cryo-erp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.cryo-erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cryo-erp.yourdomain.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Production Health Checks & Automated Backups

1. **Liveness & Readiness Probes**:
   - `GET /api/system/dashboard/kpis` (Requires token, validates database round-trip)
2. **Database Backup Strategy**:
   - MongoDB Atlas automated daily snapshots with 35-day continuous cloud backup.
   - Point-in-time recovery (PITR) configured for zero data loss compliance.
