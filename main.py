# main.py
# 1. FIRST: Load environment variables
import os
from dotenv import load_dotenv

# Load appropriate .env file
if os.getenv("ENVIRONMENT") == "production":
    load_dotenv(".env.production")
else:
    load_dotenv(".env")  # Default to development

# 2. THEN: Import other modules
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.database import engine, Base

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

# Import routers - TRY to import public_router, but handle gracefully if it fails
try:
    from api.public_routes import public_router
    app.include_router(public_router)
    print("✅ Public routes loaded successfully")
except ImportError as e:
    print(f"⚠️ Warning: Could not load public routes: {e}")
    # Create a simple placeholder
    from fastapi import APIRouter
    placeholder_router = APIRouter(prefix="/api/v1/public", tags=["public"])
    
    @placeholder_router.get("/")
    def public_placeholder():
        return {"message": "Public API placeholder - public_routes.py not found"}
    
    app.include_router(placeholder_router)

# Register main routers
try:
    from api.routes import auth_router, main_router
    app.include_router(auth_router)
    app.include_router(main_router)
    print("✅ Main routes loaded successfully")
except ImportError as e:
    print(f"❌ Error: Could not load main routes: {e}")
    raise

@app.get("/")
def read_root():
    return {"message": "AI Agent Builder API - Ready to build some AI agents!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Agent Builder"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)