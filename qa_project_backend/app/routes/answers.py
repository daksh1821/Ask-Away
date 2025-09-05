from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, database, crud, auth, models
from ..services.ai_service import ai_service
from ..services.slack_service import slack_service
from ..services.aws_service import aws_service

router = APIRouter(prefix="/answers", tags=["answers"])

@router.post("/{question_id}", response_model=schemas.AnswerOut, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: int = Path(..., description="ID of the question to answer"),
    answer: schemas.AnswerCreate = ...,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new answer for a question"""
    try:
        # Verify question exists
        question = crud.get_question(db, question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Create the answer (this will also increment user's answer count)
        new_answer = crud.create_answer(db, current_user.id, question_id, answer)
        
        # AI Enhancement: Generate quality score
        if ai_service:
            quality_score = await ai_service.generate_answer_quality_score(
                answer.content,
                f"{question.title}\n{question.content}"
            )
            new_answer.quality_score = int(quality_score * 100)  # Convert to 0-100 scale
            db.commit()
        
        # Send Slack notification
        if slack_service:
            await slack_service.notify_new_answer(
                {
                    'id': question.id,
                    'title': question.title
                },
                {
                    'id': new_answer.id,
                    'content': new_answer.content
                },
                {
                    'first_name': current_user.first_name,
                    'last_name': current_user.last_name,
                    'username': current_user.username
                }
            )
        
        # Send metrics to CloudWatch
        if aws_service:
            await aws_service.send_metric_to_cloudwatch('AnswersCreated', 1)
        
        return new_answer
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create answer: {str(e)}"
        )

@router.get("/question/{question_id}", response_model=List[schemas.AnswerOut])
def get_answers_for_question(
    question_id: int = Path(..., description="ID of the question"),
    skip: int = Query(0, ge=0, description="Number of answers to skip"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of answers to return"),
    db: Session = Depends(database.get_db)
):
    """Get all answers for a specific question"""
    try:
        # Verify question exists
        question = crud.get_question(db, question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return crud.get_answers_for_question(db, question_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch answers: {str(e)}"
        )

@router.get("/my", response_model=List[schemas.AnswerOut])
def my_answers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's answers"""
    try:
        return crud.get_user_answers(db, current_user.id, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user answers: {str(e)}"
        )

@router.get("/{answer_id}", response_model=schemas.AnswerOut)
def get_answer(
    answer_id: int = Path(..., description="ID of the answer"),
    db: Session = Depends(database.get_db)
):
    """Get a specific answer by ID"""
    try:
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        return answer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch answer: {str(e)}"
        )

@router.put("/{answer_id}", response_model=schemas.AnswerOut)
def update_answer(
    answer_id: int = Path(..., description="ID of the answer to update"),
    update: schemas.AnswerUpdate = ...,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update an answer (only by the author)"""
    try:
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        if answer.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own answers"
            )
        
        # Update only provided fields
        update_data = update.dict(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            setattr(answer, field, value)
        
        db.commit()
        db.refresh(answer)
        return answer
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update answer: {str(e)}"
        )

@router.delete("/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_answer(
    answer_id: int = Path(..., description="ID of the answer to delete"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete an answer (only by the author)"""
    try:
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        if answer.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own answers"
            )
        
        # Decrease user's answer count
        db.query(models.User).filter(models.User.id == current_user.id).update({
            models.User.answers_count: models.User.answers_count - 1
        })
        
        db.delete(answer)
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete answer: {str(e)}"
        )

# =====================
# Star System Endpoints
# =====================

@router.post("/{answer_id}/star", response_model=schemas.StarOut, status_code=status.HTTP_201_CREATED)
def star_answer(
    answer_id: int = Path(..., description="ID of the answer to star"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Star an answer"""
    try:
        # Get the answer and its question
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        # Cannot star your own answer
        if answer.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot star your own answer"
            )
        
        return crud.star_answer(db, current_user.id, answer.question_id, answer_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{answer_id}/star", status_code=status.HTTP_204_NO_CONTENT)
def unstar_answer(
    answer_id: int = Path(..., description="ID of the answer to unstar"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Remove star from an answer"""
    try:
        # Get the answer to find the question
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        success = crud.unstar_answer(db, current_user.id, answer.question_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Star not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unstar answer: {str(e)}"
        )

@router.get("/starred", response_model=List[schemas.StarOut])
def get_starred_answers(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all answers starred by the current user"""
    try:
        return crud.get_user_starred_answers(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch starred answers: {str(e)}"
        )