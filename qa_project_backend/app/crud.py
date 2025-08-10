from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from sqlalchemy import or_

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Users
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed = pwd.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed,
        interests=user.interests or "",
        work_area=user.work_area or ""
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain, hashed):
    return pwd.verify(plain, hashed)

# Questions & Answers
def create_question(db: Session, user_id: int, q: schemas.QuestionCreate):
    dbq = models.Question(title=q.title, content=q.content, tags=q.tags or "", user_id=user_id)
    db.add(dbq)
    db.commit()
    db.refresh(dbq)
    return dbq

def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def list_questions(db: Session, skip=0, limit=100):
    return db.query(models.Question).order_by(models.Question.created_at.desc()).offset(skip).limit(limit).all()

def search_questions(db: Session, q: str, limit=50):
    like = f"%{q}%"
    return db.query(models.Question).filter(
        or_(models.Question.title.ilike(like), models.Question.content.ilike(like), models.Question.tags.ilike(like))
    ).order_by(models.Question.created_at.desc()).limit(limit).all()

def create_answer(db: Session, user_id: int, question_id: int, ans: schemas.AnswerCreate):
    dbans = models.Answer(content=ans.content, user_id=user_id, question_id=question_id)
    db.add(dbans)
    db.commit()
    db.refresh(dbans)
    return dbans

def get_answers_for_question(db: Session, question_id: int):
    return db.query(models.Answer).filter(models.Answer.question_id == question_id).order_by(models.Answer.created_at.asc()).all()

def personalized_feed(db: Session, interests: str, limit=50):
    if not interests:
        return list_questions(db, limit=limit)
    tokens = [t.strip() for t in interests.split(",") if t.strip()]
    if not tokens:
        return list_questions(db, limit=limit)
    clauses = []
    for t in tokens:
        like = f"%{t}%"
        clauses.append(models.Question.title.ilike(like))
        clauses.append(models.Question.content.ilike(like))
        clauses.append(models.Question.tags.ilike(like))
    return db.query(models.Question).filter(or_(*clauses)).order_by(models.Question.created_at.desc()).limit(limit).all()
