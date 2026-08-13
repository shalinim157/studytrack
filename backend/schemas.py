from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

class CourseCreate(BaseModel):
    student_id: int
    course_name: str
    credits: int

    @field_validator("credits")
    @classmethod
    def validate_course_credits(cls, value: int) -> int:
        if value < 1 or value > 6:
            raise ValueError("Course credits must be between 1 and 6 inclusive")
        return value

class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    credits: Optional[int] = None

    @field_validator("credits")
    @classmethod
    def validate_course_credits(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 1 or value > 6):
            raise ValueError("Course credits must be between 1 and 6 inclusive")
        return value

class CourseResponse(CourseCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)

class StudentCreate(BaseModel):
    name: str
    email: str
    age: int = Field(..., gt=0, description="Age must be a positive integer greater than 0")

    @field_validator("email")
    @classmethod
    def validate_email_contains_at(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("Invalid email format: Must contain an '@' character")
        return value

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = Field(None, gt=0, description="Age must be a positive integer greater than 0")

    @field_validator("email")
    @classmethod
    def validate_email_contains_at(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and "@" not in value:
            raise ValueError("Invalid email format: Must contain an '@' character")
        return value

class StudentResponse(StudentCreate):
    id: int
    courses: List[CourseResponse] = []
    model_config = ConfigDict(from_attributes=True)

class StudentCourseCountResponse(BaseModel):
    student_id: int
    course_count: int

class SummarizeRequest(BaseModel):
    text: str = Field(..., description="Raw study notes to summarize")

class SummarizeResponse(BaseModel):
    topic: str
    key_points: List[str]
    difficulty: str
