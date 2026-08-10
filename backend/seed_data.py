from sqlalchemy.orm import Session
from backend.models import Student

# Exact Required Seed Dataset
SEED_STUDENTS = [
    {"name": "Aditi Rao",     "email": "aditi.rao@example.com",     "age": 22},
    {"name": "Rohan Mehta",   "email": "rohan.mehta@example.com",   "age": 19},
    {"name": "Kavya Nair",    "email": "kavya.nair@example.com",    "age": 25},
    {"name": "Farhan Sheikh", "email": "farhan.sheikh@example.com", "age": 18},
    {"name": "Priya Iyer",    "email": "priya.iyer@example.com",    "age": 21},
    {"name": "Devansh Gupta", "email": "devansh.gupta@example.com", "age": 23},
    {"name": "Meera Joshi",   "email": "meera.joshi@example.com",   "age": 20},
    {"name": "Sameer Khan",   "email": "sameer.khan@example.com",   "age": 24},
]

def seed_database(db: Session):
    """
    Seeds the SQLite database with the exact required 8-student roster if empty.
    """
    if db.query(Student).count() > 0:
        return  # Database already seeded

    for student_dict in SEED_STUDENTS:
        student = Student(**student_dict)
        db.add(student)

    db.commit()
