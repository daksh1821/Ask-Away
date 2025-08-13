from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from sqlalchemy import or_, func, desc, asc, and_
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =====================
# User CRUD Operations
# =====================

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Get user by ID with error handling"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Get user by username"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user with all default values"""
    try:
        hashed_password = pwd_context.hash(user.password)
        db_user = models.User(
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name or "",
            email=user.email,
            password_hash=hashed_password,
            interests=user.interests or "",
            work_area=user.work_area or "",
            location="",
            website="",
            bio="",
            questions_count=0,
            answers_count=0,
            reputation=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to create user: {str(e)}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def update_user_profile(db: Session, user_id: int, update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user profile with only provided fields"""
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = update.dict(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to update profile: {str(e)}")


# =====================
# Question CRUD Operations
# =====================

def create_question(db: Session, user_id: int, question: schemas.QuestionCreate) -> models.Question:
    """Create a new question and increment user's question count"""
    try:
        db_question = models.Question(
            title=question.title,
            content=question.content,
            tags=question.tags or "",
            user_id=user_id,
            views_count=0  # Initialize views count
        )
        db.add(db_question)
        
        # Increment user's question count atomically
        db.query(models.User).filter(models.User.id == user_id).update({
            models.User.questions_count: models.User.questions_count + 1
        })
        
        db.commit()
        db.refresh(db_question)
        return db_question
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to create question: {str(e)}")

def get_question(db: Session, question_id: int) -> Optional[models.Question]:
    """Get question by ID with user information"""
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(models.Question.id == question_id).first()

def get_question_with_answers(db: Session, question_id: int) -> Optional[models.Question]:
    """Get question with all its answers and user info"""
    return db.query(models.Question).options(
        joinedload(models.Question.user),
        joinedload(models.Question.answers).joinedload(models.Answer.user)
    ).filter(models.Question.id == question_id).first()

def get_question_with_answers_and_stars(db: Session, question_id: int, current_user_id: int = None) -> Optional[models.Question]:
    """Get question with all its answers and star information"""
    question = db.query(models.Question).options(
        joinedload(models.Question.user),
        joinedload(models.Question.answers).joinedload(models.Answer.user)
    ).filter(models.Question.id == question_id).first()
    
    if not question:
        return None
    
    # Add star information to each answer
    for answer in question.answers:
        # Count total stars for this answer
        answer.stars_count = db.query(models.Star).filter(
            models.Star.answer_id == answer.id
        ).count()
        
        # Check if current user has starred this answer
        if current_user_id:
            user_star = db.query(models.Star).filter(
                models.Star.answer_id == answer.id,
                models.Star.user_id == current_user_id
            ).first()
            answer.is_starred = bool(user_star)
        else:
            answer.is_starred = False
    
    return question

def list_questions(db: Session, skip: int = 0, limit: int = 100) -> List[models.Question]:
    """Get paginated list of questions with user info, ordered by recent activity"""
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).order_by(desc(models.Question.created_at)).offset(skip).limit(limit).all()

def search_questions(db: Session, query: str, limit: int = 50) -> List[models.Question]:
    """Search questions by title, content, or tags"""
    if not query.strip():
        return list_questions(db, limit=limit)
    
    search_term = f"%{query.strip()}%"
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(
        or_(
            models.Question.title.ilike(search_term),
            models.Question.content.ilike(search_term),
            models.Question.tags.ilike(search_term)
        )
    ).order_by(desc(models.Question.created_at)).limit(limit).all()

