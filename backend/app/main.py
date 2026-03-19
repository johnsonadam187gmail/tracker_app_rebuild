from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import (
    users,
    classes,
    class_instances,
    attendance,
    terms,
    gyms,
    class_types,
    roles,
    curricula,
    lessons,
    auth,
    feedback,
    kiosk,
    database,
    dashboard,
)

app = FastAPI(title="CKB Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(classes.router, prefix="/classes", tags=["Classes"])
app.include_router(
    class_instances.router, prefix="/class-instances", tags=["Class Instances"]
)
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(terms.router, prefix="/terms", tags=["Terms"])
app.include_router(gyms.router, prefix="/gym-locations", tags=["Gym Locations"])
app.include_router(class_types.router, prefix="/class-types", tags=["Class Types"])
app.include_router(roles.router, prefix="/roles", tags=["Roles"])
app.include_router(curricula.router, prefix="/curricula", tags=["Curricula"])
app.include_router(lessons.router, prefix="/lessons", tags=["Lessons"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
app.include_router(kiosk.router, prefix="/kiosk", tags=["Kiosk"])
app.include_router(database.router, prefix="/database", tags=["Database"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])


@app.get("/")
def read_root():
    return {"message": "CKB Tracker API is live!"}
