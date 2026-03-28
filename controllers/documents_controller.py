"""
controllers/documents_controller.py
CRUD operations for the documents table + Supabase Storage.
Upload flow: file → Storage bucket "documents" → DB row with file_url.
"""
import uuid
from fastapi import HTTPException, UploadFile, status
from core.supabase import get_supabase

BUCKET = "medical_documents"


async def upload_document(file: UploadFile, patient_id: str) -> dict:
    """Upload file to Supabase Storage and insert a documents table row."""
    supabase = get_supabase()
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    storage_path = f"{patient_id}/{uuid.uuid4().hex}.{ext}"

    # Upload to storage
    try:
        supabase.storage.from_(BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Storage upload failed: {e}")

    # Build public URL
    file_url = f"{supabase.supabase_url}/storage/v1/object/public/{BUCKET}/{storage_path}"

    # Insert DB row
    row = {
        "patient_id": patient_id,
        "file_name": file.filename,
        "file_url": file_url,
        "file_type": ext,
    }
    try:
        res = supabase.table("documents").insert(row).execute()
        return res.data[0]
    except Exception as e:
        # Cleanup storage on DB failure
        try:
            supabase.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"DB insert failed: {e}")


async def list_documents(patient_id: str) -> list:
    supabase = get_supabase()
    res = (
        supabase.table("documents")
        .select("*")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


async def get_document(doc_id: str) -> dict:
    supabase = get_supabase()
    try:
        res = supabase.table("documents").select("*").eq("id", doc_id).single().execute()
        return res.data
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found")


async def delete_document(doc_id: str):
    """Delete from DB and attempt to remove from storage."""
    supabase = get_supabase()

    # Fetch existing row to get storage path
    try:
        row = supabase.table("documents").select("*").eq("id", doc_id).single().execute()
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc = row.data
    file_url: str = doc.get("file_url", "")

    # Extract storage path from URL
    marker = f"/storage/v1/object/public/{BUCKET}/"
    if marker in file_url:
        storage_path = file_url.split(marker, 1)[1]
        try:
            supabase.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass  # best-effort cleanup

    # Delete DB row
    try:
        supabase.table("documents").delete().eq("id", doc_id).execute()
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
