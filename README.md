# StudyTrack Service & Dashboard

An end-to-end full-stack student management application featuring a FastAPI backend powered by SQLAlchemy and SQLite, paired with a responsive, modern HTML/CSS/JS frontend dashboard.

---

## 📁 Repository Structure

```
studytrack/
├── backend/
│   ├── __init__.py
│   ├── database.py       # SQLAlchemy engine, sessionmaker, Base, and get_db dependency
│   ├── models.py         # Student & Course ORM models with foreign key and bi-directional relationship
│   ├── schemas.py        # Pydantic models with custom @field_validator for email & age/credit bounds
│   ├── crud.py           # Database CRUD functions & SQLAlchemy aggregate course-count query
│   ├── seed_data.py      # Pre-populated roster seed generator (Alice, Bob, Charlie, Diana, Evan)
│   ├── algorithms.py     # Algorithms module engine (hand-rolled sort/search/report functions)
│   ├── ai_service.py     # AI service module (summarizer & similarity functions)
│   ├── main.py           # FastAPI app, API routes, CORS config, static mount, startup seed
│   └── requirements.txt  # Project dependencies
├── frontend/
│   ├── index.html        # HTML5 markup with Add Student & Add Course forms, dropdown mappers, error banner
│   ├── style.css         # Modern dark glassmorphic theme with box model styling & responsive media query
│   └── app.js            # Async fetch, dropdown mapping, event delegation, dynamic DOM creation
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusion rules (venv, *.db, .env, __pycache__)
└── README.md             # Complete setup, API documentation, run modes & execution guide
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Python 3.9+
- pip (Python package manager)

### 2. Create Virtual Environment & Install Dependencies
Open your terminal in the repository root directory (`D:\Shalu_AI\project_1\studytrack`):

```bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies from backend requirements
pip install -r backend/requirements.txt
```

---

## 🚀 Running the Application

You can run StudyTrack in **Single-Process Mode (Recommended)** or **Two-Process Mode**.

### Option A: Single-Process Mode (Recommended)
In single-process mode, FastAPI serves both the REST API and the frontend dashboard as static files from the same server.

Run the following command from the project root (`studytrack/`):

```bash
uvicorn backend.main:app --reload --port 8000
```

Open your browser and navigate to:
- **Frontend Dashboard**: [http://localhost:8000/](http://localhost:8000/)
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Two-Process Mode
If you prefer running the backend and frontend separately:

1. **Start Backend Server**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
2. **Serve Frontend**: Use VS Code Live Server or python http.server on port 5500:
   ```bash
   cd frontend
   python -m http.server 5500
   ```
3. Open your browser to `http://localhost:5500`.

---

## 📖 REST API Documentation

### Student Endpoints

| Method | Endpoint | Description | Request Body | Status Code / Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/students/` | Create a new student | `{ "name": "Jane", "email": "jane@ex.com", "age": 20 }` | `201 Created` -> Student Object |
| `GET` | `/students/` | List all students (supports `?min_age=N`) | Query params: `min_age` (optional) | `200 OK` -> `[ Student Objects ]` |
| `GET` | `/students/{id}` | Get single student by ID | None | `200 OK` / `404 Not Found` |
| `PATCH` | `/students/{id}` | Partially update student (e.g. age) | `{ "age": 22 }` | `200 OK` -> Updated Student |
| `DELETE` | `/students/{id}` | Delete student record | None | `200 OK` / `404 Not Found` |
| `GET` | `/students/{id}/course-count` | Get course count aggregated by DB | None | `200 OK` -> `{ "student_id": id, "course_count": N }` |

### Course Endpoints

| Method | Endpoint | Description | Request Body | Status Code / Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/courses/` | Enroll student in a course | `{ "course_name": "CS101", "credits": 3, "student_id": 1 }` | `201 Created` -> Course Object |
| `GET` | `/courses/` | List all courses | None | `200 OK` -> `[ Course Objects ]` |
| `GET` | `/courses/{id}` | Get single course by ID | None | `200 OK` / `404 Not Found` |
| `PATCH` | `/courses/{id}` | Update course details | `{ "credits": 4 }` | `200 OK` -> Updated Course |
| `DELETE` | `/courses/{id}` | Delete course record | None | `200 OK` / `404 Not Found` |

---

## 🔍 Database Aggregation Query Note

The endpoint `GET /students/{student_id}/course-count` computes the course enrollment count directly within SQLite via an aggregate database query in `backend/crud.py`:

```python
# Executed in backend/crud.py:
def get_student_course_count(db: Session, student_id: int) -> int:
    return db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar() or 0
```
*Note: This query uses SQLAlchemy's `func.count()` to perform an SQL aggregate `SELECT COUNT(courses.id) FROM courses WHERE courses.student_id = :student_id` directly in the database engine, avoiding loading full row collections into Python memory.*

---

## 🎨 Key Features & Verification Walkthrough

1. **Seeded Database Roster**: On initial startup, `seed_data.py` populates 5 initial students with course enrollments (Alice Johnson, Bob Smith, Charlie Brown, Diana Prince, Evan Wright).
2. **Action Buttons & Interactive Modals**:
   - **"➕ Create New Student" Button**: Opens modal to register students with name, email, and age validation.
   - **"📘 Create New Course" Button**: Opens modal to add new course definitions/titles into the master course catalog.
   - **"🔗 Map Course to Student" Button**: Opens modal containing a **Select Student Dropdown** and a **Select Course Dropdown** with auto-filled credits, allowing mapping any student to any course.
   - Modal submission saves mapping to SQLite, clears all fields (resets student dropdown, resets course dropdown, and clears credits input), and closes the popup automatically.
3. **Interactive Course Deletion**: Each course tag on a student card has a removal button (`✕`) that sends a `DELETE /courses/{course_id}` request and updates the roster state.
4. **Age Filtering**: Top navigation bar includes a minimum age filter input (`#min-age-input`), "Apply Filter" button, and "Reset" button.
6. **Dynamic DOM Rendering**: On loading the dashboard, `loadRoster()` fetches students and constructs each student card using `document.createElement` + `appendChild`.
7. **Event Delegation (`#roster-list`)**: A single click listener is attached to `#roster-list` in `app.js`. When a click event occurs, `event.target.closest()` identifies whether the **"Save Age"**, **"Delete Student"**, or **"Remove Course"** button was triggered.
8. **Validation & Error Handling**:
   - Submitting an email without an `@` character triggers a `422 Unprocessable Entity` response from Pydantic's `@field_validator`.
   - Submitting a duplicate email triggers a `400 Bad Request` integrity error from FastAPI without crashing the database server.
   - If the backend server is unreachable, the frontend displays an on-page `<div id="error-banner">` with plain-language text ("Could not reach the StudyTrack backend").
9. **Responsive Design**: `@media (max-width: 600px)` in `style.css` automatically transforms multi-column student cards into a single-column layout.
