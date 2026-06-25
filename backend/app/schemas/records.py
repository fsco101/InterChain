from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class StudentActivityCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    activity_date: date
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=1000)
    hours_spent: float = Field(gt=0, le=24)


class StudentReportCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    report_title: str = Field(min_length=3, max_length=120)
    summary: str = Field(min_length=20, max_length=1500)


class StudentAttendanceCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    attendance_date: date
    time_in: str = Field(min_length=3, max_length=10)   # e.g. "08:00"
    time_out: str = Field(min_length=3, max_length=10)   # e.g. "17:00"
    hours: float = Field(gt=0, le=24)
    notes: str | None = Field(default=None, max_length=500)
    # photo_url is injected server-side after Cloudinary upload


class AttendanceValidationCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    student_id: str = Field(min_length=5, max_length=100)
    attendance_date: date
    status: str = Field(pattern="^(present|absent|late)$")
    notes: str | None = Field(default=None, max_length=500)


class EvaluationCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    student_id: str = Field(min_length=5, max_length=100)
    score: int = Field(ge=1, le=10)
    feedback: str = Field(min_length=10, max_length=1000)


class EmployerEvaluationCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    student_id: str = Field(min_length=5, max_length=100)
    score: int = Field(ge=1, le=10)
    feedback: str = Field(min_length=10, max_length=1000)


class CompletionApprovalCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    student_id: str = Field(min_length=5, max_length=100)
    approval_date: date
    approved: bool = True
    notes: str | None = Field(default=None, max_length=500)


class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5, max_length=2000)
    position: str = Field(min_length=1, max_length=120)
    student_ids: list[str] | None = None  # None = assign to all students with this position
    due_date: date | None = None


class TaskUpdate(BaseModel):
    status: str = Field(pattern="^(pending|in_progress|completed|cancelled)$")


class PositionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class RecordRead(BaseModel):
    id: str
    record_type: str
    role: str
    user_id: str
    created_at: datetime
    payload: dict
