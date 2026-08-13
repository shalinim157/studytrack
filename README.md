# StudyTrack Service & Dashboard

An end-to-end full-stack student management application featuring a FastAPI backend powered by SQLAlchemy and SQLite, paired with a responsive, modern HTML/CSS/JS frontend dashboard.

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Python 3.9+
- pip (Python package manager)

### 2. Create Virtual Environment & Install Dependencies
Open your terminal in the repository root directory 

Create a virtual environment
python -m venv venv

Activate Virtual environment in Windows (CMD):
.\venv\Scripts\activate

Install dependencies from backend requirements
pip install -r backend/requirements.txt


Running the Application

You can run StudyTrack in Single-Process Mode

In single-process mode, FastAPI serves both the REST API and the frontend dashboard as static files from the same server.

Run the command from the project root (`studytrack/`):

In terminal ,backend run command ->

uvicorn backend.main:app --reload --port 8000

Open your browser and navigate to:
- Frontend Dashboard: http://localhost:8000/
- API Swagger Documentation: http://localhost:8000/docs


REST API Documentation
-----------------------
### Student Endpoints

| Method | Endpoint | Description | Request Body | Status Code / Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/students/` | Create a new student | `{ "name": "Neha Sharma", "email": "neha.sharma@example.com", "age": 20 }` | `201 Created` -> Student Object |
| `GET` | `/students/` | List all students (supports `?min_age=`) | None | `200 OK` -> `[ Student Objects ]` |
| `GET` | `/students/{id}` | Get single student by ID | None | `200 OK` -> Student Object / `404 Not Found` |
| `PATCH` | `/students/{id}` | Partially update student (e.g. age) | `{ "age": 22 }` | `200 OK` -> Updated Student / `404 Not Found` |
| `DELETE` | `/students/{id}` | Delete a student record | None | `200 OK` -> `{ "message": "..." }` / `404 Not Found` |
| `GET` | `/students/{id}/course-count` | Get total number of courses enrolled by student | None | `200 OK` -> `{ "student_id": id, "course_count": N }` / `404 Not Found` |

### Course Endpoints

| Method | Endpoint | Description | Request Body | Status Code / Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/courses/` | Enroll student in a course | `{ "course_name": "CS101", "credits": 3, "student_id": 1 }` | `201 Created` -> Course Object |
| `GET` | `/courses/` | List all courses | None | `200 OK` -> `[ Course Objects ]` |
| `GET` | `/courses/{id}` | Get single course by ID | None | `200 OK` / `404 Not Found` |
| `PATCH` | `/courses/{id}` | Update course details | `{ "credits": 4 }` | `200 OK` -> Updated Course / `404 Not Found` |
| `DELETE` | `/courses/{id}` | Delete course record | None | `200 OK` -> `{ "message": "..." }` / `404 Not Found` |

Database Aggregation Query Note
-------------------------------

The endpoint `GET /students/{student_id}/course-count` computes the course enrollment count directly within SQLite via an aggregate database query in `backend/crud.py`:

Executed in backend/crud.py:
```python
def get_student_course_count(db: Session, student_id: int) -> int:
    return db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar() or 0
```

Explanation: This query uses SQLAlchemy `func.count()` to perform an SQL aggregate `SELECT COUNT(courses.id) FROM courses WHERE courses.student_id == student_id` directly in the database, avoiding loading full row collections into Python memory.

The database counts the matching rows and returns a single number — only the integer count is transferred back to our application.

Key Features & Verification Walkthrough
----------------------------------------

1. **Seeded Database Roster**: On initial startup, `seed_data.py` populates the official 8-student roster dataset:
   - Aditi Rao (Age 22, `aditi.rao@example.com`)
   - Rohan Mehta (Age 19, `rohan.mehta@example.com`)
   - Kavya Nair (Age 25, `kavya.nair@example.com`)
   - Farhan Sheikh (Age 18, `farhan.sheikh@example.com`)
   - Priya Iyer (Age 21, `priya.iyer@example.com`)
   - Devansh Gupta (Age 23, `devansh.gupta@example.com`)
   - Meera Joshi (Age 20, `meera.joshi@example.com`)
   - Sameer Khan (Age 24, `sameer.khan@example.com`)

