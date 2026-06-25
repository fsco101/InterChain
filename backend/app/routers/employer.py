import base64
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import serialize_user
from app.services.blockchain_service import build_blockchain_metadata_async
from app.services.email_service import send_certificate_email


router = APIRouter(prefix="/employer", tags=["employer"])


class InstructorAdd(BaseModel):
    role_id: str  # INS-XXXXX


class PositionBody(BaseModel):
    name: str
    description: str | None = None


class AssignPositionBody(BaseModel):
    ojt_position: str


class TaskBody(BaseModel):
    title: str
    description: str
    position: str
    student_ids: list[str] | None = None  # None = assign by position
    due_date: str | None = None


class TaskStatusBody(BaseModel):
    status: str  # pending | in_progress | completed | cancelled


class AttendanceValidateBody(BaseModel):
    validation_status: str  # validated | rejected
    notes: str | None = None


class CertificateCreate(BaseModel):
    recipient_name: str
    recipient_email: str
    recipient_role_id: str
    recipient_type: str  # "student" | "instructor"
    internship_title: str
    company_name: str
    company_address: str | None = None
    signatory_name: str
    signatory_title: str
    start_date: str
    end_date: str
    remarks: str | None = None
    company_logo_b64: str | None = None  # base64 data URL
    cert_html: str  # rendered HTML from frontend
    send_email: bool = True
    override_hours: bool = False  # override hours check


def _oid(val: str):
    try:
        return ObjectId(val)
    except Exception:
        return None


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("employer"))):
    return {
        "message": f"Welcome to the employer dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Validate attendance", "Approve completion", "Review performance"],
    }


@router.get("/search")
async def search_users(
    q: str = "",
    role: str = "student",
    current_user: dict = Depends(require_roles("employer")),
):
    db = get_database()
    query: dict = {"role": role}
    if q.strip():
        query["$or"] = [
            {"full_name": {"$regex": q.strip(), "$options": "i"}},
            {"role_id": {"$regex": q.strip(), "$options": "i"}},
            {"email": {"$regex": q.strip(), "$options": "i"}},
            {"ojt_position": {"$regex": q.strip(), "$options": "i"}},
        ]
    cursor = db.users.find(query).limit(10)
    return {"users": [serialize_user(u) async for u in cursor]}


# ── Instructor Roster ──────────────────────────────────────────────────────────

