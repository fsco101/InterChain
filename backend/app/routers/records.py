from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.db.mongodb import get_database
from app.schemas.records import (
    AttendanceValidationCreate,
    CompletionApprovalCreate,
    EvaluationCreate,
    StudentActivityCreate,
    StudentReportCreate,
)
from app.services.records_service import create_record, list_records


router = APIRouter(prefix="/records", tags=["records"])


@router.get("/internships/search")
async def search_internships(q: str = "", current_user: dict = Depends(require_roles("student", "instructor", "employer"))):
    """Return distinct internship_ids from record collections + student internship_ids matching the query."""
    db = get_database()
    seen = set()
    results = []

    # 1. student internship_ids from users collection
    user_query: dict = {"role": "student", "internship_id": {"$ne": None}}
    if q.strip():
        user_query["internship_id"] = {"$regex": q.strip(), "$options": "i"}
    cursor = db.users.find(user_query, {"internship_id": 1}).limit(10)
    async for doc in cursor:
        iid = doc.get("internship_id")
        if iid and iid not in seen:
            seen.add(iid)
            results.append(iid)

    # 2. internship_ids referenced in record collections
    if len(results) < 10:
        collections = ["activity_logs", "student_reports", "attendance_records", "performance_evaluations", "completion_approvals"]
        for col in collections:
            pipeline = [
                {"$group": {"_id": "$payload.internship_id"}},
                {"$match": {"_id": {"$regex": q.strip(), "$options": "i"}} if q.strip() else {"_id": {"$ne": None}}},
                {"$limit": 10},
            ]
            async for doc in db[col].aggregate(pipeline):
                iid = doc["_id"]
                if iid and iid not in seen:
                    seen.add(iid)
                    results.append(iid)
            if len(results) >= 10:
                break

    return {"internship_ids": sorted(results)[:10]}


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

