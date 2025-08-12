from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, database, crud, auth

router = APIRouter(prefix="/answers", tags=["answers"])

@router.post("", response_model=schemas.AnswerOut)
def create_answer(ans: schemas.AnswerCreate, question_id: int, db: Session = Depends(database.get_db), current_user: schemas.UserOut = Depends(auth.get_current_user)):
    if not crud.get_question(db, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    return crud.create_answer(db, current_user.id, question_id, ans)

@router.get("/{question_id}", response_model=List[schemas.AnswerOut])
def get_answers(question_id: int, db: Session = Depends(database.get_db)):
    return crud.get_answers_for_question(db, question_id)

