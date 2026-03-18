from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
from typing import List

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[schemas.RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()


@router.get("/user/{user_uuid}", response_model=List[schemas.UserRoleResponse])
def get_user_roles(user_uuid: str, db: Session = Depends(get_db)):
    return (
        db.query(models.UserRole)
        .filter(
            models.UserRole.user_uuid == user_uuid, models.UserRole.is_current == True
        )
        .all()
    )


@router.put("/user/{user_uuid}")
def update_user_roles(user_uuid: str, data: dict, db: Session = Depends(get_db)):
    role_ids = data.get("role_ids", [])

    # Archive old roles
    old_roles = (
        db.query(models.UserRole)
        .filter(
            models.UserRole.user_uuid == user_uuid, models.UserRole.is_current == True
        )
        .all()
    )

    for ur in old_roles:
        ur.is_current = False

    # Add new roles
    for role_id in role_ids:
        user_role = models.UserRole(user_uuid=user_uuid, role_id=role_id)
        db.add(user_role)

    db.commit()
    return {"message": "Roles updated"}


@router.get("/user/{user_uuid}/history", response_model=List[schemas.UserRoleResponse])
def get_user_role_history(user_uuid: str, db: Session = Depends(get_db)):
    return (
        db.query(models.UserRole)
        .filter(models.UserRole.user_uuid == user_uuid)
        .order_by(models.UserRole.created_date.desc())
        .all()
    )


@router.get("/users/by-role/{role}", response_model=List[schemas.UserResponse])
def get_users_by_role(role: str, db: Session = Depends(get_db)):
    role_obj = db.query(models.Role).filter(models.Role.name == role).first()
    if not role:
        return []

    user_roles = (
        db.query(models.UserRole)
        .filter(
            models.UserRole.role_id == role_obj.id, models.UserRole.is_current == True
        )
        .all()
    )

    user_uuids = [ur.user_uuid for ur in user_roles]
    return (
        db.query(models.User)
        .filter(models.User.user_uuid.in_(user_uuids), models.User.is_current == True)
        .all()
    )
