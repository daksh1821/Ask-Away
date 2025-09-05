from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .. import database, auth, models, crud
from ..services.ai_service import ai_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/summarize/{question_id}")
async def generate_question_summary(
    question_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Generate AI summary for a specific question"""
    try:
        # Get question with answers
        question = crud.get_question_with_answers_and_stars(db, question_id, current_user.id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Prepare answers data
        answers_data = []
        if hasattr(question, 'answers') and question.answers:
            answers_data = [{'content': answer.content} for answer in question.answers[:5]]
        
        # Generate summary
        summary = await ai_service.summarize_question(
            question.title,
            question.content,
            answers_data
        )
        
        # Update question with summary
        question.ai_summary = summary
        db.commit()
        
        return {
            "question_id": question_id,
            "summary": summary,
            "generated_at": question.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI summarization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary"
        )

@router.post("/suggest-tags")
async def suggest_tags_for_content(
    title: str = Query(..., description="Question title"),
    content: str = Query(..., description="Question content"),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get AI-suggested tags for question content"""
    try:
        tags = await ai_service.suggest_tags(title, content)
        return {
            "suggested_tags": tags,
            "count": len(tags)
        }
    except Exception as e:
        logger.error(f"Tag suggestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to suggest tags"
        )

@router.get("/quality-score/{answer_id}")
async def get_answer_quality_score(
    answer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get AI quality score for an answer"""
    try:
        answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        question = crud.get_question(db, answer.question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated question not found"
            )
        
        # Generate or return existing quality score
        if answer.quality_score == 50:  # Default score, generate new one
            quality_score = await ai_service.generate_answer_quality_score(
                answer.content,
                f"{question.title}\n{question.content}"
            )
            answer.quality_score = int(quality_score * 100)
            db.commit()
        
        return {
            "answer_id": answer_id,
            "quality_score": answer.quality_score,
            "score_normalized": answer.quality_score / 100.0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quality score retrieval failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quality score"
        )

@router.get("/analytics/platform")
async def get_ai_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get AI-powered platform analytics"""
    try:
        # Get basic stats
        total_questions = db.query(models.Question).count()
        total_answers = db.query(models.Answer).count()
        
        # Get questions with AI summaries
        questions_with_summaries = db.query(models.Question).filter(
            models.Question.ai_summary != ""
        ).count()
        
        # Get average quality scores
        avg_question_quality = db.query(models.Question).filter(
            models.Question.quality_score > 0
        ).with_entities(models.Question.quality_score).all()
        
        avg_answer_quality = db.query(models.Answer).filter(
            models.Answer.quality_score > 0
        ).with_entities(models.Answer.quality_score).all()
        
        # Calculate averages
        avg_q_score = sum(q[0] for q in avg_question_quality) / len(avg_question_quality) if avg_question_quality else 0
        avg_a_score = sum(a[0] for a in avg_answer_quality) / len(avg_answer_quality) if avg_answer_quality else 0
        
        return {
            "total_questions": total_questions,
            "total_answers": total_answers,
            "questions_with_ai_summaries": questions_with_summaries,
            "ai_summary_coverage": (questions_with_summaries / total_questions * 100) if total_questions > 0 else 0,
            "average_question_quality": round(avg_q_score, 2),
            "average_answer_quality": round(avg_a_score, 2),
            "ai_features_enabled": bool(ai_service and ai_service.encoding)
        }
        
    except Exception as e:
        logger.error(f"AI analytics failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get AI analytics"
        )