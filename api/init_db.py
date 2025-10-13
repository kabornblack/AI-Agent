# api/init_db.py
from api.database import Base, engine
from api import models

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database initialized successfully.")
