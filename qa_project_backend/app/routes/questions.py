from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, database, crud, auth, models

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("", response_model=schemas.QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new question"""
    try:
        return crud.create_question(db, current_user.id, question)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create question: {str(e)}"
        )

@router.get("", response_model=List[schemas.QuestionOut])
def list_questions(
    skip: int = Query(0, ge=0, description="Number of questions to skip"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of questions to return"),
    search: Optional[str] = Query(None, description="Search in title, content, and tags"),
    tags: Optional[str] = Query(None, description="Filter by tags"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    db: Session = Depends(database.get_db)
):
    """Get paginated list of questions with optional filtering"""
    try:
        if search:
            return crud.search_questions(db, search, limit=limit)
        elif user_id:
            return crud.get_user_questions(db, user_id, skip=skip, limit=limit)
        else:
            return crud.list_questions(db, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch questions: {str(e)}"
        )

@router.get("/search", response_model=List[schemas.QuestionOut])
def search_questions(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db)
):
    """Search questions by title, content, or tags"""
    try:
        return crud.search_questions(db, q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/feed", response_model=List[schemas.QuestionOut])
def personalized_feed(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get personalized question feed based on user interests"""
    try:
        return crud.personalized_feed(db, current_user.interests, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch feed: {str(e)}"
        )

@router.get("/trending", response_model=List[schemas.QuestionOut])
def trending_questions(
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(database.get_db)
):
    """Get trending questions based on recent activity"""
    try:
        return crud.get_trending_questions(db, days=days, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trending questions: {str(e)}"
        )

@router.get("/my", response_model=List[schemas.QuestionOut])
def my_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's questions"""
    try:
        return crud.get_user_questions(db, current_user.id, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user questions: {str(e)}"
        )

@router.get("/{question_id}", response_model=schemas.QuestionDetail)
def get_question(
    question_id: int,
    include_answers: bool = Query(True, description="Include answers in response"),
    db: Session = Depends(database.get_db)
):
    """Get a specific question by ID"""
    try:
        if include_answers:
            question = crud.get_question_with_answers(db, question_id)
        else:
            question = crud.get_question(db, question_id)
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return question
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch question: {str(e)}"
        )

@router.put("/{question_id}", response_model=schemas.QuestionOut)
def update_question(
    question_id: int,
    update: schemas.QuestionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update a question (only by the author)"""
    try:
        question = crud.get_question(db, question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        if question.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own questions"
            )
        
        # Update logic would go here (implement in crud.py)
        # For now, return the existing question
        return question
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update question: {str(e)}"
        )

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a question (only by the author)"""
    try:
        question = crud.get_question(db, question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        if question.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own questions"
            )
        
        db.delete(question)
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete question: {str(e)}"
        )