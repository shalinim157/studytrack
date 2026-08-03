from sqlalchemy.orm import Session
from backend.models import Student, Course

# Exact Required Seed Dataset for Part 2
SEED_STUDENTS = [
    {
        "name": "Aditi Rao",
        "email": "aditi.rao@example.com",
        "age": 22,
        "courses": [
            {"course_name": "Computer Science 101", "credits": 3},
            {"course_name": "Web Development", "credits": 3},
        ],
    },
    {
        "name": "Rohan Mehta",
        "email": "rohan.mehta@example.com",
        "age": 19,
        "courses": [
            {"course_name": "Data Structures", "credits": 4},
        ],
    },
    {
        "name": "Kavya Nair",
        "email": "kavya.nair@example.com",
        "age": 25,
        "courses": [
            {"course_name": "Machine Learning", "credits": 4},
            {"course_name": "Artificial Intelligence", "credits": 4},
        ],
    },
    {
        "name": "Farhan Sheikh",
        "email": "farhan.sheikh@example.com",
        "age": 18,
        "courses": [
            {"course_name": "Physics I", "credits": 4},
        ],
    },
    {
        "name": "Priya Iyer",
        "email": "priya.iyer@example.com",
        "age": 21,
        "courses": [
            {"course_name": "Algorithms", "credits": 4},
            {"course_name": "Calculus I", "credits": 4},
        ],
    },
    {
        "name": "Devansh Gupta",
        "email": "devansh.gupta@example.com",
        "age": 23,
        "courses": [
            {"course_name": "Database Systems", "credits": 3},
        ],
    },
    {
        "name": "Meera Joshi",
        "email": "meera.joshi@example.com",
        "age": 20,
        "courses": [
            {"course_name": "Linear Algebra", "credits": 3},
        ],
    },
    {
        "name": "Sameer Khan",
        "email": "sameer.khan@example.com",
        "age": 24,
        "courses": [
            {"course_name": "Operating Systems", "credits": 4},
        ],
    },
]

def seed_database(db: Session):
    """
    Seeds the SQLite database with the exact required 8-student roster if empty or missing seed dataset.
    """
    aditi_exists = db.query(Student).filter(Student.email == "aditi.rao@example.com").first()
    if aditi_exists:
        return  # Database already seeded with Part 2 dataset

    # Clear old legacy seed records if any exist without aditi.rao
    if db.query(Student).count() > 0 and not aditi_exists:
        db.query(Course).delete()
        db.query(Student).delete()
        db.commit()

    for student_dict in SEED_STUDENTS:
        data = student_dict.copy()
        courses_data = data.pop("courses", [])
        student = Student(**data)
        db.add(student)
        db.flush() 

        for course_item in courses_data:
            course = Course(
                course_name=course_item["course_name"],
                credits=course_item["credits"],
                student_id=student.id
            )
            db.add(course)

    db.commit()
