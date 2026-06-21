from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.schemas.records import (
    AttendanceValidationCreate,
    CompletionApprovalCreate,
    EvaluationCreate,
    StudentActivityCreate,
    StudentReportCreate,
)
from app.services.records_service import create_record, list_records


router = APIRouter(prefix="/records", tags=["records"])


@router.post("/student/activity")
async def create_student_activity(payload: StudentActivityCreate, current_user: dict = Depends(require_roles("student"))):
    return await create_record("activity_logs", "student_activity", "student", current_user, payload.model_dump(mode="json"))


@router.post("/student/report")
async def create_student_report(payload: StudentReportCreate, current_user: dict = Depends(require_roles("student"))):
    return await create_record("student_reports", "student_report", "student", current_user, payload.model_dump(mode="json"))


@router.get("/student")
async def get_student_records(current_user: dict = Depends(require_roles("student"))):
    activity_logs = await list_records("activity_logs", current_user["id"])
    reports = await list_records("student_reports", current_user["id"])
    return {"activity_logs": activity_logs, "reports": reports}


@router.post("/instructor/attendance")
async def validate_attendance(payload: AttendanceValidationCreate, current_user: dict = Depends(require_roles("instructor"))):
    return await create_record("attendance_records", "attendance_validation", "instructor", current_user, payload.model_dump(mode="json"))


@router.post("/instructor/evaluation")
async def submit_evaluation(payload: EvaluationCreate, current_user: dict = Depends(require_roles("instructor"))):
    return await create_record("performance_evaluations", "performance_evaluation", "instructor", current_user, payload.model_dump(mode="json"))


@router.get("/instructor")
async def get_instructor_records(current_user: dict = Depends(require_roles("instructor"))):
    attendance = await list_records("attendance_records", current_user["id"])
    evaluations = await list_records("performance_evaluations", current_user["id"])
    return {"attendance": attendance, "evaluations": evaluations}


@router.post("/employer/approval")
async def approve_completion(payload: CompletionApprovalCreate, current_user: dict = Depends(require_roles("employer"))):
    return await create_record("completion_approvals", "completion_approval", "employer", current_user, payload.model_dump(mode="json"))


@router.get("/employer")
async def get_employer_records(current_user: dict = Depends(require_roles("employer"))):
    approvals = await list_records("completion_approvals", current_user["id"])
    return {"approvals": approvals}

