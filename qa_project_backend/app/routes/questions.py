from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, database, crud, auth, models
from ..services.ai_service import ai_service
from ..services.slack_service import slack_service
from ..services.aws_service import aws_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/questions", tags=["questions"])


# =====================
# Question CRUD Operations
# =====================

@router.post("", response_model=schemas.QuestionOut, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new question"""
    try:
        # Create the question
        new_question = crud.create_question(db, current_user.id, question)
        
        # AI Enhancement: Generate suggested tags if not provided
        if not question.tags and ai_service:
            suggested_tags = await ai_service.suggest_tags(question.title, question.content)
            if suggested_tags:
                new_question.suggested_tags = ','.join(suggested_tags)
                db.commit()
        
        # Send Slack notification
        if slack_service:
            await slack_service.notify_new_question(
                {
                    'id': new_question.id,
                    'title': new_question.title,
                    'content': new_question.content
                },
                {
                    'first_name': current_user.first_name,
                    'last_name': current_user.last_name,
                    'username': current_user.username
                }
            )
            new_question.slack_notified = 1
            db.commit()
        
        # Send metrics to CloudWatch
        if aws_service:
            await aws_service.send_metric_to_cloudwatch('QuestionsCreated', 1)
        
        return new_question
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
    sort_by: Optional[str] = Query("recent", description="Sort by: recent, popular, trending"),
    db: Session = Depends(database.get_db)
):
    """Get paginated list of questions with optional filtering and sorting"""
    try:
        if search:
            return crud.search_questions(db, search, limit=limit)
        elif user_id:
            return crud.get_user_questions(db, user_id, skip=skip, limit=limit)
        elif sort_by == "popular":
            return crud.get_most_viewed_questions(db, limit=limit)
        elif sort_by == "trending":
            return crud.get_trending_questions_enhanced(db, limit=limit)
        else:
            return crud.list_questions(db, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch questions: {str(e)}"
        )

@router.get("/{question_id}", response_model=schemas.QuestionDetail)
async def get_question(
    question_id: int,
    include_answers: bool = Query(True, description="Include answers in response"),
    generate_summary: bool = Query(False, description="Generate AI summary"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)  # Optional auth
):
    """Get a specific question by ID with optional authentication"""
    try:
        if include_answers:
            question = crud.get_question_with_answers_and_stars(
                db, question_id, current_user.id if current_user else None
            )
        else:
            question = crud.get_question(db, question_id)
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Generate AI summary if requested and not already generated
        if generate_summary and ai_service and not question.ai_summary:
            answers_data = []
            if hasattr(question, 'answers') and question.answers:
                answers_data = [{'content': answer.content} for answer in question.answers[:3]]
            
            summary = await ai_service.summarize_question(
                question.title, 
                question.content, 
                answers_data
            )
            
            if summary:
                question.ai_summary = summary
                db.commit()
        
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


# =====================
# View Tracking System
# =====================

@router.post("/{question_id}/view", status_code=status.HTTP_200_OK)
def track_question_view(
    question_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)  # Optional auth
):
    """Track a view for a question with smart duplicate prevention"""
    try:
        # Get client IP
        client_ip = request.client.host
        if hasattr(request, 'headers'):
            # Check for forwarded IP in case of proxy
            forwarded_for = request.headers.get('X-Forwarded-For')
            if forwarded_for:
                client_ip = forwarded_for.split(',')[0].strip()
        
        # Get user agent
        user_agent = request.headers.get('User-Agent', '')
        
        # Track the view
        success = crud.track_question_view(
            db=db,
            question_id=question_id,
            user_id=current_user.id if current_user else None,
            ip_address=client_ip,
            user_agent=user_agent[:500]  # Truncate to fit in DB
        )
        
        return {
            "success": success, 
            "message": "View tracked" if success else "Duplicate view ignored",
            "total_views": crud.get_question_views_count(db, question_id)
        }
        
    except Exception as e:
        logger.error(f"Error tracking view: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track view"
        )

@router.get("/{question_id}/views", status_code=status.HTTP_200_OK)
def get_question_views(
    question_id: int,
    db: Session = Depends(database.get_db)
):
    """Get view count for a question"""
    try:
        question = crud.get_question(db, question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return {
            "question_id": question_id,
            "views_count": question.views_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get view count: {str(e)}"
        )


# =====================
# Search & Discovery
# =====================

@router.get("/search/basic", response_model=List[schemas.QuestionOut])
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

@router.get("/search/enhanced", response_model=List[schemas.QuestionOut])
def search_questions_enhanced(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    """Enhanced search with better relevance ranking"""
    try:
        interests = current_user.interests if current_user else None
        return crud.search_questions_enhanced(db, q, limit=limit, current_user_interests=interests)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/popular/views", response_model=List[schemas.QuestionOut])
def most_viewed_questions(
    limit: int = Query(20, ge=1, le=50),
    days: Optional[int] = Query(None, ge=1, le=365, description="Limit to questions from last N days"),
    db: Session = Depends(database.get_db)
):
    """Get most viewed questions"""
    try:
        return crud.get_most_viewed_questions(db, limit=limit, days=days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch popular questions: {str(e)}"
        )


# =====================
# Trending & Feed
# =====================

@router.get("/trending/basic", response_model=List[schemas.QuestionOut])
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

@router.get("/trending/enhanced", response_model=List[schemas.QuestionOut])
def trending_questions_enhanced(
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(database.get_db)
):
    """Get trending questions with enhanced algorithm (views + answers + stars)"""
    try:
        return crud.get_trending_questions_enhanced(db, days=days, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trending questions: {str(e)}"
        )

@router.get("/feed/personalized", response_model=List[schemas.QuestionOut])
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


# =====================
# User-specific Endpoints
# =====================

@router.get("/my/questions", response_model=List[schemas.QuestionOut])
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

@router.get("/user/{user_id}/questions", response_model=List[schemas.QuestionOut])
def get_user_questions_public(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db)
):
    """Get questions by a specific user (public endpoint)"""
    try:
        # Verify user exists
        user = crud.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return crud.get_user_questions(db, user_id, skip=skip, limit=limit)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user questions: {str(e)}"
        )


# =====================
# Star System Integration
# =====================

@router.post("/{question_id}/answers/{answer_id}/star", status_code=status.HTTP_201_CREATED)
def star_answer(
    question_id: int,
    answer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Star an answer for a question"""
    try:
        star = crud.star_answer(db, current_user.id, question_id, answer_id)
        return {
            "message": "Answer starred successfully",
            "star_id": star.id,
            "stars_count": crud.get_answer_stars_count(db, answer_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{question_id}/star", status_code=status.HTTP_200_OK)
def unstar_answer(
    question_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Remove star from a question"""
    try:
        success = crud.unstar_answer(db, current_user.id, question_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No star found for this question"
            )
        
        return {"message": "Star removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove star: {str(e)}"
        )

@router.get("/answers/{answer_id}/stars", status_code=status.HTTP_200_OK)
def get_answer_stars(
    answer_id: int,
    db: Session = Depends(database.get_db)
):
    """Get star count for an answer"""
    try:
        stars_count = crud.get_answer_stars_count(db, answer_id)
        return {
            "answer_id": answer_id,
            "stars_count": stars_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get star count: {str(e)}"
        )


# =====================
# Analytics Endpoints
# =====================

@router.get("/analytics/platform", status_code=status.HTTP_200_OK)
def platform_analytics(
    db: Session = Depends(database.get_db)
):
    """Get platform-wide analytics"""
    try:
        return crud.get_platform_stats(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get platform stats: {str(e)}"
        )