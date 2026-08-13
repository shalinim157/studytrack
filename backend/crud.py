from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Student, Course
from backend.schemas import StudentCreate, StudentUpdate, CourseCreate, CourseUpdate


def get_student(db: Session, student_id: int) -> Optional[Student]:
    return db.query(Student).filter(Student.id == student_id).first()

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    return db.query(Student).filter(Student.email == email).first()

def get_students(db: Session, min_age: Optional[int] = None) -> List[Student]:
    query = db.query(Student)
    if min_age is not None:
        query = query.filter(Student.age >= min_age)
    return query.all()

def create_student(db: Session, student: StudentCreate) -> Student:
    db_student = Student(name=student.name,email=student.email,age=student.age)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_update: StudentUpdate) -> Optional[Student]:
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    
    update_data = student_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_student, key, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int) -> bool:
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    db.delete(db_student)
    db.commit()
    return True

def get_course(db: Session, course_id: int) -> Optional[Course]:
    return db.query(Course).filter(Course.id == course_id).first()

def get_courses(db: Session) -> List[Course]:
    return db.query(Course).all()

def get_student_course_by_name(db: Session, student_id: int, course_name: str) -> Optional[Course]:
    return db.query(Course).filter(Course.student_id == student_id,func.lower(Course.course_name) == func.lower(course_name)).first()

def create_course(db: Session, course: CourseCreate) -> Course:
    db_course = Course(course_name=course.course_name,credits=course.credits,student_id=course.student_id)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def update_course(db: Session, course_id: int, course_update: CourseUpdate) -> Optional[Course]:
    db_course = get_course(db, course_id)
    if not db_course:
        return None
    
    update_data = course_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

def delete_course(db: Session, course_id: int) -> bool:
    db_course = get_course(db, course_id)
    if not db_course:
        return False
    db.delete(db_course)
    db.commit()
    return True

def get_student_course_count(db: Session, student_id: int) -> int:
    count = db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar()
    return count or 0
