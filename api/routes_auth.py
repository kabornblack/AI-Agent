# api/routes_auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Company, CompanyUser
from .schemas import UserCreate, UserLogin, UserOut, Token
from .security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register-company", response_model=UserOut)
def register_company(payload: UserCreate, company_name: str, db: Session = Depends(get_db)):
    # company_name is a query param or form param (keep simple for now)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    company = db.query(Company).filter(Company.name == company_name).first()
    if company:
        raise HTTPException(status_code=400, detail="Company already exists")

    company = Company(name=company_name)
    db.add(company)
    db.commit()
    db.refresh(company)

    user = User(email=payload.email, hashed_password=get_password_hash(payload.password), is_admin=0)
    db.add(user)
    db.commit()
    db.refresh(user)

    link = CompanyUser(company_id=company.id, user_id=user.id, role="owner")
    db.add(link)
    db.commit()

    return user

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(sub=user.email, is_admin=bool(user.is_admin))
    return Token(access_token=token)

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
