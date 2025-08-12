from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# =====================
# User Schemas
# =====================

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=80, description="Username must be 3-80 characters")
    first_name: str = Field(..., min_length=1, max_length=80, description="First name is required")
    email: EmailStr = Field(..., description="Valid email address required")

class UserCreate(UserBase):
    last_name: Optional[str] = Field("", max_length=80)
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    interests: Optional[str] = Field("", max_length=500)
    work_area: Optional[str] = Field("", max_length=200)

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=80)
    last_name: Optional[str] = Field(None, max_length=80)
    interests: Optional[str] = Field(None, max_length=500)
    work_area: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=300)
    bio: Optional[str] = Field(None, max_length=2000)

class UserOut(UserBase):
    id: int
    last_name: Optional[str] = ""
    interests: Optional[str] = ""
    work_area: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""
    bio: Optional[str] = ""
    questions_count: int = 0
    answers_count: int = 0
    reputation: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserSummary(BaseModel):
    """Lightweight user info for nested responses"""
    id: int
    username: str
    first_name: str
    last_name: Optional[str] = ""
    reputation: int = 0
    
    model_config = ConfigDict(from_attributes=True)

# =====================
# Authentication Schemas
# =====================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None

# =====================
# Question Schemas
# =====================

class QuestionBase(BaseModel):
    title: str = Field(..., min_length=10, max_length=300, description="Title must be 10-300 characters")
    content: str = Field(..., min_length=20, description="Content must be at least 20 characters")
    tags: Optional[str] = Field("", max_length=300, description="Comma-separated tags")

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=300)
    content: Optional[str] = Field(None, min_length=20)
    tags: Optional[str] = Field(None, max_length=300)

class QuestionOut(QuestionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserSummary] = None
    answers_count: Optional[int] = 0
    
    model_config = ConfigDict(from_attributes=True)

class QuestionDetail(QuestionOut):
    """Question with answers included"""
    answers: List["AnswerOut"] = []

# =====================
# Answer Schemas
# =====================

class AnswerBase(BaseModel):
    content: str = Field(..., min_length=10, description="Answer must be at least 10 characters")

class AnswerCreate(AnswerBase):
    pass

class AnswerUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=10)

class AnswerOut(AnswerBase):
    id: int
    user_id: int
    question_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserSummary] = None
    is_starred: Optional[bool] = False
    stars_count: Optional[int] = 0
    
    model_config = ConfigDict(from_attributes=True)

# =====================
# Star Schemas
# =====================

class StarCreate(BaseModel):
    question_id: int = Field(..., gt=0)
    answer_id: int = Field(..., gt=0)

class StarOut(BaseModel):
    id: int
    user_id: int
    question_id: int
    answer_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# =====================
# Search and Filter Schemas
# =====================

class QuestionFilter(BaseModel):
    search: Optional[str] = Field(None, description="Search in title, content, and tags")
    tags: Optional[str] = Field(None, description="Filter by tags")
    user_id: Optional[int] = Field(None, description="Filter by user")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=200, description="Maximum number of records to return")

class UserFilter(BaseModel):
    search: Optional[str] = Field(None, description="Search in username, first_name, last_name")
    min_reputation: Optional[int] = Field(None, ge=0, description="Minimum reputation")
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)

# =====================
# Statistics Schemas
# =====================

class UserStats(BaseModel):
    questions_count: int
    answers_count: int
    reputation: int
    stars_given: int
    stars_received: int

class PlatformStats(BaseModel):
    total_users: int
    total_questions: int
    total_answers: int
    total_stars: int
    active_users_today: Optional[int] = 0

# =====================
# Response Schemas
# =====================

class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    skip: int
    limit: int
    has_next: bool

class SuccessResponse(BaseModel):
    message: str
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Fix forward references
QuestionDetail.model_rebuild()