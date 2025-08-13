from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional, List
from .. import schemas, auth, database, crud, models, config
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

# Add optional OAuth2 scheme for endpoints that don't require authentication
oauth2_scheme_optional = HTTPBearer(auto_error=False)


# =====================
# Core Authentication
# =====================

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Register a new user"""
    # Check if username exists
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        return crud.create_user(db, user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login with username/email and password"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": config.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/login-json", response_model=schemas.Token)
def login_json(
    payload: schemas.LoginRequest,
    db: Session = Depends(database.get_db)
):
    """Login with JSON payload (alternative to form-data)"""
    user = auth.authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": config.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": config.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# =====================
# Optional Authentication Helper
# =====================

def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional), 
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    """Get current user from JWT token (optional) - returns None if no token or invalid"""
    if not token:
        return None
        
    try:
        payload = auth.decode_access_token(token)
        if payload is None:
            return None
            
        username: str = payload.get("sub")
        if username is None:
            return None
            
        user = crud.get_user_by_username(db, username)
        return user
        
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


# =====================
# User Profile Management
# =====================

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's profile"""
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_profile(
    update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update current user's profile"""
    try:
        updated_user = crud.update_user_profile(db, current_user.id, update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.put("/me/profile", response_model=schemas.UserOut)
def update_my_profile(
    profile_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Alternative endpoint for updating current user's profile"""
    try:
        updated_user = crud.update_user_profile(db, current_user.id, profile_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete current user's account"""
    try:
        db.delete(current_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


# =====================
# User Statistics & Analytics
# =====================

@router.get("/me/stats", response_model=schemas.UserStats)
def get_user_stats_basic(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's basic statistics"""
    try:
        return crud.get_user_stats(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user stats: {str(e)}"
        )

@router.get("/me/stats/enhanced", response_model=dict)
def get_enhanced_user_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get comprehensive user statistics with detailed metrics"""
    try:
        return crud.get_user_stats_enhanced(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch enhanced user stats: {str(e)}"
        )

@router.get("/users/{user_id}/stats", response_model=dict)
def get_public_user_stats(
    user_id: int,
    db: Session = Depends(database.get_db)
):
    """Get public user statistics"""
    try:
        # Verify user exists
        user = crud.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return public stats only
        stats = crud.get_user_stats_enhanced(db, user_id)
        
        # Remove sensitive information for public view
        public_stats = {
            "user_id": user_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "questions_count": stats.get("questions_count", 0),
            "answers_count": stats.get("answers_count", 0),
            "reputation": stats.get("reputation", 0),
            "stars_received": stats.get("stars_received", 0),
            "total_views": stats.get("total_views", 0),
            "join_date": stats.get("join_date"),
            "avg_views_per_question": stats.get("avg_views_per_question", 0)
        }
        
        return public_stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user stats: {str(e)}"
        )

@router.get("/users/{user_id}/profile", response_model=schemas.UserOut)
def get_public_user_profile(
    user_id: int,
    db: Session = Depends(database.get_db)
):
    """Get public user profile"""
    try:
        user = crud.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


# =====================
# Star System Integration
# =====================

@router.get("/me/starred", response_model=List[dict])
def get_my_starred_answers(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all answers starred by the current user"""
    try:
        starred_answers = crud.get_user_starred_answers(db, current_user.id)
        
        # Apply pagination manually since it's a relationship query
        paginated_stars = starred_answers[skip:skip + limit]
        
        # Format the response
        result = []
        for star in paginated_stars:
            result.append({
                "star_id": star.id,
                "starred_at": star.created_at,
                "answer": {
                    "id": star.answer.id,
                    "content": star.answer.content,
                    "created_at": star.answer.created_at,
                    "author": {
                        "id": star.answer.user.id,
                        "username": star.answer.user.username,
                        "first_name": star.answer.user.first_name,
                        "last_name": star.answer.user.last_name
                    }
                },
                "question": {
                    "id": star.answer.question.id,
                    "title": star.answer.question.title,
                    "created_at": star.answer.question.created_at
                }
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch starred answers: {str(e)}"
        )

@router.get("/me/answers", response_model=List[schemas.AnswerOut])
def get_my_answers(
    skip: int = 0,
    limit: int = 50,
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

@router.get("/me/questions", response_model=List[schemas.QuestionOut])
def get_my_questions(
    skip: int = 0,
    limit: int = 50,
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


# =====================
# User Discovery & Search
# =====================

@router.get("/users/search", response_model=List[schemas.UserOut])
def search_users(
    query: str,
    limit: int = 20,
    db: Session = Depends(database.get_db)
):
    """Search users by username, first name, or last name"""
    try:
        search_term = f"%{query.strip()}%"
        users = db.query(models.User).filter(
            models.User.username.ilike(search_term) |
            models.User.first_name.ilike(search_term) |
            models.User.last_name.ilike(search_term)
        ).limit(limit).all()
        
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User search failed: {str(e)}"
        )

@router.get("/users/top-contributors", response_model=List[dict])
def get_top_contributors(
    limit: int = 10,
    metric: str = "reputation",
    db: Session = Depends(database.get_db)
):
    """Get top contributors by various metrics"""
    try:
        if metric == "reputation":
            users = db.query(models.User).order_by(
                models.User.reputation.desc()
            ).limit(limit).all()
        elif metric == "questions":
            users = db.query(models.User).order_by(
                models.User.questions_count.desc()
            ).limit(limit).all()
        elif metric == "answers":
            users = db.query(models.User).order_by(
                models.User.answers_count.desc()
            ).limit(limit).all()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metric. Use: reputation, questions, or answers"
            )
        
        # Format response with stats
        result = []
        for user in users:
            user_stats = crud.get_user_stats(db, user.id)
            result.append({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                },
                "stats": user_stats
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch top contributors: {str(e)}"
        )


# =====================
# Platform Analytics (Public)
# =====================

@router.get("/platform/stats", response_model=dict)
def get_platform_statistics(
    db: Session = Depends(database.get_db)
):
    """Get public platform statistics"""
    try:
        return crud.get_platform_stats(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch platform stats: {str(e)}"
        )