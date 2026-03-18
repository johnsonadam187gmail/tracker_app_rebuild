from fastapi import APIRouter, Depends
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


@router.get("/", response_model=List[schemas.ClassTypeResponse])
def list_class_types(db: Session = Depends(get_db)):
    return db.query(models.ClassType).all()


@router.post("/", response_model=schemas.ClassTypeResponse)
def create_class_type(ct: schemas.ClassTypeCreate, db: Session = Depends(get_db)):
    db_ct = models.ClassType(**ct.dict())
    db.add(db_ct)
    db.commit()
    db.refresh(db_ct)
    return db_ct