2. **Interactive Modals with Confirmation OK Popups**:
   - **"Create New Student" Button**: Opens modal to register students with custom email `@` validation (`@field_validator`) and age `> 0` validation (`Field(gt=0)`). Shows confirmation OK popup upon creation ("Student 'Name' created successfully."). Automatically pre-selects the new student in the Map Course dropdown.
   - **"Create New Course" Button**: Opens modal with Course Title to add new courses to the catalog. Shows confirmation OK popup upon addition.
   - **"Map Course to Student" Button**: Opens modal containing a Select Student dropdown and a Select Course dropdown with credits validation (1 to 6 inclusive, `Field(ge=1, le=6)`). Shows confirmation OK popup upon mapping.
   - **Form Clearing on Modal Close/Open**: Closing any modal without submitting automatically resets all input fields, and opening any modal pre-clears previous inputs.
   - **Disabled Browser Autocomplete**: All modal forms and input fields explicitly enforce `autocomplete="off"`.
   - **Deletion Confirmations**: Deleting a student or course displays a confirmation popup with an OK button.
   - **In-Modal Error Banners**: Validation & backend errors display directly inside active modal popups in bold red without closing windows.

3. **Interactive Course Deletion**: Each course tag on a student card has a Delete button that sends a `DELETE /courses/{course_id}` request and updates the roster state.
4. **Age Filtering**: Click "Apply Filter" button that sends `GET /students/?min_age=20` to show students with `age >= 20`, and "Reset" button resets the roster view.
5. **Dynamic DOM Rendering**: On loading the dashboard, `loadRoster()` fetches students and constructs each student card using `document.createElement` + `appendChild`.
6. **Event Delegation (`#roster-list`)**: A single click listener is attached to `#roster-list` in `app.js`. When a click event occurs, `event.target.closest()` identifies whether "Save Age", "Delete Student", or "Remove Course" was triggered.
7. **Validation & Error Handling**:
   - Submitting an email without an `@` character triggers a `422 Unprocessable Entity` response from Pydantic's `@field_validator`, displaying `"Invalid email format: Must contain an '@' character"`.
   - Submitting a duplicate email triggers a `400 Bad Request` integrity error from FastAPI without crashing the database server.
   - If the backend server is unreachable, the frontend displays an on-page `<div id="error-banner">` with plain-language text: `"Could not reach the StudyTrack backend. Please ensure the backend server is running."`.
8. **Responsive Design**: `@media (max-width: 600px)` in `style.css` automatically transforms multi-column student cards into a single-column layout.

End-to-End Walkthrough & Sample Backend Logs
--------------------------------------------

This application connects the HTML/CSS/JS dashboard and FastAPI + SQLAlchemy backend end-to-end. Below is the step-by-step execution walkthrough with corresponding backend console log outputs and HTTP responses:

Step 1: Opening Dashboard & Loading Roster (`GET /students/`)
- User Action: Open `http://localhost:8000/` in browser.
- Backend Console Log:
  ```
  INFO:     127.0.0.1:8000 - "GET /students/ HTTP/1.1" 200 OK
  ```
- HTTP Response Payload (200 OK):
  ```json
  [
    { "id": 1, "name": "Aditi Rao", "email": "aditi.rao@example.com", "age": 22, "courses": [] },
    { "id": 2, "name": "Rohan Mehta", "email": "rohan.mehta@example.com", "age": 19, "courses": [] },
    { "id": 3, "name": "Kavya Nair", "email": "kavya.nair@example.com", "age": 25, "courses": [] },
    { "id": 4, "name": "Farhan Sheikh", "email": "farhan.sheikh@example.com", "age": 18, "courses": [] },
    { "id": 5, "name": "Priya Iyer", "email": "priya.iyer@example.com", "age": 21, "courses": [] },
    { "id": 6, "name": "Devansh Gupta", "email": "devansh.gupta@example.com", "age": 23, "courses": [] },
    { "id": 7, "name": "Meera Joshi", "email": "meera.joshi@example.com", "age": 20, "courses": [] },
    { "id": 8, "name": "Sameer Khan", "email": "sameer.khan@example.com", "age": 24, "courses": [] }
  ]
  ```

