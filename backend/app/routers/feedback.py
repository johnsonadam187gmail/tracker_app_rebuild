from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
from typing import List, Optional
from datetime import datetime

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


@router.get("/admin/comprehensive-stats", response_model=schemas.FeedbackStats)
def get_admin_comprehensive_stats(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    classes: Optional[str] = Query(None, description="Comma-separated class IDs"),
    teachers: Optional[str] = Query(None, description="Comma-separated teacher UUIDs"),
    rating: Optional[str] = Query(
        None, description="Rating filter: positive, negative, or all"
    ),
    db: Session = Depends(get_db),
):
    """Get comprehensive feedback statistics for admin dashboard."""
    query = db.query(models.ClassFeedback)

    # Filter by date range if provided
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(models.ClassFeedback.created_at >= start)
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
        # Include the entire day
        end = end.replace(hour=23, minute=59, second=59)
        query = query.filter(models.ClassFeedback.created_at <= end)

    # Filter by teacher if provided
    if teachers:
        teacher_list = teachers.split(",")
        instances = (
            db.query(models.ClassInstance)
            .filter(models.ClassInstance.teacher_uuid.in_(teacher_list))
            .all()
        )
        instance_ids = [i.id for i in instances]
        query = query.filter(models.ClassFeedback.class_instance_id.in_(instance_ids))

    # Filter by rating
    if rating and rating != "all":
        query = query.filter(models.ClassFeedback.rating == rating)

    all_feedback = query.all()
    total = len(all_feedback)
    positive = sum(
        1
        for f in all_feedback
        if f.rating and f.rating.lower() in ["positive", "good", "great", "thumbs_up"]
    )
    negative = sum(
        1
        for f in all_feedback
        if f.rating and f.rating.lower() in ["negative", "bad", "poor", "thumbs_down"]
    )

    # If rating was provided as filter, recalculate based on actual ratings in result
    if rating and rating != "all":
        if rating == "positive":
            positive = total
            negative = 0
        elif rating == "negative":
            negative = total
            positive = 0

    positive_percent = (positive / total * 100) if total > 0 else 0.0

    return schemas.FeedbackStats(
        totalFeedback=total,
        positiveCount=positive,
        negativeCount=negative,
        positivePercent=positive_percent,
    )


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
