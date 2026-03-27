# FitTrack - Fitness Tracker Application

A full-stack fitness tracking application built with **React** and **Flask**, demonstrating DevOps practices including CI/CD, containerisation, automated testing, and monitoring.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Recharts, Lucide Icons    |
| Backend   | Python Flask, Flask-CORS, SQLite    |
| DevOps    | Docker, GitHub Actions, Pytest, Jest|

## Project Structure

```
fittrack/
├── backend/
│   ├── app.py              # Flask API server
│   ├── test_app.py         # Pytest test suite
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js          # API service layer
│   │   ├── App.js          # Main app with routing
│   │   ├── index.css       # Global styles
│   │   └── pages/
│   │       ├── Dashboard.js
│   │       ├── Workouts.js
│   │       └── Goals.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Development)

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
The API runs on http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm start
```
The app opens at http://localhost:3000

### With Docker
```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/health           | Health check             |
| GET    | /api/workouts         | List all workouts        |
| POST   | /api/workouts         | Create a workout         |
| DELETE | /api/workouts/:id     | Delete a workout         |
| GET    | /api/goals            | List all goals           |
| POST   | /api/goals            | Create a goal            |
| PATCH  | /api/goals/:id        | Update goal progress     |
| DELETE | /api/goals/:id        | Delete a goal            |
| GET    | /api/stats            | Dashboard statistics     |
| POST   | /api/seed             | Seed demo data           |

## Running Tests

```bash
# Backend tests
cd backend
pytest test_app.py -v

# Frontend tests (when added)
cd frontend
npm test
```

## DevOps Practices Implemented

1. **Version Control** - Git branching strategy with feature branches and pull requests
2. **CI/CD** - GitHub Actions pipeline for automated testing and building
3. **Containerisation** - Docker and Docker Compose for consistent environments
4. **Automated Testing** - Pytest for backend API testing
5. **Monitoring** - Health check endpoint and structured logging

## Team

- **Jasim** - [Role TBD]

## License

This project is part of an academic DevOps module assignment.
