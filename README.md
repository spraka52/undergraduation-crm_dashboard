# Undergraduation CRM Dashboard

## Project Overview

This repository contains a lightweight internal CRM dashboard designed for the Undergraduation team. It provides a centralized view of **student engagement**, **application progress**, and **communication history**, enabling internal teams to manage follow-ups and log key interactions efficiently.

The solution is built using a **Python Flask API** for the backend logic and data persistence, and a **React application** for the dynamic frontend interface.

---

### Key Implemented Features

| Feature Area | Details |
| :--- | :--- |
| **Student Directory View** | Table view with search, filtering (by status, last active, needs essay help), and summary statistics. |
| **Individual Profile View** | Dedicated page displaying profile info, scores (GPA, SAT/ACT), dynamic **Application Progress** bar, and mock AI Summary. |
| **Communication Log** | Separate section dedicated to logging **Calls and Mock Emails**. Displays status and team member responsible. |
| **Interaction Timeline** | Separate section showing system-generated events like **Logins, AI Questions Asked, and Documents Submitted** (mock data). |
| **Internal Notes CRUD** | Dedicated section for team members to **Add, Edit, and Delete** internal notes and reminders (tasks). |

### Technology Stack

* **Frontend:** React (Vite)
* **Backend API:** Python Flask
* **Database:** Firebase Cloud Firestore (via Python Admin SDK)

---

## Local Setup and Installation

Follow these steps precisely to set up and run the application locally.

### 1. Prerequisites

* **Python 3.8+**
* **Node.js & npm (or Yarn)**
* **Firebase Project:** A Google Firebase project with **Cloud Firestore** enabled.

### 2. Firebase Configuration (Security Critical)

The backend requires credentials to access Firestore.

1.  In your Firebase Console, navigate to **Project settings** (gear icon) > **Service accounts**.
2.  Click **Generate new private key** and download the `JSON` file.
3.  Rename the downloaded file to **`serviceAccountKey.json`** and place it directly inside the **`backend/`** directory.
4.  **Security Note:** This file is listed in the root `.gitignore` to prevent accidental pushing.

### 3. Backend Setup (Flask API)

Navigate to the **`backend/`** directory in your first terminal window.

```bash
# 1. Create and activate a Python virtual environment
python3 -m venv venv
#for mac os
source venv/bin/activate 
#for windows
.\venv\Scripts\activate.bat

# 2. Install dependencies (Flask, flask-cors, firebase-admin)
pip install -r requirements.txt

# 3. Seed Mock Data (MANDATORY for initial load)
python seed_data.py

# 4. Run the Flask API Server (Uses port 8000 to avoid conflicts)
python app.py
```
Leave this terminal window running. The API is accessible at http://127.0.0.1:8000.

### 4. Frontend Setup (React)
Open a NEW terminal window and navigate to the frontend/ directory.


```bash
# 1. Install Node modules
npm install 

# 2. Run the React Development Server (Runs on port 5173)
npm run dev
```

The live application will open in your browser at http://localhost:5173.

Link to loom Demo : https://www.loom.com/share/ff4436710cb64ce6b9d77cca9cfdd455?sid=8376fb2e-f2f8-46f7-bad2-b363f64a4094
