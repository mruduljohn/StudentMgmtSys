from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..utils.security import create_token
from ..models.user import User

router = APIRouter()

@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.password_hash == password:  # Replace with hashed password check
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_token(data={"sub": user.user_id})
    return {"access_token": access_token, "token_type": "bearer"}