@router.get("/roster")
async def get_roster(current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    doc = await db.employer_rosters.find_one({"employer_id": current_user["id"]})
    instructors = doc.get("instructors", []) if doc else []

    # for each instructor, fetch their student roster
    result = []
    for ins in instructors:
        ins_roster = await db.instructor_rosters.find_one({"instructor_id": ins["user_id"]})
        students_raw = ins_roster.get("students", []) if ins_roster else []
        # enrich students with ojt_position from user doc
        enriched = []
        for s in students_raw:
            user_doc = await db.users.find_one({"role_id": s["role_id"]})
            s["ojt_position"] = user_doc.get("ojt_position") if user_doc else None
            enriched.append(s)
        ins["students"] = enriched
        result.append(ins)

    return {"instructors": result}


@router.post("/roster/add", status_code=status.HTTP_201_CREATED)
async def add_instructor(body: InstructorAdd, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    instructor = await db.users.find_one({"role_id": body.role_id, "role": "instructor"})
    if not instructor:
        # fallback: case-insensitive match
        instructor = await db.users.find_one({"role_id": {"$regex": f"^{body.role_id}$", "$options": "i"}, "role": "instructor"})
    if not instructor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instructor not found. Make sure the Instructor ID is correct (e.g. INS-12345).")

    i = serialize_user(instructor)
    entry = {
        "user_id": i["id"],
        "role_id": i["role_id"],
        "full_name": i["full_name"],
        "email": i["email"],
        "institution": i.get("institution"),
    }

    # check not already in roster
    existing_doc = await db.employer_rosters.find_one(
        {"employer_id": current_user["id"], "instructors.user_id": i["id"]}
    )
    if existing_doc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Instructor already in your roster")

    await db.employer_rosters.update_one(
        {"employer_id": current_user["id"]},
        {"$push": {"instructors": entry}},
        upsert=True,
    )
    return {"message": f"Instructor {body.role_id} added", "instructor": entry}


@router.delete("/roster/{role_id}")
async def remove_instructor(role_id: str, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    result = await db.employer_rosters.update_one(
        {"employer_id": current_user["id"]},
        {"$pull": {"instructors": {"role_id": role_id}}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instructor not in roster")
    return {"message": f"Instructor {role_id} removed"}


# ── Students (all under employer via instructor rosters) ───────────────────────

async def _get_employer_student_ids(db, employer_id: str) -> list[str]:
    """Return user_ids of all students under this employer (via instructor rosters)."""
    doc = await db.employer_rosters.find_one({"employer_id": employer_id})
    if not doc:
        return []
    student_ids = []
    for ins in doc.get("instructors", []):
        roster = await db.instructor_rosters.find_one({"instructor_id": ins["user_id"]})
        if roster:
            for s in roster.get("students", []):
                if s["user_id"] not in student_ids:
                    student_ids.append(s["user_id"])
    return student_ids


@router.get("/students")
async def get_employer_students(current_user: dict = Depends(require_roles("employer"))):
    """Get all students under this employer (via instructor rosters) with their details."""
    db = get_database()
    student_ids = await _get_employer_student_ids(db, current_user["id"])
    students = []
    for sid in student_ids:
        oid = _oid(sid)
        if oid:
            user = await db.users.find_one({"_id": oid})
            if user:
                students.append(serialize_user(user))
    return {"students": students}


# ── Student Attendance (employer view / validation) ────────────────────────────

@router.get("/student-attendance/{student_id}")
async def get_student_attendance(student_id: str, current_user: dict = Depends(require_roles("employer"))):
    """Employer views a specific student's attendance records."""
    db = get_database()
    from app.services.records_service import serialize_record
    cursor = db.student_attendance.find({"user_id": student_id}).sort("created_at", -1)
    return {"attendance": [serialize_record(doc) async for doc in cursor]}


@router.get("/attendance")
async def get_all_student_attendance(current_user: dict = Depends(require_roles("employer"))):
    """Employer views attendance records for ALL students under them."""
    db = get_database()
    student_ids = await _get_employer_student_ids(db, current_user["id"])
    from app.services.records_service import serialize_record
    if not student_ids:
        return {"attendance": []}
    cursor = db.student_attendance.find({"user_id": {"$in": student_ids}}).sort("created_at", -1).limit(100)
    return {"attendance": [serialize_record(doc) async for doc in cursor]}


@router.patch("/attendance/{record_id}/validate")
async def validate_student_attendance(record_id: str, body: AttendanceValidateBody, current_user: dict = Depends(require_roles("employer"))):
    """Employer validates or rejects a student attendance entry."""
    db = get_database()
    oid = _oid(record_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid record ID")

    result = await db.student_attendance.update_one(
        {"_id": oid},
        {"$set": {
            "payload.validation_status": body.validation_status,
            "payload.validated_by": current_user["id"],
            "payload.validated_by_name": current_user["full_name"],
            "payload.validation_notes": body.notes,
            "payload.validated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Notify the student
    doc = await db.student_attendance.find_one({"_id": oid})
    if doc:
        from app.routers.notifications import push_notification
        student_id = doc["user_id"]
        status_text = "validated" if body.validation_status == "validated" else "rejected"
        await push_notification(
            db, student_id, f"Attendance {status_text}",
            f"Your attendance for {doc['payload'].get('attendance_date', '?')} has been {status_text} by {current_user['full_name']}.",
            "success" if body.validation_status == "validated" else "warning"
        )

    return {"ok": True}


# ── Positions (employer-defined) ──────────────────────────────────────────────

@router.post("/positions", status_code=status.HTTP_201_CREATED)
async def create_position(body: PositionBody, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    # Check for duplicate name under this employer
    existing = await db.positions.find_one({"employer_id": current_user["id"], "name": {"$regex": f"^{body.name.strip()}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=409, detail="A position with this name already exists")

    doc = {
        "employer_id": current_user["id"],
        "name": body.name.strip(),
        "description": body.description.strip() if body.description else None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.positions.insert_one(doc)
    return {"id": str(result.inserted_id), "name": doc["name"], "description": doc["description"]}


@router.get("/positions")
async def list_positions(current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    cursor = db.positions.find({"employer_id": current_user["id"]}).sort("created_at", -1)
    positions = []
    async for doc in cursor:
        positions.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "description": doc.get("description"),
        })
    return {"positions": positions}


@router.delete("/positions/{position_id}")
async def delete_position(position_id: str, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    oid = _oid(position_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid position ID")
    result = await db.positions.delete_one({"_id": oid, "employer_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"ok": True}


# ── Assign Position to Student ─────────────────────────────────────────────────

@router.put("/student/{student_id}/position")
async def assign_position(student_id: str, body: AssignPositionBody, current_user: dict = Depends(require_roles("employer"))):
    """Employer assigns an OJT position to a student."""
    db = get_database()
    oid = _oid(student_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.users.find_one({"_id": oid, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    await db.users.update_one({"_id": oid}, {"$set": {"ojt_position": body.ojt_position.strip()}})
    return {"ok": True, "ojt_position": body.ojt_position.strip()}


# ── Tasks (employer assigns) ──────────────────────────────────────────────────

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskBody, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()

    # Determine target student IDs
    if body.student_ids and len(body.student_ids) > 0:
        # Single or multi assign by specific student IDs
        target_ids = body.student_ids
    else:
        # Assign to all students with matching position
        cursor = db.users.find({"role": "student", "ojt_position": {"$regex": f"^{body.position.strip()}$", "$options": "i"}})
        target_ids = [str(u["_id"]) async for u in cursor]

    if not target_ids:
        raise HTTPException(status_code=400, detail="No students found for this position or selection.")

    doc = {
        "employer_id": current_user["id"],
        "employer_name": current_user["full_name"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "position": body.position.strip(),
        "student_ids": target_ids,
        "due_date": body.due_date,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.tasks.insert_one(doc)

    # Notify each student
    from app.routers.notifications import push_notification
    for sid in target_ids:
        await push_notification(db, sid, "New task assigned", f"'{body.title}' has been assigned to you by {current_user['full_name']}.", "info")

    doc["id"] = str(result.inserted_id)
    doc["_id"] = None
    return doc


@router.get("/tasks")
async def list_tasks(current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    cursor = db.tasks.find({"employer_id": current_user["id"]}).sort("created_at", -1).limit(50)
    tasks = []
    
    from bson import ObjectId

    async for doc in cursor:
        student_ids = doc.get("student_ids", [])
        assigned_students = []
        if student_ids:
            oids = [ObjectId(sid) for sid in student_ids if ObjectId.is_valid(sid)]
            if oids:
                s_cursor = db.users.find({"_id": {"$in": oids}})
                async for s_doc in s_cursor:
                    assigned_students.append({
                        "user_id": str(s_doc["_id"]),
                        "full_name": s_doc.get("full_name", "Unknown"),
                        "avatar_url": s_doc.get("avatar_url")
                    })

        tasks.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "description": doc["description"],
            "position": doc["position"],
            "student_ids": student_ids,
            "assigned_students": assigned_students,
            "due_date": doc.get("due_date"),
            "status": doc.get("status", "pending"),
            "employer_name": doc.get("employer_name"),
            "created_at": doc["created_at"],
        })
    return {"tasks": tasks}


@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, body: TaskStatusBody, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    oid = _oid(task_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    result = await db.tasks.update_one(
        {"_id": oid, "employer_id": current_user["id"]},
        {"$set": {"status": body.status}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    oid = _oid(task_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    result = await db.tasks.delete_one({"_id": oid, "employer_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# ── Rankings (evaluation-based) ───────────────────────────────────────────────

@router.get("/rankings")
async def get_rankings(current_user: dict = Depends(require_roles("employer"))):
    """Get student rankings based on employer evaluations: overall, per school, per position."""
    db = get_database()

    # Gather all evaluations by this employer
    cursor = db.employer_evaluations.find({"user_id": current_user["id"]}).sort("created_at", -1)
    evaluations = []
    async for doc in cursor:
        evaluations.append(doc)

    if not evaluations:
        return {"overall": [], "by_school": {}, "by_position": {}}

    # Aggregate scores per student
    student_scores = {}
    for ev in evaluations:
        sid = ev["payload"]["student_id"]
        if sid not in student_scores:
            student_scores[sid] = {"scores": [], "student_id": sid}
        student_scores[sid]["scores"].append(ev["payload"]["score"])

    # Enrich with user data
    for sid, data in student_scores.items():
        user = await db.users.find_one({"role_id": sid})
        if user:
            data["full_name"] = user.get("full_name", "Unknown")
            data["institution"] = user.get("institution")
            data["ojt_position"] = user.get("ojt_position")
            data["avatar_url"] = user.get("avatar_url")
            data["user_id"] = str(user["_id"])
        else:
            data["full_name"] = sid
            data["institution"] = None
            data["ojt_position"] = None
            data["avatar_url"] = None
            data["user_id"] = None
        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 2)
        data["eval_count"] = len(data["scores"])

    ranked = sorted(student_scores.values(), key=lambda x: x["avg_score"], reverse=True)

    # Overall
    overall = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(ranked)]

    # By school
    by_school = {}
    for r in ranked:
        school = r.get("institution") or "Unknown"
        if school not in by_school:
            by_school[school] = []
        by_school[school].append(r)

    for school in by_school:
        by_school[school] = sorted(by_school[school], key=lambda x: x["avg_score"], reverse=True)
        by_school[school] = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(by_school[school])]

    # By position
    by_position = {}
    for r in ranked:
        pos = r.get("ojt_position") or "Unassigned"
        if pos not in by_position:
            by_position[pos] = []
        by_position[pos].append(r)

    for pos in by_position:
        by_position[pos] = sorted(by_position[pos], key=lambda x: x["avg_score"], reverse=True)
        by_position[pos] = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(by_position[pos])]

    return {"overall": overall, "by_school": by_school, "by_position": by_position}


# ── Certificates ───────────────────────────────────────────────────────────────

@router.post("/certificates", status_code=status.HTTP_201_CREATED)
async def issue_certificate(body: CertificateCreate, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()

    # Check if student has completed required hours (unless overridden)
    if body.recipient_type == "student" and not body.override_hours:
        student = await db.users.find_one({"role_id": body.recipient_role_id, "role": "student"})
        if student:
            student_id = str(student["_id"])
            # Calculate total validated attendance hours
            cursor = db.student_attendance.find({
                "user_id": student_id,
                "payload.validation_status": "validated",
            })
            total_hours = 0.0
            async for att_doc in cursor:
                total_hours += att_doc["payload"].get("hours", 0)

            # Also check if there's an approved completion approval
            approval = await db.completion_approvals.find_one({
                "user_id": current_user["id"],
                "payload.student_id": body.recipient_role_id,
                "payload.approved": True,
            })
            if not approval:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Student {body.recipient_role_id} does not have an approved completion record. Please approve completion first or use the override option."
                )

    payload = {
        "recipient_name": body.recipient_name,
        "recipient_email": body.recipient_email,
        "recipient_role_id": body.recipient_role_id,
        "recipient_type": body.recipient_type,
        "internship_title": body.internship_title,
        "company_name": body.company_name,
        "company_address": body.company_address,
        "signatory_name": body.signatory_name,
        "signatory_title": body.signatory_title,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "remarks": body.remarks,
        "issued_by": current_user["full_name"],
        "issued_by_id": current_user["id"],
    }

    blockchain = await build_blockchain_metadata_async("certificate", current_user["id"], payload)

    document = {
        "employer_id": current_user["id"],
        "payload": payload,
        "blockchain": blockchain,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.certificates.insert_one(document)

    email_error = None
    if body.send_email and body.recipient_email:
        try:
            await send_certificate_email(
                to_email=body.recipient_email,
                recipient_name=body.recipient_name,
                company_name=body.company_name,
                cert_html=body.cert_html,
            )
        except Exception as exc:
            email_error = str(exc)

    return {
        "id": str(result.inserted_id),
        "blockchain": blockchain,
        "email_sent": email_error is None and body.send_email,
        "email_error": email_error,
    }


@router.get("/certificates")
async def list_certificates(current_user: dict = Depends(require_roles("employer"))):
    db = get_database()
    cursor = db.certificates.find({"employer_id": current_user["id"]}).sort("created_at", -1).limit(50)
    certs = []
    async for doc in cursor:
        certs.append({
            "id": str(doc["_id"]),
            "payload": doc["payload"],
            "blockchain": doc.get("blockchain"),
            "created_at": doc["created_at"],
        })
    return {"certificates": certs}


# ── Student hours summary (used by certificate check & profile) ───────────────

@router.get("/student-hours/{role_id}")
async def get_student_hours(role_id: str, current_user: dict = Depends(require_roles("employer", "instructor", "student", "admin"))):
    """Get total validated attendance hours for a student by their role_id."""
    db = get_database()
    student = await db.users.find_one({"role_id": role_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student_id = str(student["_id"])
    cursor = db.student_attendance.find({"user_id": student_id})
    total_hours = 0.0
    validated_hours = 0.0
    pending_hours = 0.0
    total_days = 0
    async for doc in cursor:
        h = doc["payload"].get("hours", 0)
        total_hours += h
        total_days += 1
        if doc["payload"].get("validation_status") == "validated":
            validated_hours += h
        elif doc["payload"].get("validation_status") == "pending":
            pending_hours += h

    return {
        "role_id": role_id,
        "total_hours": round(total_hours, 2),
        "validated_hours": round(validated_hours, 2),
        "pending_hours": round(pending_hours, 2),
        "total_days": total_days,
    }
