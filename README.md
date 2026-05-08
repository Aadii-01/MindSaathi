# Smriti (स्मृति) - Cognitive Assessment Platform

Smriti is a full-stack web application for cognitive screening and practice.  
It allows users to sign up/login, attempt multiple cognitive tests, store results, view trend graphs, and submit platform feedback.

This README is written in report-friendly format and covers:

- Website purpose and use-case
- Complete product flow
- Full tech stack (frontend + backend)
- Functions/modules used where and why
- API contract and data flow
- Setup instructions for running locally

---

## 1) Purpose of the Website

Smriti is designed to provide a simple, modern, and accessible platform for:

- Cognitive self-assessment (memory, focus, pattern recognition, processing speed)
- Performance tracking over time (charts + attempt history)
- Structured feedback collection to improve the platform
- Bilingual user experience (English + Hindi)

### Why this website is useful

- Helps users monitor cognitive performance across repeated attempts
- Gives quantitative output (score, correct/wrong, timing, trends)
- Enables instructors/researchers/developers to collect user feedback and test data
- Demonstrates full-stack integration of modern frontend UI and backend APIs

---

## 2) Complete Flow of the Project

### A) Entry and Authentication flow

1. User opens `/` -> `MainCome` screen (auth landing).
2. User chooses:
   - Participant Login (`/login`)
   - Signup (`/signup` via Login link)
   - Admin Login (`/admin-login`)
3. On successful login, frontend stores user token/session info in `localStorage`.
4. User is redirected to dashboard `/landing`.

### B) Dashboard and test selection flow

1. Navbar provides:
   - Feedback page
   - View test scores page
   - Language switcher (English/Hindi)
2. User selects a test card and starts a test.
3. Test page runs timer/question logic and computes final score.
4. On completion, score payload is sent to backend `POST /api/result/`.
5. User is navigated to `/result` page for summary.

### C) Result and analytics flow

1. Result page shows score and test-specific metrics.
2. User can retry test or return to dashboard.
3. On "View test scores", user navigates to `/test-scores`.
4. Test Scores page fetches user-wise history from `GET /api/results/me/?username=...`.
5. Page groups attempts by test type and renders charts + summary cards + attempt list.

### D) Feedback flow

1. User opens `/feedback`.
2. Submits ratings (1-5) and comments.
3. Backend saves feedback with metadata and timestamp through `POST /api/feedback/`.

---

## 3) Tech Stack

## Frontend (React app)

- React 19
- React Router DOM
- Chart.js + react-chartjs-2
- CSS3 (custom styling)
- LocalStorage for session/language state

## Backend (Django REST API)

- Django 5
- Django REST Framework
- django-cors-headers
- JSON file-based persistence via `backend/db.json` (custom helper)
- Optional Django ORM models/serializers present for extensibility

## Development/Tooling

- Node.js + npm
- Python 3 + pip + virtualenv
- Build via `react-scripts`

---

## 4) Frontend Architecture (Used where and why)

### Routing and app entry

- `frontend/src/index.js`
  - Wraps app in `LanguageProvider`
  - Why: enables global multilingual support.

- `frontend/src/App.js`
  - Declares route map for all pages/tests
  - Why: centralized navigation structure.

### Global language system

- `frontend/src/context/LanguageContext.jsx`
  - `LanguageProvider`, `useLanguage()`, `toggleLanguage`, persisted language
  - Why: single source of truth for UI language.

- `frontend/src/i18n/translations.js`
  - English/Hindi key-value text dictionary
  - Why: maintainable multilingual text management.

### Core pages/components

- `pages/MainCome.jsx`
  - Split auth landing UI (login/signup/admin switching)
- `pages/Login.jsx`
  - Participant login form + backend auth call
- `pages/Signup.jsx`
  - Registration form + validation + register API call
- `pages/AdminLogin.jsx`
  - Admin login endpoint integration
- `pages/Landing.jsx`
  - Dashboard + test listing
- `components/Navbar.jsx`
  - Navigation, language selector, logout
- `components/Hero.jsx`
  - Main dashboard hero section content
- `components/Card.jsx`
  - Reusable test card component
- `pages/Feedback.jsx`
  - Feedback questionnaire and comments
- `pages/TestScores.jsx`
  - Grouped attempts + performance chart + metrics
- `pages/tests/*.jsx`
  - Test execution engines (Number Memory, Find Target, Pattern, Stroop, Typing/CDR)
- `pages/tests/Result.jsx`
  - Test result presentation and retry flow

### Graph/analytics layer

- In `TestScores.jsx`:
  - `scorePercent(score, total)` -> normalized percentage calculation
  - `aggregateForCategory(attempts)` -> summary stats per test type
  - `buildCategoryChartData(attempts)` -> chart-ready trend points
  - Why: converts raw attempt data into meaningful visual analytics.

---

## 5) Backend Architecture (Used where and why)

### URL and project config

- `backend/config/urls.py`
  - Routes all `/api/*` calls to `app.urls`
