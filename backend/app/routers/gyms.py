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


@router.get("/", response_model=List[schemas.GymLocationResponse])
def list_gyms(db: Session = Depends(get_db)):
    return db.query(models.GymLocation).all()


@router.post("/", response_model=schemas.GymLocationResponse)
def create_gym(gym: schemas.GymLocationCreate, db: Session = Depends(get_db)):
    db_gym = models.GymLocation(**gym.dict())
    db.add(db_gym)
    db.commit()
    db.refresh(db_gym)
    return db_gym
