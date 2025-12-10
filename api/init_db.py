# init_db.py
from database import engine, Base
from models import Agent, AgentKnowledge, Conversation

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database tables created successfully!")