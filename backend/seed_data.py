from sqlalchemy.orm import Session
from backend.models import Student, Course

SEED_STUDENTS = [
    {
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "age": 21,
        "courses": [
            {"course_name": "Computer Science 101", "credits": 3},
            {"course_name": "Data Structures", "credits": 4},
        ],
    },
    {
        "name": "Bob Smith",
        "email": "bob@example.com",
        "age": 19,
        "courses": [
            {"course_name": "Calculus I", "credits": 4},
        ],
    },
    {
        "name": "Charlie Brown",
        "email": "charlie@example.com",
        "age": 22,
        "courses": [
            {"course_name": "Web Development", "credits": 3},
            {"course_name": "Database Systems", "credits": 3},
            {"course_name": "Algorithms", "credits": 4},
        ],
    },
    {
        "name": "Diana Prince",
        "email": "diana@example.com",
        "age": 20,
        "courses": [
            {"course_name": "Linear Algebra", "credits": 3},
        ],
    },
    {
        "name": "Evan Wright",
        "email": "evan@example.com",
        "age": 18,
        "courses": [
            {"course_name": "Physics I", "credits": 4},
        ],
    },
]

def seed_database(db: Session):
    """
    Seeds the SQLite database with the standard seed roster if no students currently exist.
    """
    existing_count = db.query(Student).count()
    if existing_count > 0:
        return  # Database already seeded

    for student_data in SEED_STUDENTS:
        courses_data = student_data.pop("courses", [])
        student = Student(**student_data)
        db.add(student)
        db.flush()  # Ensures student.id is generated for relationship foreign key

        for course_item in courses_data:
            course = Course(
                course_name=course_item["course_name"],
                credits=course_item["credits"],
                student_id=student.id
            )
            db.add(course)

    db.commit()
