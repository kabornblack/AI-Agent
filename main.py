# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.database import engine, Base
import uvicorn
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Agent Builder API",
    description="A plug-and-play AI Agent builder for creating custom assistants",
    version="1.0.0"
)

# Add CORS middleware - allow all origins for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "AI Agent Builder API - Ready to build some AI agents!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Agent Builder"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)