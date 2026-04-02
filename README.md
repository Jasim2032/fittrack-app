# FitTrack — Your Personal Fitness Tracker

FitTrack is a full-stack web application where you can log workouts, set fitness goals, track your progress with charts, and browse exercises. It was built as a university DevOps module project and is **fully deployed and live on the internet**.

---

## Table of Contents

1. [What Does It Do?](#what-does-it-do)
2. [Live Deployment — Where Is Everything Hosted?](#live-deployment--where-is-everything-hosted)
3. [How the App Is Split Up](#how-the-app-is-split-up)
4. [Tech Stack — What Tools Were Used and Why](#tech-stack--what-tools-were-used-and-why)
5. [Project Folder Structure](#project-folder-structure)
6. [How to Run It on Your Own Computer](#how-to-run-it-on-your-own-computer)
7. [All API Endpoints (Backend Routes)](#all-api-endpoints-backend-routes)
8. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
9. [DevOps Practices Used](#devops-practices-used)
10. [Environment Variables Explained](#environment-variables-explained)
11. [Running the Tests](#running-the-tests)

---

## What Does It Do?

FitTrack lets a user:

- **Create an account and log in** — your data is saved privately under your account
- **Log workouts** — record exercise name, sets, reps, duration, and calories burned
- **Set goals** — e.g. "Run 50km this month" and track progress toward them
- **View a dashboard** — see charts and stats about your fitness over time
- **Browse exercises** — search an exercise library and save favourites to your personal library
- **Load demo data** — one click fills your account with sample workouts and goals so you can explore the app immediately

---

## Live Deployment — Where Is Everything Hosted?

The app is split into two parts (frontend and backend) and each is hosted on a different platform. Here is exactly where everything lives:

### Frontend (the website — what you see in your browser)

| Detail | Value |
|---|---|
| **Live URL** | https://fittrack-theta-three.vercel.app |
| **Hosting Platform** | [Vercel](https://vercel.com) |
| **What it is** | The React web app — all the pages, buttons, charts, and forms |
| **How it gets deployed** | Every time code is pushed to the `main` branch on GitHub, Vercel automatically rebuilds and publishes the new version |

> **What is Vercel?** Vercel is a free hosting service made specifically for frontend web apps. You connect it to your GitHub repo and it auto-deploys every time you push code. Think of it like a web host that watches your GitHub and updates the live site automatically.

---

### Backend (the API — the brain that stores and processes data)

| Detail | Value |
|---|---|
| **Live URL** | https://fittrack-production-f9ad.up.railway.app |
| **API Base URL** | https://fittrack-production-f9ad.up.railway.app/api |
| **Hosting Platform** | [Railway](https://railway.app) |
| **What it is** | The Python Flask server — handles login, saves workouts, reads goals, etc. |
| **How it gets deployed** | Railway watches the `main` branch on GitHub. When new code is pushed, it builds a Docker image and deploys it automatically |

> **What is Railway?** Railway is a cloud hosting platform for backends and servers. You push your code and Railway runs it 24/7 on their servers. It also provides a public URL so the internet can reach your API.

> **What is an API?** An API (Application Programming Interface) is like a waiter in a restaurant. Your browser (the frontend) is the customer, the database is the kitchen, and the API is the waiter that takes your order to the kitchen and brings back the result. The frontend never touches the database directly — it always goes through the API.

---

### Database (where all data is permanently stored)

| Detail | Value |
|---|---|
| **Hosting Platform** | [Railway](https://railway.app) — PostgreSQL plugin |
| **What it is** | A PostgreSQL database that stores all user accounts, workouts, and goals |
| **Who connects to it** | Only the backend (Flask) connects to it. The frontend never touches the database directly |

> **What is PostgreSQL?** PostgreSQL (also called Postgres) is a database — like a very organised spreadsheet that lives on a server. It stores all the app's data permanently. SQLite is used locally for development (it's just a file on your computer), but Postgres is used in production because it handles many users at once reliably.

---

### How They All Connect Together

```
You (browser)
     |
     | visits https://fittrack-theta-three.vercel.app
     v
[VERCEL — React Frontend]
     |
     | sends API requests to Railway
     | e.g. POST /api/auth/login
     v
[RAILWAY — Flask Backend]
     |
     | reads/writes data
     v
[RAILWAY — PostgreSQL Database]
```

In plain English: you open the website (Vercel), you click "Sign In", the website sends your username and password to the backend (Railway), the backend checks the database (also Railway), and sends back "yes, correct" or "wrong password".

---

## How the App Is Split Up

The project has two main parts:

### Frontend
- Built with **React** (a JavaScript framework for building web pages)
- Runs in your web browser
- Responsible for everything you see: the login page, dashboard, charts, buttons, forms
- Talks to the backend via HTTP requests (like a phone call to the API)

### Backend
- Built with **Python Flask** (a lightweight web server framework)
- Runs on Railway's servers
- Responsible for: user authentication, saving/loading workouts and goals, calculating stats
- Talks to the database to permanently store data

---

## Tech Stack — What Tools Were Used and Why

| Layer | Technology | What It Does |
|---|---|---|
| **Frontend UI** | React 18 | Builds the interactive web pages |
| **Charts** | Recharts | Draws the workout charts on the dashboard |
| **Icons** | Lucide React | Provides the small icons (dumbbell, trophy, etc.) |
| **HTTP Requests** | Axios | Sends requests from the frontend to the backend API |
| **Backend Server** | Python Flask | Handles all API routes and business logic |
| **Database (local)** | SQLite | A simple file-based database used during local development |
| **Database (production)** | PostgreSQL | A full database server used when deployed on Railway |
| **Containerisation** | Docker | Packages the backend into a container so it runs the same everywhere |
| **Multi-container** | Docker Compose | Runs frontend + backend together locally with one command |
| **CI/CD** | GitHub Actions | Automatically tests the code every time it is pushed to GitHub |
| **Backend Tests** | Pytest | Automated tests that check the API routes work correctly |
| **Frontend Hosting** | Vercel | Hosts and auto-deploys the React frontend |
| **Backend Hosting** | Railway | Hosts and auto-deploys the Flask backend |
| **Version Control** | Git + GitHub | Tracks all code changes and hosts the source code |

---

## Project Folder Structure

Here is every important file and what it does:

```
fittrack/
│
├── backend/                        ← Everything for the Python server
│   ├── app.py                      ← THE main file — all API routes and logic live here
│   ├── requirements.txt            ← List of Python packages to install (like a shopping list)
│   ├── test_app.py                 ← Automated tests for the API
│   ├── Dockerfile                  ← Instructions to build the backend into a Docker container
│   ├── .dockerignore               ← Tells Docker which files to ignore (keeps the image small)
│   └── railway.toml                ← Railway-specific config (tells Railway how to run the app)
│
├── frontend/                       ← Everything for the React website
│   ├── public/
│   │   └── index.html              ← The single HTML file the whole React app loads into
│   ├── src/
│   │   ├── index.js                ← Entry point — starts the React app
│   │   ├── App.js                  ← Sets up page routing (which URL shows which page)
│   │   ├── index.css               ← Global styles for the whole app
│   │   ├── api.js                  ← All API calls to the backend are defined here
│   │   ├── contexts/
│   │   │   └── AuthContext.js      ← Manages login state across the whole app
│   │   ├── data/
│   │   │   └── exercises.js        ← Local list of exercises for the exercise browser
│   │   └── pages/
│   │       ├── Login.js            ← Sign in / Create account page
│   │       ├── Dashboard.js        ← Home page with stats and charts
│   │       ├── Workouts.js         ← Log and view your workouts
│   │       ├── Goals.js            ← Set and track fitness goals
│   │       ├── Exercises.js        ← Browse and save exercises
│   │       └── Plans.js            ← Workout plans page
│   ├── package.json                ← List of JavaScript packages (like requirements.txt for JS)
│   ├── Dockerfile                  ← Instructions to build the frontend into a Docker container
│   └── .env                        ← Local environment variables (not committed with secrets)
│
├── docker-compose.yml              ← Runs both frontend and backend together locally
├── .github/
│   └── workflows/
│       └── ci.yml                  ← GitHub Actions CI/CD pipeline definition
└── README.md                       ← This file
```

---

## How to Run It on Your Own Computer

> You will need: **Python 3.11+**, **Node.js 18+**, and **npm** installed on your computer.

### Step 1 — Download the code

```bash
git clone https://github.com/Jasim2032/fittrack-app.git
cd fittrack-app
```

### Step 2 — Start the Backend (Python API)

Open a terminal and run:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will start at `http://localhost:5000`
You can verify it works by visiting `http://localhost:5000/api/health` in your browser — you should see `{"status": "ok"}`.

### Step 3 — Start the Frontend (React App)

Open a **second** terminal (keep the backend running in the first one) and run:

```bash
cd frontend
npm install
npm start
```

The app will open automatically at `http://localhost:3000`

### Alternative — Run Both With Docker (one command)

If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed:

```bash
docker-compose up --build
```

This starts both the frontend and backend together. Visit `http://localhost:3000`.

> **What is Docker?** Docker is a tool that packages your app and all its dependencies into a "container" — like a self-contained box that runs the same way on any computer, regardless of what's installed on that computer.

---

## All API Endpoints (Backend Routes)

An "endpoint" is a specific URL on the backend that does one specific job. Here is every endpoint in the app:

### Health Check
| Method | URL | What It Does |
|---|---|---|
| GET | `/api/health` | Returns `{"status":"ok"}` — used to check the server is running |

### Authentication (Login / Register)
| Method | URL | What It Does |
|---|---|---|
| POST | `/api/auth/register` | Creates a new user account |
| POST | `/api/auth/login` | Logs in and returns a token |
| GET | `/api/auth/me` | Returns the currently logged-in user's info |
| POST | `/api/auth/upgrade` | Upgrades account (admin use) |

> **What is a token?** When you log in, the server gives your browser a secret string (a "token"). Every time the frontend makes a request after that, it includes this token to prove who you are — like a wristband at an event.

### Workouts
| Method | URL | What It Does |
|---|---|---|
| GET | `/api/workouts` | Returns all workouts for the logged-in user |
| POST | `/api/workouts` | Saves a new workout |
| DELETE | `/api/workouts/<id>` | Deletes a specific workout by its ID |

### Goals
| Method | URL | What It Does |
|---|---|---|
| GET | `/api/goals` | Returns all goals for the logged-in user |
| POST | `/api/goals` | Creates a new goal |
| PATCH | `/api/goals/<id>` | Updates progress on a goal |
| DELETE | `/api/goals/<id>` | Deletes a goal |

### Statistics
| Method | URL | What It Does |
|---|---|---|
| GET | `/api/stats` | Returns summary stats (total workouts, calories, etc.) for the dashboard |

### Exercises
| Method | URL | What It Does |
|---|---|---|
| GET | `/api/exercises/search` | Searches for exercises by name |
| GET | `/api/exercises/saved` | Returns the user's saved exercise library |
| POST | `/api/exercises/saved` | Saves an exercise to the user's library |
| DELETE | `/api/exercises/saved/<id>` | Removes a saved exercise |

### Utilities
| Method | URL | What It Does |
|---|---|---|
| POST | `/api/calories/estimate` | Estimates calories burned based on exercise and duration |
| POST | `/api/seed` | Fills the account with sample demo data |

---

## How the CI/CD Pipeline Works

> **What is CI/CD?** CI stands for Continuous Integration — every time you push code, automated checks run to make sure nothing is broken. CD stands for Continuous Deployment — if the checks pass, the new code is automatically deployed live. Together they mean: push code → tests run automatically → if tests pass → live site updates automatically. No manual steps needed.

Here is what happens step by step every time code is pushed to GitHub:

```
1. Developer pushes code to GitHub (git push)
         |
         v
2. GitHub Actions automatically triggers the CI pipeline
         |
         v
3. GitHub spins up a fresh virtual machine in the cloud
         |
         v
4. It installs Python and all dependencies
         |
         v
5. It runs all the backend tests (pytest)
         |
         v
6. If ALL tests pass → GitHub marks the commit as green (✓)
   If ANY test fails → GitHub marks it red (✗) and notifies you
         |
         v
7. Vercel detects the push → rebuilds and redeploys the frontend
         |
         v
8. Railway detects the push → rebuilds the Docker image → redeploys the backend
```

The pipeline file lives at [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## DevOps Practices Used

This project demonstrates the following DevOps practices:

| Practice | Tool Used | What It Means |
|---|---|---|
| **Version Control** | Git + GitHub | All code changes are tracked. You can see every change ever made, who made it, and roll back if needed |
| **CI/CD Pipeline** | GitHub Actions | Tests run automatically on every push. Deployments happen automatically if tests pass |
| **Containerisation** | Docker | The backend is packaged into a container so it behaves identically in development and production |
| **Infrastructure as Code** | Dockerfile, docker-compose.yml | The server setup is written as code — anyone can reproduce the exact same environment |
| **Automated Testing** | Pytest | 20+ automated tests verify every API endpoint works correctly without manual testing |
| **Health Monitoring** | `/api/health` endpoint | A dedicated URL that monitoring tools can ping to confirm the server is alive |
| **Environment Separation** | `.env` files | Secrets and config (database URLs, secret keys) are kept out of the code and set as environment variables |
| **Separate Staging/Prod** | Vercel preview deployments | Every Pull Request gets its own preview URL before merging to production |

---

## Environment Variables Explained

Environment variables are settings that are stored outside the code — usually secrets or URLs that differ between your laptop and the live server. **Never put passwords or secret keys directly in code files.**

### Backend (set in Railway dashboard → Variables tab)

| Variable | Example Value | What It Does |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Connection string for the PostgreSQL database on Railway |
| `SECRET_KEY` | `some-random-string` | Used to sign login tokens so they can't be faked |
| `PORT` | `5000` | The port the Flask server listens on (Railway sets this automatically) |

### Frontend (set in Vercel dashboard → Settings → Environment Variables)

| Variable | Example Value | What It Does |
|---|---|---|
| `REACT_APP_API_URL` | `https://fittrack-production-f9ad.up.railway.app/api` | Tells the frontend where the backend API lives |

> **Why does the frontend need the backend URL?** The React app runs in your browser — it doesn't know where the backend is unless you tell it. Without this variable it tries to guess (and gets it wrong when deployed).

---

## Running the Tests

The backend has a suite of automated tests that check every API endpoint:

```bash
cd backend
pip install -r requirements.txt
pytest test_app.py -v
```

The `-v` flag means "verbose" — it prints the name of each test as it runs so you can see what's being tested.

You should see output like:
```
test_app.py::test_health_check PASSED
test_app.py::test_register_user PASSED
test_app.py::test_login_user PASSED
...
```

These same tests run automatically on GitHub every time code is pushed (via GitHub Actions).

---

## Team

- **Jasim** — Developer

## License

This project is part of an academic DevOps module assignment.
