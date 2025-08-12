from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from sqlalchemy import or_, func, desc, asc

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
            user_id=user_id
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

def list_questions(db: Session, skip: int = 0, limit: int = 100) -> List[models.Question]:
    """Get paginated list of questions with user info"""
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

def get_user_questions(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[models.Question]:
    """Get all questions by a specific user"""
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).filter(models.Question.user_id == user_id).order_by(
        desc(models.Question.created_at)
    ).offset(skip).limit(limit).all()


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
# Star/Vote System
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
    ).filter(models.Star.user_id == user_id).all()


# =====================
# Personalized Feed & Recommendations
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
        desc(models.Question.created_at)
    ).limit(limit).all()

def get_trending_questions(db: Session, days: int = 7, limit: int = 20) -> List[models.Question]:
    """Get trending questions based on recent activity"""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Questions with most answers in the given time period
    return db.query(models.Question).options(
        joinedload(models.Question.user)
    ).join(models.Answer).filter(
        models.Answer.created_at >= cutoff_date
    ).group_by(models.Question.id).order_by(
        desc(func.count(models.Answer.id)),
        desc(models.Question.created_at)
    ).limit(limit).all()


# =====================
# Statistics & Analytics
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

def get_platform_stats(db: Session) -> dict:
    """Get overall platform statistics"""
    return {
        "total_users": db.query(models.User).count(),
        "total_questions": db.query(models.Question).count(),
        "total_answers": db.query(models.Answer).count(),
        "total_stars": db.query(models.Star).count()
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