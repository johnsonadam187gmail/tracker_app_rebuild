from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
from passlib.context import CryptContext
from datetime import datetime, date
from typing import List
import uuid

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_uuid = str(uuid.uuid4())
    password_hash = None
    if user.password:
        password_hash = pwd_context.hash(user.password)

    db_user = models.User(
        user_uuid=user_uuid,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=password_hash,
        rank=user.rank,
        nicknames=user.nicknames,
        comments=user.comments,
        last_graded_date=user.last_graded_date,
        profile_image_url=user.profile_image_url,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Add Student role by default
    student_role = db.query(models.Role).filter(models.Role.name == "Student").first()
    if student_role:
        user_role = models.UserRole(user_uuid=user_uuid, role_id=student_role.id)
        db.add(user_role)
        db.commit()

    return db_user


@router.get("/", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.is_current == True).all()


@router.get("/{user_uuid}", response_model=schemas.UserResponse)
def get_user(user_uuid: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_uuid}", response_model=schemas.UserResponse)
def update_user(
    user_uuid: str, user: schemas.UserUpdate, db: Session = Depends(get_db)
):
    db_user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Archive old record
    db_user.end_date = datetime.utcnow()
    db_user.is_current = False

    # Create new record
    new_user = models.User(
        user_uuid=user_uuid,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        rank=user.rank,
        nicknames=user.nicknames,
        comments=user.comments,
        last_graded_date=user.last_graded_date,
        profile_image_url=db_user.profile_image_url,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/search", response_model=List[schemas.UserResponse])
def search_users(q: str, db: Session = Depends(get_db)):
    return (
        db.query(models.User)
        .filter(
            models.User.is_current == True,
            (models.User.first_name.ilike(f"%{q}%"))
            | (models.User.last_name.ilike(f"%{q}%"))
            | (models.User.email.ilike(f"%{q}%")),
        )
        .all()
    )


@router.post("/{user_uuid}/photo")
def upload_photo(user_uuid: str, profile_image_url: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.profile_image_url = profile_image_url
    db.commit()
    return {"message": "Photo updated"}


@router.delete("/{user_uuid}/photo")
def delete_photo(user_uuid: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.profile_image_url = None
    db.commit()
    return {"message": "Photo deleted"}
