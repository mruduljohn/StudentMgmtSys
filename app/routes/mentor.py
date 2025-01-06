from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.student import Student
from ..utils.auth import get_mentor

router = APIRouter()

@router.get("/students")
def get_students(db: Session = Depends(get_db), user = Depends(get_mentor)):
    students = db.query(Student).filter(Student.mentor_id == user.user_id).all()
    return students