Step 2: Editing Student Age (`PATCH /students/2`)
- User Action: Change age input on Rohan Mehta's card to `20` and click "Save Age".
- Backend Console Log:
  ```
  INFO:     127.0.0.1:8000 - "PATCH /students/2 HTTP/1.1" 200 OK
  ```
- HTTP Request Body: `{ "age": 20 }`
- HTTP Response Payload (200 OK):
  ```json
  {
    "id": 2,
    "name": "Rohan Mehta",
    "email": "rohan.mehta@example.com",
    "age": 20,
    "courses": []
  }
  ```

Step 3: Creating a New Student (`POST /students/`)
- User Action: Click "Create New Student", enter `Neha Sharma`, `neha.sharma@example.com`, `20` and click Save Student.
- Backend Console Log:
  ```
  INFO:     127.0.0.1:8000 - "POST /students/ HTTP/1.1" 201 Created
  ```
- HTTP Request Body: `{ "name": "Neha Sharma", "email": "neha.sharma@example.com", "age": 20 }`
- HTTP Response Payload (201 Created):
  ```json
  {
    "id": 9,
    "name": "Neha Sharma",
    "email": "neha.sharma@example.com",
    "age": 20,
    "courses": []
  }
  ```
- DOM Action: A new student card for Neha Sharma is instantiated via `document.createElement("div")` and appended directly into `#roster-list` via `.appendChild()` without reloading the page.

