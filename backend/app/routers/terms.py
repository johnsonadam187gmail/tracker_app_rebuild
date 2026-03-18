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


@router.get("/", response_model=List[schemas.TermResponse])
def list_terms(db: Session = Depends(get_db)):
    return db.query(models.Term).all()


@router.post("/", response_model=schemas.TermResponse)
def create_term(term: schemas.TermCreate, db: Session = Depends(get_db)):
    db_term = models.Term(**term.dict())
    db.add(db_term)
    db.commit()
    db.refresh(db_term)
    return db_term


@router.get("/term-targets/", response_model=List[schemas.TermTargetResponse])
def list_targets(db: Session = Depends(get_db)):
    return db.query(models.TermTarget).all()


@router.post("/term-targets/", response_model=schemas.TermTargetResponse)
def create_target(target: schemas.TermTargetCreate, db: Session = Depends(get_db)):
    db_target = models.TermTarget(**target.dict())
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target
