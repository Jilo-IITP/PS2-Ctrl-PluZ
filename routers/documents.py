"""
routers/documents.py
Document CRUD: upload to Supabase Storage, list/get/delete from DB + Storage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from schemas.documents import DocumentOut
from controllers import documents_controller
from core.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/documents", tags=["Documents"], dependencies=[Depends(get_current_user)])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=DocumentOut)
async def upload(patient_id: str = Query(...), file: UploadFile = File(...)):
    return await documents_controller.upload_document(file, patient_id)


@router.get("/", response_model=List[DocumentOut])
async def list_by_patient(patient_id: str = Query(...)):
    return await documents_controller.list_documents(patient_id)


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_one(doc_id: str):
    return await documents_controller.get_document(doc_id)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(doc_id: str):
    await documents_controller.delete_document(doc_id)
