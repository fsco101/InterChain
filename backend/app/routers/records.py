from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.schemas.records import (
    AttendanceValidationCreate,
    CompletionApprovalCreate,
    EvaluationCreate,
    EmployerEvaluationCreate,
    StudentActivityCreate,
    StudentReportCreate,
)
from app.services.records_service import create_record, list_records, list_all_records, delete_record, delete_records_bulk
from app.services.cloudinary_service import upload_attendance_photo
from app.services.blockchain_service import build_blockchain_metadata_async
from app.routers.notifications import push_notification
from datetime import datetime, timezone


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


@router.post("/student/attendance")
async def create_student_attendance(
    internship_id: str = Form(...),
    attendance_date: str = Form(...),
    time_in: str = Form(...),
    time_out: str = Form(...),
    hours: float = Form(...),
    notes: str | None = Form(None),
    photo: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student")),
):
    """Student logs attendance with a required photo as proof. Photo is uploaded to Cloudinary."""
    if not photo or not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance photo is required as proof.")

    photo_bytes = await photo.read()
    if not photo_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded photo is empty.")

    # Upload photo to Cloudinary
    photo_result = await upload_attendance_photo(photo_bytes)

    payload = {
        "internship_id": internship_id,
        "attendance_date": attendance_date,
        "time_in": time_in,
        "time_out": time_out,
        "hours": hours,
        "notes": notes,
        "photo_url": photo_result["url"],
        "photo_public_id": photo_result["public_id"],
        "validation_status": "pending",  # pending | validated | rejected
    }

    db = get_database()
    blockchain = await build_blockchain_metadata_async("student_attendance", current_user["id"], payload)
    document = {
        "record_type": "student_attendance",
        "role": "student",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "payload": payload,
        "blockchain": blockchain,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.student_attendance.insert_one(document)
    created = await db.student_attendance.find_one({"_id": result.inserted_id})
    from app.services.records_service import serialize_record
    await push_notification(db, current_user["id"], "Attendance logged", f"Attendance for {attendance_date} has been saved with photo proof.", "success")
    return serialize_record(created)


@router.get("/student/attendance")
async def get_student_attendance(current_user: dict = Depends(require_roles("student"))):
    db = get_database()
    cursor = db.student_attendance.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(20)
    from app.services.records_service import serialize_record
    return {"attendance": [serialize_record(doc) async for doc in cursor]}


@router.get("/student/attendance/history")
async def get_student_attendance_history(current_user: dict = Depends(require_roles("student"))):
    db = get_database()
    cursor = db.student_attendance.find({"user_id": current_user["id"]}).sort("created_at", -1)
    from app.services.records_service import serialize_record
    return {"attendance": [serialize_record(doc) async for doc in cursor]}


@router.delete("/student/attendance/{record_id}")
async def delete_student_attendance(record_id: str, current_user: dict = Depends(require_roles("student"))):
    ok = await delete_record("student_attendance", record_id, current_user["id"])
    return {"deleted": ok}


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


@router.post("/employer/evaluation")
async def submit_employer_evaluation(payload: EmployerEvaluationCreate, current_user: dict = Depends(require_roles("employer"))):
    record = await create_record("employer_evaluations", "employer_evaluation", "employer", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Evaluation submitted", f"Score {payload.score}/10 saved for student {payload.student_id}.", "success")
    return record


@router.get("/employer/evaluations")
async def get_employer_evaluations(current_user: dict = Depends(require_roles("employer"))):
    evaluations = await list_records("employer_evaluations", current_user["id"])
    return {"evaluations": evaluations}


@router.get("/employer/evaluations/history")
async def get_employer_evaluations_history(current_user: dict = Depends(require_roles("employer"))):
    evaluations = await list_all_records("employer_evaluations", current_user["id"])
    return {"evaluations": evaluations}


@router.delete("/employer/evaluation/{record_id}")
async def delete_employer_evaluation(record_id: str, current_user: dict = Depends(require_roles("employer"))):
    ok = await delete_record("employer_evaluations", record_id, current_user["id"])
    return {"deleted": ok}


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
