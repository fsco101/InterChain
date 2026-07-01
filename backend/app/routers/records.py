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
from app.services.cloudinary_service import upload_attendance_photo, upload_task_photo
from app.services.blockchain_service import build_blockchain_metadata_async
from app.routers.notifications import push_notification
from app.utils.timezone import get_pht_now, PHT
from datetime import datetime, timezone


class BulkDeleteBody(BaseModel):
    ids: list[str]


router = APIRouter(prefix="/records", tags=["records"])


@router.get("/internships/search")
async def search_internships(q: str = "", current_user: dict = Depends(require_roles("student", "instructor", "supervisor"))):
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
    data = payload.model_dump(mode="json")
    data["validation_status"] = "pending"
    record = await create_record("activity_logs", "student_activity", "student", current_user, data)
    db = get_database()
    await push_notification(db, current_user["id"], "Activity logged", f"'{payload.title}' saved for {payload.activity_date}.", "success")
    
    supervisor_id = current_user.get("supervisor_id")
    if supervisor_id:
        await push_notification(
            db, supervisor_id, "New Student Activity",
            f"{current_user['full_name']} has logged a new activity: '{payload.title}'.", "info"
        )
        
    return record


@router.post("/student/report")
async def create_student_report(payload: StudentReportCreate, current_user: dict = Depends(require_roles("student"))):
    record = await create_record("student_reports", "student_report", "student", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Report submitted", f"'{payload.report_title}' has been saved.", "success")
    
    supervisor_id = current_user.get("supervisor_id")
    if supervisor_id:
        await push_notification(
            db, supervisor_id, "New Internship Report",
            f"{current_user['full_name']} has submitted a new report: '{payload.report_title}'.", "info"
        )
        
    return record


@router.post("/student/attendance/time-in")
async def student_time_in(
    internship_id: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student")),
):
    """Student logs time in with a required photo as proof."""
    if not photo or not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance photo is required as proof.")

    photo_bytes = await photo.read()
    if not photo_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded photo is empty.")

    now = get_pht_now()
    attendance_date = now.strftime("%Y-%m-%d")
    time_in = now.strftime("%H:%M")

    db = get_database()
    # Check if already timed in for today
    existing = await db.student_attendance.find_one({
        "user_id": current_user["id"],
        "payload.attendance_date": attendance_date
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already timed in for today.")

    photo_result = await upload_attendance_photo(photo_bytes)

    payload = {
        "internship_id": internship_id,
        "attendance_date": attendance_date,
        "time_in": time_in,
        "time_out": None,
        "hours": 0.0,
        "notes": None,
        "photo_url": photo_result["url"],
        "photo_public_id": photo_result["public_id"],
        "validation_status": "pending",
    }

    blockchain = await build_blockchain_metadata_async("student_attendance", current_user["id"], payload)
    document = {
        "record_type": "student_attendance",
        "role": "student",
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "payload": payload,
        "blockchain": blockchain,
        "created_at": now,
    }
    result = await db.student_attendance.insert_one(document)
    created = await db.student_attendance.find_one({"_id": result.inserted_id})
    from app.services.records_service import serialize_record
    await push_notification(db, current_user["id"], "Time In logged", f"Time In for {attendance_date} has been saved.", "success")
    return serialize_record(created)


@router.post("/student/attendance/time-out")
async def student_time_out(
    photo: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student")),
):
    """Student logs time out with a required photo as proof."""
    if not photo or not photo.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance photo is required as proof.")

    photo_bytes = await photo.read()
    if not photo_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded photo is empty.")

    now = get_pht_now()
    attendance_date = now.strftime("%Y-%m-%d")
    time_out = now.strftime("%H:%M")

    db = get_database()
    # Find the active attendance record for today
    existing = await db.student_attendance.find_one({
        "user_id": current_user["id"],
        "payload.attendance_date": attendance_date
    })

    if not existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No time in record found for today.")
    if existing["payload"].get("time_out") and existing["payload"].get("validation_status") not in ("rejected", "re-validated"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already timed out for today.")

    time_in = existing["payload"]["time_in"]
    h_in, m_in = map(int, time_in.split(':'))
    h_out, m_out = map(int, time_out.split(':'))
    hours = max(0.0, (h_out + m_out / 60) - (h_in + m_in / 60))

    photo_result = await upload_attendance_photo(photo_bytes)

    await db.student_attendance.update_one(
        {"_id": existing["_id"]},
        {"$set": {
            "payload.time_out": time_out,
            "payload.hours": round(hours, 2),
            "payload.photo_out_url": photo_result["url"],
            "payload.photo_out_public_id": photo_result["public_id"],
            "payload.validation_status": "pending"
        }}
    )

    updated = await db.student_attendance.find_one({"_id": existing["_id"]})
    from app.services.records_service import serialize_record
    await push_notification(db, current_user["id"], "Time Out logged", f"Time Out for {attendance_date} has been saved.", "success")
    
    supervisor_id = current_user.get("supervisor_id")
    if supervisor_id:
        await push_notification(db, supervisor_id, "Student Time Out", f"{current_user['full_name']} has logged out.", "info")

    return serialize_record(updated)


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
    attendance = await list_all_records("student_attendance", current_user["id"])
    return {"activity_logs": activity_logs, "reports": reports, "attendance": attendance}


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

@router.post("/student/attendance/bulk-delete")
async def bulk_delete_student_attendance(body: BulkDeleteBody, current_user: dict = Depends(require_roles("student"))):
    count = await delete_records_bulk("student_attendance", body.ids, current_user["id"])
    return {"deleted": count}


@router.delete("/admin/bulk")
async def admin_bulk_delete_records(body: BulkDeleteBody, current_user: dict = Depends(require_roles("admin"))):
    deleted_count = await delete_records_bulk(body.ids)
    return {"ok": True, "deleted": deleted_count}


@router.patch("/student/tasks/{task_id}/done")
async def student_mark_task_done(
    task_id: str, 
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student"))
):
    db = get_database()
    from app.routers.supervisor import _oid
    oid = _oid(task_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    task = await db.tasks.find_one({"_id": oid, "student_id": current_user["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    
    if task.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot mark task as done (current status: {task.get('status')})")

    # Upload photo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_bytes = await file.read()
    try:
        photo_res = await upload_task_photo(file_bytes)
        attachment_url = photo_res["url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

    update_data = {
        "status": "done",
        "attachment_url": attachment_url
    }
    last_start = task.get("last_active_start")
    if last_start:
        dt_start = datetime.fromisoformat(last_start)
        elapsed = (get_pht_now() - dt_start).total_seconds()
        update_data["accumulated_seconds"] = task.get("accumulated_seconds", 0) + int(elapsed)
        update_data["last_active_start"] = None

    await db.tasks.update_one({"_id": oid}, {"$set": update_data})
    
    # Optionally notify supervisor
    if task.get("employer_id"):
        await push_notification(
            db, task["employer_id"], "Task Marked as Done",
            f"{current_user['full_name']} marked task '{task.get('title')}' as done and attached a photo.", "success"
        )

    return {"ok": True, "message": "Task marked as done", "attachment_url": attachment_url}


# ── Instructor ─────────────────────────────────────────────────────────────────

@router.post("/instructor/attendance")
async def validate_attendance(payload: AttendanceValidationCreate, current_user: dict = Depends(require_roles("instructor"))):
    record = await create_record("attendance_records", "attendance_validation", "instructor", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Attendance recorded", f"Student {payload.student_id} marked as {payload.status} on {payload.attendance_date}.", "info")
    return record


@router.get("/instructor")
async def get_instructor_records(current_user: dict = Depends(require_roles("instructor"))):
    attendance = await list_records("attendance_records", current_user["id"])
    return {"attendance": attendance}


@router.get("/instructor/history")
async def get_instructor_history(current_user: dict = Depends(require_roles("instructor"))):
    attendance = await list_all_records("attendance_records", current_user["id"])
    return {"attendance": attendance}


@router.delete("/instructor/attendance/{record_id}")
async def delete_instructor_attendance(record_id: str, current_user: dict = Depends(require_roles("instructor"))):
    ok = await delete_record("attendance_records", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/instructor/attendance/bulk-delete")
async def bulk_delete_instructor_attendance(body: BulkDeleteBody, current_user: dict = Depends(require_roles("instructor"))):
    count = await delete_records_bulk("attendance_records", body.ids, current_user["id"])
    return {"deleted": count}


# ── Supervisor ───────────────────────────────────────────────────────────────

@router.post("/supervisor/approval")
async def approve_completion(payload: CompletionApprovalCreate, current_user: dict = Depends(require_roles("supervisor"))):
    record = await create_record("completion_approvals", "completion_approval", "supervisor", current_user, payload.model_dump(mode="json"))
    db = get_database()
    await push_notification(db, current_user["id"], "Approval saved", f"Student {payload.student_id} {'approved' if payload.approved else 'not approved'} on {payload.approval_date}.", "success")
    return record


@router.post("/supervisor/evaluation")
async def submit_supervisor_evaluation(payload: EmployerEvaluationCreate, current_user: dict = Depends(require_roles("supervisor"))):
    db = get_database()
    existing = await db.employer_evaluations.find_one({
        "user_id": current_user["id"],
        "payload.student_id": payload.student_id
    })

    if existing:
        now = get_pht_now()
        await db.employer_evaluations.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "payload.score": payload.score,
                "payload.feedback": payload.feedback,
                "payload.internship_id": payload.internship_id,
                "created_at": now
            }}
        )
        updated = await db.employer_evaluations.find_one({"_id": existing["_id"]})
        from app.services.records_service import serialize_record
        record = serialize_record(updated)
        await push_notification(db, current_user["id"], "Evaluation updated", f"Score {payload.score}/10 updated for student {payload.student_id}.", "success")
    else:
        record = await create_record("employer_evaluations", "supervisor_evaluation", "supervisor", current_user, payload.model_dump(mode="json"))
        await push_notification(db, current_user["id"], "Evaluation submitted", f"Score {payload.score}/10 saved for student {payload.student_id}.", "success")
        
    return record


@router.get("/supervisor/evaluations")
async def get_supervisor_evaluations(current_user: dict = Depends(require_roles("supervisor"))):
    evaluations = await list_all_records("employer_evaluations", current_user["id"])
    db = get_database()
    for ev in evaluations:
        student_id = ev.get("payload", {}).get("student_id")
        if student_id:
            try:
                student = await db.users.find_one({"role_id": student_id})
                if student:
                    ev["student_name"] = student.get("full_name")
                    ev["student_email"] = student.get("email")
                    ev["student_avatar_url"] = student.get("avatar_url")
            except Exception:
                pass
    return {"evaluations": evaluations}


@router.get("/supervisor/evaluations/history")
async def get_supervisor_evaluations_history(current_user: dict = Depends(require_roles("supervisor"))):
    evaluations = await list_all_records("employer_evaluations", current_user["id"])
    db = get_database()
    for ev in evaluations:
        student_id = ev.get("payload", {}).get("student_id")
        if student_id:
            try:
                student = await db.users.find_one({"role_id": student_id})
                if student:
                    ev["student_name"] = student.get("full_name")
                    ev["student_email"] = student.get("email")
                    ev["student_avatar_url"] = student.get("avatar_url")
            except Exception:
                pass
    return {"evaluations": evaluations}


@router.delete("/supervisor/evaluation/{record_id}")
async def delete_supervisor_evaluation(record_id: str, current_user: dict = Depends(require_roles("supervisor"))):
    ok = await delete_record("employer_evaluations", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/supervisor/evaluation/bulk-delete")
async def bulk_delete_supervisor_evaluation(body: BulkDeleteBody, current_user: dict = Depends(require_roles("supervisor"))):
    count = await delete_records_bulk("employer_evaluations", body.ids, current_user["id"])
    return {"deleted": count}


@router.get("/supervisor")
async def get_supervisor_records(current_user: dict = Depends(require_roles("supervisor"))):
    approvals = await list_records("completion_approvals", current_user["id"])
    return {"approvals": approvals}


@router.get("/supervisor/history")
async def get_supervisor_history(current_user: dict = Depends(require_roles("supervisor"))):
    approvals = await list_all_records("completion_approvals", current_user["id"])
    return {"approvals": approvals}


@router.delete("/supervisor/approval/{record_id}")
async def delete_supervisor_approval(record_id: str, current_user: dict = Depends(require_roles("supervisor"))):
    ok = await delete_record("completion_approvals", record_id, current_user["id"])
    return {"deleted": ok}


@router.post("/supervisor/approval/bulk-delete")
async def bulk_delete_supervisor_approval(body: BulkDeleteBody, current_user: dict = Depends(require_roles("supervisor"))):
    count = await delete_records_bulk("completion_approvals", body.ids, current_user["id"])
    return {"deleted": count}


# ── Global Rankings ──────────────────────────────────────────────────────────

@router.get("/rankings")
async def get_global_rankings(
    start_date: str | None = None,
    end_date: str | None = None,
    current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))
):
    """Global rankings of all evaluated students."""
    db = get_database()

    query = {}
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            try:
                query["created_at"]["$gte"] = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=PHT)
            except ValueError: pass
        if end_date:
            try:
                query["created_at"]["$lte"] = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=PHT, hour=23, minute=59, second=59)
            except ValueError: pass
        if not query["created_at"]:
            del query["created_at"]

    cursor = db.employer_evaluations.find(query).sort("created_at", -1)
    evaluations = [ev async for ev in cursor]

    if not evaluations:
        return {"overall": []}

    student_scores = {}
    for ev in evaluations:
        sid = ev["payload"]["student_id"]
        if sid not in student_scores:
            student_scores[sid] = {
                "scores": [],
                "student_id": sid,
                "recent_feedback": ev["payload"].get("feedback"),
                "recent_supervisor_id": ev.get("user_id")
            }
        student_scores[sid]["scores"].append(ev["payload"]["score"])

    # Collect unique role_ids to fetch all at once
    unique_sids = list(student_scores.keys())
    user_cursor = db.users.find({"role_id": {"$in": unique_sids}})
    user_map = {u["role_id"]: u async for u in user_cursor}

    # Gather supervisors to get companies and profiles
    sup_ids = [u["supervisor_id"] for u in user_map.values() if u.get("supervisor_id")]
    for data in student_scores.values():
        if data.get("recent_supervisor_id") and data["recent_supervisor_id"] not in sup_ids:
            sup_ids.append(data["recent_supervisor_id"])
            
    from bson import ObjectId
    valid_sup_ids = []
    for sid in set(sup_ids):
        try: valid_sup_ids.append(ObjectId(sid))
        except: valid_sup_ids.append(sid)

    sup_cursor = db.users.find({"_id": {"$in": valid_sup_ids}})
    sup_map = {str(u["_id"]): u async for u in sup_cursor}

    for sid, data in student_scores.items():
        user = user_map.get(sid)
        if user:
            data["full_name"] = user.get("full_name", "Unknown")
            data["institution"] = user.get("institution")
            data["ojt_position"] = user.get("ojt_position")
            data["avatar_url"] = user.get("avatar_url")
            data["user_id"] = str(user["_id"])
            sup_id = user.get("supervisor_id")
            sup_user = sup_map.get(str(sup_id)) if sup_id else None
            data["company"] = sup_user.get("company") if sup_user else None
        else:
            data["full_name"] = sid
            data["institution"] = None
            data["ojt_position"] = None
            data["avatar_url"] = None
            data["user_id"] = None
            data["company"] = None
            
        recent_sup_id = data.pop("recent_supervisor_id", None)
        recent_sup_user = sup_map.get(str(recent_sup_id)) if recent_sup_id else None
        if recent_sup_user:
            data["recent_supervisor"] = {
                "id": str(recent_sup_user["_id"]),
                "full_name": recent_sup_user.get("full_name"),
                "avatar_url": recent_sup_user.get("avatar_url"),
                "company": recent_sup_user.get("company")
            }
        else:
            data["recent_supervisor"] = None

        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 2)
        data["eval_count"] = len(data["scores"])

    ranked = sorted(student_scores.values(), key=lambda x: x["avg_score"], reverse=True)
    overall = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(ranked)]

    return {"overall": overall}
