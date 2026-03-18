from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/verify-pin")
def verify_pin(data: dict, db: Session = Depends(get_db)):
    pin = data.get("pin")

    kiosk = db.query(models.KioskAuth).first()
    if not kiosk:
        # Default PIN: 1234
        if pin == "1234":
            return {"valid": True}
        return {"valid": False}

    if pwd_context.verify(pin, kiosk.pin_hash):
        return {"valid": True}
    return {"valid": False}


@router.put("/update-pin")
def update_pin(data: dict, db: Session = Depends(get_db)):
    current_pin = data.get("current_pin")
    new_pin = data.get("new_pin")

    kiosk = db.query(models.KioskAuth).first()

    if not kiosk:
        # Create new kiosk auth
        if current_pin != "1234":
            raise HTTPException(status_code=400, detail="Invalid current PIN")
        kiosk = models.KioskAuth(pin_hash=pwd_context.hash(new_pin))
        db.add(kiosk)
    else:
        if not pwd_context.verify(current_pin, kiosk.pin_hash):
            raise HTTPException(status_code=400, detail="Invalid current PIN")
        kiosk.pin_hash = pwd_context.hash(new_pin)

    db.commit()
    return {"message": "PIN updated"}


@router.post("/setup")
def setup_kiosk(data: dict, db: Session = Depends(get_db)):
    pin = data.get("pin", "1234")

    kiosk = db.query(models.KioskAuth).first()
    if kiosk:
        kiosk.pin_hash = pwd_context.hash(pin)
    else:
        kiosk = models.KioskAuth(pin_hash=pwd_context.hash(pin))
        db.add(kiosk)

    db.commit()
    return {"message": "Kiosk configured"}
