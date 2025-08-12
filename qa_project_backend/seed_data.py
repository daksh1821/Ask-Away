#!/usr/bin/env python3
"""
Database seeding script.
Run this script to populate the database with sample data.
"""

import logging
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the app
sys.path.append(str(Path(__file__).parent))

from app import crud, database, schemas
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("seed_data.log") if settings.DEBUG else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_sample_users(db):
    """Create sample users"""
    logger.info("Creating sample users...")
    
    users_data = [
        {
            "username": "alice",
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com",
            "password": "password123",
            "interests": "python,fastapi,web development",
            "work_area": "Software Engineer"
        },
        {
            "username": "bob",
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob@example.com",
            "password": "password123",
            "interests": "machine learning,data science,python",
            "work_area": "Data Scientist"
        },
        {
            "username": "charlie",
            "first_name": "Charlie",
            "last_name": "Brown",
            "email": "charlie@example.com",
            "password": "password123",
            "interests": "javascript,react,frontend",
            "work_area": "Frontend Developer"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        existing_user = crud.get_user_by_username(db, user_data["username"])
        if not existing_user:
            user_create = schemas.UserCreate(**user_data)
            user = crud.create_user(db, user_create)
            created_users.append(user)
            logger.info(f"✓ Created user: {user.username}")
        else:
            created_users.append(existing_user)
            logger.info(f"User {user_data['username']} already exists")
    
    return created_users

def create_sample_questions(db, users):
    """Create sample questions"""
    logger.info("Creating sample questions...")
    
    # Check if questions already exist
    existing_questions = crud.list_questions(db, skip=0, limit=5)
    if existing_questions:
        logger.info("Sample questions already exist")
        return existing_questions
    
    questions_data = [
        {
            "title": "What is FastAPI and why should I use it?",
            "content": "I'm new to web development with Python and I keep hearing about FastAPI. What makes it special compared to other frameworks like Django or Flask? What are the main advantages and use cases?",
            "tags": "fastapi,python,web-development,frameworks",
            "user_idx": 0
        },
        {
            "title": "How to implement JWT authentication in FastAPI?",
            "content": "I need to add user authentication to my FastAPI application using JWT tokens. What's the best way to implement this? Should I use any specific libraries or can I implement it from scratch?",
            "tags": "fastapi,jwt,authentication,security",
            "user_idx": 1
        },
        {
            "title": "Best practices for handling database migrations with SQLAlchemy?",
            "content": "I'm working on a FastAPI project with SQLAlchemy and I need to handle database schema changes. What are the best practices for database migrations? Should I use Alembic?",
            "tags": "sqlalchemy,database,migrations,alembic",
            "user_idx": 0
        },
        {
            "title": "How to deploy FastAPI applications to production?",
            "content": "I've built a FastAPI application and now I need to deploy it to production. What are the recommended deployment strategies? Should I use Docker, and what about ASGI servers like Uvicorn vs Gunicorn?",
            "tags": "fastapi,deployment,docker,uvicorn,production",
            "user_idx": 2
        },
        {
            "title": "Difference between async and sync endpoints in FastAPI?",
            "content": "I'm confused about when to use async def vs def for my FastAPI endpoints. What's the difference and when should I use each? Does it affect performance significantly?",
            "tags": "fastapi,async,performance,endpoints",
            "user_idx": 1
        },
        {
            "title": "How to handle file uploads in FastAPI?",
            "content": "I need to implement file upload functionality in my FastAPI application. What's the best way to handle file uploads? How do I validate file types and sizes?",
            "tags": "fastapi,file-upload,forms,validation",
            "user_idx": 0
        }
    ]
    
    created_questions = []
    for q_data in questions_data:
        user = users[q_data["user_idx"]]
        question_create = schemas.QuestionCreate(
            title=q_data["title"],
            content=q_data["content"],
            tags=q_data["tags"]
        )
        question = crud.create_question(db, user.id, question_create)
        created_questions.append(question)
        logger.info(f"✓ Created question: {question.title[:50]}...")
    
    return created_questions

def create_sample_answers(db, users, questions):
    """Create sample answers"""
    logger.info("Creating sample answers...")
    
    # Check if answers already exist
    existing_answers = crud.get_answers_for_question(db, questions[0].id)
    if existing_answers:
        logger.info("Sample answers already exist")
        return existing_answers
    
    answers_data = [
        {
            "question_idx": 0,
            "user_idx": 1,
            "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+. Key advantages include: automatic API documentation, built-in data validation using Pydantic, excellent performance (comparable to NodeJS and Go), and great developer experience with type hints and async support."
        },
        {
            "question_idx": 0,
            "user_idx": 2,
            "content": "I've been using FastAPI for over a year now. The automatic OpenAPI documentation generation is amazing - it saves so much time! The type hints integration makes the code much more maintainable too."
        },
        {
            "question_idx": 1,
            "user_idx": 0,
            "content": "For JWT authentication in FastAPI, I recommend using the `python-jose` library along with `passlib` for password hashing. FastAPI has great documentation on this topic. The basic flow is: 1) User login with credentials, 2) Server validates and returns JWT token, 3) Client includes token in subsequent requests."
        },
        {
            "question_idx": 2,
            "user_idx": 2,
            "content": "Definitely use Alembic for database migrations with SQLAlchemy! It's the de facto standard. Initialize it with `alembic init alembic`, then create migrations with `alembic revision --autogenerate -m 'description'` and apply them with `alembic upgrade head`."
        },
        {
            "question_idx": 3,
            "user_idx": 1,
            "content": "For production deployment, I recommend using Docker with Gunicorn + Uvicorn workers. Something like: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`. You can also use cloud platforms like Railway, Heroku, or AWS ECS for easier deployment."
        },
        {
            "question_idx": 4,
            "user_idx": 0,
            "content": "Use `async def` when your endpoint performs I/O operations (database queries, API calls, file operations). Use regular `def` for CPU-bound operations or simple endpoints. FastAPI handles both efficiently, but async is better for I/O-heavy workloads."
        }
    ]
    
    created_answers = []
    for a_data in answers_data:
        question = questions[a_data["question_idx"]]
        user = users[a_data["user_idx"]]
        answer_create = schemas.AnswerCreate(content=a_data["content"])
        answer = crud.create_answer(db, user.id, question.id, answer_create)
        created_answers.append(answer)
        logger.info(f"✓ Created answer for question: {question.title[:30]}...")
    
    return created_answers

def create_sample_stars(db, users, questions, answers):
    """Create sample stars"""
    logger.info("Creating sample stars...")
    
    # Create some stars for answers
    star_data = [
        {"user_idx": 0, "question_idx": 1, "answer_idx": 0},  # Alice stars Bob's answer
        {"user_idx": 2, "question_idx": 0, "answer_idx": 0},  # Charlie stars Bob's answer
        {"user_idx": 1, "question_idx": 3, "answer_idx": 1},  # Bob stars Charlie's answer
    ]
    
    created_stars = []
    for s_data in star_data:
        try:
            user = users[s_data["user_idx"]]
            question = questions[s_data["question_idx"]]
            answer = answers[s_data["answer_idx"]]
            
            star = crud.star_answer(db, user.id, question.id, answer.id)
            created_stars.append(star)
            logger.info(f"✓ Created star from {user.username}")
        except Exception as e:
            logger.warning(f"Could not create star: {e}")
    
    return created_stars

def main():
    """Main seeding function"""
    logger.info("=" * 50)
    logger.info("Database Seeding Script")
    logger.info("=" * 50)
    
    # Get database session
    db = next(database.get_db())
    
    try:
        # Create sample data
        users = create_sample_users(db)
        questions = create_sample_questions(db, users)
        answers = create_sample_answers(db, users, questions)
        stars = create_sample_stars(db, users, questions, answers)
        
        logger.info("=" * 50)
        logger.info("🎉 Database seeding completed successfully!")
        logger.info(f"Created: {len(users)} users, {len(questions)} questions, {len(answers)} answers, {len(stars)} stars")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Error during seeding: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()