def search_questions_enhanced(db: Session, query: str, limit: int = 50, current_user_interests: str = None) -> List[models.Question]:
    """Enhanced search with relevance ranking"""
    if not query.strip():
        return list_questions(db, limit=limit)
    
    search_term = f"%{query.strip()}%"
    
    # Build base query
    base_query = db.query(models.Question).options(
        joinedload(models.Question.user)
    )
    
    # Search in title, content, and tags
    search_filter = or_(
        models.Question.title.ilike(search_term),
        models.Question.content.ilike(search_term),
        models.Question.tags.ilike(search_term)
    )
    
    # Apply search filter
    questions = base_query.filter(search_filter)
    
    # Order by relevance (title matches first, then recent, then popular)
    questions = questions.order_by(
        # Title matches first
        models.Question.title.ilike(search_term).desc(),
        # Then by views and popularity
        models.Question.views_count.desc(),
        # Finally by recency
        models.Question.created_at.desc()
    ).limit(limit).all()
    
    return questions

def get_user_questions(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[models.Question]:
    """Get all questions by a specific user"""
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(models.Question.user_id == user_id).order_by(
        desc(models.Question.created_at)
    ).offset(skip).limit(limit).all()


# =====================
# View Tracking System
# =====================

def track_question_view(db: Session, question_id: int, user_id: int = None, ip_address: str = None, user_agent: str = None) -> bool:
    """Track a question view with duplicate prevention"""
    try:
        # Check if this is a duplicate view (within last hour)
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        existing_view = None
        if user_id:
            # For logged-in users, check by user_id
            existing_view = db.query(models.QuestionView).filter(
                models.QuestionView.question_id == question_id,
                models.QuestionView.user_id == user_id,
                models.QuestionView.created_at > cutoff_time
            ).first()
        elif ip_address:
            # For anonymous users, check by IP
            existing_view = db.query(models.QuestionView).filter(
                models.QuestionView.question_id == question_id,
                models.QuestionView.ip_address == ip_address,
                models.QuestionView.created_at > cutoff_time
            ).first()
        
        if existing_view:
            return False  # Don't count duplicate views
        
        # Create new view record
        new_view = models.QuestionView(
            question_id=question_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(new_view)
        
        # Increment question views count atomically
        db.query(models.Question).filter(models.Question.id == question_id).update({
            models.Question.views_count: models.Question.views_count + 1
        })
        
        db.commit()
        return True
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to track view: {str(e)}")
        return False

def get_question_views_count(db: Session, question_id: int) -> int:
    """Get total view count for a question"""
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    return question.views_count if question else 0

def get_most_viewed_questions(db: Session, limit: int = 20, days: int = None) -> List[models.Question]:
    """Get most viewed questions, optionally within a time period"""
    query = db.query(models.Question).options(
        joinedload(models.Question.user)
    )
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models.Question.created_at >= cutoff_date)
    
    return query.order_by(
        desc(models.Question.views_count),
        desc(models.Question.created_at)
    ).limit(limit).all()


# =====================
# Answer CRUD Operations
# =====================

def create_answer(db: Session, user_id: int, question_id: int, answer: schemas.AnswerCreate) -> models.Answer:
    """Create a new answer and increment user's answer count"""
    try:
        db_answer = models.Answer(
            content=answer.content,
            user_id=user_id,
            question_id=question_id
        )
        db.add(db_answer)
        
        # Increment user's answer count atomically
        db.query(models.User).filter(models.User.id == user_id).update({
            models.User.answers_count: models.User.answers_count + 1
        })
        
        db.commit()
        db.refresh(db_answer)
        return db_answer
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to create answer: {str(e)}")

def get_answers_for_question(db: Session, question_id: int) -> List[models.Answer]:
    """Get all answers for a question with user info, ordered by creation time"""
    return db.query(models.Answer).options(
        joinedload(models.Answer.user)
    ).filter(models.Answer.question_id == question_id).order_by(
        asc(models.Answer.created_at)
    ).all()

def get_user_answers(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[models.Answer]:
    """Get all answers by a specific user"""
    return db.query(models.Answer).options(
        joinedload(models.Answer.user),
        joinedload(models.Answer.question)
    ).filter(models.Answer.user_id == user_id).order_by(
        desc(models.Answer.created_at)
    ).offset(skip).limit(limit).all()


# =====================
# Enhanced Star/Vote System
# =====================

def star_answer(db: Session, user_id: int, question_id: int, answer_id: int) -> models.Star:
    """Star an answer and increase author's reputation"""
    try:
        # Check if already starred this question
        existing_star = db.query(models.Star).filter(
            models.Star.user_id == user_id,
            models.Star.question_id == question_id
        ).first()
        
        if existing_star:
            raise Exception("You have already starred an answer for this question")
        
        # Verify the answer belongs to the question
        answer = db.query(models.Answer).filter(
            models.Answer.id == answer_id,
            models.Answer.question_id == question_id
        ).first()
        
        if not answer:
            raise Exception("Answer not found for this question")
        
        # Don't allow users to star their own answers
        if answer.user_id == user_id:
            raise Exception("You cannot star your own answer")
        
        # Create the star
        new_star = models.Star(
            user_id=user_id,
            question_id=question_id,
            answer_id=answer_id
        )
        db.add(new_star)
        
        # Increment answer author's reputation atomically
        db.query(models.User).filter(models.User.id == answer.user_id).update({
            models.User.reputation: models.User.reputation + 1
        })
        
        db.commit()
        db.refresh(new_star)
        return new_star
        
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to star answer: {str(e)}")

def unstar_answer(db: Session, user_id: int, question_id: int) -> bool:
    """Remove star from a question and decrease author's reputation"""
    try:
        star = db.query(models.Star).filter(
            models.Star.user_id == user_id,
            models.Star.question_id == question_id
        ).first()
        
        if not star:
            return False
        
        # Get the answer to decrease author's reputation
        answer = db.query(models.Answer).filter(models.Answer.id == star.answer_id).first()
        if answer:
            db.query(models.User).filter(models.User.id == answer.user_id).update({
                models.User.reputation: func.greatest(models.User.reputation - 1, 0)
            })
        
        db.delete(star)
        db.commit()
        return True
        
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to unstar answer: {str(e)}")

def get_user_starred_answers(db: Session, user_id: int) -> List[models.Star]:
    """Get all answers starred by a user"""
    return db.query(models.Star).options(
        joinedload(models.Star.answer).joinedload(models.Answer.question),
        joinedload(models.Star.answer).joinedload(models.Answer.user)
    ).filter(models.Star.user_id == user_id).order_by(
        desc(models.Star.created_at)
    ).all()

def get_answer_stars_count(db: Session, answer_id: int) -> int:
    """Get total stars count for an answer"""
    return db.query(models.Star).filter(models.Star.answer_id == answer_id).count()

def check_user_starred_answer(db: Session, user_id: int, question_id: int) -> Optional[models.Star]:
    """Check if user has starred an answer for this question"""
    return db.query(models.Star).filter(
        models.Star.user_id == user_id,
        models.Star.question_id == question_id
    ).first()


# =====================
# Enhanced Feed & Recommendations
# =====================

def personalized_feed(db: Session, interests: str, limit: int = 50) -> List[models.Question]:
    """Get personalized question feed based on user interests"""
    if not interests or not interests.strip():
        return list_questions(db, limit=limit)
    
    # Parse interests and create search terms
    interest_tokens = [token.strip() for token in interests.split(",") if token.strip()]
    if not interest_tokens:
        return list_questions(db, limit=limit)
    
    # Build search clauses for each interest
    search_clauses = []
    for token in interest_tokens:
        search_term = f"%{token}%"
        search_clauses.extend([
            models.Question.title.ilike(search_term),
            models.Question.content.ilike(search_term),
            models.Question.tags.ilike(search_term)
        ])
    
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(or_(*search_clauses)).order_by(
        desc(models.Question.views_count),  # Popular first
        desc(models.Question.created_at)
    ).limit(limit).all()

def get_trending_questions(db: Session, days: int = 7, limit: int = 20) -> List[models.Question]:
    """Get trending questions based on recent activity"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Questions with most answers in the given time period
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).join(models.Answer).filter(
        models.Answer.created_at >= cutoff_date
    ).group_by(models.Question.id).order_by(
        desc(func.count(models.Answer.id)),
        desc(models.Question.views_count),
        desc(models.Question.created_at)
    ).limit(limit).all()

def get_trending_questions_enhanced(db: Session, days: int = 7, limit: int = 20) -> List[models.Question]:
    """Get trending questions with better scoring algorithm"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Complex trending algorithm considering views, answers, stars, and recency
    questions = db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(
        models.Question.created_at >= cutoff_date
    ).outerjoin(models.Answer).outerjoin(models.Star).group_by(
        models.Question.id
    ).order_by(
        # Trending score: views + (answers * 2) + (total_stars * 3)
        (
            models.Question.views_count + 
            (func.count(models.Answer.id.distinct()) * 2) + 
            (func.count(models.Star.id.distinct()) * 3)
        ).desc(),
        models.Question.created_at.desc()
    ).limit(limit).all()
    
    return questions


# =====================
# Enhanced Statistics & Analytics
# =====================

def get_user_stats(db: Session, user_id: int) -> dict:
    """Get comprehensive user statistics"""
    user = get_user_by_id(db, user_id)
    if not user:
        return {}
    
    return {
        "questions_count": user.questions_count,
        "answers_count": user.answers_count,
        "reputation": user.reputation,
        "stars_given": db.query(models.Star).filter(models.Star.user_id == user_id).count(),
        "stars_received": db.query(models.Star).join(models.Answer).filter(
            models.Answer.user_id == user_id
        ).count()
    }

def get_user_stats_enhanced(db: Session, user_id: int) -> dict:
    """Get comprehensive user statistics with additional metrics"""
    user = get_user_by_id(db, user_id)
    if not user:
        return {}
    
    # Calculate additional stats
    total_views = db.query(func.sum(models.Question.views_count)).filter(
        models.Question.user_id == user_id
    ).scalar() or 0
    
    stars_received = db.query(func.count(models.Star.id)).join(
        models.Answer, models.Star.answer_id == models.Answer.id
    ).filter(models.Answer.user_id == user_id).scalar() or 0
    
    stars_given = db.query(func.count(models.Star.id)).filter(
        models.Star.user_id == user_id
    ).scalar() or 0
    
    # Best answer (most starred)
    best_answer = db.query(models.Answer).outerjoin(models.Star).filter(
        models.Answer.user_id == user_id
    ).group_by(models.Answer.id).order_by(
        func.count(models.Star.id).desc()
    ).first()
    
    return {
        "questions_count": user.questions_count,
        "answers_count": user.answers_count,
        "reputation": user.reputation,
        "total_views": total_views,
        "stars_given": stars_given,
        "stars_received": stars_received,
        "best_answer_stars": db.query(func.count(models.Star.id)).filter(
            models.Star.answer_id == best_answer.id
        ).scalar() if best_answer else 0,
        "join_date": user.created_at,
        "avg_views_per_question": round(total_views / max(user.questions_count, 1), 2)
    }

def get_platform_stats(db: Session) -> dict:
    """Get overall platform statistics"""
    return {
        "total_users": db.query(models.User).count(),
        "total_questions": db.query(models.Question).count(),
        "total_answers": db.query(models.Answer).count(),
        "total_stars": db.query(models.Star).count(),
        "total_views": db.query(func.sum(models.Question.views_count)).scalar() or 0
    }


# =====================
# Utility Functions (Deprecated - keeping for backward compatibility)
# =====================

def increment_questions_count(db: Session, user_id: int) -> None:
    """Deprecated: Use atomic update in create_question instead"""
    try:
        db.query(models.User).filter(models.User.id == user_id).update({
            models.User.questions_count: models.User.questions_count + 1
        })
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to increment questions count: {str(e)}")

def increment_answers_count(db: Session, user_id: int) -> None:
    """Deprecated: Use atomic update in create_answer instead"""
    try:
        db.query(models.User).filter(models.User.id == user_id).update({
            models.User.answers_count: models.User.answers_count + 1
        })
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Failed to increment answers count: {str(e)}")