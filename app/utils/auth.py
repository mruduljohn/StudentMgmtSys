from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from .security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
    try:
        payload = decode_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_superadmin(user: User = Depends(get_current_user)):
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

def get_mentor(user: User = Depends(get_current_user)):
    if user.role != "mentor":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user
