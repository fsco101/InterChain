from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.schemas.records import (
    AttendanceValidationCreate,
    CompletionApprovalCreate,
    EvaluationCreate,
    StudentActivityCreate,
    StudentReportCreate,
)
from app.services.records_service import create_record, list_records, list_all_records, delete_record, delete_records_bulk
from app.routers.notifications import push_notification


class BulkDeleteBody(BaseModel):
    ids: list[str]


router = APIRouter(prefix="/records", tags=["records"])


@router.get("/internships/search")
async def search_internships(q: str = "", current_user: dict = Depends(require_roles("student", "instructor", "employer"))):
    db = get_database()
    seen = set()
    results = []

    user_query: dict = {"role": "student", "internship_id": {"$ne": None}}
    if q.strip():
        user_query["internship_id"] = {"$regex": q.strip(), "$options": "i"}
    cursor = db.users.find(user_query, {"internship_id": 1}).limit(10)
    async for doc in cursor:
        iid = doc.get("internship_id")
        if iid and iid not in seen:
            seen.add(iid)
            results.append(iid)

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


# ── Student ────────────────────────────────────────────────────────────────────

@router.post("/student/activity")
async def create_student_activity(payload: StudentActivityCreate, current_user: dict = Depends(require_roles("student"))):
    record = await create_record("activity_logs", "student_activity", "student", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Activity logged", f"'{payload.title}' saved for {payload.activity_date}.", "success")
    return record


@router.post("/student/report")
async def create_student_report(payload: StudentReportCreate, current_user: dict = Depends(require_roles("student"))):
    record = await create_record("student_reports", "student_report", "student", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Report submitted", f"'{payload.report_title}' has been saved.", "success")
    return record


@router.get("/student")
async def get_student_records(current_user: dict = Depends(require_roles("student"))):
    activity_logs = await list_records("activity_logs", current_user["id"])
    reports = await list_records("student_reports", current_user["id"])
    return {"activity_logs": activity_logs, "reports": reports}


@router.get("/student/history")
async def get_student_history(current_user: dict = Depends(require_roles("student"))):
    activity_logs = await list_all_records("activity_logs", current_user["id"])
    reports = await list_all_records("student_reports", current_user["id"])
    return {"activity_logs": activity_logs, "reports": reports}


@router.delete("/student/activity/{record_id}")
async def delete_student_activity(record_id: str, current_user: dict = Depends(require_roles("student"))):
    ok = await delete_record("activity_logs", record_id, current_user["id"])
    return {"deleted": ok}


@router.delete("/student/report/{record_id}")
async def delete_student_report(record_id: str, current_user: dict = Depends(require_roles("student"))):
    ok = await delete_record("student_reports", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/student/activity/bulk-delete")
async def bulk_delete_student_activity(body: BulkDeleteBody, current_user: dict = Depends(require_roles("student"))):
    count = await delete_records_bulk("activity_logs", body.ids, current_user["id"])
    return {"deleted": count}


@router.post("/student/report/bulk-delete")
async def bulk_delete_student_report(body: BulkDeleteBody, current_user: dict = Depends(require_roles("student"))):
    count = await delete_records_bulk("student_reports", body.ids, current_user["id"])
    return {"deleted": count}


# ── Instructor ─────────────────────────────────────────────────────────────────

@router.post("/instructor/attendance")
async def validate_attendance(payload: AttendanceValidationCreate, current_user: dict = Depends(require_roles("instructor"))):
    record = await create_record("attendance_records", "attendance_validation", "instructor", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Attendance recorded", f"Student {payload.student_id} marked as {payload.status} on {payload.attendance_date}.", "info")
    return record


@router.post("/instructor/evaluation")
async def submit_evaluation(payload: EvaluationCreate, current_user: dict = Depends(require_roles("instructor"))):
    record = await create_record("performance_evaluations", "performance_evaluation", "instructor", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Evaluation submitted", f"Score {payload.score}/10 saved for student {payload.student_id}.", "success")
    return record


@router.get("/instructor")
async def get_instructor_records(current_user: dict = Depends(require_roles("instructor"))):
    attendance = await list_records("attendance_records", current_user["id"])
    evaluations = await list_records("performance_evaluations", current_user["id"])
    return {"attendance": attendance, "evaluations": evaluations}


@router.get("/instructor/history")
async def get_instructor_history(current_user: dict = Depends(require_roles("instructor"))):
    attendance = await list_all_records("attendance_records", current_user["id"])
    evaluations = await list_all_records("performance_evaluations", current_user["id"])
    return {"attendance": attendance, "evaluations": evaluations}


@router.delete("/instructor/attendance/{record_id}")
async def delete_instructor_attendance(record_id: str, current_user: dict = Depends(require_roles("instructor"))):
    ok = await delete_record("attendance_records", record_id, current_user["id"])
    return {"deleted": ok}


@router.delete("/instructor/evaluation/{record_id}")
async def delete_instructor_evaluation(record_id: str, current_user: dict = Depends(require_roles("instructor"))):
    ok = await delete_record("performance_evaluations", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/instructor/attendance/bulk-delete")
async def bulk_delete_instructor_attendance(body: BulkDeleteBody, current_user: dict = Depends(require_roles("instructor"))):
    count = await delete_records_bulk("attendance_records", body.ids, current_user["id"])
    return {"deleted": count}


@router.post("/instructor/evaluation/bulk-delete")
async def bulk_delete_instructor_evaluation(body: BulkDeleteBody, current_user: dict = Depends(require_roles("instructor"))):
    count = await delete_records_bulk("performance_evaluations", body.ids, current_user["id"])
    return {"deleted": count}


# ── Employer ───────────────────────────────────────────────────────────────────

@router.post("/employer/approval")
async def approve_completion(payload: CompletionApprovalCreate, current_user: dict = Depends(require_roles("employer"))):
    record = await create_record("completion_approvals", "completion_approval", "employer", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Approval saved", f"Student {payload.student_id} {'approved' if payload.approved else 'not approved'} on {payload.approval_date}.", "success")
    return record


@router.get("/employer")
async def get_employer_records(current_user: dict = Depends(require_roles("employer"))):
    approvals = await list_records("completion_approvals", current_user["id"])
    return {"approvals": approvals}


@router.get("/employer/history")
async def get_employer_history(current_user: dict = Depends(require_roles("employer"))):
    approvals = await list_all_records("completion_approvals", current_user["id"])
    return {"approvals": approvals}


@router.delete("/employer/approval/{record_id}")
async def delete_employer_approval(record_id: str, current_user: dict = Depends(require_roles("employer"))):
    ok = await delete_record("completion_approvals", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/employer/approval/bulk-delete")
async def bulk_delete_employer_approval(body: BulkDeleteBody, current_user: dict = Depends(require_roles("employer"))):
    count = await delete_records_bulk("completion_approvals", body.ids, current_user["id"])
    return {"deleted": count}
