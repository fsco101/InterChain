from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import serialize_user
from fastapi import File, Form, UploadFile, HTTPException, status
from app.services.cloudinary_service import upload_task_photo # repurposing this or we can create upload_document_photo
from app.utils.timezone import get_pht_now, PHT
from datetime import datetime, timezone


router = APIRouter(prefix="/student", tags=["student"])


@router.get("/search")
async def search_students(
    q: str = "",
    current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin")),
):
    db = get_database()
    query: dict = {"role": "student"}
    if q.strip():
        query["$or"] = [
            {"full_name": {"$regex": q.strip(), "$options": "i"}},
            {"role_id": {"$regex": q.strip(), "$options": "i"}},
            {"internship_id": {"$regex": q.strip(), "$options": "i"}},
            {"ojt_position": {"$regex": q.strip(), "$options": "i"}},
        ]
    cursor = db.users.find(query).limit(10)
    return {"users": [serialize_user(u) async for u in cursor]}


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("student"))):
    return {
        "message": f"Welcome to the student dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Log daily activity", "Submit report", "View progress"],
    }


@router.get("/tasks")
async def get_student_tasks(current_user: dict = Depends(require_roles("student"))):
    db = get_database()
    cursor = db.tasks.find({"student_id": current_user["id"]}).sort("created_at", -1)
    tasks = []
    async for doc in cursor:
        employer_id = doc.get("employer_id")
        employer_avatar_url = None
        if employer_id:
            try:
                from app.routers.supervisor import _oid
                emp_user = await db.users.find_one({"_id": _oid(employer_id)})
                if emp_user:
                    employer_avatar_url = emp_user.get("avatar_url")
            except Exception:
                pass
                
        tasks.append({
            "id": str(doc["_id"]),
            "title": doc.get("title"),
            "description": doc.get("description"),
            "position": doc.get("position"),
            "due_date": doc.get("due_date"),
            "status": doc.get("status"),
            "employer_id": employer_id,
            "employer_name": doc.get("employer_name"),
            "employer_avatar_url": employer_avatar_url,
            "created_at": doc.get("created_at"),
            "completed_at": doc.get("completed_at"),
            "accumulated_seconds": doc.get("accumulated_seconds", 0),
            "last_active_start": doc.get("last_active_start"),
            "attachment_url": doc.get("attachment_url")
        })
    return {"tasks": tasks}


@router.get("/documents")
async def get_student_documents(current_user: dict = Depends(require_roles("student"))):
    db = get_database()
    cursor = db.student_documents.find({"student_id": current_user["id"]}).sort("created_at", -1)
    documents = []
    async for doc in cursor:
        documents.append({
            "id": str(doc["_id"]),
            "document_type": doc.get("document_type"),
            "file_url": doc.get("file_url"),
            "status": doc.get("status"),
            "created_at": doc.get("created_at")
        })
    return {"documents": documents}


@router.post("/documents")
async def upload_student_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student"))
):
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document file is required.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Document must be an image for now")

    file_bytes = await file.read()
    try:
        # We can reuse upload_task_photo since it just uploads an image
        photo_res = await upload_task_photo(file_bytes)
        file_url = photo_res["url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

    db = get_database()
    
    # Check if a document of this type already exists for the student
    existing = await db.student_documents.find_one({
        "student_id": current_user["id"],
        "document_type": document_type
    })

    if existing:
        await db.student_documents.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "file_url": file_url,
                "status": "Uploaded",
                "updated_at": get_pht_now()
            }}
        )
    else:
        document = {
            "student_id": current_user["id"],
            "document_type": document_type,
            "file_url": file_url,
            "status": "Uploaded",
            "created_at": get_pht_now(),
            "updated_at": get_pht_now()
        }
        await db.student_documents.insert_one(document)

    return {"ok": True, "file_url": file_url, "document_type": document_type}


@router.delete("/documents")
async def delete_student_document(
    document_type: str,
    current_user: dict = Depends(require_roles("student"))
):
    db = get_database()
    query = {"student_id": current_user["id"], "document_type": document_type}
    
    result = await db.student_documents.delete_one(query)
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Document not found. Requested: '{document_type}'")
        
    return {"ok": True, "message": f"{document_type} removed"}

