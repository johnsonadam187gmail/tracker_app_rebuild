from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "users": db.query(models.User).filter(models.User.is_current == True).count(),
        "classes": db.query(models.ClassSchedule)
        .filter(models.ClassSchedule.is_current == True)
        .count(),
        "attendance": db.query(models.Attendance).count(),
    }


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)

    # Seed roles
    roles = [
        models.Role(name="Student", description="Member attending classes"),
        models.Role(name="Teacher", description="Instructor teaching classes"),
        models.Role(name="Admin", description="Administrator with full access"),
    ]
    for role in roles:
        db.add(role)
    db.commit()

    return {"message": "Database reset"}
