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


@router.get("/", response_model=List[schemas.CurriculumResponse])
def list_curricula(db: Session = Depends(get_db)):
    return db.query(models.Curriculum).all()


@router.post("/", response_model=schemas.CurriculumResponse)
def create_curriculum(
    curriculum: schemas.CurriculumCreate, db: Session = Depends(get_db)
):
    db_curriculum = models.Curriculum(**curriculum.dict())
    db.add(db_curriculum)
    db.commit()
    db.refresh(db_curriculum)
    return db_curriculum
