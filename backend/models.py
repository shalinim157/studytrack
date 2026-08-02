from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from backend.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    age = Column(Integer, nullable=False)

    # Bi-directional relationship to Course
    courses = relationship("Course", back_populates="student", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        CheckConstraint("credits >= 1 AND credits <= 6", name="check_course_credits"),
    )

    # Bi-directional relationship to Student
    student = relationship("Student", back_populates="courses")
