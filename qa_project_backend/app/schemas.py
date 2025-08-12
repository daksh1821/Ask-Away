# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from pydantic import ConfigDict

class UserCreate(BaseModel):
    username: str
    first_name: str
    last_name: Optional[str] = ""
    email: EmailStr
    password: str
    interests: Optional[str] = ""
    work_area: Optional[str] = ""

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str]
    questions_count: int
    answers_count: int
    username: str
    email: EmailStr
    interests: Optional[str]
    work_area: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# login request (JSON)
class LoginRequest(BaseModel):
    username: str
    password: str

class QuestionCreate(BaseModel):
    title: str
    content: str
    tags: Optional[str] = ""

class QuestionOut(BaseModel):
    id: int
    title: str
    content: str
    tags: Optional[str]
    user_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AnswerCreate(BaseModel):
    content: str

class AnswerOut(BaseModel):
    id: int
    content: str
    user_id: int
    question_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