Step 4: Querying Aggregated Course Count (`GET /students/1/course-count`)
- User Action: Query course count endpoint for Aditi Rao (ID #1) after enrolling in 2 courses.
- Backend Console Log:
  ```
  INFO:     127.0.0.1:8000 - "GET /students/1/course-count HTTP/1.1" 200 OK
  ```
- HTTP Response Payload (200 OK):
  ```json
  {
    "student_id": 1,
    "course_count": 2
  }
  ```
- SQLAlchemy Call: Executed directly in SQLite via `db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar()`.

Step 5: Deleting a Student (`DELETE /students/9`)
- User Action: Click "Delete Student" on Neha Sharma's card.
- Backend Console Log:
  ```
  INFO:     127.0.0.1:8000 - "DELETE /students/9 HTTP/1.1" 200 OK
  ```
- HTTP Response Payload (200 OK):
  ```json
  {
    "message": "Student with ID 9 successfully deleted."
  }
  ```
- DOM Action: Card is immediately removed from DOM (`card.remove()`), and confirmation OK popup displays "Neha Sharma is deleted.".

Step 6: Error Handling Verification
1. **Duplicate Email Error**:
   - Submitting `aditi.rao@example.com` returns `400 Bad Request`:
     `{ "detail": "A student with email 'aditi.rao@example.com' already exists." }`
   - Displays error directly inside `#student-modal-error` in bold red text.

2. **Invalid Email Missing `@`**:
   - Submitting `invalid-email` returns `422 Unprocessable Entity` from Pydantic `@field_validator`:
     `{ "detail": "Invalid email format: Must contain an '@' character" }`

3. **Nonexistent Resource (404)**:
   - Requesting `GET /students/999` returns `404 Not Found`:
     `{ "detail": "Student with ID 999 not found." }`

4. **Backend Server Offline**:
   - Stopping Uvicorn triggers on-page error banner `<div id="error-banner">`: `"Could not reach the StudyTrack backend. Please ensure the backend server is running."`

Part 2: Integrated Algorithms Engine & Roster Reports

The algorithms engine operates directly on the live SQLite database populated with the official 8-student seed dataset (`backend/seed_data.py`).

Algorithmic Complexity & Precondition Explanation

1. Insertion Sort Complexity Analysis:
  Insertion Sort builds a sorted array one element at a time by picking each key and inserting it into its correct position among previously sorted elements.
   - Worst-Case Time Complexity O(n^2): This happens when the list is in reverse order. For each element, the while loop has to compare and move all the previous elements. As the number of elements increases, the number of operations increases very quickly. Therefore, the time complexity is O(n²).

    -Best-Case Time Complexity O(n): This happens when the list is already sorted in ascending order. For each element, the while loop checks the condition only once, and no elements need to be moved. Therefore, the algorithm takes linear time, O(n).

2. Binary Search Sorted Precondition:
    Binary Search checks the middle element and removes half of the list in each step. If the target is greater than the middle element, it searches the right half; otherwise, it searches the left half. This only works when the list is already sorted. If the list is unsorted, removing half of the list may accidentally remove the target element. Therefore, the list must be sorted before using Binary Search.


Part 2 API Endpoint Reference & Verification
--------------------------------------------

 Endpoint - `GET /students/sorted?by=age`
-Description: Fetches all students and sorts them in place using Insertion Sort(`insertion_sort_by_field`).
-Sample Request: `GET http://localhost:8000/students/sorted?by=age`

  [
    { "id": 4, "name": "Farhan Sheikh", "email": "farhan.sheikh@example.com", "age": 18 },
    { "id": 2, "name": "Rohan Mehta", "email": "rohan.mehta@example.com", "age": 19 },
    { "id": 7, "name": "Meera Joshi", "email": "meera.joshi@example.com", "age": 20 },
    { "id": 5, "name": "Priya Iyer", "email": "priya.iyer@example.com", "age": 21 },
    { "id": 1, "name": "Aditi Rao", "email": "aditi.rao@example.com", "age": 22 },
    { "id": 6, "name": "Devansh Gupta", "email": "devansh.gupta@example.com", "age": 23 },
    { "id": 8, "name": "Sameer Khan", "email": "sameer.khan@example.com", "age": 24 },
    { "id": 3, "name": "Kavya Nair", "email": "kavya.nair@example.com", "age": 25 }
  ]

2. `GET /students/search?name=Priya Iyer`
- Description: Sorts students alphabetically by name using Python's `sorted()`, then performs an iterative Binary Search (`binary_search_by_name`).
- Sample Request: `GET http://localhost:8000/students/search?name=Priya%20Iyer`
- Backend Console Log: `INFO: 127.0.0.1:5500 - "GET /students/search?name=Priya%20Iyer HTTP/1.1" 200 OK`
- Verified Response :
  {
    "id": 5,
    "name": "Priya Iyer",
    "email": "priya.iyer@example.com",
    "age": 21,
    "courses": [ ... ]
  }
  
- Nonexistent Search Request: `GET /students/search?name=Priya` -> Returns `404 Not Found` (`{ "detail": "Student with name 'Priya' not found." }`).

3. `GET /students/report?min_age=21`
- Description: Generates a formatted multi-line roster report (`format_roster_report`) and counts students meeting the minimum age threshold (`count_students_meeting_min_age`) using an explicit accumulator variable.
- Sample Request: `GET http://localhost:8000/students/report?min_age=21`
- Backend Console Log: `INFO: 127.0.0.1:5500 - "GET /students/report?min_age=21 HTTP/1.1" 200 OK`
- Verified Response (count_meeting_min_age = 5):
  Output
  {
      "report": "[Age 22] Aditi Rao <aditi.rao@example.com>
                    [Age 19] Rohan Mehta <rohan.mehta@example.com>
                    [Age 25] Kavya Nair <kavya.nair@example.com>
                    [Age 18] Farhan Sheikh <farhan.sheikh@example.com>
                    [Age 21] Priya Iyer <priya.iyer@example.com>
                    [Age 23] Devansh Gupta <devansh.gupta@example.com>
                    [Age 20] Meera Joshi <meera.joshi@example.com>
                    [Age 24] Sameer Khan <sameer.khan@example.com>",
    "count_meeting_min_age": 5
  }


Part 3: Integrated AI Assistant Module & Semantic Search
--------------------------------------------------------

The AI Assistant module provides deterministic offline note summarization (`backend/ai_service.py`) and semantic search over a 5-note study dataset using cosine similarity.

Execution Mode & Security Declaration
- Demonstration Mode: Default offline `AI_MODE=mock` mode is active for all grading operations. It operates deterministically with zero network calls and zero external API dependencies.

Structured LLM Prompting Technique (Real Mode Documentation)
If `AI_MODE=real` were selected to connect to a production LLM completion provider (e.g., Google Gemini or OpenAI Chat Completions), the following exact prompt would be sent to the API:

SYSTEM PROMPT / TASK ROLE:
You are an expert AI Study Assistant specializing in educational note analysis. Your task is to analyze the user's raw study notes and output a strictly formatted JSON summary object.

FORMAT INSTRUCTIONS:
1. Output MUST be valid JSON and contain EXACTLY these three top-level keys:
   - "topic": (string) A short 2-5 word title summarizing the central concept.
   - "key_points": (list of strings) Up to 3 key summary bullet points extracted from the notes.
   - "difficulty": (string) one of "easy", "medium", or "hard".
2. If the input text is empty or whitespace-only,it will return:
   {"topic": "untitled", "key_points": [], "difficulty": "easy"}

Part 3 API Endpoint Reference & Verification

1. `POST /assistant/summarize`
- Description: summarizes raw study notes into a fixed-shape JSON object (`topic`, `key_points`, `difficulty`).
- Sample Request: `POST http://localhost:8000/assistant/summarize`
- HTTP Request Body:
  {
    "text": "Binary search requires a sorted array. It repeatedly halves the search range using a midpoint comparison."
  }
- Backend Console Log: `INFO: 127.0.0.1:8000 - "POST /assistant/summarize HTTP/1.1" 200 OK`
- Verified Response Payload (200 OK):
  {
    "topic": "Binary Search Requires A Sorted Array",
    "key_points": [
      "Binary search requires a sorted array",
      "It repeatedly halves the search range using a midpoint comparison"
    ],
    "difficulty": "easy"
  }
- Empty/Whitespace Input Verification (`POST` with `{"text": ""}`):
  - Verified Response: `{"topic": "untitled", "key_points": [], "difficulty": "easy"}` (No exception raised).

2. `GET /assistant/search?query=<text>`
- Description: Converts notes and input query into 12-dimensional word-frequency vectors using a fixed vocabulary (`mock_embed`) and ranks notes descending by cosine similarity (`cosine_similarity`).
- Sample Request: `GET http://localhost:8000/assistant/search?query=binary%20search%20algorithm`
- Backend Console Log: `INFO: 127.0.0.1:8000 - "GET /assistant/search?query=binary%20search%20algorithm HTTP/1.1" 200 OK`
- Verified Response Payload (200 OK):
  [
    {
      "id": 1,
      "text": "Binary search requires a sorted array and repeatedly halves the search range using a midpoint comparison.",
      "score":0.9487
    },
    {
      "id": 2,
      "text": "Insertion sort builds a sorted list one element at a time by shifting larger elements to the right.",
      "score": 0.0
    },
    {
      "id": 3,
      "text": "FastAPI uses Pydantic models to validate request bodies and automatically generates Swagger documentation.",
      "score": 0.0
    },
    {
      "id": 4,
      "text": "SQL joins combine rows from two tables using a matching column, such as inner join, left join, and full join.",
      "score": 0.0
    },
    {
      "id": 5,
      "text": "Prompt engineering structures a task, context, constraints, and desired output format to guide an LLM's response.",
      "score": 0.0
    }
  ]
- Out-of-Vocabulary / Empty Query Verification (`GET /assistant/search?query=xyz%20zzz` or `query=`):
  - Verified Response: Returns all 5 notes with `score: 0.0` in original ID order without raising a `ZeroDivisionError`.
