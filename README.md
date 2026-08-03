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
.\venv\Scripts\activate.bat

Install dependencies from backend requirements
pip install -r backend/requirements.txt


Running the Application

You can run StudyTrack in **Single-Process Mode** or **Two-Process Mode**.

Single-Process Mode
In single-process mode, FastAPI serves both the REST API and the frontend dashboard as static files from the same server.

Run the command from the project root (`studytrack/`):

In terminal ,backend run command ->

uvicorn backend.main:app --reload --port 8000

Open your browser and navigate to:
- **Frontend Dashboard**: [http://localhost:8000/](http://localhost:8000/)
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)


REST API Documentation

Student Endpoints

| Method `POST` | Endpoint `/students/` | Description Create a new student | Request Body `{ "name": "Jane", "email": "jane@ex.com", "age": 20 }` | Status Code / Response `201 Created` -> Student Object |

| Method `GET` | Endpoint `/students/{id}` | Description `Get a single student by ID` | Request Body `None` | Status Code / Response `200 OK -> Student Object / 404 Not Found` |

| Method `PATCH` | Endpoint `/students/{id}` | Description `Partially update a student (e.g. age)` | Request Body `{ "age": 22 }` | Status Code `/ Response 200 OK -> Updated Student Object / 404 Not Found` |

| Method `DELETE` | Endpoint `/students/{id}` | Description `Delete a student record` | Request Body `None` | Status Code / Response `200 OK -> Student Deleted Successfully / 404 Not Found` |

| Method `GET` | Endpoint `/students/{id}/course-count` | Description `Get the total number of courses enrolled by a student` | Request Body `None` | Status Code / Response `200 OK -> { "student_id": id, "course_count": N } / 404 Not Found` |


### Course Endpoints

| Method | Endpoint | Description | Request Body | Status Code / Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/courses/` | Enroll student in a course | `{ "course_name": "CS101", "credits": 3, "student_id": 1 }` | `201 Created` -> Course Object |
| `GET` | `/courses/` | List all courses | None | `200 OK` -> `[ Course Objects ]` |
| `GET` | `/courses/{id}` | Get single course by ID | None | `200 OK` / `404 Not Found` |
| `PATCH` | `/courses/{id}` | Update course details | `{ "credits": 4 }` | `200 OK` -> Updated Course |
| `DELETE` | `/courses/{id}` | Delete course record | None | `200 OK` / `404 Not Found` |

*Note: Dedicated 200/204 handlers are also registered for `/favicon.ico` and `/.well-known/appspecific/com.chrome.devtools.json` to eliminate browser DevTools 404 console warnings.*

## 🔍 Database Aggregation Query Note

The endpoint `GET /students/{student_id}/course-count` computes the course enrollment count directly within SQLite via an aggregate database query in `backend/crud.py`:

# Executed in backend/crud.py:
def get_student_course_count(db: Session, student_id: int) -> int:
    return db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar() or 0

Explanation :  This query uses SQLAlchemy func.count() to perform an SQL aggregate SELECT COUNT(courses.id) FROM courses WHERE courses.student_id == student_id directly in the database,avoiding loading full row collections into python memory

How many courses belong to this student? Don't send me all the course details—just send me the total count."

The database counts the matching rows and returns a single number, such as 3, which is efficient because only the count is transferred back to our application


Key Features & Verification Walkthrough
----------------------------------------

1.Seeded Database Roster:  On initial startup, `seed_data.py` populates 5 initial students with course enrollments 

2.Action Buttons & Interactive Modals with Confirmation OK Popups:
   -"Create New Student" Button: Opens modal to register students with custom email `@` validation (`@field_validator`) and age `> 0` validation (`Field(gt=0)`). Shows confirmation OK popup upon creation (`"Student 'Name' created successfully."`). Automatically pre-selects the new student in the Map Course dropdown!
   -"Create New Course" Button: Opens modal with only Course Title to add new courses to the system catalog. Shows confirmation OK popup ("Course 'Python' created successfully").
   -"Map Course to Student" Button: Opens modal containing a Select Student Dropdown (displaying student name only, no ID) and a Select Course Dropdown with credits validation (1 to 6 inclusive, CheckConstraint & Field(ge=1, le=6)). Shows confirmation OK popup upon mapping (" 'Python' mapped to Smith successfully.").
   -Disabled Browser Autocomplete: All modal forms and input fields explicitly enforce autocomplete="off".
   - Deletion Confirmations: Deleting a student or un-enrolling a course displays a confirmation popup (e.g."Alice is deleted.") with an OK button.
   -In-Modal Error Banners: Validation & backend errors display directly inside active modal popups in vivid bold red without closing windows.
3. Interactive Course Deletion: Each course tag on a student card has a removal button (`✕`) that sends a `DELETE /courses/{course_id}` request and updates the roster state.
4. Age Filtering: Top navigation bar includes a minimum age filter input 20 (`#min-age-input`),Tap "Apply Filter" button which shows students with min_age>=20, and when tap "Reset" button that shows all the enrolled students.
6. Dynamic DOM Rendering: On loading the dashboard, `loadRoster()` fetches students and constructs each student card using `document.createElement`+`appendChild`.
7.Event Delegation(`#roster-list`): A single click listener is attached to `#roster-list` in `app.js`. When a click event occurs, `event.target.closest()` identifies whether the "Save Age","Delete Student","Remove Course" button was triggered.
8.Validation & Error Handling:
   - Submitting an email without an `@` character triggers a `422 Unprocessable Entity` response from Pydantic's `@field_validator`.,"Invalid email format: Must contain an '@' character" This error message shown in modal box.
   - Submitting a duplicate email triggers a `400 Bad Request` integrity error from FastAPI without crashing the database server."Email already exists" error message shown in modal box.
   - If the backend server is unreachable, the frontend displays an on-page `<div id="error-banner">` with plain-language text -> Could not reach the StudyTrack backend. Please ensure the backend server is running
