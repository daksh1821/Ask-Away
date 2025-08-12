from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), default="")
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    
    # Profile fields
    interests = Column(String(500), default="")
    work_area = Column(String(200), default="")
    location = Column(String(200), default="")
    website = Column(String(300), default="")
    bio = Column(Text, default="")
    
    # Statistics
    questions_count = Column(Integer, default=0, nullable=False)
    answers_count = Column(Integer, default=0, nullable=False)
    reputation = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    questions = relationship("Question", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    answers = relationship("Answer", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    stars = relationship("Star", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_reputation', 'reputation'),
        Index('idx_user_created_at', 'created_at'),
    )

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    content = Column(Text, nullable=False)
    tags = Column(String(300), default="")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan", lazy="dynamic")
    stars = relationship("Star", back_populates="question", cascade="all, delete-orphan", lazy="dynamic")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_question_user_created', 'user_id', 'created_at'),
        Index('idx_question_tags', 'tags'),
        Index('idx_question_title_content', 'title', 'content'),  # For full-text search
    )

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    stars = relationship("Star", back_populates="answer", cascade="all, delete-orphan", lazy="dynamic")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_answer_question_created', 'question_id', 'created_at'),
        Index('idx_answer_user_created', 'user_id', 'created_at'),
    )

class Star(Base):
    __tablename__ = "stars"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    answer_id = Column(Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="stars")
    question = relationship("Question", back_populates="stars")
    answer = relationship("Answer", back_populates="stars")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="unique_star_per_question"),
        Index('idx_star_user_question', 'user_id', 'question_id'),
        Index('idx_star_answer', 'answer_id'),
    )