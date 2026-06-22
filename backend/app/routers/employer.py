import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import serialize_user
from app.services.blockchain_service import build_blockchain_metadata
from app.services.email_service import send_certificate_email


router = APIRouter(prefix="/employer", tags=["employer"])


class InstructorAdd(BaseModel):
    role_id: str  # INS-XXXXX


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
        ins["students"] = ins_roster.get("students", []) if ins_roster else []
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


# ── Certificates ───────────────────────────────────────────────────────────────

@router.post("/certificates", status_code=status.HTTP_201_CREATED)
async def issue_certificate(body: CertificateCreate, current_user: dict = Depends(require_roles("employer"))):
    db = get_database()

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

    blockchain = build_blockchain_metadata("certificate", current_user["id"], payload)

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