- `backend/config/settings.py`
  - Installed apps, custom user model, CORS, database/static/media settings

### API route definitions

- `backend/app/urls.py`
  - Endpoint map for auth, feedback, captcha, results, health

### Business logic APIs

- `backend/app/views.py` (main logic layer)
  - Auth:
    - `register`
    - `login`
    - `admin_login`
    - `get_all_users`
  - Feedback:
    - `submit_feedback`
    - `get_all_feedback`
  - Captcha:
    - `captcha_challenge`
    - `captcha_verify`
  - Results:
    - `save_result`
    - `get_results`
    - `get_my_results`
  - Utility:
    - `health_check`

### Storage and persistence

- `backend/app/json_db.py`
  - File-based DB abstraction for users, feedback, test results, captcha sessions
  - Why: simple persistence layer without full relational schema dependence.

- `backend/db.json`
  - Actual JSON data store
  - Why: rapid development and easy debugging.

### Captcha data engine

- `backend/app/captcha_data.py`
  - Challenge generation + verification
  - Why: supports image-based challenge test flow.

### ORM-ready models and serializers (extensible layer)

- `backend/app/models.py`
  - `User`, `Feedback`, `ImageQuestion`, `ImageOption`, `TestResult`
- `backend/app/serializers.py`
  - serializers for register/login/feedback/image question

These are present for structured ORM/API expansion even though current runtime logic primarily uses JSON DB helper functions.

---

## 6) Key Functions and Their Role (Report Section)

### Frontend function-level highlights

- `useLanguage()` in multiple pages/components  
  - Where: auth pages, dashboard, tests, result, feedback  
  - Why: dynamic multilingual rendering.

- `handleLogin()`, `handleSubmit()` in auth pages  
  - Where: `Login.jsx`, `Signup.jsx`, `AdminLogin.jsx`  
  - Why: client-side validation + backend auth integration.

- Test finish handlers (`finish`)  
  - Where: each test file under `pages/tests/`  
  - Why: compute final metrics, persist result to backend, redirect to result page.

- Chart helper functions in `TestScores.jsx`  
  - Why: convert attempt history into readable and comparable analytics.

### Backend function-level highlights

- `hash_password()`, `verify_password()`, `generate_token()`  
  - Why: credential security and session token generation.

- `validate_username()`, `validate_email()`, `validate_password()`  
  - Why: enforce input correctness and data quality.

- `save_result()` + `get_my_results()`  
  - Why: analytics backbone for test history and graph rendering.

- `submit_feedback()`  
  - Why: collect user quality insights for platform improvement.

---

## 7) API Endpoints (Current)

Base URL: `http://127.0.0.1:8000/api/`

- `POST /register/` - create participant account
- `POST /login/` - participant login
- `POST /admin-login/` - admin login
- `GET /users/` - list users
- `POST /feedback/` - submit feedback
- `GET /feedback/all/` - get all feedback entries
- `GET /captcha/challenge/` - get captcha challenge
- `POST /captcha/verify/` - validate captcha selection
- `POST /result/` - save test result
- `GET /results/` - fetch all results
- `GET /results/me/?username=<name>` - fetch results for one user
- `GET /health/` - health check

---

## 8) Folder Structure

```text
wt-labese-project/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── app/
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── json_db.py
│   │   ├── captcha_data.py
│   │   ├── models.py
│   │   └── serializers.py
│   ├── db.json
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── context/
│   │   ├── i18n/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
└── README.md
```

---

## 9) Setup and Run Instructions

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver
```

Backend default: `http://127.0.0.1:8000/`

## Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend default: `http://localhost:3000/`

## Production build (frontend)

```bash
cd frontend
npm run build
```

---

## 10) General Information for Report Writing

Use this project as a case study of:

- Full-stack integration (React + Django REST)
- Cognitive-assessment product design
- API-driven modular architecture
- Data collection + analytics dashboards
- Bilingual UX implementation
- Secure auth basics (hash + token, validation)

### Suggested report headings

1. Introduction and Objective  
2. Problem Statement  
3. Proposed Solution (Smriti)  
4. System Architecture  
5. Tech Stack Justification  
6. Module-wise Implementation  
7. API Design and Data Flow  
8. UI/UX and Multilingual Design  
9. Testing and Build Validation  
10. Future Scope  

---

## 11) Future Scope

- Replace JSON file DB with PostgreSQL/MySQL
- Add JWT refresh token flow and role-based authorization
- Add admin analytics dashboard
- Add downloadable reports and export features
- Add deeper cognitive metrics and ML-based insights
- Add unit/integration/E2E tests
- Deploy frontend and backend with CI/CD pipeline

---

## 12) Conclusion

Smriti is a practical and extensible cognitive assessment platform demonstrating modern full-stack web development. It combines user authentication, modular test engines, multilingual UI, feedback collection, and analytical score tracking in one integrated system suitable for academic demonstration and future production hardening.
