# Deploying the MemoCare AI services

All three AI services run on **one Linux server** with Docker Compose. Nginx is the only public entry and adds HTTPS.

| Service | Folder | Port (on the server only) | Public URL |
|---|---|---|---|
| Memory service (FastAPI) | `memory-service/` | 8000 | `https://YOUR_DOMAIN/ai/` |
| Caregiver stress model (Flask) | `caregiver/` | 5001 | `https://YOUR_DOMAIN/caregiver/` |
| Dementia triage model (Flask) | `dementia/` | 5002 | `https://YOUR_DOMAIN/dementia/` |
| Node API (optional, same server) | `../backend/` | 5000 | `https://YOUR_DOMAIN/api/` |

---

## 1. Create the server (Azure for Students)

1. Go to **portal.azure.com** and sign in with the SLIIT account.
2. **Create a resource → Virtual machine**:
   - Image: **Ubuntu Server 22.04 LTS** (or 24.04)
   - Size: **Standard B2ms** (2 vCPU, 8 GB RAM). B2s (4 GB) works but is tight for the memory service.
   - Authentication: **SSH public key**, user name `memocare`. Download the `.pem` key when asked.
   - Inbound ports: allow **SSH (22)**, **HTTP (80)** and **HTTPS (443)**. Do **not** open 8000, 5001, 5002 or 5000.
   - Disk: Standard SSD, 64 GB.
3. When it is created, copy the VM's **Public IP address**.
4. Optional but recommended: in the VM's **Networking** settings, restrict SSH (22) to your own IP.

> Credits: **Stop** the VM in the portal when nobody needs it - a stopped (deallocated) VM costs only its disk.

## 2. Get a free domain name (needed for HTTPS)

1. Go to **duckdns.org**, sign in, create a subdomain, e.g. `memocare-sliit` → `memocare-sliit.duckdns.org`.
2. Put the VM's public IP in the **current ip** box and click **update ip**.

## 3. Install Docker, Nginx and Git on the server

From your PC (PowerShell), connect:

```bash
ssh -i path\to\key.pem memocare@<VM-PUBLIC-IP>
```

Then on the server:

```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt -y install nginx git certbot python3-certbot-nginx
exit          # log out and in again so the docker group applies
```

## 4. Get the code and the models

```bash
ssh -i path\to\key.pem memocare@<VM-PUBLIC-IP>
git clone https://github.com/sewmi-senarath/R26-SE-024.git
cd R26-SE-024/models
```

Model files (`*.pt`) are not in Git. Copy the fine-tuned items model from your PC (run this **on your PC**, in a new terminal):

```bash
scp -i path\to\key.pem memocare_items.pt memocare@<VM-PUBLIC-IP>:~/R26-SE-024/models/memory-service/models/
```

`yolov8n.pt` and `yolov8s-worldv2.pt` are downloaded automatically by Ultralytics on first start.

## 5. Secrets

```bash
cp .env.example .env
nano .env        # paste GROQ_API_KEY and GEMINI_API_KEY, then Ctrl+O, Enter, Ctrl+X
```

## 6. Start the AI services

```bash
docker compose up -d --build      # first build takes 10-20 minutes
docker compose ps                 # all three should be "running"
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:5002/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/docs   # 200
```

The containers restart by themselves after a crash or a server reboot (`restart: unless-stopped`).
The memory service keeps its data (moments, family, quiz, conversations) in its folder on the server's disk.

## 7. Nginx + HTTPS

```bash
sudo cp deploy/nginx-memocare.conf /etc/nginx/sites-available/memocare
sudo sed -i 's/YOUR_DOMAIN/memocare-sliit.duckdns.org/' /etc/nginx/sites-available/memocare
sudo ln -s /etc/nginx/sites-available/memocare /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d memocare-sliit.duckdns.org      # free certificate, renews automatically
```

Check from any browser: `https://memocare-sliit.duckdns.org/ai/docs`

## 8. Node API on the same server (optional)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm install -g pm2
cd ~/R26-SE-024/backend
npm ci
nano .env                         # MONGO_URI, JWT secrets ... (same as on your PC)
pm2 start index.js --name memocare-api
pm2 save && pm2 startup           # run the printed command so it starts after a reboot
```

## 9. Point the apps to the server

`frontend/.env` (mobile app):

```
EXPO_PUBLIC_API_URL=https://memocare-sliit.duckdns.org
EXPO_PUBLIC_AI_URL=https://memocare-sliit.duckdns.org/ai
```

The web portal has some hard-coded `http://localhost:5000` and `http://172.20.10.3:8000` addresses (e.g. `GeofenceSettings.jsx`); those need the server URLs too when the portal is used from another computer.

## 10. Updating after new commits

```bash
cd ~/R26-SE-024 && git pull
cd ml-service && docker compose up -d --build
```

## Windows Server + IIS (instead of steps 3-8)

Use this when the VM runs Windows. The three services run as Windows services (NSSM); IIS is the gateway on 80/443.

