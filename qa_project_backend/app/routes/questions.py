# app/routes/questions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, database, crud, auth, models

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("", response_model=schemas.QuestionOut)
def create_question(q: schemas.QuestionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    crud.increment_questions_count(db, current_user.id)
    return crud.create_question(db, current_user.id, q)


@router.get("", response_model=List[schemas.QuestionOut])
def list_questions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.list_questions(db, skip=skip, limit=limit)

@router.get("/search", response_model=List[schemas.QuestionOut])
def search_questions(q: str, limit: int = 50, db: Session = Depends(database.get_db)):
    return crud.search_questions(db, q, limit=limit)

@router.get("/feed", response_model=List[schemas.QuestionOut])
def personalized_feed(limit: int = 50, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.personalized_feed(db, current_user.interests, limit=limit)

@router.get("/{id}", response_model=schemas.QuestionOut)
def get_question(id: int, db: Session = Depends(database.get_db)):
    question = crud.get_question(db, id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
