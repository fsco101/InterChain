from datetime import date, datetime

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


class CompletionApprovalCreate(BaseModel):
    internship_id: str = Field(min_length=3, max_length=100)
    student_id: str = Field(min_length=5, max_length=100)
    approval_date: date
    approved: bool = True
    notes: str | None = Field(default=None, max_length=500)


class RecordRead(BaseModel):
    id: str
    record_type: str
    role: str
    user_id: str
    created_at: datetime
    payload: dict