1. **Azure → VM → Networking**: inbound rules for **3389 (RDP)**, **80** and **443** only.
2. **Connect → RDP**, download the `.rdp` file, log in.
3. On the VM, install: **Python 3.11** (python.org, tick "Add to PATH"), **Git**, **Node.js 20** (if the Node API runs here), **Google Chrome** (video diary), and ffmpeg: `winget install Gyan.FFmpeg`.
4. Get the code and the model (copy `memocare_items.pt` over RDP into `ml-service\memory-service\models\`):
   ```powershell
   cd C:\
   git clone https://github.com/sewmi-senarath/R26-SE-024.git
   ```
5. One virtual environment per service:
   ```powershell
   cd C:\R26-SE-024\ml-service\memory-service
   python -m venv .venv
   .venv\Scripts\pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   .venv\Scripts\pip install -r requirements.txt

   cd ..\caregiver
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt waitress

   cd ..\dementia
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt waitress
   ```
6. Install **NSSM** (`winget install NSSM.NSSM`) and register the services (Admin PowerShell):
   ```powershell
   $m = "C:\R26-SE-024\ml-service"
   nssm install MemoCareAI "$m\memory-service\.venv\Scripts\python.exe" main.py
   nssm set MemoCareAI AppDirectory "$m\memory-service"
   nssm set MemoCareAI AppEnvironmentExtra GROQ_API_KEY=... GEMINI_API_KEY=... PYTHONIOENCODING=utf-8

   nssm install MemoCareCaregiver "$m\caregiver\.venv\Scripts\waitress-serve.exe" --listen=127.0.0.1:5001 app:app
   nssm set MemoCareCaregiver AppDirectory "$m\caregiver"
   nssm set MemoCareCaregiver AppEnvironmentExtra PYTHONIOENCODING=utf-8

   nssm install MemoCareDementia "$m\dementia\.venv\Scripts\waitress-serve.exe" --listen=127.0.0.1:5002 app:app
   nssm set MemoCareDementia AppDirectory "$m\dementia"
   nssm set MemoCareDementia AppEnvironmentExtra PYTHONIOENCODING=utf-8

   nssm start MemoCareAI; nssm start MemoCareCaregiver; nssm start MemoCareDementia
   ```
   Services start automatically after a reboot and restart after a crash.
7. IIS (Admin PowerShell): `Install-WindowsFeature Web-Server -IncludeManagementTools`, then install **URL Rewrite** and **Application Request Routing 3.0** from iis.net. In IIS Manager → server node → **Application Request Routing Cache → Server Proxy Settings → Enable proxy**, and set the time-out to 180 seconds.
8. Copy `ml-service\deploy\web.config` to `C:\inetpub\wwwroot\web.config`. Test on the VM: `http://localhost/ai/docs`, `http://localhost/caregiver/health`.
9. HTTPS: point a DuckDNS name at the VM's public IP, then run **win-acme** (`wacs.exe`, free Let's Encrypt for IIS) and choose the Default Web Site. It renews by itself.
10. Node API (optional): `npm ci` in `backend`, then `nssm install MemoCareAPI "C:\Program Files\nodejs\node.exe" index.js` with `AppDirectory C:\R26-SE-024\backend`.

## 11. Build the Android APK (Expo EAS, free tier)

The APK talks to the server, so do steps 1-9 first. Android blocks plain `http://` in release builds - use the **https** domain.

1. Create a free account at **expo.dev**.
2. On your PC:
   ```bash
   npm install -g eas-cli
   eas login
   cd frontend
   eas build:configure          # choose Android; creates eas.json
   ```
   When asked for an Android package name, use e.g. `lk.sliit.memocare`.
3. `frontend/.env` is not uploaded to the build server (it is git-ignored), so put the URLs in `eas.json` under a `preview` profile:
   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://memocare-sliit.duckdns.org",
           "EXPO_PUBLIC_AI_URL": "https://memocare-sliit.duckdns.org/ai"
         }
       }
     }
   }
   ```
4. Build:
   ```bash
   eas build -p android --profile preview
   ```
   The build runs on Expo's servers (free tier: queued, about 10-30 minutes; a limited number of free builds per month).
5. When it finishes, open the link (or scan the QR code) on the phone, download the `.apk`, and allow "Install unknown apps" for the browser.

For a new app version later: change `version` in `app.json` and run step 4 again.

## Troubleshooting

| Problem | Check |
|---|---|
| A service is not running | `docker compose logs --tail 50 memory-service` |
| 502 Bad Gateway in the browser | the container is still starting, or crashed - see the logs |
| 413 Request Entity Too Large | raise `client_max_body_size` in the Nginx file |
| Out of memory | use a B2ms VM, or add swap: `sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

## Security notes

- Only ports 22, 80 and 443 are open; the services listen on `127.0.0.1` behind Nginx.
- The AI services have **no login of their own yet**: anyone who knows the URL can call them. Do not load real patient data until access control is added.
- Keep `.env` files and `*_db.json` data files out of Git.
