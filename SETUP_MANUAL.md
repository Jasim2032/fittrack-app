# FitTrack — Complete Setup & Configuration Manual

> This manual covers everything from zero to a fully running FitTrack application.
> Whether you're setting it up locally on your laptop or deploying it live to the internet,
> follow the steps in order and you should be fine. If something breaks, every section
> has a troubleshooting part at the bottom — check that first before panicking.

---

## Table of Contents

1. [What You Need Before You Start](#1-what-you-need-before-you-start)
2. [Getting the Code](#2-getting-the-code)
3. [Running the Backend Locally](#3-running-the-backend-locally)
4. [Running the Frontend Locally](#4-running-the-frontend-locally)
5. [Running Both Together (Full Local App)](#5-running-both-together-full-local-app)
6. [Running with Docker (Optional)](#6-running-with-docker-optional)
7. [Deploying the Backend to Railway](#7-deploying-the-backend-to-railway)
8. [Adding PostgreSQL on Railway](#8-adding-postgresql-on-railway)
9. [Deploying the Frontend to Vercel](#9-deploying-the-frontend-to-vercel)
10. [Setting Up UptimeRobot Monitoring](#10-setting-up-uptimerobot-monitoring)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Common Errors and How to Fix Them](#12-common-errors-and-how-to-fix-them)

---

## 1. What You Need Before You Start

Before doing anything, make sure you have these installed on your computer. If you already
have them, skip ahead.

### Required Software

| Tool | Why you need it | Download |
|---|---|---|
| **Git** | To clone and manage the code | https://git-scm.com/downloads |
| **Python 3.11+** | To run the backend | https://www.python.org/downloads |
| **Node.js 18+** | To run the frontend | https://nodejs.org (pick LTS version) |
| **pip** | Comes with Python, installs packages | Already included with Python |

### To check if you have them, open a terminal and run:

```bash
git --version
python --version
node --version
npm --version
```

If any of these say "command not found" or something similar, install that one first.

> **Note for Windows users:** After installing Python, make sure you tick the box that
> says "Add Python to PATH" during installation. If you missed it, uninstall and reinstall.

---

## 2. Getting the Code

### Step 1 — Clone the repository

Open a terminal, go to a folder where you want the project to live, then run:

```bash
git clone https://github.com/Jasim2032/fittrack-.git
```

This will create a folder called `fittrack-` with all the project files inside.

### Step 2 — Go into the project folder

```bash
cd fittrack-
```

You should now see these folders when you list the contents:

```
fittrack-/
├── backend/
├── frontend/
├── .github/
├── PROJECT_COMPACT.md
├── SETUP_MANUAL.md
└── DevOps_Essay.md
```

If you see these, you're good to go.

### Troubleshooting — Git Clone

**Error: `repository not found`**
- Check that the URL is correct. Try opening the GitHub link in a browser to confirm
  the repo exists and is public.

**Error: `git: command not found`**
- Git is not installed. Go to https://git-scm.com/downloads and install it, then
  open a new terminal window and try again.

---

## 3. Running the Backend Locally

The backend is a Python/Flask API. When running locally it uses SQLite, so you do NOT
need PostgreSQL installed on your machine.

### Step 1 — Go into the backend folder

```bash
cd backend
```

### Step 2 — Create a virtual environment

This keeps the Python packages for this project separate from everything else on your
computer. It is good practice and avoids a lot of headaches.

```bash
# On Windows
python -m venv venv

# On Mac/Linux
python3 -m venv venv
```

### Step 3 — Activate the virtual environment

```bash
# On Windows (Command Prompt)
venv\Scripts\activate

# On Windows (Git Bash or PowerShell)
source venv/Scripts/activate

# On Mac/Linux
source venv/bin/activate
```

You will know it worked because your terminal prompt will now show `(venv)` at the start.

### Step 4 — Install the Python packages

```bash
pip install -r requirements.txt
```

This installs Flask, PyJWT, psycopg2, Gunicorn, and everything else the backend needs.
It might take a minute.

### Step 5 — Start the backend

```bash
python app.py
```

If it worked, you will see something like this:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Step 6 — Test that it is working

Open a browser and go to:

```
http://localhost:5000/api/health
```

You should see a JSON response like this:

```json
{
  "status": "healthy",
  "service": "FitTrack API",
  "database": "sqlite",
  "timestamp": "2026-03-27T..."
}
```

If you see that, the backend is running correctly.

### Troubleshooting — Backend

**Error: `ModuleNotFoundError: No module named 'flask'`**
- You forgot to activate the virtual environment, or you ran `pip install` without
  activating it. Run `source venv/bin/activate` first, then `pip install -r requirements.txt`
  again.

**Error: `Port 5000 is already in use`**
- Something else is using port 5000. On Mac this is usually AirPlay Receiver. Go to
  System Preferences → Sharing and turn off AirPlay Receiver. Or kill the process
  using: `kill -9 $(lsof -ti:5000)`
- On Windows: `netstat -ano | findstr :5000` to find the process ID, then
  `taskkill /PID <id> /F` to kill it.

**Error: `python: command not found`**
- Try `python3 app.py` instead. If that also fails, Python is not installed or not
  in your PATH.

**The database file `fittrack.db` was not created**
- It gets created automatically when the app starts. Check the backend folder. If it
  is not there after starting the app, check the terminal for error messages.

---

## 4. Running the Frontend Locally

The frontend is a React application. Keep the backend running in one terminal and open
a second terminal for this.

### Step 1 — Go into the frontend folder

From the project root:

```bash
cd frontend
```

### Step 2 — Install the Node packages

```bash
npm install
```

This downloads all the React libraries (Axios, Recharts, React Router, etc.) into a
`node_modules` folder. This can take 2-3 minutes the first time.

### Step 3 — Start the frontend

```bash
npm start
```

After a moment it will open your browser automatically at `http://localhost:3000`.

If the browser does not open automatically, go there yourself.

You should see the FitTrack login page. If the backend is running on port 5000, the
frontend will automatically connect to it.

### Troubleshooting — Frontend

**Error: `npm: command not found`**
- Node.js is not installed. Go to https://nodejs.org, download the LTS version, install
  it, then open a new terminal and try again.

**The app loads but says "Network Error" or "Cannot connect to server"**
- The backend is not running. Make sure you started `python app.py` in a separate
  terminal and that it is still running.
- Check that the backend is on port 5000 by visiting `http://localhost:5000/api/health`.

**Error: `ENOENT: no such file or directory, open 'package.json'`**
- You are in the wrong folder. Make sure you are inside the `frontend` folder, not the
  project root.

**Compiled but with warnings / lots of yellow text**
- Warnings do not stop the app from running. You can ignore them for now.

**Page shows but is blank / white screen**
- Open the browser developer tools (F12) and check the Console tab for red errors.
  Usually this means a JavaScript syntax error or a missing environment variable.

---

## 5. Running Both Together (Full Local App)

To run the complete app locally you need two terminals open at the same time.

**Terminal 1 — Backend:**
```bash
cd fittrack-/backend
source venv/bin/activate        # (or venv\Scripts\activate on Windows)
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd fittrack-/frontend
npm start
```

Then open `http://localhost:3000` in your browser.

Register a new account, log in, and try adding a workout to confirm everything works
end to end.

> **Tip:** Keep both terminals visible so you can see if either one crashes.

---

## 6. Running with Docker (Optional)

If you have Docker installed and want to run the app the same way it runs in production
without setting up Python or Node manually, you can use Docker.

### Backend with Docker

```bash
cd backend
docker build -t fittrack-backend .
docker run -p 5000:5000 fittrack-backend
```

### Frontend with Docker

```bash
cd frontend
docker build -t fittrack-frontend .
docker run -p 3000:80 fittrack-frontend
```

Then open `http://localhost:3000` as usual.

### Troubleshooting — Docker

**Error: `Cannot connect to the Docker daemon`**
- Docker Desktop is not running. Open Docker Desktop and wait for it to start (the
  whale icon in the taskbar should stop animating).

**Error: `port is already allocated`**
- Change the port mapping. For example `-p 5001:5000` will expose the backend on
  port 5001 instead.

---

## 7. Deploying the Backend to Railway

This section covers how to deploy the Flask backend to Railway so it is live on the
internet. You will need a Railway account — sign up free at https://railway.app.

### Step 1 — Create a new project on Railway

1. Go to https://railway.app and log in.
2. Click **New Project**.
3. Select **Deploy from GitHub repo**.
4. Connect your GitHub account if asked.
5. Find and select the `fittrack-` repository.

### Step 2 — Set the root directory

Railway will try to deploy the whole repo by default. You need to tell it to only use
the `backend` folder.

1. Click on the service that was just created.
2. Go to **Settings** tab.
3. Under **Source**, find **Root Directory** and type: `backend`
4. Click Save.

### Step 3 — Set environment variables

1. Go to the **Variables** tab on your service.
2. Add these variables one by one:

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `SECRET_KEY` | `fittrack-2026` |
| `FLASK_ENV` | `production` |

> You will add `DATABASE_URL` in the next section after setting up PostgreSQL.

### Step 4 — Deploy

1. Go to **Deployments** tab.
2. Click **Deploy** or push a new commit to GitHub — Railway auto-deploys on push.
3. Wait for the build to finish. You will see logs in real time.

### Step 5 — Get your public URL

1. Go to **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Railway will give you a URL like `https://fittrack-production-xxxx.up.railway.app`.

Test it by visiting `https://your-url.up.railway.app/api/health` in a browser.

### Troubleshooting — Railway Deployment

**Build fails with `No start command found`**
- Make sure the `railway.toml` file is inside the `backend/` folder with this content:
  ```toml
  [build]
  builder = "nixpacks"

  [deploy]
  startCommand = "gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120"
  restartPolicyType = "on_failure"
  restartPolicyMaxRetries = 3
  ```

**Build fails with `Module not found`**
- Check that `requirements.txt` is in the `backend/` folder and has all packages listed.

**App crashes after starting — logs say `$PORT is not a valid port number`**
- This happens when Railway tries to use its internal `$PORT` variable inside a Docker
  exec command. Fix: make sure `railway.toml` has the startCommand hardcoded to use
  `5000`, not `$PORT`.

**App returns 500 errors in production but works locally**
- Check the **Logs** tab in Railway for the actual Python error. Usually it is a missing
  environment variable or a database connection issue.

---

## 8. Adding PostgreSQL on Railway

Without a proper database, all data will be lost every time Railway restarts the server.
This section adds PostgreSQL so data is saved permanently.

### Step 1 — Add a PostgreSQL database

1. Inside your Railway project, click **New** (the + button).
2. Select **Database** → **Add PostgreSQL**.
3. Railway creates a PostgreSQL service in the same project.
4. Wait for it to finish provisioning (takes about 30 seconds).

### Step 2 — Get the database connection URL

1. Click on the PostgreSQL service.
2. Go to **Variables** tab.
3. Find the variable called `DATABASE_PUBLIC_URL` and copy its full value.
   It looks like: `postgresql://postgres:password@hostname.railway.app:port/railway`

> **Important:** Use `DATABASE_PUBLIC_URL`, NOT `DATABASE_URL`. The `DATABASE_URL` uses
> Railway's internal network which may not be available on all plan tiers.

### Step 3 — Add it to your backend service

1. Go back to your backend service (not the PostgreSQL service).
2. Go to the **Variables** tab.
3. Add a new variable:
   - Name: `DATABASE_URL`
   - Value: paste the full `DATABASE_PUBLIC_URL` you copied

### Step 4 — Redeploy

Railway should auto-redeploy when you save the variable. If not, trigger a manual deploy.

### Step 5 — Verify

Visit `https://your-url.up.railway.app/api/health` and check the response. It should
now show `"database": "postgresql"` instead of `"database": "sqlite"`.

### Important Note About Existing Data

PostgreSQL starts completely empty. Any data you had in SQLite (local testing accounts,
etc.) does NOT carry over. You will need to register a new account on the live site.

### Troubleshooting — PostgreSQL

**Health check still shows `"database": "sqlite"` after adding DATABASE_URL**
- The environment variable was not saved or the service did not redeploy. Check the
  Variables tab on the backend service to confirm `DATABASE_URL` is there, then trigger
  a redeploy manually.

**App crashes with `could not connect to server`**
- Make sure you used `DATABASE_PUBLIC_URL` and not `DATABASE_URL` from the PostgreSQL
  service's variables tab.
- Double check that you added it to the **backend service variables**, not the PostgreSQL
  service variables.

**Error: `UniqueViolation on pg_type_typname_nsp_index`**
- This is a race condition that happens when two server workers both try to create the
  database tables at the same time during startup. It is already fixed in the code
  using `autocommit=True`. If you see it, it means you are running an older version of
  the code — pull the latest from GitHub and redeploy.

---

## 9. Deploying the Frontend to Vercel

Vercel hosts the React frontend. Sign up free at https://vercel.com.

### Step 1 — Import the project

1. Go to https://vercel.com and log in.
2. Click **Add New** → **Project**.
3. Connect GitHub if not already connected.
4. Find and import the `fittrack-` repository.

### Step 2 — Configure the project settings

In the import screen before clicking Deploy:

- **Project Name:** type `fittrack` (no dash at the end — Vercel does not allow trailing dashes)
- **Framework Preset:** Create React App (Vercel usually detects this automatically)
- **Root Directory:** click **Edit** and set it to `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`

### Step 3 — Add the environment variable

Still on the same import screen, scroll down to **Environment Variables** and add:

| Name | Value |
|---|---|
| `REACT_APP_API_URL` | `https://your-railway-url.up.railway.app/api` |

Replace `your-railway-url` with the actual Railway domain you got in Section 7.

### Step 4 — Deploy

Click **Deploy**. Vercel will build the React app and deploy it. This takes about 1-2
minutes.

When it finishes, Vercel gives you a URL like `https://fittrack-delta-brown.vercel.app`.
Open it — you should see the FitTrack login page.

### Step 5 — Test the full flow

1. Register a new account.
2. Log in.
3. Add a workout.
4. Refresh the page — data should still be there (confirms PostgreSQL is working).

### Troubleshooting — Vercel

**Error: "invalid project name" during import**
- Vercel auto-fills the project name from the repo name `fittrack-` (with the trailing
  dash). Just clear that field and type `fittrack` manually.

**Deploy succeeds but the app shows a blank white page**
- Usually means the `REACT_APP_API_URL` variable is missing or wrong.
- Go to Vercel → Project → Settings → Environment Variables and check it is there.
- After changing any environment variable, you need to **redeploy** for it to take effect.
  Go to Deployments → click the three dots on the latest → Redeploy.

**Routing error — refreshing any page (e.g. /workouts) shows a 404**
- The `vercel.json` file is missing or not in the `frontend` folder. It needs this:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

**Login works but API calls fail — browser shows CORS error**
- The Railway backend is not allowing requests from the Vercel domain. Check that
  `flask-cors` is installed and that `CORS(app)` is in `app.py` with no restrictions.

**`npm ci` error during Vercel build**
- This can happen if the `package-lock.json` is out of date. The fix: from the
  `frontend` folder run `npm install` locally, commit the updated `package-lock.json`,
  and push to GitHub. Vercel will pick up the new file.

---

## 10. Setting Up UptimeRobot Monitoring

UptimeRobot pings your backend every 5 minutes and emails you if it goes down. It is
free.

### Step 1 — Create an account

Go to https://uptimerobot.com and sign up for free.

### Step 2 — Add a new monitor

1. On the dashboard, click **+ Add New Monitor**.
2. Set the following:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** FitTrack API
   - **URL:** `https://your-railway-url.up.railway.app/api/health`
   - **Monitoring Interval:** 5 minutes

3. Under **Alert Contacts**, make sure your email is selected so you get notified on
   downtime.

4. Click **Create Monitor**.

### Step 3 — Verify

After a minute, the monitor should show **Up** with a green dot. If it shows red or
yellow, check that your Railway backend is actually running by visiting the health
endpoint in a browser.

---

## 11. Environment Variables Reference

### Backend (set on Railway or in `backend/.env` for local dev)

| Variable | Example Value | What it does |
|---|---|---|
| `SECRET_KEY` | `fittrack-2026` | Signs and verifies JWT tokens. Change this in production. |
| `FLASK_ENV` | `production` | Disables debug mode. Use `development` locally. |
| `PORT` | `5000` | The port Gunicorn listens on. |
| `DATABASE_URL` | `postgresql://...` | If set, uses PostgreSQL. If missing, uses SQLite. |

### Frontend (set on Vercel or in `frontend/.env` for local dev)

| Variable | Example Value | What it does |
|---|---|---|
| `REACT_APP_API_URL` | `https://...railway.app/api` | The full backend API URL. Overrides the localhost default. |

### For local development (optional)

You can create a `.env` file inside the `backend/` folder:

```
SECRET_KEY=any-random-string-for-local
FLASK_ENV=development
PORT=5000
```

And a `.env` file inside `frontend/` folder (if you want to test against production API locally):

```
REACT_APP_API_URL=https://fittrack-production-f9ad.up.railway.app/api
```

---

## 12. Common Errors and How to Fix Them

This section is a quick-reference for the most common things that go wrong.

---

**`ModuleNotFoundError: No module named 'flask'`**
> You are running Python without the virtual environment activated.
> Run `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows) first.

---

**`Address already in use` / `Port 5000 already in use`**
> Something is already running on port 5000.
> Find and kill it:
> - Mac/Linux: `kill -9 $(lsof -ti:5000)`
> - Windows: `netstat -ano | findstr :5000` → `taskkill /PID <id> /F`

---

**`npm install` takes forever or hangs**
> Try deleting `node_modules` and `package-lock.json`, then run `npm install` again:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

---

**Login says "Invalid credentials" on the live site after you deployed PostgreSQL**
> PostgreSQL is a fresh empty database. Your old local SQLite account does not exist there.
> Register a brand new account on the live site.

---

**Railway deployment keeps crashing — logs show a Python error**
> Open Railway → your service → Logs tab. Read the actual error. Common causes:
> - Missing environment variable (add it in Variables tab)
> - Database URL is wrong (re-copy the `DATABASE_PUBLIC_URL` from PostgreSQL service)
> - A syntax error in `app.py` (check locally first with `python app.py`)

---

**GitHub Actions CI is failing**
> Click on the failing run → click the failing job → expand the step that shows the red X.
> Read the error message. Common causes:
> - Backend tests fail: run `pytest test_app.py -v` locally to see which test fails
> - Frontend build fails: run `npm run build` inside the `frontend/` folder locally to see
>   the error
> - `npm ci` fails with lock file mismatch: the workflow now uses `npm install` which
>   handles this automatically

---

**The app works locally but data disappears on the live site**
> Railway is still using SQLite (no PostgreSQL connected). Check that `DATABASE_URL` is
> set in Railway's Variables tab for the backend service and that it starts with
> `postgresql://`.

---

**CORS error in browser console on the live site**
> The frontend URL is being blocked by the backend. Make sure `flask-cors` is installed
> and `CORS(app)` is in `app.py`. Check Railway logs to confirm the backend is actually
> running and not crashed.

---

**Vercel deploy says "Build failed"**
> Go to Vercel → your project → latest deployment → View build logs.
> Common causes:
> - Missing `package.json` (wrong root directory set — should be `frontend/`)
> - A JavaScript syntax error — fix it locally and push again

---

*Last updated: March 2026*
*FitTrack by Jasim2032 — https://github.com/Jasim2032/fittrack-*