9.Responsive Design: `@media (max-width: 600px)` in `style.css` automatically transforms multi-column student cards into a single-column layout.

End-to-End Walkthrough & Sample Backend Logs
--------------------------------------------

This application connects the vanilla HTML/CSS/JS dashboard and FastAPI + SQLAlchemy backend end-to-end. Below is the step-by-step execution walkthrough with corresponding backend console log outputs and HTTP responses:

Step 1: Opening Dashboard & Loading Roster (GET/students/)
-User Action: Open `http://localhost:8000/` in browser.
-Backend Console Log:
  INFO:     127.0.0.1:5500 - "GET /students/ HTTP/1.1" 200 OK
-HTTP Response Payload (200 OK): json
  [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "age": 21,
      "courses": [
        { "id": 1, "course_name": "Computer Science 101", "credits": 3, "student_id": 1 },
        { "id": 2, "course_name": "Data Structures", "credits": 4, "student_id": 1 }
      ]
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@example.com",
      "age": 19,
      "courses": [
        { "id": 3, "course_name": "Python", "credits": 4, "student_id": 2 }
      ]
    }
  ]
  
Step 2: Editing Student Age (`PATCH /students/1`)
-User Action: Change age input on Alice's card to `22` and click "Save Age".
- Backend Console Log:
  INFO:     127.0.0.1:5500 - "PATCH /students/1 HTTP/1.1" 200 OK
- HTTP Request Body: `{ "age": 22 }`
- HTTP Response Payload (200 OK):
  {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 22,
    "courses": [ ... ]
  }

Step 3: Creating a New Student (`POST /students/`)
- User Action: Click "Create New Student", enter `Jane Doe`, `jane@example.com`, `20` and click Save Student.
- Backend Console Log:
  INFO:     127.0.0.1:5500 - "POST /students/ HTTP/1.1" 201 Created

-HTTP Request Body: `{ "name": "Jane Doe", "email": "jane@example.com", "age": 20 }`
- HTTP Response Payload (201 Created):
  {
    "id": 6,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 20,
    "courses": []
  }

- DOM Action: A new student card for Jane Doe is instantiated via `document.createElement("div")` and appended directly into `#roster-list` via `.appendChild()` without reloading the page.

