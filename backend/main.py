import os
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import Base, engine, get_db
from backend.schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    StudentCourseCountResponse,
)
import backend.crud as crud
from backend.seed_data import seed_database
from backend.algorithms import (
    insertion_sort_by_field,
    binary_search_by_name,
    format_roster_report,
    count_students_meeting_min_age,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="StudyTrack Service API",
    description="RESTful CRUD API for managing Students and Course Enrollments.",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/students/",response_model=StudentResponse,status_code=status.HTTP_201_CREATED,summary="Create a new student",)
def create_student_endpoint(student: StudentCreate, db: Session = Depends(get_db)):
    
    existing = crud.get_student_by_email(db, student.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A student with email '{student.email}' already exists.",
        )
    try:
        return crud.create_student(db=db, student=student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Email must be unique.",
        )

@app.get("/students/",response_model=List[StudentResponse],summary="List all students (with optional min_age filter)",)
def list_students_endpoint(min_age: Optional[int] = Query(None, description="Filter students with age >= min_age"),db: Session = Depends(get_db),):
    return crud.get_students(db=db, min_age=min_age)


@app.get("/students/sorted",response_model=List[StudentResponse],summary="Get students sorted by age or name using hand-written Insertion Sort",)
def get_sorted_students(by: str = Query("age", description="Field to sort by ('age' or 'name')"),db: Session = Depends(get_db),):
    if by not in ("age", "name"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter 'by' must be 'age' or 'name'.",
        )
    students_orm = crud.get_students(db=db)
    students_dicts = [StudentResponse.model_validate(s).model_dump() for s in students_orm]
    sorted_dicts = insertion_sort_by_field(students_dicts, field=by)
    return sorted_dicts

@app.get("/students/search",response_model=StudentResponse,summary="Search student by exact name using hand-written Binary Search",)
def search_student_by_name(name: str = Query(..., description="Exact student name to search for"),db: Session = Depends(get_db),):
    students_orm = crud.get_students(db=db)
    students_dicts = [StudentResponse.model_validate(s).model_dump() for s in students_orm]
    name_sorted_students = sorted(students_dicts, key=lambda x: x["name"])
    result = binary_search_by_name(name_sorted_students, name=name)
    if result == -1 or isinstance(result, int):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with name '{name}' not found.",
        )
    return result

@app.get("/students/report",summary="Generate Roster Report and count students meeting minimum age",)
def get_roster_report(min_age: int = Query(21, description="Minimum age filter for report"),    db: Session = Depends(get_db),):
    students_orm = crud.get_students(db=db)
    students_dicts = [StudentResponse.model_validate(s).model_dump() for s in students_orm]
    report_text = format_roster_report(students_dicts)
    count = count_students_meeting_min_age(students_dicts, min_age=min_age)
    return {
        "report": report_text,
        "count_meeting_min_age": count,
    }

@app.get("/students/{student_id}",response_model=StudentResponse,summary="Get a single student by ID",)
def get_student_endpoint(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db=db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return student

@app.patch("/students/{student_id}",response_model=StudentResponse,summary="Partially update student record",)
def update_student_endpoint(student_id: int,student_update: StudentUpdate,db: Session = Depends(get_db),):
    if student_update.email:
        existing = crud.get_student_by_email(db, student_update.email)
        if existing and existing.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{student_update.email}' is already in use by another student.",
            )
    
    updated_student = crud.update_student(db=db, student_id=student_id, student_update=student_update)
    if not updated_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return updated_student

@app.delete("/students/{student_id}",status_code=status.HTTP_200_OK,summary="Delete a student record",)
def delete_student_endpoint(student_id: int, db: Session = Depends(get_db)):
    success = crud.delete_student(db=db, student_id=student_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return {"message": f"Student with ID {student_id} successfully deleted."}

@app.get("/students/{student_id}/course-count",response_model=StudentCourseCountResponse,summary="Get course count for a student via DB aggregate query",)
def get_student_course_count_endpoint(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db=db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    count = crud.get_student_course_count(db=db, student_id=student_id)
    return {"student_id": student_id, "course_count": count}

@app.post("/courses/",response_model=CourseResponse,status_code=status.HTTP_201_CREATED,summary="Create a new course enrollment",)
def create_course_endpoint(course: CourseCreate, db: Session = Depends(get_db)):
    student = crud.get_student(db=db, student_id=course.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot enroll course: Student with ID {course.student_id} does not exist.",
        )
    
    existing_enrollment = crud.get_student_course_by_name(db, course.student_id, course.course_name)
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student '{student.name}' is already enrolled in '{course.course_name}'. A student cannot be enrolled in the same course twice.",
        )
    try:
        return crud.create_course(db=db, course=course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student '{student.name}' is already enrolled in '{course.course_name}'.",
        )

@app.get("/courses/",response_model=List[CourseResponse],summary="List all courses",)
def list_courses_endpoint(db: Session = Depends(get_db)):
    return crud.get_courses(db=db)
@app.get(
"/courses/{course_id}",response_model=CourseResponse,summary="Get a single course by ID",)
def get_course_endpoint(course_id: int, db: Session = Depends(get_db)):
    course = crud.get_course(db=db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Course with ID {course_id} not found.",
        )
    return course

@app.patch("/courses/{course_id}",response_model=CourseResponse,summary="Partially update course details",)
def update_course_endpoint(course_id: int,course_update: CourseUpdate,db: Session = Depends(get_db),):
    updated_course = crud.update_course(db=db, course_id=course_id, course_update=course_update)
    if not updated_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found.",
        )
    return updated_course

@app.delete("/courses/{course_id}",status_code=status.HTTP_200_OK,summary="Delete a course enrollment",)
def delete_course_endpoint(course_id: int, db: Session = Depends(get_db)):
    success = crud.delete_course(db=db, course_id=course_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Course with ID {course_id} not found.",
        )
    return {"message": f"Course with ID {course_id} successfully deleted."}


# --- Static Files Mount (Single-process mode: MUST be mounted last) ---
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
