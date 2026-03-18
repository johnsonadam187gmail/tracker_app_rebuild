from app.database import SessionLocal
from app.models import User, Role, GymLocation, ClassType, ClassSchedule
import bcrypt
from datetime import date, timedelta
import uuid


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_data():
    db = SessionLocal()

    try:
        # Seed roles (if not exist)
        roles = ["Student", "Teacher", "Admin"]
        for role_name in roles:
            existing = db.query(Role).filter(Role.name == role_name).first()
            if not existing:
                db.add(Role(name=role_name, description=f"{role_name} role"))

        db.commit()

        # Get roles
        student_role = db.query(Role).filter(Role.name == "Student").first()
        teacher_role = db.query(Role).filter(Role.name == "Teacher").first()
        admin_role = db.query(Role).filter(Role.name == "Admin").first()

        # Seed gyms
        gyms = [
            {"name": "Downtown", "address": "123 Main St"},
            {"name": "Westside", "address": "456 West Ave"},
        ]
        for gym_data in gyms:
            existing = (
                db.query(GymLocation)
                .filter(GymLocation.name == gym_data["name"])
                .first()
            )
            if not existing:
                db.add(GymLocation(**gym_data))

        db.commit()

        # Seed class types
        class_types = ["Gi", "No-Gi", "MMA", "Open Mat"]
        for type_name in class_types:
            existing = db.query(ClassType).filter(ClassType.name == type_name).first()
            if not existing:
                db.add(ClassType(name=type_name))

        db.commit()

        # Seed classes
        classes = [
            {
                "class_name": "Fundamentals",
                "day": "Monday",
                "time": "18:00",
                "points": 1.0,
            },
            {"class_name": "Advanced", "day": "Monday", "time": "19:00", "points": 1.5},
            {"class_name": "No-Gi", "day": "Tuesday", "time": "18:00", "points": 1.0},
            {
                "class_name": "Open Mat",
                "day": "Saturday",
                "time": "10:00",
                "points": 1.0,
            },
            {
                "class_name": "Kids Class",
                "day": "Wednesday",
                "time": "17:00",
                "points": 1.0,
            },
        ]

        for cls_data in classes:
            existing = (
                db.query(ClassSchedule)
                .filter(
                    ClassSchedule.class_name == cls_data["class_name"],
                    ClassSchedule.is_current == True,
                )
                .first()
            )
            if not existing:
                db.add(
                    ClassSchedule(
                        class_uuid=str(uuid.uuid4()), **cls_data, is_current=True
                    )
                )

        db.commit()

        # Seed demo users
        demo_users = [
            {
                "first_name": "John",
                "last_name": "Smith",
                "email": "john@example.com",
                "rank": "Blue",
                "password": "password123",
                "role": student_role,
            },
            {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane@example.com",
                "rank": "Purple",
                "password": "password123",
                "role": student_role,
            },
            {
                "first_name": "Mike",
                "last_name": "Instructor",
                "email": "mike@example.com",
                "rank": "Black",
                "password": "password123",
                "role": teacher_role,
            },
            {
                "first_name": "Admin",
                "last_name": "User",
                "email": "admin@example.com",
                "rank": "Black",
                "password": "admin123",
                "role": admin_role,
            },
        ]

        for user_data in demo_users:
            role = user_data.pop("role")
            existing = (
                db.query(User)
                .filter(User.email == user_data["email"], User.is_current == True)
                .first()
            )
            if not existing:
                user_uuid = str(uuid.uuid4())
                user = User(
                    user_uuid=user_uuid,
                    password_hash=hash_password(user_data.pop("password")),
                    **user_data,
                    is_current=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                # Add role
                user_role = UserRole(
                    user_uuid=user_uuid, role_id=role.id, is_current=True
                )
                db.add(user_role)

        db.commit()
        print("Seed data created successfully!")
        print("\nDemo accounts:")
        print("  Student: john@example.com / password123")
        print("  Teacher: mike@example.com / password123")
        print("  Admin: admin@example.com / admin123")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    from app.models import UserRole

    seed_data()
