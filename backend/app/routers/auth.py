from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
import bcrypt
from datetime import datetime
from typing import List
import secrets

router = APIRouter()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.email == data.email, models.User.is_current == True)
        .first()
    )
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    roles = (
        db.query(models.UserRole)
        .filter(
            models.UserRole.user_uuid == user.user_uuid,
            models.UserRole.is_current == True,
        )
        .all()
    )

    role_objs = []
    for ur in roles:
        role = db.query(models.Role).filter(models.Role.id == ur.role_id).first()
        if role:
            role_objs.append(
                schemas.RoleResponse(
                    id=role.id, name=role.name, description=role.description
                )
            )

    token = secrets.token_urlsafe(32)
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user),
        roles=role_objs,
    )


@router.post("/teacher-login", response_model=schemas.TokenResponse)
def teacher_login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.email == data.email, models.User.is_current == True)
        .first()
    )
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check if user has Teacher role
    user_roles = (
        db.query(models.UserRole)
        .filter(
            models.UserRole.user_uuid == user.user_uuid,
            models.UserRole.is_current == True,
        )
        .all()
    )

    role_objs = []
    for ur in user_roles:
        role = db.query(models.Role).filter(models.Role.id == ur.role_id).first()
        if role:
            role_objs.append(
                schemas.RoleResponse(
                    id=role.id, name=role.name, description=role.description
                )
            )

    is_teacher = any(r.name == "Teacher" for r in role_objs)
    is_admin = any(r.name == "Admin" for r in role_objs)

    if not is_teacher and not is_admin:
        raise HTTPException(status_code=403, detail="Teacher role required")

    token = secrets.token_urlsafe(32)
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user),
        roles=role_objs,
    )


@router.post("/verify-session")
def verify_session(db: Session = Depends(get_db)):
    # Simplified - in production would verify JWT token
    return {"message": "Session verified"}


@router.get("/check-password/{user_uuid}")
def check_password(user_uuid: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"has_password": user.password_hash is not None}


@router.delete("/remove-password/{user_uuid}")
def remove_password(user_uuid: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.user_uuid == user_uuid, models.User.is_current == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = None
    db.commit()
    return {"message": "Password removed"}
