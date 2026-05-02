from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app import models, schemas
from typing import List, Optional

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


@router.get("/admin/list", response_model=List[schemas.FeedbackResponse])
def get_admin_feedback_list(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    classes: Optional[str] = Query(None),
    teachers: Optional[str] = Query(None),
    rating: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.ClassFeedback)
        .join(models.ClassInstance)
        .join(models.User)
        .join(models.ClassSchedule)
    )

    if start_date:
        query = query.filter(models.ClassInstance.class_date >= start_date)
    if end_date:
        query = query.filter(models.ClassInstance.class_date <= end_date)
    if classes:
        class_ids = [int(c.strip()) for c in classes.split(",")]
        query = query.filter(models.ClassInstance.class_id.in_(class_ids))
    if teachers:
        teacher_uuids = [t.strip() for t in teachers.split(",")]
        query = query.filter(models.ClassInstance.teacher_uuid.in_(teacher_uuids))
    if rating and rating != "all":
        query = query.filter(models.ClassFeedback.rating == rating)

    feedback = query.order_by(models.ClassInstance.class_date.desc()).all()
    return feedback


@router.get("/admin/comprehensive-stats", response_model=schemas.FeedbackStats)
def get_admin_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    classes: Optional[str] = Query(None),
    teachers: Optional[str] = Query(None),
    rating: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.ClassFeedback).join(models.ClassInstance)

    if start_date:
        query = query.filter(models.ClassInstance.class_date >= start_date)
    if end_date:
        query = query.filter(models.ClassInstance.class_date <= end_date)
    if classes:
        class_ids = [int(c.strip()) for c in classes.split(",")]
        query = query.filter(models.ClassInstance.class_id.in_(class_ids))
    if teachers:
        teacher_uuids = [t.strip() for t in teachers.split(",")]
        query = query.filter(models.ClassInstance.teacher_uuid.in_(teacher_uuids))
    if rating:
        query = query.filter(models.ClassFeedback.rating == rating)

    total_feedback = query.count()
    positive_count = query.filter(models.ClassFeedback.rating == "positive").count()
    negative_count = query.filter(models.ClassFeedback.rating == "negative").count()
    positive_percent = (
        (positive_count / total_feedback * 100) if total_feedback > 0 else 0
    )

    return schemas.FeedbackStats(
        totalFeedback=total_feedback,
        positiveCount=positive_count,
        negativeCount=negative_count,
        positivePercent=round(positive_percent, 2),
    )