Step 4: Querying Aggregated Course Count (`GET /students/3/course-count`)
- User Action: Query course count endpoint for Charlie(ID #3).
- Backend Console Log:
  INFO:     127.0.0.1:5500 - "GET /students/3/course-count HTTP/1.1" 200 OK
  
- HTTP Response Payload (200 OK):
  
  {
    "student_id": 3,
    "course_count": 3
  }
  
- SQLAlchemy Call: Executed directly in SQLite via `db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar()`.

Step 5: Deleting a Student (`DELETE /students/6`)
- User Action: Click "Delete Student" on Jane's card.
- Backend Console Log:
  
  INFO:     127.0.0.1:5500 - "DELETE /students/6 HTTP/1.1" 200 OK
  
- HTTP Response Payload (200 OK):
  
  {
    "message": "Student Jane successfully deleted."
  }
  
- DOM Action: Card is immediately removed from DOM (`card.remove()`), and confirmation OK popup displays "Jane is deleted.".

Step 6: Error Handling Verification
1.Duplicate Email Error:
   - Submitting `alice@example.com` returns `400 Bad Request`:
     `{ "detail": "A student with email 'alice@example.com' already exists." }`
   - Displayed directly inside `#student-modal-error` in vivid bold red text.
2. Invalid Email Missing `@`:
   - Submitting `invalidemail` returns `422 Unprocessable Entity` from Pydantic `@field_validator`:
     `{ "detail": "Invalid email format: Must contain an '@' character." }`
3. Nonexistent Resource (404):
   - Requesting `GET /students/999` returns `404 Not Found`:
     `{ "detail": "Student with ID 999 not found." }`
4. Backend Server Offline:
   - Stopping Uvicorn triggers on-page error banner `<div id="error-banner">`: `"Could not reach the StudyTrack backend. Please ensure the backend server is running."`

Part 2: Integrated Algorithms Engine & Roster Reports

The Part 2 algorithms engine is operates directly on the live SQLite database populated with the official 8-student seed dataset (`backend/seed_data.py`).

Algorithmic Complexity & Precondition Explanation

1. Insertion Sort Complexity Analysis:
   Insertion Sort builds a sorted array one element at a time by picking each key and inserting it into its correct position among previously sorted elements.
   - Worst-Case Time Complexity O(n^2): Occurs when the input list is sorted in exact reverse order. For every element at index i, the inner "while loop" must compare and shift all i preceding elements to the right. This requires \sum_{i=1}^{n-1} i = \frac{n(n-1)}{2} operations, resulting in quadratic time complexity O(n^2).
   -Best-Case Time Complexity O(n): Occurs when the input list is already sorted in ascending order. For each key, the inner `while` loop condition (`students[j][field] > key_value`) fails on the very first comparison without shifting any elements. Consequently, the algorithm executes exactly n-1 total comparisons, achieving linear time complexity O(n).

2. Binary Search Sorted Precondition:
   Binary Search operates on the divide-and-conquer principle by evaluating the middle element (`mid = low + (high - low) // 2`) and eliminating half of the search space at each iteration. This halving logic relies strictly on the total ordering property: if the target is greater than the middle element, all elements to the left of `mid` are guaranteed to be smaller and can be safely discarded. If the input list is unsorted, discarding half of the array risks eliminating the target element, causing false negatives. Therefore, the dataset must be pre-sorted by the search attribute before executing Binary Search.


Part 2 API Endpoint Reference & Verification

 Endpoint - `GET /students/sorted?by=age`
-Description: Fetches all students and sorts them in place using hand-written Insertion Sort(`insertion_sort_by_field`).
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
- Description: Sorts students alphabetically by name using Python's `sorted()`, then performs an iterative hand-written Binary Search (`binary_search_by_name`).
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
  
- Nonexistent Search Request: `GET /students/search?name=Nonexistent` -> Returns `404 Not Found` (`{ "detail": "Student with name 'Nonexistent' not found." }`).

3. `GET /students/report?min_age=21`
- Description: Generates a formatted multi-line roster report (`format_roster_report`) and counts students meeting the minimum age threshold (`count_students_meeting_min_age`) using an explicit accumulator variable.
- *Sample Request: `GET http://localhost:8000/students/report?min_age=21`
- Backend Console Log: `INFO: 127.0.0.1:5500 - "GET /students/report?min_age=21 HTTP/1.1" 200 OK`
- Verified Response (count_meeting_min_age = 5):
  Output
  {
    "report": "[Age 22] Aditi Rao <aditi.rao@example.com>\n[Age 19] Rohan Mehta <rohan.mehta@example.com>\n[Age 25] Kavya Nair <kavya.nair@example.com>\n[Age 18] Farhan Sheikh <farhan.sheikh@example.com>\n[Age 21] Priya Iyer <priya.iyer@example.com>\n[Age 23] Devansh Gupta <devansh.gupta@example.com>\n[Age 20] Meera Joshi <meera.joshi@example.com>\n[Age 24] Sameer Khan <sameer.khan@example.com>",
    "count_meeting_min_age": 5
  }
