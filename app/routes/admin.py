from fastapi import APIRouter, Depends, UploadFile, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..utils.excel import upload_students
from ..utils.auth import get_superadmin

router = APIRouter()

@router.post("/upload-students")
def upload_students_file(file: UploadFile, db: Session = Depends(get_db), user = Depends(get_superadmin)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Invalid file format")
    file_path = f"temp/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    upload_students(file_path, db)
    return {"message": "Students uploaded successfully"}
