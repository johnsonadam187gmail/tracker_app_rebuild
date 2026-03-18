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


@router.post("/", response_model=schemas.FeedbackResponse)
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    db_feedback = models.ClassFeedback(**feedback.dict())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.get("/user/{user_uuid}", response_model=List[schemas.FeedbackResponse])
def get_user_feedback(user_uuid: str, db: Session = Depends(get_db)):
    return (
        db.query(models.ClassFeedback)
        .filter(models.ClassFeedback.user_uuid == user_uuid)
        .order_by(models.ClassFeedback.created_at.desc())
        .all()
    )


@router.get("/teacher/{teacher_uuid}", response_model=List[schemas.FeedbackResponse])
def get_teacher_feedback(teacher_uuid: str, db: Session = Depends(get_db)):
    instances = (
        db.query(models.ClassInstance)
        .filter(models.ClassInstance.teacher_uuid == teacher_uuid)
        .all()
    )

    instance_ids = [i.id for i in instances]
    return (
        db.query(models.ClassFeedback)
        .filter(models.ClassFeedback.class_instance_id.in_(instance_ids))
        .all()
    )
